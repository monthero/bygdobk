import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Group, Loader, Slider, Stack, Text } from '@mantine/core';
import { useEffect, useId, useMemo, useState, type FC, type HTMLAttributes, type ReactNode } from 'react';
import Cropper, { type Area, type CropperInteractionSource, type Point } from 'react-easy-crop';

import { ArrowCounterClockwise, Check, ResponsiveModal, Warning } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';

import { avatarErrorMessage, UNREADABLE_PHOTO, useChangeAvatar, type CropArea } from './avatar';

import classes from './AvatarCropper.module.css';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.01;
const KEYBOARD_STEP = 10;
const CENTER: Point = { x: 0, y: 0 };
const DRAG_SOURCES = new Set<CropperInteractionSource>(['mouse', 'touch']);
const CROPPER_CLASSES = { containerClassName: classes.container, cropAreaClassName: classes.cropArea };

const zoomLabel = (zoom: number) => `${Math.round(zoom * 100)}%`;

type Props = { file: File; onClose: () => void };

type FormProps = {
  src: string;
  hint: ReactNode;
  saving: boolean;
  error: unknown;
  onSave: (area: CropArea) => void;
  onCancel: () => void;
};

const CropForm: FC<FormProps> = ({ src, hint, saving, error, onSave, onCancel }) => {
  const { i18n, t } = useLingui();
  const hintId = useId();
  const [crop, setCrop] = useState(CENTER);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<Area>();
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const cropperProps = useMemo<HTMLAttributes<HTMLDivElement>>(
    () => ({ role: 'group', 'aria-label': t`Crop area`, 'aria-describedby': hintId }),
    [t, hintId],
  );
  const mediaProps = useMemo(() => ({ onError: () => setFailed(true) }), []);

  const reset = () => {
    setCrop(CENTER);
    setZoom(MIN_ZOOM);
  };

  return (
    <Stack gap="md">
      {failed ? (
        <Alert color="red" variant="light" icon={<Warning />}>
          {i18n._(UNREADABLE_PHOTO)}
        </Alert>
      ) : (
        <>
          <div className={classes.frame} data-dragging={dragging || undefined} data-saving={saving || undefined}>
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              aspect={1}
              cropShape="round"
              showGrid={false}
              keyboardStep={KEYBOARD_STEP}
              classes={CROPPER_CLASSES}
              cropperProps={cropperProps}
              mediaProps={mediaProps}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
              onInteractionStart={({ source }) => setDragging(DRAG_SOURCES.has(source))}
              onInteractionEnd={() => setDragging(false)}
            />
            {!area && <Loader className={classes.loader} color="white" size="sm" />}
          </div>
          <Text id={hintId} size="sm" c="dimmed" ta="center">
            {hint}
          </Text>
          <Group gap="sm" wrap="nowrap">
            <Slider
              flex={1}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              value={zoom}
              onChange={setZoom}
              label={zoomLabel}
              thumbLabel={t`Zoom`}
              disabled={saving || !area}
            />
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<ArrowCounterClockwise />}
              disabled={saving || !area}
              onClick={reset}
            >
              <Trans>Reset</Trans>
            </Button>
          </Group>
        </>
      )}
      {error !== null && (
        <Alert color="red" variant="light" icon={<Warning />} role="alert">
          {i18n._(avatarErrorMessage(error))}
        </Alert>
      )}
      <Group justify="flex-end" gap="xs">
        <Button variant="default" disabled={saving} onClick={onCancel}>
          <Trans>Cancel</Trans>
        </Button>
        <Button leftSection={<Check />} loading={saving} disabled={!area} onClick={() => area && onSave(area)}>
          <Trans>Save photo</Trans>
        </Button>
      </Group>
    </Stack>
  );
};

const AvatarCropper: FC<Props> = ({ file, onClose }) => {
  const { t } = useLingui();
  const mobile = useIsMobile();
  const change = useChangeAvatar({ onSuccess: onClose });
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const close = () => {
    if (!change.isPending) onClose();
  };

  return (
    <ResponsiveModal opened onClose={close} title={t`Crop your photo`}>
      {src && (
        <CropForm
          src={src}
          hint={
            mobile ? (
              <Trans>Drag to move. Pinch to zoom.</Trans>
            ) : (
              <Trans>Drag or use the arrow keys to move. Scroll or pinch to zoom.</Trans>
            )
          }
          saving={change.isPending}
          error={change.error}
          onSave={(area) => change.mutate({ file, area })}
          onCancel={close}
        />
      )}
    </ResponsiveModal>
  );
};

export default AvatarCropper;
