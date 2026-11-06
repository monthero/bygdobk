import { Trans, useLingui } from '@lingui/react/macro';
import {
  Accordion,
  Alert,
  Anchor,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC, ReactNode } from 'react';

import { useSiteContent, type Plan } from '~/cms/content';
import { PageIntro } from '~/components/styles';
import { ArrowRight, CalendarBlank, UserPlus } from '~/components/ui';
import { CLUB, DEAL_HASH, GROUP_SLUGS, PriceKind } from '~/data/club';
import { contactLink, ContactTopic } from '~/data/contact';
import { PHOTOS } from '~/data/photos';
import { useSeasons } from '~/hooks/useSeasons';
import { groupOfPlan, kr, planTotal } from '~/pages/join/offers';
import { BRING_HASH } from '~/pages/training/TrainingPage';

import { MemberDeal } from './MemberDeal';

const trainingPrice = (p: Plan) => {
  if (p.perVisit) return <Trans>{kr(p.perVisit)} per visit</Trans>;
  if (p.kind === PriceKind.enum.trial) return <Trans>Included</Trans>;
  return p.training ? kr(p.training) : '–';
};

const totalPrice = (p: Plan) => (p.kind === PriceKind.enum.dropin ? '–' : kr(planTotal(p)));

const PriceName: FC<{ price: Plan; season: string }> = ({ price, season }) => {
  const group = groupOfPlan(price);
  const name = price.name;
  return (
    <div>
      {group ? (
        <Anchor
          fw={600}
          renderRoot={(props) => (
            <Link
              {...props}
              to="/trening/$sesong"
              params={{ sesong: season }}
              search={{ gruppe: GROUP_SLUGS.toSlug(group) }}
            />
          )}
        >
          {name}
        </Anchor>
      ) : (
        <Text fw={600} span>
          {name}
        </Text>
      )}
      <Text size="sm" c="dimmed">
        {price.note}
      </Text>
      {price.kind === PriceKind.enum.dropin && (
        <Text size="sm" c="dimmed">
          <Trans>Vipps number {CLUB.vipps}</Trans>
        </Text>
      )}
    </div>
  );
};

const PriceLine: FC<{ label: ReactNode; value: ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <Group justify="space-between" wrap="nowrap" gap="sm">
    <Text c={strong ? undefined : 'dimmed'} fw={strong ? 700 : undefined}>
      {label}
    </Text>
    <Text fw={strong ? 700 : undefined} className="tabular" ta="end">
      {value}
    </Text>
  </Group>
);

const ASK_LINK = contactLink(ContactTopic.enum.membership);

export const MembershipPage: FC = () => {
  const { t } = useLingui();
  const { plans, discounts } = useSiteContent();
  const { current } = useSeasons();
  const renderBringLink = (props: Record<string, unknown>) => (
    <Link {...props} to="/trening/$sesong" params={{ sesong: current.id }} hash={BRING_HASH} />
  );
  const midSeasonLink = contactLink(
    ContactTopic.enum.membership,
    t`Hi! I'd like to join mid-season. What would the price be?`,
  );
  const changeLink = contactLink(ContactTopic.enum.membership, t`Hi! I'd like to change or end my membership.`);
  const paymentLink = contactLink(
    ContactTopic.enum.membership,
    t`Hi! I have a question about paying for my membership.`,
  );

  const steps = [
    { title: t`Choose a group`, body: t`Beginners, Junior, Adults or a trial. Not sure? Start as a beginner.` },
    { title: t`Fill in the form`, body: t`Parents sign up children under 18.` },
    {
      title: t`Pay`,
      body: t`You pay both fees together, by card or Vipps, when the season starts or right after you join.`,
    },
    {
      title: t`Come to training`,
      body: (
        <Anchor size="sm" fw={600} renderRoot={renderBringLink}>
          <Trans>What to bring</Trans> <ArrowRight />
        </Anchor>
      ),
    },
  ];

  const faq = [
    {
      q: t`Can I try before I join?`,
      a: <Trans>Yes. Children can start with a trial membership, and adults can drop in. See the prices above.</Trans>,
    },
    {
      q: t`How do I change or end my membership?`,
      a: (
        <Trans>
          <Anchor renderRoot={(props) => <Link {...props} {...changeLink} />}>Write to the board</Anchor> before the new
          season starts.
        </Trans>
      ),
    },
    {
      q: t`Questions about payment?`,
      a: (
        <Trans>
          <Anchor renderRoot={(props) => <Link {...props} {...paymentLink} />}>Write to the board</Anchor>.
        </Trans>
      ),
    },
  ];

  return (
    <>
      <PageIntro
        photo={PHOTOS.shuttleRacket}
        eyebrow={<Trans>Season {current.label}</Trans>}
        title={<Trans>Membership and prices</Trans>}
        lede={
          <Trans>
            Everyone who plays is a member. The price for the season is the membership fee plus the training fee for
            your group.
          </Trans>
        }
      >
        <Group mt="sm">
          <Button component={Link} to="/medlemskap/bli-medlem" size="md" leftSection={<UserPlus />}>
            <Trans>Join the club</Trans>
          </Button>
          <Button component={Link} to="/medlemskap/mine" size="md" variant="default">
            <Trans>My membership</Trans>
          </Button>
        </Group>
        <Text mt="md">
          <Trans>
            Members also get up to 20% off at Sport Modern.{' '}
            <Anchor component={Link} to="/medlemskap" hash={DEAL_HASH} fw={600}>
              See the member deal
            </Anchor>
          </Trans>
        </Text>
      </PageIntro>

      <Container py={40}>
        <Grid gap={40}>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Title order={2}>
                <Trans>Prices per season</Trans>
              </Title>
              <Alert icon={<CalendarBlank />} variant="light" color="brand">
                <Trans>
                  One season runs from August to June, like the school year. Joining mid-season?{' '}
                  <Anchor
                    renderRoot={(props) => <Link {...props} {...midSeasonLink} />}
                    inherit
                    c="inherit"
                    fw={600}
                    underline="always"
                  >
                    Ask the board
                  </Anchor>{' '}
                  about the price.
                </Trans>
              </Alert>
              {plans.length === 0 && (
                <Text c="dimmed">
                  <Trans>
                    No prices here yet.{' '}
                    <Anchor
                      renderRoot={(props) => <Link {...props} {...ASK_LINK} />}
                      inherit
                      c="inherit"
                      fw={600}
                      underline="always"
                    >
                      Ask the board
                    </Anchor>
                  </Trans>
                </Text>
              )}
              <Table.ScrollContainer minWidth={520} visibleFrom="sm">
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        <Trans>Group</Trans>
                      </Table.Th>
                      <Table.Th ta="end">
                        <Trans>Membership</Trans>
                      </Table.Th>
                      <Table.Th ta="end">
                        <Trans>Training</Trans>
                      </Table.Th>
                      <Table.Th ta="end">
                        <Trans>Total</Trans>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {plans.map((p) => (
                      <Table.Tr key={p.id}>
                        <Table.Td>
                          <PriceName price={p} season={current.id} />
                        </Table.Td>
                        <Table.Td ta="end" className="tabular">
                          {kr(p.membership)}
                        </Table.Td>
                        <Table.Td ta="end" className="tabular">
                          {trainingPrice(p)}
                        </Table.Td>
                        <Table.Td ta="end" fw={700} className="tabular">
                          {totalPrice(p)}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
              <Stack gap="sm" hiddenFrom="sm">
                {plans.map((p) => (
                  <Card key={p.id} withBorder radius="lg" padding="md">
                    <PriceName price={p} season={current.id} />
                    <Stack gap={4} mt="sm">
                      <PriceLine label={<Trans>Membership</Trans>} value={kr(p.membership)} />
                      <PriceLine label={<Trans>Training</Trans>} value={trainingPrice(p)} />
                      <Divider my={4} />
                      <PriceLine label={<Trans>Total</Trans>} value={totalPrice(p)} strong />
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Title order={2}>
                <Trans>Discounts and help</Trans>
              </Title>
              {discounts.map((d) => (
                <Card key={d.title} withBorder radius="lg" padding="md">
                  <Text fw={700}>{d.title}</Text>
                  <Text c="dimmed">{d.body}</Text>
                </Card>
              ))}
              {discounts.length === 0 && (
                <Text c="dimmed">
                  <Trans>
                    <Anchor
                      renderRoot={(props) => <Link {...props} {...ASK_LINK} />}
                      inherit
                      c="inherit"
                      fw={600}
                      underline="always"
                    >
                      Ask the board
                    </Anchor>{' '}
                    about discounts and support.
                  </Trans>
                </Text>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      <Container pb={40}>
        <Stack gap="md" id={DEAL_HASH}>
          <Title order={2}>
            <Trans>Member deal</Trans>
          </Title>
          <MemberDeal />
        </Stack>
      </Container>

      <Container pb={40}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={40}>
          <Stack gap="md">
            <Title order={2}>
              <Trans>How to join</Trans>
            </Title>
            <Timeline active={-1} bulletSize={28} lineWidth={2}>
              {steps.map((step, index) => (
                <Timeline.Item
                  key={step.title}
                  bullet={
                    <Text size="sm" fw={700}>
                      {index + 1}
                    </Text>
                  }
                  title={step.title}
                >
                  <Text c="dimmed" size="sm">
                    {step.body}
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Stack>
          <Stack gap="md">
            <Title order={2}>
              <Trans>Questions</Trans>
            </Title>
            <Accordion variant="separated" radius="md">
              {faq.map(({ q, a }) => (
                <Accordion.Item key={q} value={q}>
                  <Accordion.Control>{q}</Accordion.Control>
                  <Accordion.Panel>{a}</Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Stack>
        </SimpleGrid>
      </Container>
    </>
  );
};
