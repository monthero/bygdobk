import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Container, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, type FC } from 'react';

import { useSessionUserId } from '~/components/auth/hooks';
import { Clock, PencilSimple, Play, ResponsiveModal, SignIn, SignOut, UserPlus } from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { notifyDone, notifyFailed } from '~/pages/board/format';
import { entrantsNeeded, setPlayers, setupProblem } from '~/shuttlekaos/engine';
import { Partners, PlayStyle, type Pair, type Player, type Settings } from '~/shuttlekaos/model';
import {
  ShuttleKaosError,
  shuttleKaosErrorMessage,
  shuttleKaosProblemMessage,
  useJoinSession,
  useLeaveSession,
  useStartSession,
  type SessionView as SessionData,
} from '~/shuttlekaos/queries';
import { ShuttleKaosProblem } from '~/shuttlekaos/store';
import { useUi } from '~/stores/ui';

import { BusyAlert } from './BusyAlert';
import { Field, Section, StickyBar } from './FormParts';
import { InviteCard } from './InviteCard';
import {
  BRAND,
  formatScheduled,
  isFull,
  playerLimitOf,
  repeatsLabel,
  SectionColor,
  SETUP_PROBLEMS,
  startCueAt,
  suggestedCourts,
  suggestedLimit,
} from './labels';
import { LocationPicker } from './LocationPicker';
import { PairPicker } from './PairPicker';
import { PlayerList, PlayerPicker } from './PlayerPicker';
import { SECTION_ICONS } from './sectionIcons';
import { SessionMenu } from './SessionMenu';
import { SessionTop } from './SessionTop';
import { PlayerLimitField, SettingsForm, VisibilityPicker } from './SettingsForm';
import { PlayerCount, SettingsSummary } from './SettingsSummary';
import { useReached } from './useReached';
import { busyNamesOf, useSessionSave } from './useSessionSave';

import classes from './OpenSession.module.css';

const selectOpenLogin = (s: ReturnType<typeof useUi.getState>) => s.openLogin;

const usesPairs = (settings: Settings) =>
  settings.style === PlayStyle.enum.doubles && settings.partners === Partners.enum.fixed;

const EditSettings: FC<{ view: SessionData; onClose: () => void }> = ({ view, onClose }) => {
  const save = useSessionSave();
  const { session } = view;
  const [settings, setSettings] = useState(session.settings);
  const [isPublic, setIsPublic] = useState(session.isPublic);
  const [location, setLocation] = useState(session.location ?? null);
  const [maxPlayers, setMaxPlayers] = useState(session.maxPlayers ?? null);

  const submit = () => save.mutate({ ...session, settings, isPublic, location, maxPlayers }, { onSuccess: onClose });

  return (
    <ResponsiveModal opened onClose={onClose} title={<Trans>Session settings</Trans>}>
      <Stack gap="md" className={classes.edit}>
        <VisibilityPicker isPublic={isPublic} onChange={setIsPublic} />
        <Field label={<Trans>Location</Trans>}>
          <LocationPicker value={location} onChange={setLocation} />
        </Field>
        <SettingsForm
          settings={settings}
          playerCount={session.players.length}
          pairs={session.pairs}
          onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
        />
        <PlayerLimitField
          value={maxPlayers}
          suggested={suggestedLimit(settings, session.players.length)}
          onChange={setMaxPlayers}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            <Trans>Cancel</Trans>
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            <Trans>Save</Trans>
          </Button>
        </Group>
      </Stack>
    </ResponsiveModal>
  );
};

const OrganizerLobby: FC<{ view: SessionData }> = ({ view }) => {
  const { t, i18n } = useLingui();
  const { session, shareCode } = view;
  const save = useSessionSave();
  const start = useStartSession({
    onError: (error) => notifyFailed(i18n._(shuttleKaosErrorMessage(error))),
  });
  const [editing, edit] = useDisclosure(false);
  const [confirming, confirm] = useDisclosure(false);
  const fixed = usesPairs(session.settings);
  const problem = setupProblem(session.settings, session.players, session.pairs);
  const perCourt = entrantsNeeded(session.settings);
  const suggested = suggestedCourts(session.settings, session.players.length);
  const courts = session.settings.courts;
  const busy = busyNamesOf(save.error);
  const due = useReached(session.scheduledAt && startCueAt(session.scheduledAt));

  const changeLineup = (players: Player[], pairs: Pair[]) => save.mutate(setPlayers(session, players, pairs));

  const changePlayers = (players: Player[]) => {
    const ids = new Set(players.map((p) => p.id));
    changeLineup(
      players,
      session.pairs.filter((pair) => pair.every((id) => ids.has(id))),
    );
  };

  const go = () =>
    start.mutate(
      { code: shareCode, revision: session.revision },
      { onSuccess: () => notifyDone(t`Round 1 is drawn. Let the chaos begin!`) },
    );

  return (
    <>
      <Container py="md">
        <div className={classes.grid}>
          <Stack gap="md">
            {due && (
              <Alert variant="light" color="brand" icon={<Clock />} title={<Trans>It's time</Trans>}>
                <Trans>Start when everyone's here.</Trans>
              </Alert>
            )}
            <InviteCard code={shareCode} title={session.title} />
            <Section
              title={<Trans>Settings</Trans>}
              icon={SECTION_ICONS.game}
              color={SectionColor.enum.brand}
              aside={
                <Button variant="subtle" size="compact-md" h={44} leftSection={<PencilSimple />} onClick={edit.open}>
                  <Trans>Change</Trans>
                </Button>
              }
            >
              <SettingsSummary
                settings={session.settings}
                isPublic={session.isPublic}
                playerCount={session.players.length}
                pairs={session.pairs}
              />
              {suggested !== courts && session.players.length >= perCourt && (
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    <Trans>
                      {courts} courts set. <Plural value={suggested} one="# court fits" other="# courts fit" /> the
                      players now.
                    </Trans>
                  </Text>
                  <Button
                    variant="light"
                    size="compact-sm"
                    loading={save.isPending}
                    onClick={() => save.mutate({ ...session, settings: { ...session.settings, courts: suggested } })}
                  >
                    <Trans>Use {suggested}</Trans>
                  </Button>
                </Group>
              )}
            </Section>
          </Stack>
          <Stack gap="md">
            <Section
              title={<Trans>Players</Trans>}
              icon={SECTION_ICONS.players}
              color={SectionColor.enum.blue}
              aside={<PlayerCount {...playerLimitOf(session)} />}
            >
              <PlayerPicker players={session.players} signedIn onChange={changePlayers} />
            </Section>
            {fixed && session.players.length > 1 && (
              <Section title={<Trans>Pairs</Trans>} icon={SECTION_ICONS.pairs} color={SectionColor.enum.teal}>
                <PairPicker
                  players={session.players}
                  pairs={session.pairs}
                  onChange={(pairs) => changeLineup(session.players, pairs)}
                />
              </Section>
            )}
            {busy && (
              <BusyAlert players={session.players} names={busy} pending={save.isPending} onUnlink={changePlayers} />
            )}
          </Stack>
        </div>
      </Container>
      <StickyBar reason={problem && i18n._({ ...SETUP_PROBLEMS[problem], values: { min: perCourt } })} warn>
        <Button size="lg" fullWidth leftSection={<Play />} disabled={problem !== null} onClick={confirm.open}>
          <Trans context="ShuttleKaos: button that starts the session">Start</Trans>
        </Button>
      </StickyBar>
      {editing && <EditSettings view={view} onClose={edit.close} />}
      <ResponsiveModal opened={confirming} onClose={confirm.close} title={<Trans>Start now?</Trans>}>
        <Stack gap="md">
          <Text>
            <Trans>Nobody can join after this. Round 1 gets drawn right away.</Trans>
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={confirm.close} data-autofocus>
              <Trans>Not yet</Trans>
            </Button>
            <Button leftSection={<Play />} loading={start.isPending} onClick={go}>
              <Trans context="ShuttleKaos: button that starts the session">Start</Trans>
            </Button>
          </Group>
        </Stack>
      </ResponsiveModal>
    </>
  );
};

const JoinBar: FC<{ view: SessionData }> = ({ view }) => {
  const { t, i18n } = useLingui();
  const userId = useSessionUserId();
  const openLogin = useUi(selectOpenLogin);
  const join = useJoinSession();
  const leave = useLeaveSession();
  const joined = view.myPlayerId !== null;
  const full = !joined && isFull(playerLimitOf(view.session));
  const failed = join.error ?? leave.error;
  let reason: string | null = null;
  if (failed instanceof ShuttleKaosError && failed.problem === ShuttleKaosProblem.enum.busy) {
    reason = t`You're already playing in another session. Leave that one first.`;
  } else if (failed) reason = i18n._(shuttleKaosErrorMessage(failed));
  else if (full) reason = i18n._(shuttleKaosProblemMessage(ShuttleKaosProblem.enum.full));

  if (!userId) {
    return (
      <StickyBar reason={t`Log in to join. Watching works without an account.`}>
        <Button size="lg" fullWidth leftSection={<SignIn />} onClick={openLogin}>
          <Trans>Log in to join</Trans>
        </Button>
      </StickyBar>
    );
  }
  return (
    <StickyBar
      reason={reason ?? (joined ? t`You're in! The organizer starts when everyone's here.` : null)}
      warn={reason !== null}
    >
      {joined ? (
        <Button
          size="lg"
          fullWidth
          variant="default"
          leftSection={<SignOut />}
          loading={leave.isPending}
          onClick={() => leave.mutate(view.shareCode, { onSuccess: () => join.reset() })}
        >
          <Trans>Leave</Trans>
        </Button>
      ) : (
        <Button
          size="lg"
          fullWidth
          leftSection={<UserPlus />}
          disabled={full}
          loading={join.isPending}
          onClick={() => join.mutate(view.shareCode, { onSuccess: () => leave.reset() })}
        >
          <Trans context="ShuttleKaos: join a session">Join</Trans>
        </Button>
      )}
    </StickyBar>
  );
};

const Lobby: FC<{ view: SessionData }> = ({ view }) => {
  const { session } = view;
  return (
    <>
      <Container py="md">
        <div className={classes.grid}>
          <Section title={<Trans>Settings</Trans>} icon={SECTION_ICONS.game} color={SectionColor.enum.brand}>
            <SettingsSummary
              settings={session.settings}
              isPublic={session.isPublic}
              playerCount={session.players.length}
              pairs={session.pairs}
            />
          </Section>
          <Section
            title={<Trans>Who's in</Trans>}
            icon={SECTION_ICONS.players}
            color={SectionColor.enum.blue}
            aside={<PlayerCount {...playerLimitOf(session)} />}
          >
            <PlayerList players={session.players} highlight={view.myPlayerId} />
          </Section>
        </div>
      </Container>
      <JoinBar view={view} />
    </>
  );
};

export const OpenSession: FC<{ view: SessionData }> = ({ view }) => {
  const { i18n } = useLingui();
  const { session, series } = view;
  usePageTitle(session.title || BRAND, session.title ? BRAND : undefined);
  return (
    <>
      <SessionTop
        title={session.title}
        progress={<Trans comment="Session status: people can still join">Open to join</Trans>}
        parts={[session.scheduledAt && formatScheduled(session.scheduledAt), series && i18n._(repeatsLabel(series))]}
        details={
          <SettingsSummary
            settings={session.settings}
            isPublic={session.isPublic}
            playerCount={session.players.length}
            maxPlayers={session.maxPlayers}
            pairs={session.pairs}
            inSession
          />
        }
        actions={<SessionMenu view={view} />}
        location={session.location}
      />
      {view.isOwner ? <OrganizerLobby view={view} /> : <Lobby view={view} />}
    </>
  );
};
