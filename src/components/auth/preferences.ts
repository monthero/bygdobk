import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { notifications } from '@mantine/notifications';
import { useEffect, useRef } from 'react';

import { queryClient } from '~/cms/queryClient';
import { currentLocale } from '~/i18n/current';
import type { Locale } from '~/i18n/locales';
import { switchLocale } from '~/i18n/switch';
import { useAuth, type User } from '~/stores/auth';
import { useSettings, type ColorScheme } from '~/stores/settings';
import { getSupabase } from '~/supabase/client';

import { profileKey, useProfile, useSessionUserId } from './hooks';

type Preferences = { locale?: Locale; colorScheme?: ColorScheme };

const toColumns = ({ locale, colorScheme }: Preferences) => ({
  ...(locale && { locale }),
  ...(colorScheme && { color_scheme: colorScheme }),
});

export const savePreferences = async (patch: Preferences) => {
  const userId = useAuth.getState().session?.user.id;
  if (!userId) return;
  const supabase = await getSupabase();
  const { error } = await supabase.from('profiles').update(toColumns(patch)).eq('id', userId);
  if (error) {
    notifications.show({
      color: 'red',
      message: i18n._(msg`Couldn’t save this to your profile. It still works on this device.`),
    });
    return;
  }
  queryClient.setQueryData<User>(profileKey(userId), (old) => old && { ...old, ...patch });
};

export const usePreferenceSync = () => {
  const userId = useSessionUserId();
  const { data: profile } = useProfile();
  const synced = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!userId || !profile || synced.current === userId) return;
    synced.current = userId;
    const locale = currentLocale();
    const { colorScheme, set } = useSettings.getState();
    if (profile.colorScheme) set({ colorScheme: profile.colorScheme });
    if (profile.locale && profile.locale !== locale) void switchLocale(profile.locale);
    const missing: Preferences = {
      ...(!profile.locale && { locale }),
      ...(!profile.colorScheme && { colorScheme }),
    };
    if (missing.locale || missing.colorScheme) void savePreferences(missing);
  }, [userId, profile]);
};
