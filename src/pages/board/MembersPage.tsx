import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Badge, Button, Chip, Container, Select, Stack, Tabs, Text, Title } from '@mantine/core';
import { getRouteApi, Navigate } from '@tanstack/react-router';
import { useCallback, useDeferredValue, useMemo, useState, type FC } from 'react';
import { z } from 'zod';

import { useSiteContent } from '~/cms/content';
import { useProfile, useSignedOut } from '~/components/auth/hooks';
import { PageToolbar } from '~/components/layout';
import { PageIntro } from '~/components/styles';
import { CalendarBlank, Clock, Gauge, IdentificationCard, Plus, SearchInput, Segmented } from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { useSeasons } from '~/hooks/useSeasons';
import { MembershipStatus, type AdminMembership, type BoardProfile } from '~/memberships/model';
import {
  useBoardProfiles,
  useMembershipRequests,
  useOpenRequestCount,
  useSeasonMemberships,
} from '~/memberships/queries';
import { STAY } from '~/utils/navigation';

import { BoardDatesProvider } from './BoardDatesProvider';
import { DeclineRequestModal } from './DeclineRequestModal';
import { DeleteMembershipModal } from './DeleteMembershipModal';
import { ALL_SEASONS, MembersTab, seasonById } from './format';
import { LoadError } from './LoadError';
import { MarkPaidModal } from './MarkPaidModal';
import { MembershipFormModal } from './MembershipForm';
import { MembershipList, MembershipListSkeleton } from './MembershipList';
import { MembersOverview, MembersOverviewSkeleton } from './MembersOverview';
import { matchesFilter, matchesPerson, PeopleFilter, peopleOf, type Person } from './people';
import { PeopleList } from './PeopleList';

const route = getRouteApi('/styret/medlemmer');

const EMPTY: AdminMembership[] = [];
const NO_PROFILES: BoardProfile[] = [];
const EMPTY_ICON_SIZE = 40;
const ALL = 'alle';

const ALL_LABEL = msg({ message: 'All', comment: 'People filter: everyone' });

const FILTER_LABELS: Record<PeopleFilter, MessageDescriptor> = {
  [PeopleFilter.enum.betalt]: msg({ message: 'Paid', comment: 'People filter: everyone has paid' }),
  [PeopleFilter.enum.ubetalt]: msg({ message: 'Unpaid', comment: 'People filter: still owes money' }),
  [PeopleFilter.enum.forespurt]: msg({ message: 'Requested', comment: 'People filter: has a membership request' }),
  [PeopleFilter.enum.uten]: msg({ message: 'No membership', comment: 'People filter: account without a membership' }),
};

const DialogKind = z.enum(['edit', 'pay', 'remove', 'decline']);
type DialogKind = z.infer<typeof DialogKind>;
type Dialog = { kind: DialogKind; membership?: AdminMembership; email?: string };

const matchesQuery = (m: AdminMembership, query: string) =>
  [m.playerName, m.profile?.name, m.profile?.email].some((v) => v?.toLowerCase().includes(query));

const isActive = (m: AdminMembership) => m.status === MembershipStatus.enum.active;

export const MembersPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`Memberships`, t`The board`);
  const { sesong, vis, fane = MembersTab.enum.medlemmer, avslatt = false } = route.useSearch();
  const navigate = route.useNavigate();
  const { plans } = useSiteContent();
  const { seasons, current } = useSeasons();
  const signedOut = useSignedOut();
  const profile = useProfile();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [dialog, setDialog] = useState<Dialog>();
  const [opened, setOpened] = useState(false);

  const onRequests = fane === MembersTab.enum.foresporsler;
  const onOverview = fane === MembersTab.enum.oversikt;
  const onList = !onOverview && !onRequests;
  const seasonId = sesong ?? current.id;
  const season = seasons.find((s) => s.id === seasonId) ?? current;

  const seasonQuery = useSeasonMemberships(seasonId === ALL_SEASONS ? null : seasonId, { enabled: !onRequests });
  const requestsQuery = useMembershipRequests(avslatt, { enabled: onRequests });
  const profilesQuery = useBoardProfiles({ enabled: onList });
  const requestCount = useOpenRequestCount().data ?? 0;

  const seasonMemberships = seasonQuery.data ?? EMPTY;
  const profiles = profilesQuery.data ?? NO_PROFILES;
  const queries = [profile, onRequests ? requestsQuery : seasonQuery, ...(onList ? [profilesQuery] : [])];
  const failed = queries.find((q) => q.isError);
  const isPending = !failed && queries.some((q) => q.isPending);

  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);

  const seasonOptions = useMemo(() => {
    const labels = new Map(seasons.map((s) => [s.id, s.label]));
    if (seasonId !== ALL_SEASONS && !labels.has(seasonId)) labels.set(seasonId, seasonById(seasonId).label);
    const options = Array.from(labels, ([value, label]) => ({ value, label })).sort((a, b) =>
      b.value.localeCompare(a.value),
    );
    return [{ value: ALL_SEASONS, label: t({ message: 'All seasons', comment: 'Season filter option' }) }, ...options];
  }, [seasons, seasonId, t]);

  const active = useMemo(() => seasonMemberships.filter(isActive), [seasonMemberships]);
  const people = useMemo(() => peopleOf(profiles, seasonMemberships), [profiles, seasonMemberships]);
  const q = deferredQuery.trim().toLowerCase();
  const searched = useMemo(() => (q ? people.filter((p) => matchesPerson(p, q)) : people), [people, q]);
  const shownPeople = useMemo(() => searched.filter((p) => matchesFilter(p, vis)), [searched, vis]);
  const requests = useMemo(
    () => (requestsQuery.data ?? EMPTY).filter((m) => !q || matchesQuery(m, q)),
    [requestsQuery.data, q],
  );

  const filterCounts = useMemo(
    () => new Map(PeopleFilter.options.map((f) => [f, searched.filter((p) => matchesFilter(p, f)).length])),
    [searched],
  );
  const filterOptions = useMemo(
    () => [
      { value: ALL, label: `${t(ALL_LABEL)} (${searched.length})` },
      ...PeopleFilter.options.map((filter) => ({
        value: filter,
        label: `${t(FILTER_LABELS[filter])} (${filterCounts.get(filter) ?? 0})`,
      })),
    ],
    [filterCounts, searched.length, t],
  );

  const shownCount = onRequests ? requests.length : shownPeople.length;
  const filtering = !onOverview && ((onList && vis !== undefined) || query.trim() !== '');

  const openDialog = useCallback((kind: DialogKind, membership?: AdminMembership, email?: string) => {
    setDialog({ kind, membership, email });
    setOpened(true);
  }, []);
  const closeDialog = useCallback(() => setOpened(false), []);
  const handlers = useMemo(
    () => ({
      onPay: (m: AdminMembership) => openDialog(DialogKind.enum.pay, m),
      onEdit: (m: AdminMembership) => openDialog(DialogKind.enum.edit, m),
      onDelete: (m: AdminMembership) => openDialog(DialogKind.enum.remove, m),
      onDecline: (m: AdminMembership) => openDialog(DialogKind.enum.decline, m),
    }),
    [openDialog],
  );
  const addFor = useCallback(
    (person: Person) => openDialog(DialogKind.enum.edit, undefined, person.profile?.email),
    [openDialog],
  );
  const addMembership = () => openDialog(DialogKind.enum.edit);

  const pickSeason = (value: string | null) =>
    value && navigate({ search: (prev) => ({ ...prev, sesong: value === current.id ? undefined : value }), ...STAY });
  const pickFilter = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, vis: PeopleFilter.safeParse(value).data }), ...STAY });
  const toggleDeclined = (checked: boolean) =>
    navigate({ search: (prev) => ({ ...prev, avslatt: checked || undefined }), ...STAY });
  const pickTab = (value: string | null) => {
    const tab = MembersTab.safeParse(value).data;
    if (!tab) return;
    void navigate({
      search: (prev) => ({ ...prev, fane: tab === MembersTab.enum.medlemmer ? undefined : tab }),
      ...STAY,
    });
  };
  const showUnpaid = () =>
    navigate({ search: (prev) => ({ ...prev, fane: undefined, vis: PeopleFilter.enum.ubetalt }), ...STAY });
  const clearFilters = () => {
    setQuery('');
    void navigate({ search: (prev) => ({ ...prev, vis: undefined }), ...STAY });
  };

  if (signedOut) return <Navigate to="/" replace />;

  const isOpen = (kind: DialogKind) => opened && dialog?.kind === kind;
  const empty = !isPending && !failed && (onOverview ? active.length === 0 : shownCount === 0);

  return (
    <BoardDatesProvider>
      <PageIntro
        eyebrow={<Trans comment="Eyebrow above the page title: the club board">The board</Trans>}
        title={<Trans>Memberships</Trans>}
        lede={<Trans>Who has a membership, and who still needs to pay.</Trans>}
      />

      <PageToolbar>
        {onRequests ? (
          <Chip checked={avslatt} onChange={toggleDeclined} variant="light">
            <Trans comment="Filter chip: also list membership requests the board said no to">Show declined</Trans>
          </Chip>
        ) : (
          <Select
            aria-label={t`Season`}
            data={seasonOptions}
            value={seasonId}
            onChange={pickSeason}
            allowDeselect={false}
            radius="xl"
            w={150}
            leftSection={<CalendarBlank />}
          />
        )}
        {!onOverview && (
          <SearchInput
            value={query}
            onChange={setQuery}
            label={t`Search`}
            placeholder={t`Name or email`}
            visibleFrom="sm"
          />
        )}
        <Button ms="auto" radius="xl" leftSection={<Plus />} onClick={addMembership} visibleFrom="sm">
          <Trans>Add membership</Trans>
        </Button>
        <ActionIcon
          ms="auto"
          size="lg"
          radius="xl"
          aria-label={t`Add membership`}
          onClick={addMembership}
          hiddenFrom="sm"
        >
          <Plus />
        </ActionIcon>
      </PageToolbar>

      <Container py={32}>
        <Stack gap="md">
          <Tabs value={fane} onChange={pickTab}>
            <Tabs.List>
              <Tabs.Tab value={MembersTab.enum.oversikt} leftSection={<Gauge />}>
                <Trans comment="Tab: the season's membership numbers at a glance">Overview</Trans>
              </Tabs.Tab>
              <Tabs.Tab value={MembersTab.enum.medlemmer} leftSection={<IdentificationCard />}>
                <Trans comment="Tab: everyone with an account or a membership">Members</Trans>
              </Tabs.Tab>
              <Tabs.Tab
                value={MembersTab.enum.foresporsler}
                leftSection={<Clock />}
                rightSection={
                  requestCount > 0 && (
                    <Badge size="sm" circle color="blue" aria-label={t`${requestCount} open`}>
                      {requestCount}
                    </Badge>
                  )
                }
              >
                <Trans comment="Tab: membership requests sent from the join page">Requests</Trans>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
          {onList && <Segmented label={t`Show`} options={filterOptions} value={vis ?? ALL} onChange={pickFilter} />}
          {!onOverview && (
            <SearchInput
              value={query}
              onChange={setQuery}
              label={t`Search`}
              placeholder={t`Name or email`}
              hiddenFrom="sm"
            />
          )}
          {isPending && (onOverview ? <MembersOverviewSkeleton /> : <MembershipListSkeleton />)}
          {failed && (
            <LoadError
              title={t`Couldn't load the memberships`}
              retrying={failed.isRefetching}
              onRetry={() => void failed.refetch()}
            />
          )}
          {empty && (
            <Stack align="center" gap="sm" py={40} ta="center">
              <Text c="dimmed" lh={0}>
                <IdentificationCard width={EMPTY_ICON_SIZE} height={EMPTY_ICON_SIZE} aria-hidden />
              </Text>
              <Title order={2} size="h3">
                {filtering && onRequests && <Trans>No requests match</Trans>}
                {filtering && onList && <Trans>No one matches</Trans>}
                {!filtering && onRequests && <Trans>No open requests. All caught up!</Trans>}
                {!filtering && onList && <Trans>No accounts or memberships yet</Trans>}
                {onOverview && seasonId === ALL_SEASONS && <Trans>No memberships yet</Trans>}
                {onOverview && seasonId !== ALL_SEASONS && <Trans>No memberships this season yet</Trans>}
              </Title>
              {filtering && (
                <Button variant="light" radius="xl" onClick={clearFilters}>
                  <Trans>Clear filters</Trans>
                </Button>
              )}
              {!filtering && !onRequests && (
                <Button radius="xl" leftSection={<Plus />} onClick={addMembership}>
                  <Trans>Add membership</Trans>
                </Button>
              )}
            </Stack>
          )}
          {onOverview && !isPending && active.length > 0 && (
            <MembersOverview memberships={active} plans={planMap} seasonId={seasonId} onShowUnpaid={showUnpaid} />
          )}
          {onRequests && !isPending && requests.length > 0 && (
            <>
              <Text size="sm" c="dimmed">
                <Plural value={requests.length} one="# request" other="# requests" />
              </Text>
              <MembershipList memberships={requests} plans={planMap} requests {...handlers} />
            </>
          )}
          {onList && !isPending && shownPeople.length > 0 && (
            <PeopleList people={shownPeople} plans={planMap} onAdd={addFor} {...handlers} />
          )}
        </Stack>
      </Container>

      <MembershipFormModal
        opened={isOpen(DialogKind.enum.edit)}
        onClose={closeDialog}
        membership={dialog?.membership}
        email={dialog?.email}
        season={season}
        plans={planMap}
      />
      <MarkPaidModal opened={isOpen(DialogKind.enum.pay)} onClose={closeDialog} membership={dialog?.membership} />
      <DeleteMembershipModal
        opened={isOpen(DialogKind.enum.remove)}
        onClose={closeDialog}
        membership={dialog?.membership}
      />
      <DeclineRequestModal
        opened={isOpen(DialogKind.enum.decline)}
        onClose={closeDialog}
        membership={dialog?.membership}
      />
    </BoardDatesProvider>
  );
};
