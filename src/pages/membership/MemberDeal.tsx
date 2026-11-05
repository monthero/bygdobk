import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import type { FC } from 'react';

import sportModernLogo from '~/assets/sponsors/sport-modern.svg';
import { ArrowUpRight, EnvelopeSimple, Sneaker, Truck, TShirt } from '~/components/ui';
import { CLUB } from '~/data/club';

import classes from './MemberDeal.module.css';

const PERCENT = { style: 'percent' } as const;
const KRONER = { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 } as const;
const FREE_SHIPPING_FROM = 1000;

export const MemberDeal: FC = () => {
  const { i18n } = useLingui();
  const limit = i18n.number(FREE_SHIPPING_FROM, KRONER);
  const perks = [
    { icon: <TShirt />, value: i18n.number(0.2, PERCENT), label: <Trans>off clothes and rackets</Trans> },
    {
      icon: <Sneaker />,
      value: i18n.number(0.1, PERCENT),
      label: <Trans>off shoes, accessories, bags and shuttles</Trans>,
    },
    { icon: <Truck />, value: <Trans>Free shipping</Trans>, label: <Trans>on orders over {limit}</Trans> },
  ];

  return (
    <Card withBorder radius="lg" padding="lg">
      <Stack gap="lg">
        <Group gap="lg" wrap="wrap">
          <a href={CLUB.sportModernUrl} target="_blank" rel="noreferrer" className={classes.logo}>
            <img src={sportModernLogo} alt="Sport Modern" width={186} height={45} />
          </a>
          <Text c="dimmed" className={classes.lede}>
            <Trans>Our members get these discounts at Sport Modern.</Trans>
          </Text>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
          {perks.map((perk, index) => (
            <div key={index} className={classes.perk}>
              <ThemeIcon variant="light" size={36} radius="md">
                {perk.icon}
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
        <Group justify="space-between" gap="sm" className={classes.foot}>
          <Text size="sm">
            <Trans>Give the club code when you order. Forgot it? Ask the board.</Trans>
          </Text>
          <Group gap="xs">
            <Button component="a" href={`mailto:${CLUB.email}`} variant="default" leftSection={<EnvelopeSimple />}>
              <Trans>Ask for the code</Trans>
            </Button>
            <Button
              component="a"
              href={CLUB.sportModernUrl}
              target="_blank"
              rel="noreferrer"
              rightSection={<ArrowUpRight />}
            >
              <Trans>Shop at Sport Modern</Trans>
            </Button>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
};
