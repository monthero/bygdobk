import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Container, Skeleton, Stack, Switch, Text, TextInput } from '@mantine/core';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useState, type FC } from 'react';

import { useAuthReady, useProfile, useSessionUserId } from '~/components/auth/hooks';
import { Plus } from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { LoadError } from '~/pages/board/LoadError';
import { createSession } from '~/shuttlekaos/engine';
import { Partners, PlayStyle, Settings, type Pair, type Player } from '~/shuttlekaos/model';
import {
  ShuttleKaosError,
  shuttleKaosErrorMessage,
  useCreateSession,
  useShuttleKaosSession,
} from '~/shuttlekaos/queries';
import { ShuttleKaosProblem } from '~/shuttlekaos/store';

import { BrandHeader } from './BrandHeader';
import { BusyAlert } from './BusyAlert';
import { Section, StickyBar } from './FormParts';
import { BRAND, suggestedCourts } from './labels';
import { LoginPrompt } from './LoginPrompt';
import { PairPicker } from './PairPicker';
import { PlayerPicker } from './PlayerPicker';
import { SettingsForm, VisibilityPicker } from './SettingsForm';
import { useSetupPrefs, type PrefsState } from './setupPrefs';

import classes from './SetupPage.module.css';

const route = getRouteApi('/shuttlekaos/ny');

const MAX_TITLE = 80;

type Draft = { settings: Settings; isPublic: boolean; players: Player[]; pairs: Pair[] };

const selectSettings = (s: PrefsState) => s.settings;
const selectIsPublic = (s: PrefsState) => s.isPublic;
const selectRemember = (s: PrefsState) => s.remember;

const usesPairs = (settings: Settings) =>
  settings.style === PlayStyle.enum.doubles && settings.partners === Partners.enum.fixed;

type Me = { userId: string; name: string; avatarUrl: string | null };

const meAsPlayer = (me: Me): Player => ({
  id: crypto.randomUUID(),
  name: me.name,
  profileId: me.userId,
  avatarUrl: me.avatarUrl,
});

const SetupForm: FC<{ initial: Draft; me: Me }> = ({ initial, me }) => {
  const { t, i18n } = useLingui();
  const navigate = useNavigate();
  const remember = useSetupPrefs(selectRemember);
  const create = useCreateSession();

  const firstName = me.name.split(' ').at(0) ?? '';
  const [defaultTitle] = useState(() => (firstName ? t`${firstName}'s session` : BRAND));
  const [title, setTitle] = useState(defaultTitle);
  const [settings, setSettings] = useState(initial.settings);
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [players, setPlayers] = useState(initial.players);
  const [pairs, setPairs] = useState(initial.pairs);
  const [courtsByHand, setCourtsByHand] = useState(false);

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

  const changePlayers = (next: Player[]) => {
    const ids = new Set(next.map((p) => p.id));
    setPlayers(next);
    setPairs((current) => current.filter((pair) => pair.every((id) => ids.has(id))));
    create.reset();
  };

  const togglePlaying = (notPlaying: boolean) =>
    changePlayers(notPlaying ? players.filter((p) => p.profileId !== me.userId) : [meAsPlayer(me), ...players]);

  const submit = () => {
    if (!valid) return;
    remember({ settings: effective, isPublic });
    const session = createSession(effective, players, fixedPairs ? pairs : [], title.trim() || defaultTitle, isPublic);
    create.mutate(session, {
      onSuccess: ({ shareCode }) => void navigate({ to: '/shuttlekaos/$code', params: { code: shareCode } }),
    });
  };

  return (
    <>
      <Container size="lg" py="lg" className={classes.page}>
        <div className={classes.grid}>
          <Stack gap="md">
            <Section title={<Trans>Session</Trans>}>
              <TextInput
                size="md"
                label={<Trans>Name</Trans>}
                value={title}
                maxLength={MAX_TITLE}
                placeholder={defaultTitle}
                onChange={(e) => setTitle(e.currentTarget.value)}
              />
              <VisibilityPicker isPublic={isPublic} onChange={setIsPublic} />
            </Section>
            <SettingsForm settings={effective} playerCount={players.length} pairs={pairs} onChange={changeSettings} />
          </Stack>
          <Stack gap="md" className={classes.people}>
            <Section
              title={<Trans>Players</Trans>}
              aside={
                <Text c="dimmed" className="tabular">
                  {players.length}
                </Text>
              }
            >
              <Switch
                size="md"
                label={<Trans>I'm not playing</Trans>}
                checked={!playing}
                onChange={(e) => togglePlaying(e.currentTarget.checked)}
              />
              <Text size="sm" c="dimmed">
                <Trans>Add people now, or let them join with the link once the session exists.</Trans>
              </Text>
              <PlayerPicker players={players} signedIn onChange={changePlayers} />
            </Section>
            {fixedPairs && players.length > 1 && (
              <Section title={<Trans>Pairs</Trans>}>
                <PairPicker players={players} pairs={pairs} onChange={setPairs} />
              </Section>
            )}
            {busy && <BusyAlert players={players} names={busy} onUnlink={changePlayers} />}
          </Stack>
        </div>
      </Container>
      <StickyBar reason={error ?? (valid ? null : t`Some settings don't add up. Check them again.`)} warn>
        <Button
          size="lg"
          fullWidth
          leftSection={<Plus />}
          disabled={!valid || busy !== null}
          loading={create.isPending}
          onClick={submit}
        >
          <Trans>Create session</Trans>
        </Button>
      </StickyBar>
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
  };
  return <SetupForm initial={initial} me={me} />;
};

const FreshSetup: FC<{ me: Me }> = ({ me }) => {
  const settings = useSetupPrefs(selectSettings);
  const isPublic = useSetupPrefs(selectIsPublic);
  const [initial] = useState<Draft>(() => ({ settings, isPublic, players: [meAsPlayer(me)], pairs: [] }));
  return <SetupForm initial={initial} me={me} />;
};

export const SetupPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`New session`, BRAND);
  const { fra } = route.useSearch();
  const ready = useAuthReady();
  const userId = useSessionUserId();
  const profile = useProfile();

  let body = <FormSkeleton />;
  if (ready && !userId) {
    body = (
      <Container size="sm" py="lg">
        <LoginPrompt>
          <Trans>Log in to start a session. Anyone can watch the scores without an account.</Trans>
        </LoginPrompt>
      </Container>
    );
  } else if (userId && profile.data) {
    const me: Me = { userId, name: profile.data.name, avatarUrl: profile.data.avatarUrl ?? null };
    body = fra ? <CopiedSetup key={fra} code={fra} me={me} /> : <FreshSetup me={me} />;
  }

  return (
    <>
      <BrandHeader back title={fra ? <Trans>Set up again</Trans> : <Trans>New session</Trans>} />
      {body}
    </>
  );
};
