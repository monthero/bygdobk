import { useLingui } from '@lingui/react/macro';
import { ActionIcon, Group, Text } from '@mantine/core';
import { memo } from 'react';

import { CLUB } from '~/data/club';

import { FacebookLogo, InstagramLogo } from './icons';

import classes from './SocialLinks.module.css';

const SOCIALS = [
  { name: 'Instagram', href: CLUB.instagramUrl, Icon: InstagramLogo },
  { name: 'Facebook', href: CLUB.facebookUrl, Icon: FacebookLogo },
] as const;

const EXTERNAL = { component: 'a', target: '_blank', rel: 'noopener noreferrer' } as const;

type Props = { label?: boolean; className?: string };

export const SocialLinks = memo<Props>(({ label = true, className }) => {
  const { t } = useLingui();

  return (
    <Group gap="xs" className={className}>
      {label && (
        <Text size="sm" fw={600} className={classes.label}>
          {t`Follow us`}
        </Text>
      )}
      {SOCIALS.map(({ name, href, Icon }) => (
        <ActionIcon
          key={name}
          {...EXTERNAL}
          href={href}
          size={48}
          radius="xl"
          variant="outline"
          aria-label={t`Bygdø BK on ${name}`}
          className={classes.icon}
        >
          <Icon />
        </ActionIcon>
      ))}
    </Group>
  );
});
