import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { getRouteApi, Link } from '@tanstack/react-router';
import { useMemo, useState, type FC, type FormEvent, type ReactNode } from 'react';

import { useSiteContent, type Plan } from '~/cms/content';
import { useAuthReady, useSessionUserId } from '~/components/auth/hooks';
import { PageIntro } from '~/components/styles';
import { groupTimes } from '~/components/styles/court/schedule';
import { ArrowRight, CheckCircle, Clock, PaperPlaneTilt, SignIn, User, UsersThree, Warning } from '~/components/ui';
import { GROUP_SLUGS, PriceKind } from '~/data/club';
import { PHOTOS } from '~/data/photos';
import { usePageTitle } from '~/hooks/usePageTitle';
import { useSeasons } from '~/hooks/useSeasons';
import { membershipSeason, MembershipStatus, NAME_MAX, seasonDates, type Membership } from '~/memberships/model';
import { membershipErrorMessage, useMyMemberships, useRequestMembership } from '~/memberships/queries';
import { useUi } from '~/stores/ui';
import { seasonTraining, weeklySessions } from '~/utils/training';

import { fitsJoiner, groupOfPlan, Joiner, joinerOfPlan, kr, planForGroup, planTotal } from './offers';

import classes from './JoinPage.module.css';

const route = getRouteApi('/medlemskap/bli-medlem');

const QUESTION_CLASS_NAMES = { label: classes.question };

const JOINER_OPTIONS: Record<Joiner, { label: MessageDescriptor; hint: MessageDescriptor; icon: ReactNode }> = {
  [Joiner.enum.me]: { label: msg`Me`, hint: msg`I want to play`, icon: <User /> },
  [Joiner.enum.child]: { label: msg`My child`, hint: msg`I’m the parent`, icon: <UsersThree /> },
};

const OPEN = new Set<MembershipStatus>([MembershipStatus.enum.requested, MembershipStatus.enum.active]);
const NAME_FIELD_WIDTH = 320;
const DONE_ICON_SIZE = 40;

const samePerson = (a: string | null, b: string | null) => a?.trim().toLowerCase() === b?.trim().toLowerCase();

const MineLink: FC = () => (
  <Button
    variant="light"
    rightSection={<ArrowRight />}
    className={classes.go}
    renderRoot={(props) => <Link {...props} to="/medlemskap/mine" />}
  >
    <Trans>See my membership</Trans>
  </Button>
);

const Sent: FC = () => (
  <Stack gap="md">
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" color="teal" size={DONE_ICON_SIZE} radius="xl">
        <CheckCircle />
      </ThemeIcon>
      <Stack gap={0}>
        <Title order={3}>
          <Trans>Request sent!</Trans>
        </Title>
        <Text>
          <Trans>The board will confirm it and let you know about payment.</Trans>
        </Text>
      </Stack>
    </Group>
    <MineLink />
  </Stack>
);

const AlreadyAsked: FC<{ membership: Membership }> = ({ membership }) => (
  <Stack gap="md">
    <Group gap="sm" wrap="nowrap">
      {membership.status === MembershipStatus.enum.active ? (
        <>
          <ThemeIcon variant="light" color="teal" size={DONE_ICON_SIZE} radius="xl">
            <CheckCircle />
          </ThemeIcon>
          <Text fw={600}>
            <Trans>You already have this one this season.</Trans>
          </Text>
        </>
      ) : (
        <>
          <ThemeIcon variant="light" color="blue" size={DONE_ICON_SIZE} radius="xl">
            <Clock />
          </ThemeIcon>
          <Text fw={600}>
            <Trans>Already requested. The board will get back to you.</Trans>
          </Text>
        </>
      )}
    </Group>
    <MineLink />
  </Stack>
);

const PriceAmount: FC<{ plan: Plan }> = ({ plan }) =>
  plan.kind === PriceKind.enum.dropin && plan.perVisit ? (
    <Trans>
      {kr(plan.membership)} + {kr(plan.perVisit)} per visit
    </Trans>
  ) : (
    kr(planTotal(plan))
  );

export const JoinPage: FC = () => {
  const { i18n, t } = useLingui();
  usePageTitle(t`Join the club`, t`Membership`);
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { plans, events } = useSiteContent();
  const { current } = useSeasons();
  const ready = useAuthReady();
  const userId = useSessionUserId();
  const openLogin = useUi((s) => s.openLogin);
  const mine = useMyMemberships();
  const request = useRequestMembership();
  const [childName, setChildName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const sessions = useMemo(() => weeklySessions(seasonTraining(events, current)), [events, current]);

  const picked = plans.find((p) => p.id === search.pris) ?? planForGroup(plans, GROUP_SLUGS.fromSlug(search.gruppe));
  const joiner = search.for ?? joinerOfPlan(picked);
  const options = plans.filter((p) => fitsJoiner(p, joiner));
  const plan = picked && fitsJoiner(picked, joiner) ? picked : undefined;
  const child = joiner === Joiner.enum.child;
  const playerName = child ? childName.trim() : null;
  const existing =
    plan && joiner && playerName !== ''
      ? mine.data?.find(
          (m) =>
            m.planId === plan.id &&
            OPEN.has(m.status) &&
            membershipSeason(m).id === current.id &&
            samePerson(m.playerName, playerName),
        )
      : undefined;

  const pickJoiner = (value: string) => {
    request.reset();
    const next = Joiner.safeParse(value).data;
    const keep = plan && fitsJoiner(plan, next);
    void navigate({
      search: (prev) => ({ ...prev, for: next, ...(!keep && { pris: undefined, gruppe: undefined }) }),
      replace: true,
      resetScroll: false,
    });
  };
  const pickPlan = (id: string) => {
    request.reset();
    const next = plans.find((p) => p.id === id);
    void navigate({
      search: (prev) => ({ ...prev, pris: id, gruppe: undefined, for: joiner ?? joinerOfPlan(next) }),
      replace: true,
      resetScroll: false,
    });
  };

  const changeChildName = (value: string) => {
    request.reset();
    setNameError(undefined);
    setChildName(value);
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!userId) {
      openLogin();
      return;
    }
    if (!plan || !joiner) return;
    if (playerName === '') {
      setNameError(t`Enter your child’s name`);
      return;
    }
    request.mutate({ planId: plan.id, playerName, priceNok: planTotal(plan), ...seasonDates(current) });
  };

  let body: ReactNode;
  if (request.isSuccess) body = <Sent />;
  else if (existing) body = <AlreadyAsked membership={existing} />;
  else {
    body = (
      <>
        {child && (
          <TextInput
            label={t`Your child’s name`}
            autoComplete="off"
            maxLength={NAME_MAX}
            maw={NAME_FIELD_WIDTH}
            withAsterisk
            value={childName}
            onChange={(e) => changeChildName(e.currentTarget.value)}
            error={nameError}
          />
        )}
        {request.isError && (
          <Alert color="red" variant="light" icon={<Warning />} role="alert">
            {i18n._(membershipErrorMessage(request.error))}
          </Alert>
        )}
        {userId ? (
          <Button
            type="submit"
            size="md"
            leftSection={<PaperPlaneTilt />}
            loading={request.isPending}
            disabled={!plan || !joiner}
            className={classes.go}
          >
            <Trans>Send membership request</Trans>
          </Button>
        ) : (
          <Button type="submit" size="md" leftSection={<SignIn />} loading={!ready} className={classes.go}>
            <Trans>Log in to send your request</Trans>
          </Button>
        )}
      </>
    );
  }

  return (
    <>
      <PageIntro
        photo={PHOTOS.playersCourt}
        eyebrow={<Trans>Season {current.label}</Trans>}
        title={<Trans>Join Bygdø Badmintonklubb</Trans>}
        lede={<Trans>Find the plan that fits you and send a request. The board takes it from there.</Trans>}
      />
      <Container size="md" py={40}>
        <Stack gap="xl">
          <Radio.Group
            label={t`Who is joining?`}
            classNames={QUESTION_CLASS_NAMES}
            value={joiner ?? null}
            onChange={pickJoiner}
          >
            <SimpleGrid cols={2} spacing="md" mt="xs">
              {Joiner.options.map((option) => {
                const { label, hint, icon } = JOINER_OPTIONS[option];
                return (
                  <Radio.Card key={option} value={option} radius="md" p="md" className={classes.option}>
                    <Group wrap="nowrap" gap="sm">
                      <Radio.Indicator />
                      <ThemeIcon variant="light" size={36} radius="md" visibleFrom="xs">
                        {icon}
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Text fw={700}>{i18n._(label)}</Text>
                        <Text size="sm" c="dimmed">
                          {i18n._(hint)}
                        </Text>
                      </Stack>
                    </Group>
                  </Radio.Card>
                );
              })}
            </SimpleGrid>
          </Radio.Group>

          {options.length > 0 && (
            <Radio.Group
              label={t`Choose a membership`}
              classNames={QUESTION_CLASS_NAMES}
              value={plan?.id ?? null}
              onChange={pickPlan}
            >
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="xs">
                {options.map((p) => {
                  const group = groupOfPlan(p);
                  return (
                    <Radio.Card key={p.id} value={p.id} radius="md" p="md" className={classes.option}>
                      <Group wrap="nowrap" align="flex-start">
                        <Radio.Indicator />
                        <Stack gap={2}>
                          <Text fw={700}>{p.name}</Text>
                          <Text size="sm">{p.note}</Text>
                          {group && (
                            <Text size="sm" c="dimmed" className="tabular">
                              {groupTimes(group, sessions).join(' · ')}
                            </Text>
                          )}
                          <Text fw={600} mt={4} className="tabular">
                            <PriceAmount plan={p} />
                          </Text>
                        </Stack>
                      </Group>
                    </Radio.Card>
                  );
                })}
              </SimpleGrid>
            </Radio.Group>
          )}

          <Paper
            component="form"
            onSubmit={send}
            noValidate
            withBorder
            radius="lg"
            p="lg"
            className={classes.handoff}
            data-picked={plan ? true : undefined}
          >
            <Stack gap="md">
              {plan ? (
                <div>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    <Trans>Your pick</Trans>
                  </Text>
                  <Group justify="space-between" align="baseline" gap="xs">
                    <Title order={3}>{plan.name}</Title>
                    <Text fw={700} size="lg" className="tabular">
                      <PriceAmount plan={plan} />
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    <Trans>The board applies any discounts after you sign up.</Trans>
                  </Text>
                </div>
              ) : (
                <Text c="dimmed">
                  <Trans>Pick a plan above to see the price.</Trans>
                </Text>
              )}
              {plan && !joiner && (
                <Text c="dimmed">
                  <Trans>Pick who is joining above.</Trans>
                </Text>
              )}
              {child && <Text>{t`Parents sign up children under 18.`}</Text>}
              {body}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </>
  );
};
