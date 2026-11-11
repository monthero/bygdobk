import { Plural, Trans, useLingui } from '@lingui/react/macro';
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
import { hasDeal, useGroups, useSitePhoto } from '~/cms/siteData';
import { PageIntro } from '~/components/styles';
import { ArrowRight, CalendarBlank, UserPlus } from '~/components/ui';
import { DEAL_HASH, GROUP_SLUGS, GroupStatus, Group as TrainingGroup, PriceKind } from '~/data/club';
import { contactLink, ContactTopic } from '~/data/contact';
import { PhotoSlot } from '~/data/photos';
import { usePageMetaTitle } from '~/hooks/usePageTitle';
import { useSeasons } from '~/hooks/useSeasons';
import { orListFormat } from '~/i18n/current';
import { groupOfPlan, kr, planForGroup, planTotal } from '~/pages/join/offers';
import { BRING_HASH } from '~/pages/training/TrainingPage';

import { MemberDeal } from './MemberDeal';

const trainingPrice = (p: Plan) => {
  if (p.perVisit) return <Trans>{kr(p.perVisit)} per visit</Trans>;
  if (p.kind === PriceKind.enum.trial) return <Trans>Included</Trans>;
  return p.training ? kr(p.training) : '–';
};

const totalPrice = (p: Plan) => (p.kind === PriceKind.enum.dropin ? '–' : kr(planTotal(p)));

const PriceName: FC<{ price: Plan; season: string }> = ({ price, season }) => {
  const { vipps } = useSiteContent().payment;
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
      {price.kind === PriceKind.enum.dropin && vipps && (
        <Text size="sm" c="dimmed">
          <Trans>Vipps number {vipps}</Trans>
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
  usePageMetaTitle('/medlemskap');
  const photo = useSitePhoto(PhotoSlot.enum.membership);
  const { plans, discounts, sponsors, payment } = useSiteContent();
  const groups = useGroups();
  const deals = sponsors.filter(hasDeal);
  const onlyDealName = deals.length === 1 ? deals.at(0)?.name : undefined;
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

  const choices = orListFormat().format([
    ...TrainingGroup.options
      .filter((g) => planForGroup(plans, g) && groups[g].status !== GroupStatus.enum.full)
      .map((g) => groups[g].name),
    t`a trial`,
  ]);

  const steps = [
    { title: t`Choose a group`, body: `${choices}. ${t`Not sure? Start as a beginner.`}` },
    { title: t`Fill in the form`, body: t`Parents sign up children under 18.` },
    {
      title: t`Pay`,
      body: (
        <>
          {payment.instructions}
          {payment.accountNumber && (
            <>
              {' '}
              <Trans>Account number: {payment.accountNumber}</Trans>
            </>
          )}
        </>
      ),
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
        photo={photo}
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
        {onlyDealName && (
          <Text mt="md">
            <Trans>
              Members also get a deal at {onlyDealName}.{' '}
              <Anchor component={Link} to="/medlemskap" hash={DEAL_HASH} fw={600}>
                See the member deal
              </Anchor>
            </Trans>
          </Text>
        )}
        {deals.length > 1 && (
          <Text mt="md">
            <Trans>
              Members also get deals from our partners.{' '}
              <Anchor component={Link} to="/medlemskap" hash={DEAL_HASH} fw={600}>
                See the member deals
              </Anchor>
            </Trans>
          </Text>
        )}
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

      {deals.length > 0 && (
        <Container pb={40}>
          <Stack gap="md" id={DEAL_HASH}>
            <Title order={2}>
              <Plural value={deals.length} one="Member deal" other="Member deals" />
            </Title>
            {deals.map((sponsor) => (
              <MemberDeal key={sponsor.id} sponsor={sponsor} />
            ))}
          </Stack>
        </Container>
      )}

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
