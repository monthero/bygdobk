import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Box, Paper, Text, Title } from '@mantine/core';
import { useDocumentVisibility, useElementSize, useFullscreenDocument, useIdle } from '@mantine/hooks';
import { getRouteApi } from '@tanstack/react-router';
import { useEffect, useMemo, type FC, type ReactNode } from 'react';

import { ArrowsIn, ArrowsOut, ListNumbers, Shuttle, Trophy } from '~/components/ui';
import { standings } from '~/shuttlekaos/engine';
import { SessionStatus, type Session } from '~/shuttlekaos/model';
import { useShuttleKaosSession } from '~/shuttlekaos/queries';
import { useUi } from '~/stores/ui';

import { Wordmark } from './BrandHeader';
import { CourtCard } from './CourtCard';
import { LiveBadge, SessionGate } from './Fallbacks';
import { InviteLink } from './InviteCard';
import {
  BRAND,
  playerMap,
  playersOf,
  rankMoves,
  SCAN_LABELS,
  sessionUrl,
  shownSession,
  TableVariant,
  YOU,
  type PlayerMap,
} from './labels';
import { PlayerAvatar } from './People';
import { Podium } from './Podium';
import { QrImage } from './QrImage';
import { ProgressLine, RestingPlayers, RoundCount } from './RoundBrowser';
import { SECTION_ICONS } from './sectionIcons';
import { StandingsTable } from './StandingsTable';
import { useKaosTitle } from './useKaosTitle';

import classes from './HallScreen.module.css';

const route = getRouteApi('/shuttlekaos/$code_/skjerm');

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 560;
const IDLE_MS = 3000;

type CourtLayout = { cols: number; zoom: number };

const courtLayout = (courts: number): CourtLayout => {
  if (courts <= 1) return { cols: 1, zoom: 1.6 };
  if (courts === 2) return { cols: 2, zoom: 1.35 };
  if (courts === 4) return { cols: 2, zoom: 1.1 };
  if (courts <= 6) return { cols: 3, zoom: 1 };
  if (courts <= 8) return { cols: 4, zoom: 0.8 };
  return { cols: 4, zoom: 0.72 };
};

const PROTOCOL = /^https?:\/\//;

const selectSetFocus = (s: ReturnType<typeof useUi.getState>) => s.setFocusMode;

const useHallMode = () => {
  const setFocusMode = useUi(selectSetFocus);
  const visibility = useDocumentVisibility();

  useEffect(() => {
    setFocusMode(true);
    return () => setFocusMode(false);
  }, [setFocusMode]);

  useEffect(() => {
    if (visibility !== 'visible' || !('wakeLock' in navigator)) return undefined;
    let lock: WakeLockSentinel | undefined;
    let released = false;
    void navigator.wakeLock.request('screen').then(
      (sentinel) => {
        if (released) void sentinel.release();
        else lock = sentinel;
      },
      () => undefined,
    );
    return () => {
      released = true;
      void lock?.release();
    };
  }, [visibility]);
};

const Scan: FC<{ url: string; status: SessionStatus; big?: boolean }> = ({ url, status, big }) => {
  const { t, i18n } = useLingui();
  const label = <Text className={classes.scanLabel}>{i18n._(SCAN_LABELS[status])}</Text>;
  const qr = (
    <div className={classes.qr}>
      <QrImage value={url} label={t`QR code with the session link`} />
    </div>
  );
  if (!big) {
    return (
      <div className={classes.corner}>
        {label}
        {qr}
      </div>
    );
  }
  return (
    <Paper radius="lg" className={classes.scan}>
      {qr}
      {label}
      <InviteLink url={url.replace(PROTOCOL, '')} />
    </Paper>
  );
};

const Panel: FC<{ icon: ReactNode; title: ReactNode; aside?: ReactNode; children: ReactNode }> = ({
  icon,
  title,
  aside,
  children,
}) => (
  <Paper withBorder radius="lg" className={classes.panel}>
    <div className={classes.panelHead}>
      <span className={classes.panelIcon} aria-hidden>
        {icon}
      </span>
      <Title order={2} className={classes.panelTitle}>
        {title}
      </Title>
      {aside}
    </div>
    <div className={classes.panelBody}>{children}</div>
  </Paper>
);

const Lobby: FC<{ session: Session; players: PlayerMap; url: string }> = ({ session, players, url }) => (
  <div className={classes.body} data-status={session.status}>
    <Panel
      icon={SECTION_ICONS.players}
      title={<Trans>Who's in</Trans>}
      aside={<span className={classes.count}>{session.players.length}</span>}
    >
      {session.players.length > 0 ? (
        <ul className={classes.people}>
          {Array.from(players.values(), (player) => (
            <li key={player.id} className={classes.person}>
              <PlayerAvatar player={player} size={44} />
              <span className={classes.personName}>{player.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Text className={classes.empty}>
          <Trans>No players yet.</Trans>
        </Text>
      )}
    </Panel>
    <Scan url={url} status={session.status} big />
  </div>
);

const Running: FC<{ session: Session; players: PlayerMap }> = ({ session, players }) => {
  const rows = useMemo(() => standings(session), [session]);
  const round = session.rounds.at(-1);
  const moves = useMemo(() => rankMoves(session, round?.number ?? 0), [session, round?.number]);
  const resting = round ? playersOf(players, round.resting) : [];
  const layout = courtLayout(round?.matches.length ?? 0);
  return (
    <div className={classes.body} data-status={session.status}>
      <div className={classes.round}>
        {resting.length > 0 && (
          <div className={classes.resting}>
            <RestingPlayers players={resting} />
          </div>
        )}
        <Box className={classes.courts} __vars={{ '--hall-cols': `${layout.cols}`, '--hall-card': `${layout.zoom}` }}>
          {round?.matches.map((match) => (
            <CourtCard key={match.id} match={match} settings={session.settings} players={players} big />
          ))}
        </Box>
      </div>
      <Panel icon={<ListNumbers />} title={<Trans>Standings</Trans>}>
        <div className={classes.table}>
          <StandingsTable
            rows={rows}
            session={session}
            players={players}
            variant={TableVariant.enum.compact}
            moves={moves}
          />
        </div>
      </Panel>
    </div>
  );
};

const Finished: FC<{ session: Session; players: PlayerMap }> = ({ session, players }) => {
  const rows = useMemo(() => standings(session), [session]);
  return (
    <div className={classes.body} data-status={session.status}>
      <div className={classes.podium}>
        <Podium rows={rows} players={players} />
      </div>
      <Panel icon={<Trophy />} title={<Trans>Final standings</Trans>}>
        <div className={classes.table}>
          <StandingsTable rows={rows} session={session} players={players} variant={TableVariant.enum.full} />
        </div>
      </Panel>
    </div>
  );
};

const STATUS_TEXT: Record<SessionStatus, ReactNode> = {
  [SessionStatus.enum.open]: <Trans comment="Session status: people can still join">Open to join</Trans>,
  [SessionStatus.enum.running]: <Trans comment="Session status: being played right now">Playing now</Trans>,
  [SessionStatus.enum.finished]: <Trans comment="Session status: the session is over">Finished</Trans>,
};

const Board: FC<{ session: Session; shareCode: string }> = ({ session, shareCode }) => {
  const { i18n } = useLingui();
  useKaosTitle(session.title);
  const you = i18n._(YOU);
  const players = useMemo(() => playerMap(session.players, null, you), [session.players, you]);
  const url = sessionUrl(shareCode);
  const running = session.status === SessionStatus.enum.running;
  const round = session.rounds.at(-1)?.number ?? 0;

  const lobby = session.status === SessionStatus.enum.open;
  let body: ReactNode;
  if (lobby) body = <Lobby session={session} players={players} url={url} />;
  else if (running) body = <Running session={session} players={players} />;
  else body = <Finished session={session} players={players} />;

  return (
    <>
      <header className={classes.top}>
        <span className={classes.mark} aria-hidden>
          <Shuttle />
        </span>
        <div className={classes.heading}>
          <Text className={classes.eyebrow}>
            <Wordmark />
            <span aria-hidden> · </span>
            {STATUS_TEXT[session.status]}
          </Text>
          <Title order={1} className={classes.title} lineClamp={1}>
            {session.title || BRAND}
          </Title>
        </div>
        {running && (
          <div className={classes.progress}>
            <div className={classes.roundLine}>
              <span className={classes.roundCount}>
                <RoundCount session={session} viewed={round} />
              </span>
              <LiveBadge size="lg" />
            </div>
            <ProgressLine session={session} />
          </div>
        )}
        {!lobby && <Scan url={url} status={session.status} />}
      </header>
      {body}
    </>
  );
};

export const HallScreen: FC = () => {
  const { t } = useLingui();
  const { code } = route.useParams();
  const view = useShuttleKaosSession(code);
  const { ref, width, height } = useElementSize();
  const { toggle, fullscreen } = useFullscreenDocument();
  const idle = useIdle(IDLE_MS);
  useHallMode();
  const scale = width > 0 && height > 0 ? Math.min(width / BASE_WIDTH, height / BASE_HEIGHT) : 1;
  const fullscreenLabel = fullscreen ? t`Exit full screen` : t`Full screen`;

  const fullscreenButton = (
    <ActionIcon
      variant="default"
      radius="xl"
      size={44}
      className={classes.fullscreen}
      aria-label={fullscreenLabel}
      onClick={() => void toggle()}
    >
      {fullscreen ? <ArrowsIn /> : <ArrowsOut />}
    </ActionIcon>
  );

  return (
    <div ref={ref} className={classes.hall} data-idle={idle || undefined}>
      <Box className={classes.stage} __vars={{ '--hall-scale': `${scale}` }}>
        <SessionGate view={view}>
          {(data) => <Board session={shownSession(data.session)} shareCode={data.shareCode} />}
        </SessionGate>
      </Box>
      {fullscreenButton}
    </div>
  );
};
