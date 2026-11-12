import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Container, Group, Skeleton, Stack, Switch, Text, TextInput, Tooltip } from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';

import { useAuthReady, useProfile, useSessionUserId } from '~/components/auth/hooks';
import { Play, Plus, ResponsiveModal } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { usePageTitle } from '~/hooks/usePageTitle';
import { notifyFailed } from '~/pages/board/format';
import { LoadError } from '~/pages/board/LoadError';
import { createSession, setupProblem, shortName } from '~/shuttlekaos/engine';
import { Partners, PlayStyle, Settings, type Pair, type Player, type SessionLocation } from '~/shuttlekaos/model';
import {
  ShuttleKaosError,
  shuttleKaosErrorMessage,
  useCreateSession,
  useShuttleKaosSession,
  useStartSession,
} from '~/shuttlekaos/queries';
import { ShuttleKaosProblem } from '~/shuttlekaos/store';

import { BrandHeader } from './BrandHeader';
import { BusyAlert } from './BusyAlert';
import { Field, Section } from './FormParts';
import { BRAND, SectionColor, suggestedCourts, SummaryPart } from './labels';
import { LocationPicker } from './LocationPicker';
import { LoginPrompt } from './LoginPrompt';
import { PairPicker } from './PairPicker';
import { PlayerPicker } from './PlayerPicker';
import { QuickStart } from './QuickStart';
import { SECTION_ICONS } from './sectionIcons';
import { CourtsField, GameFields, LevelPicker, RoundsFields, ScoringFields, VisibilityPicker } from './SettingsForm';
import { SessionEstimate, SettingsSummary } from './SettingsSummary';
import { useSetupPrefs, type Lineup, type PrefsState } from './setupPrefs';
import { SetupSteps, type SetupStep } from './SetupSteps';
import { useSettingsEditor } from './useSettingsEditor';

import classes from './SetupPage.module.css';

const route = getRouteApi('/shuttlekaos/ny');

const MAX_TITLE = 80;
const TITLE_DEBOUNCE_MS = 300;
const EMPTY_PAIRS: Pair[] = [];

const StepName = z.enum(['details', 'game', 'scoring', 'players']);
type StepName = z.infer<typeof StepName>;

const stepIndex = (name: StepName) => StepName.options.indexOf(name);

const PART_STEP: Record<SummaryPart, StepName> = {
  [SummaryPart.enum.format]: StepName.enum.game,
  [SummaryPart.enum.play]: StepName.enum.game,
  [SummaryPart.enum.courts]: StepName.enum.players,
  [SummaryPart.enum.scoring]: StepName.enum.scoring,
  [SummaryPart.enum.rounds]: StepName.enum.scoring,
  [SummaryPart.enum.levels]: StepName.enum.details,
  [SummaryPart.enum.visibility]: StepName.enum.details,
};

type Draft = {
  settings: Settings;
  isPublic: boolean;
  players: Player[];
  pairs: Pair[];
  location: SessionLocation | null;
};

const selectSettings = (s: PrefsState) => s.settings;
const selectIsPublic = (s: PrefsState) => s.isPublic;
const selectRemember = (s: PrefsState) => s.remember;
const selectLineup = (s: PrefsState) => s.lineup;

const freshIds = ({ players, pairs, location }: Lineup): Lineup => {
  const ids = new Map(players.map((p) => [p.id, crypto.randomUUID()]));
  const idOf = (id: string) => ids.get(id) ?? id;
  return {
    location,
    players: players.map((p) => ({ ...p, id: idOf(p.id) })),
    pairs: pairs.map(([first, second]): Pair => [idOf(first), idOf(second)]),
  };
};

const usesPairs = (settings: Settings) =>
  settings.style === PlayStyle.enum.doubles && settings.partners === Partners.enum.fixed;

type Me = { userId: string; name: string; avatarUrl: string | null };

const meAsPlayer = (me: Me): Player => ({
  id: crypto.randomUUID(),
  name: shortName(me.name, []),
  profileId: me.userId,
  avatarUrl: me.avatarUrl,
});

const SetupHeader: FC<{ title: string; copy: boolean; action?: ReactNode }> = ({ title, copy, action }) => {
  const [shown] = useDebouncedValue(title, TITLE_DEBOUNCE_MS);
  return (
    <BrandHeader
      back
      eyebrow={copy ? <Trans>ShuttleKaos · Set up again</Trans> : <Trans>ShuttleKaos · New session</Trans>}
      title={shown}
      actions={action}
    />
  );
};

const SetupForm: FC<{ initial: Draft; me: Me; prefilled: boolean }> = ({ initial, me, prefilled }) => {
  const { t, i18n } = useLingui();
  const mobile = useIsMobile();
  const navigate = useNavigate();
  const remember = useSetupPrefs(selectRemember);
  const create = useCreateSession();
  const start = useStartSession();
  const [confirming, confirmControls] = useDisclosure(false);
  const [startingNow, setStartingNow] = useState(false);

  const firstName = me.name.split(' ').at(0) ?? '';
  const [defaultTitle] = useState(() => (firstName ? t`${firstName}'s session` : BRAND));
  const [title, setTitle] = useState(defaultTitle);
  const [settings, setSettings] = useState(initial.settings);
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [players, setPlayers] = useState(initial.players);
  const [pairs, setPairs] = useState(initial.pairs);
  const [location, setLocation] = useState(initial.location);
  const [courtsByHand, setCourtsByHand] = useState(false);
  const [active, setActive] = useState(0);

  const goTo = (index: number) => {
    setActive(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fixedPairs = usesPairs(settings);
  const playing = players.some((p) => p.profileId === me.userId);
  const effective = courtsByHand ? settings : { ...settings, courts: suggestedCourts(settings, players.length) };
  const valid = Settings.safeParse(effective).success;
  const busy =
    create.error instanceof ShuttleKaosError && create.error.problem === ShuttleKaosProblem.enum.busy
      ? create.error.busyNames
      : null;
  const error = create.error && !busy ? i18n._(shuttleKaosErrorMessage(create.error)) : null;

  const changeSettings = (patch: Partial<Settings>) => {
    if (patch.courts !== undefined) setCourtsByHand(true);
    setSettings((s) => ({ ...s, ...patch }));
  };
  const editor = useSettingsEditor(effective, changeSettings);

  const changePlayers = (next: Player[]) => {
    const ids = new Set(next.map((p) => p.id));
    setPlayers(next);
    setPairs((current) => current.filter((pair) => pair.every((id) => ids.has(id))));
    create.reset();
  };

  const togglePlaying = (notPlaying: boolean) =>
    changePlayers(notPlaying ? players.filter((p) => p.profileId !== me.userId) : [meAsPlayer(me), ...players]);

  const sessionPairs = fixedPairs ? pairs : EMPTY_PAIRS;
  const canStart = valid && setupProblem(effective, players, sessionPairs) === null;
  const pending = create.isPending || start.isPending;

  const open = (code: string) => void navigate({ to: '/shuttlekaos/$code', params: { code } });

  const submit = (withStart: boolean) => {
    if (!valid) return;
    setStartingNow(withStart);
    confirmControls.close();
    remember({ settings: effective, isPublic, lineup: { players, pairs: sessionPairs, location } });
    const session = createSession(effective, players, sessionPairs, title.trim() || defaultTitle, isPublic, location);
    create.mutate(session, {
      onSuccess: ({ shareCode, session: created }) => {
        if (!withStart) {
          open(shareCode);
          return;
        }
        start.mutate(
          { code: shareCode, revision: created?.revision ?? session.revision },
          {
            onSuccess: () => open(shareCode),
            onError: (startError) => {
              const detail = i18n._(shuttleKaosErrorMessage(startError));
              notifyFailed(t`The session is created, but it didn't start. ${detail}`);
              open(shareCode);
            },
          },
        );
      },
    });
  };

  const sessionFields = (
    <>
      <TextInput
        size="md"
        label={<Trans>Name</Trans>}
        value={title}
        maxLength={MAX_TITLE}
        placeholder={defaultTitle}
        onChange={(e) => setTitle(e.currentTarget.value)}
      />
      <VisibilityPicker isPublic={isPublic} onChange={setIsPublic} />
      <Field label={<Trans>Location</Trans>}>
        <LocationPicker value={location} onChange={setLocation} />
      </Field>
    </>
  );

  const playersSection = (
    <Section
      title={<Trans>Players</Trans>}
      icon={SECTION_ICONS.players}
      color={SectionColor.enum.blue}
      aside={
        <Badge variant="light" color="blue" size="lg" className="tabular">
          {players.length}
        </Badge>
      }
    >
      <Switch
        size="md"
        color="brand"
        label={<Trans>I'm not playing</Trans>}
        checked={!playing}
        onChange={(e) => togglePlaying(e.currentTarget.checked)}
      />
      <Text size="sm" c="dimmed">
        <Trans>Add people now, or let them join with the link once the session exists.</Trans>
      </Text>
      <PlayerPicker players={players} signedIn onChange={changePlayers} />
    </Section>
  );

  const pairsSection = fixedPairs && players.length > 1 && (
    <Section title={<Trans>Pairs</Trans>} icon={SECTION_ICONS.pairs} color={SectionColor.enum.teal}>
      <PairPicker players={players} pairs={pairs} onChange={setPairs} />
    </Section>
  );

  const courtsSection = (
    <Section title={<Trans>Courts</Trans>} icon={SECTION_ICONS.courts} color={SectionColor.enum.brand}>
      <CourtsField editor={editor} playerCount={players.length} hideLabel />
    </Section>
  );

  const quickStartSection = (
    <Section title={<Trans>Quick start</Trans>} icon={SECTION_ICONS.quick} color={SectionColor.enum.brand}>
      <QuickStart
        settings={settings}
        onPick={(preset) => {
          changeSettings(preset);
          if (mobile) goTo(stepIndex(StepName.enum.players));
        }}
      />
    </Section>
  );

  const summarySection = (
    <Section title={<Trans>Summary</Trans>} icon={SECTION_ICONS.summary} color={SectionColor.enum.teal}>
      <SessionEstimate settings={effective} playerCount={players.length} pairs={sessionPairs} />
      <SettingsSummary
        settings={effective}
        isPublic={isPublic}
        playerCount={players.length}
        pairs={sessionPairs}
        onPick={mobile ? (part) => goTo(stepIndex(PART_STEP[part])) : undefined}
      />
    </Section>
  );

  const busyAlert = busy && <BusyAlert players={players} names={busy} onUnlink={changePlayers} />;
  const reason = error ?? (valid ? null : t`Some settings don't add up. Check them again.`);

  const blocked = !valid || busy !== null;

  const finalActions = (size: 'md' | 'lg') => (
    <>
      <Button
        size={size}
        variant={canStart ? 'default' : 'filled'}
        leftSection={<Plus />}
        disabled={blocked}
        loading={create.isPending && !startingNow}
        onClick={() => submit(false)}
      >
        <Trans comment="Button: create the session and open it for players to join">Create</Trans>
      </Button>
      {canStart && (
        <Button
          size={size}
          leftSection={<Play />}
          disabled={blocked}
          loading={pending && startingNow}
          onClick={confirmControls.open}
        >
          <Trans>Start now</Trans>
        </Button>
      )}
    </>
  );

  const startConfirm = (
    <ResponsiveModal opened={confirming} onClose={confirmControls.close} title={<Trans>Start now?</Trans>}>
      <Stack gap="md">
        <Text>
          <Trans>Nobody can join after this.</Trans>
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={confirmControls.close} data-autofocus>
            <Trans>Not yet</Trans>
          </Button>
          <Button leftSection={<Play />} onClick={() => submit(true)}>
            <Trans>Start now</Trans>
          </Button>
        </Group>
      </Stack>
    </ResponsiveModal>
  );

  const lastHint = canStart ? null : t`Add players now, or invite them after creating.`;

  const header = (
    <SetupHeader
      title={title.trim() || defaultTitle}
      copy={prefilled}
      action={
        !mobile && (
          <Tooltip label={reason} disabled={!reason} multiline w={240}>
            <Group gap="sm" wrap="nowrap">
              {finalActions('md')}
            </Group>
          </Tooltip>
        )
      }
    />
  );

  const steps: SetupStep[] = [
    {
      title: t`Details`,
      icon: SECTION_ICONS.details,
      content: (
        <>
          {quickStartSection}
          <Section title={<Trans>Details</Trans>} icon={SECTION_ICONS.details} color={SectionColor.enum.grape}>
            {sessionFields}
          </Section>
          <Section title={<Trans>Level</Trans>} icon={SECTION_ICONS.level} color={SectionColor.enum.grape}>
            <LevelPicker levels={settings.levels} onChange={(levels) => changeSettings({ levels })} />
          </Section>
          {busyAlert}
        </>
      ),
    },
    {
      title: t`Game`,
      icon: SECTION_ICONS.game,
      content: (
        <Section title={<Trans>Game</Trans>} icon={SECTION_ICONS.game} color={SectionColor.enum.brand}>
          <GameFields editor={editor} />
        </Section>
      ),
    },
    {
      title: t`Scoring`,
      icon: SECTION_ICONS.scoring,
      invalid: valid ? null : t`Some settings don't add up. Check them again.`,
      content: (
        <>
          <Section title={<Trans>Scoring</Trans>} icon={SECTION_ICONS.scoring} color={SectionColor.enum.teal}>
            <ScoringFields editor={editor} />
          </Section>
          <Section title={<Trans>Rounds</Trans>} icon={SECTION_ICONS.rounds} color={SectionColor.enum.blue}>
            <RoundsFields editor={editor} playerCount={players.length} pairs={pairs} />
          </Section>
        </>
      ),
    },
    {
      title: t`Players`,
      icon: SECTION_ICONS.players,
      content: (
        <>
          {playersSection}
          {pairsSection}
          {courtsSection}
          {summarySection}
          {busyAlert}
        </>
      ),
    },
  ];

  if (mobile) {
    return (
      <>
        {header}
        <SetupSteps
          steps={steps}
          active={active}
          onStep={goTo}
          jumpAhead={prefilled}
          reason={reason ?? lastHint}
          warn={reason !== null}
          finalActions={finalActions('lg')}
          compactBack={canStart}
        />
        {startConfirm}
      </>
    );
  }

  return (
    <>
      {header}
      {startConfirm}
      <Container size="lg" py="lg" className={classes.page}>
        <div className={classes.grid}>
          <Stack gap="md">
            {quickStartSection}
            <Section title={<Trans>Session</Trans>} icon={SECTION_ICONS.details} color={SectionColor.enum.grape}>
              {sessionFields}
            </Section>
            <Section title={<Trans>Game</Trans>} icon={SECTION_ICONS.game} color={SectionColor.enum.brand}>
              <GameFields editor={editor} />
            </Section>
            <Section title={<Trans>Scoring</Trans>} icon={SECTION_ICONS.scoring} color={SectionColor.enum.teal}>
              <ScoringFields editor={editor} />
            </Section>
            <Section title={<Trans>Rounds</Trans>} icon={SECTION_ICONS.rounds} color={SectionColor.enum.blue}>
              <RoundsFields editor={editor} playerCount={players.length} pairs={pairs} />
            </Section>
            <Section title={<Trans>Level</Trans>} icon={SECTION_ICONS.level} color={SectionColor.enum.grape}>
              <LevelPicker levels={settings.levels} onChange={(levels) => changeSettings({ levels })} />
            </Section>
          </Stack>
          <Stack gap="md" className={classes.people}>
            {playersSection}
            {pairsSection}
            {courtsSection}
            {summarySection}
            {busyAlert}
          </Stack>
        </div>
      </Container>
    </>
  );
};

const FormSkeleton: FC = () => (
  <Container size="sm" py="lg" aria-busy>
    <Skeleton height={320} radius="lg" />
  </Container>
);

const CopiedSetup: FC<{ code: string; me: Me }> = ({ code, me }) => {
  const { t } = useLingui();
  const source = useShuttleKaosSession(code);
  if (source.isPending) return <FormSkeleton />;
  if (source.isError) {
    return (
      <Container size="sm" py="lg">
        <LoadError
          title={t`Couldn't load that session`}
          error={source.error}
          retrying={source.isRefetching}
          onRetry={() => void source.refetch()}
        />
      </Container>
    );
  }
  if (!source.data) return <FreshSetup me={me} />;
  const { session } = source.data;
  const initial: Draft = {
    settings: session.settings,
    isPublic: session.isPublic,
    players: session.players,
    pairs: session.pairs,
    location: session.location ?? null,
  };
  return <SetupForm initial={initial} me={me} prefilled />;
};

const LastSetup: FC<{ me: Me }> = ({ me }) => {
  const settings = useSetupPrefs(selectSettings);
  const isPublic = useSetupPrefs(selectIsPublic);
  const lineup = useSetupPrefs(selectLineup);
  const [initial] = useState<Draft | null>(() => lineup && { settings, isPublic, ...freshIds(lineup) });
  return initial ? <SetupForm initial={initial} me={me} prefilled /> : <FreshSetup me={me} />;
};

const FreshSetup: FC<{ me: Me }> = ({ me }) => {
  const settings = useSetupPrefs(selectSettings);
  const isPublic = useSetupPrefs(selectIsPublic);
  const [initial] = useState<Draft>(() => ({
    settings,
    isPublic,
    players: [meAsPlayer(me)],
    pairs: [],
    location: null,
  }));
  return <SetupForm initial={initial} me={me} prefilled={false} />;
};

export const SetupPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`New session`, BRAND);
  const { fra, siste } = route.useSearch();
  const ready = useAuthReady();
  const userId = useSessionUserId();
  const profile = useProfile();

  if (userId && profile.data) {
    const me: Me = { userId, name: profile.data.name, avatarUrl: profile.data.avatarUrl ?? null };
    if (fra) return <CopiedSetup key={fra} code={fra} me={me} />;
    return siste ? <LastSetup me={me} /> : <FreshSetup me={me} />;
  }

  return (
    <>
      <BrandHeader back title={fra ? <Trans>Set up again</Trans> : <Trans>New session</Trans>} />
      {ready && !userId ? (
        <Container size="sm" py="lg">
          <LoginPrompt>
            <Trans>Log in to start a session. Anyone can watch the scores without an account.</Trans>
          </LoginPrompt>
        </Container>
      ) : (
        <FormSkeleton />
      )}
    </>
  );
};
