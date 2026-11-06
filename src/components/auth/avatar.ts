import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { queryClient } from '~/cms/queryClient';
import { useAuth, type User } from '~/stores/auth';
import { getSupabase, type Supabase } from '~/supabase/client';

import { profileKey } from './hooks';

const BUCKET = 'avatars';
const SIZE = 256;
const QUALITY = 0.85;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const CACHE_SECONDS = '31536000';

export const AVATAR_ACCEPT = 'image/*';
export const AVATAR_IMAGE_PROPS = { referrerPolicy: 'no-referrer' } as const;

const AvatarType = z.enum(['image/webp', 'image/jpeg']);
type AvatarType = z.infer<typeof AvatarType>;

const EXTENSIONS: Record<AvatarType, string> = {
  [AvatarType.enum['image/webp']]: 'webp',
  [AvatarType.enum['image/jpeg']]: 'jpg',
};

const AvatarProblem = z.enum(['notImage', 'tooLarge', 'unreadable', 'saveFailed', 'removeFailed']);
type AvatarProblem = z.infer<typeof AvatarProblem>;

const MESSAGES: Record<AvatarProblem, MessageDescriptor> = {
  [AvatarProblem.enum.notImage]: msg`That's not a photo. Pick an image file.`,
  [AvatarProblem.enum.tooLarge]: msg`That photo is over 15 MB. Pick a smaller one.`,
  [AvatarProblem.enum.unreadable]: msg`We couldn't open that photo. Try another one.`,
  [AvatarProblem.enum.saveFailed]: msg`Couldn't save your photo. Try again.`,
  [AvatarProblem.enum.removeFailed]: msg`Couldn't remove your photo. Try again.`,
};

class AvatarError extends Error {
  readonly problem: AvatarProblem;

  constructor(problem: AvatarProblem) {
    super(problem);
    this.problem = problem;
  }
}

export const avatarErrorMessage = (error: unknown) =>
  MESSAGES[error instanceof AvatarError ? error.problem : AvatarProblem.enum.saveFailed];

const createSquare = () => {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(SIZE, SIZE);
    return {
      context: canvas.getContext('2d'),
      toBlob: (type: AvatarType) => canvas.convertToBlob({ type, quality: QUALITY }),
    };
  }
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  return {
    context: canvas.getContext('2d'),
    toBlob: (type: AvatarType) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY)),
  };
};

const readBitmap = async (file: File) => {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new AvatarError(AvatarProblem.enum.unreadable);
  }
};

const squareImage = async (file: File) => {
  const bitmap = await readBitmap(file);
  const { context, toBlob } = createSquare();
  if (!context) throw new AvatarError(AvatarProblem.enum.unreadable);
  const side = Math.min(bitmap.width, bitmap.height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, (bitmap.width - side) * 0.5, (bitmap.height - side) * 0.5, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  const webp = await toBlob(AvatarType.enum['image/webp']);
  if (webp?.type === AvatarType.enum['image/webp']) return { blob: webp, type: AvatarType.enum['image/webp'] };
  // Safari can't encode webp and hands back a png instead.
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = '#fff';
  context.fillRect(0, 0, SIZE, SIZE);
  const jpeg = await toBlob(AvatarType.enum['image/jpeg']);
  if (!jpeg) throw new AvatarError(AvatarProblem.enum.unreadable);
  return { blob: jpeg, type: AvatarType.enum['image/jpeg'] };
};

type Bucket = ReturnType<Supabase['storage']['from']>;

const ownPath = (bucket: Bucket, url: string | null | undefined, userId: string) => {
  const prefix = bucket.getPublicUrl(`${userId}/`).data.publicUrl;
  return url?.startsWith(prefix) ? `${userId}/${url.slice(prefix.length)}` : undefined;
};

const removeFile = async (bucket: Bucket, path: string | undefined) => {
  if (path) await bucket.remove([path]);
};

const currentUser = () => {
  const userId = useAuth.getState().session?.user.id;
  if (!userId) throw new AvatarError(AvatarProblem.enum.saveFailed);
  return { userId, avatarUrl: queryClient.getQueryData<User>(profileKey(userId))?.avatarUrl };
};

const patchAvatar = (userId: string, avatarUrl: string | null) =>
  queryClient.setQueryData<User>(profileKey(userId), (old) => old && { ...old, avatarUrl });

const changeAvatar = async (file: File) => {
  if (!file.type.startsWith('image/')) throw new AvatarError(AvatarProblem.enum.notImage);
  if (file.size > MAX_FILE_BYTES) throw new AvatarError(AvatarProblem.enum.tooLarge);
  const { userId, avatarUrl: previous } = currentUser();
  const { blob, type } = await squareImage(file);
  const path = `${userId}/${crypto.randomUUID()}.${EXTENSIONS[type]}`;
  const supabase = await getSupabase();
  const bucket = supabase.storage.from(BUCKET);
  const upload = await bucket.upload(path, blob, { contentType: type, cacheControl: CACHE_SECONDS });
  if (upload.error) throw new AvatarError(AvatarProblem.enum.saveFailed);
  const avatarUrl = bucket.getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
  if (error) {
    await removeFile(bucket, path);
    throw new AvatarError(AvatarProblem.enum.saveFailed);
  }
  patchAvatar(userId, avatarUrl);
  await removeFile(bucket, ownPath(bucket, previous, userId));
};

const removeAvatar = async () => {
  const { userId, avatarUrl: previous } = currentUser();
  const supabase = await getSupabase();
  const bucket = supabase.storage.from(BUCKET);
  const { data, error } = await supabase.rpc('remove_avatar');
  if (error) throw new AvatarError(AvatarProblem.enum.removeFailed);
  patchAvatar(userId, z.string().nullable().catch(null).parse(data));
  await removeFile(bucket, ownPath(bucket, previous, userId));
};

type Options<TVariables> = Omit<UseMutationOptions<void, Error, TVariables>, 'mutationFn'>;

export const useChangeAvatar = (options?: Options<File>) => useMutation({ mutationFn: changeAvatar, ...options });

export const useRemoveAvatar = (options?: Options<void>) => useMutation({ mutationFn: removeAvatar, ...options });
