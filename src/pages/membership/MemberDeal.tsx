import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC, ReactNode } from 'react';

import type { DealSponsor } from '~/cms/siteData';
import { ArrowUpRight, ChatCircle, Gift, Percent, Racket, Shuttle, Sneaker, Tag, Truck, TShirt } from '~/components/ui';
import { contactLink, ContactTopic } from '~/data/contact';
import { PerkIcon } from '~/data/sponsors';

import classes from './MemberDeal.module.css';

const LOGO_HEIGHT = 44;
const MAX_PERK_COLUMNS = 3;

const PERK_ICONS: Record<PerkIcon, ReactNode> = {
  [PerkIcon.enum.tshirt]: <TShirt />,
  [PerkIcon.enum.sneaker]: <Sneaker />,
  [PerkIcon.enum.truck]: <Truck />,
  [PerkIcon.enum.tag]: <Tag />,
  [PerkIcon.enum.percent]: <Percent />,
  [PerkIcon.enum.gift]: <Gift />,
  [PerkIcon.enum.racket]: <Racket />,
  [PerkIcon.enum.shuttle]: <Shuttle />,
};

export const MemberDeal: FC<{ sponsor: DealSponsor }> = ({ sponsor }) => {
  const { t } = useLingui();
  const { name, url, logo, deal } = sponsor;
  const codeLink = contactLink(ContactTopic.enum.membership, t`Hi! Could you send me the ${name} member code?`);

  return (
    <Card withBorder radius="lg" padding="lg">
      <Stack gap="lg">
        <Group gap="lg" wrap="wrap">
          <a href={url} target="_blank" rel="noreferrer" className={classes.logo}>
            <img
              src={logo.url}
              alt={name}
              width={Math.round(logo.width * (LOGO_HEIGHT / logo.height))}
              height={LOGO_HEIGHT}
              loading="lazy"
              decoding="async"
            />
          </a>
          {deal.intro && (
            <Text c="dimmed" className={classes.lede}>
              {deal.intro}
            </Text>
          )}
        </Group>
        {deal.perks.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: Math.min(deal.perks.length, MAX_PERK_COLUMNS) }} spacing="sm">
            {deal.perks.map((perk) => (
              <div key={perk._key} className={classes.perk}>
                <ThemeIcon variant="light" size={36} radius="md">
                  {PERK_ICONS[perk.icon]}
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg" lh={1.2}>
                    {perk.value}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {perk.label}
                  </Text>
                </div>
              </div>
            ))}
          </SimpleGrid>
        )}
        <Group justify={deal.howTo ? 'space-between' : 'flex-end'} gap="sm" className={classes.foot}>
          {deal.howTo && <Text size="sm">{deal.howTo}</Text>}
          <Group gap="xs">
            {deal.askForCode && (
              <Button
                renderRoot={(props) => <Link {...props} {...codeLink} />}
                variant="default"
                leftSection={<ChatCircle />}
              >
                <Trans>Ask for the code</Trans>
              </Button>
            )}
            <Button component="a" href={url} target="_blank" rel="noreferrer" rightSection={<ArrowUpRight />}>
              <Trans>Shop at {name}</Trans>
            </Button>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
};
