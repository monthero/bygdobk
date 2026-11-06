import { useLingui } from '@lingui/react/macro';
import { ActionIcon, Group, Text } from '@mantine/core';
import { memo } from 'react';

import { useSiteContent } from '~/cms/content';
import { SOCIAL_NAMES, SocialPlatform } from '~/data/socials';

import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  SnapchatLogo,
  ThreadsLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
} from './icons';

import classes from './SocialLinks.module.css';

const ICONS: Record<SocialPlatform, typeof InstagramLogo> = {
  [SocialPlatform.enum.instagram]: InstagramLogo,
  [SocialPlatform.enum.facebook]: FacebookLogo,
  [SocialPlatform.enum.linkedin]: LinkedinLogo,
  [SocialPlatform.enum.youtube]: YoutubeLogo,
  [SocialPlatform.enum.tiktok]: TiktokLogo,
  [SocialPlatform.enum.x]: XLogo,
  [SocialPlatform.enum.threads]: ThreadsLogo,
  [SocialPlatform.enum.snapchat]: SnapchatLogo,
};

const EXTERNAL = { component: 'a', target: '_blank', rel: 'noopener noreferrer' } as const;

type Props = { label?: boolean; className?: string };

export const SocialLinks = memo<Props>(({ label = true, className }) => {
  const { t } = useLingui();
  const { socials } = useSiteContent();
  if (socials.length === 0) return null;

  return (
    <Group gap="xs" className={className}>
      {label && (
        <Text size="sm" fw={600} className={classes.label}>
          {t`Follow us`}
        </Text>
      )}
      {socials.map(({ platform, url }) => {
        const Icon = ICONS[platform];
        const name = SOCIAL_NAMES[platform];
        return (
          <ActionIcon
            key={url}
            {...EXTERNAL}
            href={url}
            size={48}
            radius="xl"
            variant="outline"
            aria-label={t`Bygdø BK on ${name}`}
            className={classes.icon}
          >
            <Icon />
          </ActionIcon>
        );
      })}
    </Group>
  );
});
