import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Badge, Button, Chip, Container, Select, Stack, Tabs, Text, Title } from '@mantine/core';
import { getRouteApi, Navigate } from '@tanstack/react-router';
import { useCallback, useDeferredValue, useMemo, useState, type FC } from 'react';
import { z } from 'zod';

import { useSiteContent } from '~/cms/content';
import { useProfile, useSignedOut } from '~/components/auth/hooks';
import { PageToolbar } from '~/components/layout';
import { PageIntro } from '~/components/styles';
import { CalendarBlank, Clock, Gauge, IdentificationCard, Plus, SearchInput } from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { useSeasons } from '~/hooks/useSeasons';
import { membershipSeason, MembershipStatus, type AdminMembership } from '~/memberships/model';
import { useAllMemberships } from '~/memberships/queries';
import { STAY } from '~/utils/navigation';

import { BoardDatesProvider } from './BoardDatesProvider';
import { DeclineRequestModal } from './DeclineRequestModal';
import { DeleteMembershipModal } from './DeleteMembershipModal';
import { ALL_SEASONS, memberName, MembersTab, seasonById } from './format';
import { LoadError } from './LoadError';
import { MarkPaidModal } from './MarkPaidModal';
import { MembershipFormModal } from './MembershipForm';
import { MembershipList, MembershipListSkeleton } from './MembershipList';
import { MembersOverview, MembersOverviewSkeleton } from './MembersOverview';

const route = getRouteApi('/styret/medlemmer');

const EMPTY: AdminMembership[] = [];
const EMPTY_ICON_SIZE = 40;

const DialogKind = z.enum(['edit', 'pay', 'remove', 'decline']);
type DialogKind = z.infer<typeof DialogKind>;
type Dialog = { kind: DialogKind; membership?: AdminMembership };

const matchesQuery = (m: AdminMembership, query: string) =>
  [m.playerName, m.profile?.name, m.profile?.email].some((v) => v?.toLowerCase().includes(query));

const byName = (a: AdminMembership, b: AdminMembership) => memberName(a).localeCompare(memberName(b));

const byNewest = (a: AdminMembership, b: AdminMembership) => b.createdAt.localeCompare(a.createdAt);

const isRequest = (m: AdminMembership) => m.status === MembershipStatus.enum.requested;

export const MembersPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`Memberships`, t`The board`);
  const { sesong, ubetalt = false, fane = MembersTab.enum.medlemmer, avslatt = false } = route.useSearch();
  const navigate = route.useNavigate();
  const { plans } = useSiteContent();
  const { seasons, current } = useSeasons();
  const signedOut = useSignedOut();
  const all = useAllMemberships();
  const profile = useProfile();
  const memberships = all.data ?? EMPTY;
  const failed = profile.isError ? profile : all;
  const isError = failed.isError;
  const isPending = all.isPending && !isError;
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [dialog, setDialog] = useState<Dialog>();
  const [opened, setOpened] = useState(false);

  const onRequests = fane === MembersTab.enum.foresporsler;
  const onOverview = fane === MembersTab.enum.oversikt;
  const seasonId = sesong ?? current.id;
  const season = seasons.find((s) => s.id === seasonId) ?? current;
  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);

  const seasonOptions = useMemo(() => {
    const labels = new Map(seasons.map((s) => [s.id, s.label]));
    for (const m of memberships) {
      const { id, label } = membershipSeason(m);
      labels.set(id, label);
    }
    if (seasonId !== ALL_SEASONS && !labels.has(seasonId)) labels.set(seasonId, seasonById(seasonId).label);
    const options = Array.from(labels, ([value, label]) => ({ value, label })).sort((a, b) =>
      b.value.localeCompare(a.value),
    );
    return [{ value: ALL_SEASONS, label: t({ message: 'All seasons', comment: 'Season filter option' }) }, ...options];
  }, [seasons, memberships, seasonId, t]);

  const requestCount = useMemo(() => memberships.filter(isRequest).length, [memberships]);

  const inSeason = useMemo(
    () =>
      memberships
        .filter(
          (m) =>
            m.status === MembershipStatus.enum.active &&
            (seasonId === ALL_SEASONS || membershipSeason(m).id === seasonId),
        )
        .sort(byName),
    [memberships, seasonId],
  );

  const shown = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (onOverview) return inSeason;
    if (onRequests) {
      return memberships
        .filter(
          (m) =>
            (isRequest(m) || (avslatt && m.status === MembershipStatus.enum.declined)) && (!q || matchesQuery(m, q)),
        )
        .sort(byNewest);
    }
    return inSeason.filter((m) => (!ubetalt || m.paidAt === null) && (!q || matchesQuery(m, q)));
  }, [memberships, inSeason, onOverview, onRequests, avslatt, ubetalt, deferredQuery]);
  const unpaidCount = onRequests ? 0 : shown.filter((m) => m.paidAt === null).length;
  const onList = !onOverview && !onRequests;
  const filtering = !onOverview && ((onList && ubetalt) || query.trim() !== '');

  const openDialog = useCallback((kind: DialogKind, membership?: AdminMembership) => {
    setDialog({ kind, membership });
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
  const addMembership = () => openDialog(DialogKind.enum.edit);

  const pickSeason = (value: string | null) =>
    value && navigate({ search: (prev) => ({ ...prev, sesong: value === current.id ? undefined : value }), ...STAY });
  const toggleUnpaid = (checked: boolean) =>
    navigate({ search: (prev) => ({ ...prev, ubetalt: checked || undefined }), ...STAY });
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
  const showUnpaid = () => navigate({ search: (prev) => ({ ...prev, fane: undefined, ubetalt: true }), ...STAY });
  const clearFilters = () => {
    setQuery('');
    void navigate({ search: (prev) => ({ ...prev, ubetalt: undefined }), ...STAY });
  };

  if (signedOut) return <Navigate to="/" replace />;

  const isOpen = (kind: DialogKind) => opened && dialog?.kind === kind;

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
          <>
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
            {onList && (
              <Chip checked={ubetalt} onChange={toggleUnpaid} variant="light">
                <Trans>Unpaid only</Trans>
              </Chip>
            )}
          </>
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
                <Trans comment="Tab: memberships the board has confirmed">Members</Trans>
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
          {isError && (
            <LoadError
              title={t`Couldn't load the memberships`}
              retrying={failed.isRefetching}
              onRetry={() => void failed.refetch()}
            />
          )}
          {!isPending && !isError && shown.length === 0 && (
            <Stack align="center" gap="sm" py={40} ta="center">
              <Text c="dimmed" lh={0}>
                <IdentificationCard width={EMPTY_ICON_SIZE} height={EMPTY_ICON_SIZE} aria-hidden />
              </Text>
              <Title order={2} size="h3">
                {filtering && onRequests && <Trans>No requests match</Trans>}
                {filtering && !onRequests && <Trans>No memberships match</Trans>}
                {!filtering && onRequests && <Trans>No open requests. All caught up!</Trans>}
                {!filtering && !onRequests && seasonId === ALL_SEASONS && <Trans>No memberships yet</Trans>}
                {!filtering && !onRequests && seasonId !== ALL_SEASONS && <Trans>No memberships this season yet</Trans>}
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
          {onOverview && shown.length > 0 && (
            <MembersOverview memberships={shown} plans={planMap} seasonId={seasonId} onShowUnpaid={showUnpaid} />
          )}
          {!onOverview && shown.length > 0 && (
            <>
              <Text size="sm" c="dimmed">
                {onRequests ? (
                  <Plural value={shown.length} one="# request" other="# requests" />
                ) : (
                  <Plural value={shown.length} one="# membership" other="# memberships" />
                )}
                {unpaidCount > 0 && (
                  <>
                    {' · '}
                    <Trans>{unpaidCount} not paid</Trans>
                  </>
                )}
              </Text>
              <MembershipList memberships={shown} plans={planMap} requests={onRequests} {...handlers} />
            </>
          )}
        </Stack>
      </Container>

      <MembershipFormModal
        opened={isOpen(DialogKind.enum.edit)}
        onClose={closeDialog}
        membership={dialog?.membership}
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
