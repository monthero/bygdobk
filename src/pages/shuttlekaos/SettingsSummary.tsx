import { Plural, Trans, useLingui } from '@lingui/react/macro';
import {
  Badge,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  useMatches,
  VisuallyHidden,
  type MantineColor,
  type MantineSize,
} from '@mantine/core';
import { memo, type FC, type ReactNode } from 'react';

import { Clock, Globe, LockSimple, PencilSimple, Users } from '~/components/ui';
import { plannedRounds } from '~/shuttlekaos/engine';
import {
  EVERYONE_ONCE,
  Partners,
  PlayStyle,
  ScoreMode,
  type Format,
  type Level,
  type Pair,
  type Settings,
} from '~/shuttlekaos/model';

import { estimate } from './estimate';
import {
  durationText,
  FORMAT_LABELS,
  minutesText,
  STYLE_LABELS,
  SummaryPart,
  Visibility,
  VISIBILITY_LABELS,
} from './labels';
import { LevelsText } from './Levels';
import { FORMAT_ICONS, PARTNER_ICONS, SECTION_ICONS, STYLE_ICONS } from './sectionIcons';

import classes from './SettingsSummary.module.css';

type FormatCellProps = { format: Format; style: PlayStyle; levels: Level[] };

export const FormatCell: FC<FormatCellProps> = ({ format, style, levels }) => {
  const { i18n } = useLingui();
  const styleLabel = i18n._(STYLE_LABELS[style]);
  return (
    <div className={classes.formatCell}>
      <span className={classes.formatLine}>
        <Tooltip label={styleLabel} withArrow>
          <span className={classes.styleIcon}>
            {STYLE_ICONS[style]}
            <VisuallyHidden>{styleLabel}</VisuallyHidden>
          </span>
        </Tooltip>
        {i18n._(FORMAT_LABELS[format].label)}
      </span>
      <Text size="xs" c="dimmed">
        <LevelsText levels={levels} />
      </Text>
    </div>
  );
};

export const VisibilityIcon: FC<{ isPublic: boolean }> = ({ isPublic }) => {
  const { i18n } = useLingui();
  const label = i18n._(VISIBILITY_LABELS[isPublic ? Visibility.enum.public : Visibility.enum.private].label);
  return (
    <Tooltip label={label} withArrow>
      <span className={classes.visibility}>
        {isPublic ? <Globe aria-hidden /> : <LockSimple aria-hidden />}
        <VisuallyHidden>{label}</VisuallyHidden>
      </span>
    </Tooltip>
  );
};

export const VisibilityBadge: FC<{ isPublic: boolean }> = ({ isPublic }) => {
  const { i18n } = useLingui();
  const visibility = isPublic ? Visibility.enum.public : Visibility.enum.private;
  return (
    <Badge
      variant="light"
      color={isPublic ? 'teal' : 'gray'}
      leftSection={isPublic ? <Globe /> : <LockSimple />}
      tt="none"
    >
      {i18n._(VISIBILITY_LABELS[visibility].label)}
    </Badge>
  );
};

type ChipProps = {
  part: SummaryPart;
  size?: MantineSize;
  color: MantineColor;
  icon?: ReactNode;
  onPick?: (part: SummaryPart) => void;
  children: ReactNode;
};

const SummaryChip: FC<ChipProps> = ({ part, size, color, icon, onPick, children }) =>
  onPick ? (
    <Badge
      component="button"
      type="button"
      size="lg"
      variant="light"
      color={color}
      tt="none"
      leftSection={icon}
      rightSection={<PencilSimple />}
      className={classes.pick}
      onClick={() => onPick(part)}
    >
      {children}
    </Badge>
  ) : (
    <Badge size={size} variant="light" color={color} tt="none" leftSection={icon}>
      {children}
    </Badge>
  );

type SessionFacts = Record<SummaryPart, ReactNode> & { partners: ReactNode };

const useSessionFacts = (settings: Settings, playerCount: number, pairs: Pair[], isPublic: boolean): SessionFacts => {
  const { i18n } = useLingui();
  const { courts, points, rounds } = settings;

  let partners: ReactNode = null;
  if (settings.style === PlayStyle.enum.doubles) {
    partners =
      settings.partners === Partners.enum.fixed ? (
        <Trans comment="Doubles with the same partner all session">Fixed pairs</Trans>
      ) : (
        <Trans comment="Doubles with a new partner every round">Rotating pairs</Trans>
      );
  }

  const planned = plannedRounds(settings, playerCount, pairs) ?? 0;
  let roundsText: ReactNode = <Trans>Until we stop</Trans>;
  if (rounds === EVERYONE_ONCE) {
    roundsText =
      planned > 0 ? (
        <Trans comment="Rounds until everyone has played together, e.g. Everyone together, ~9 rounds">
          Everyone together, ~{planned} rounds
        </Trans>
      ) : (
        <Trans>Until everyone has played together</Trans>
      );
  } else if (rounds !== null) roundsText = <Plural value={rounds} one="# round" other="# rounds" />;

  let scoring: ReactNode;
  if (settings.scoreMode === ScoreMode.enum.total) scoring = <Trans>{points} points per match</Trans>;
  else if (settings.sets === 3) scoring = <Trans>Best of 3 to {points}</Trans>;
  else scoring = <Trans>First to {points}</Trans>;

  return {
    [SummaryPart.enum.format]: i18n._(FORMAT_LABELS[settings.format].label),
    [SummaryPart.enum.play]: i18n._(STYLE_LABELS[settings.style]),
    [SummaryPart.enum.courts]: <Plural value={courts} one="# court" other="# courts" />,
    [SummaryPart.enum.scoring]: scoring,
    [SummaryPart.enum.rounds]: roundsText,
    [SummaryPart.enum.levels]: <LevelsText levels={settings.levels} />,
    partners,
    [SummaryPart.enum.visibility]: i18n._(
      VISIBILITY_LABELS[isPublic ? Visibility.enum.public : Visibility.enum.private].label,
    ),
  };
};

const SESSION_CHIP_SIZE: Record<'base' | 'sm', MantineSize> = { base: 'md', sm: 'lg' };

type Props = {
  settings: Settings;
  isPublic: boolean;
  playerCount: number;
  pairs: Pair[];
  onPick?: (part: SummaryPart) => void;
  inSession?: boolean;
};

export const SettingsSummary = memo<Props>(({ settings, isPublic, playerCount, pairs, onPick, inSession }) => {
  const facts = useSessionFacts(settings, playerCount, pairs, isPublic);
  const sessionSize = useMatches<MantineSize>(SESSION_CHIP_SIZE);
  const size = inSession ? sessionSize : undefined;
  return (
    <Group gap={6}>
      {inSession && (
        <Badge size={size} variant="light" color="gray" tt="none" leftSection={<Users />}>
          <Trans>{playerCount} players</Trans>
        </Badge>
      )}
      <SummaryChip
        size={size}
        part={SummaryPart.enum.format}
        color="brand"
        icon={FORMAT_ICONS[settings.format]}
        onPick={onPick}
      >
        {facts.format}
      </SummaryChip>
      <SummaryChip
        size={size}
        part={SummaryPart.enum.play}
        color="teal"
        icon={STYLE_ICONS[settings.style]}
        onPick={onPick}
      >
        {facts.play}
      </SummaryChip>
      {facts.partners && (
        <SummaryChip
          size={size}
          part={SummaryPart.enum.play}
          color="teal"
          icon={PARTNER_ICONS[settings.partners]}
          onPick={onPick}
        >
          {facts.partners}
        </SummaryChip>
      )}
      <SummaryChip size={size} part={SummaryPart.enum.courts} color="blue" icon={SECTION_ICONS.courts} onPick={onPick}>
        {facts.courts}
      </SummaryChip>
      <SummaryChip
        size={size}
        part={SummaryPart.enum.scoring}
        color="teal"
        icon={SECTION_ICONS.scoring}
        onPick={onPick}
      >
        {facts.scoring}
      </SummaryChip>
      {!inSession && (
        <SummaryChip
          size={size}
          part={SummaryPart.enum.rounds}
          color="blue"
          icon={SECTION_ICONS.rounds}
          onPick={onPick}
        >
          {facts.rounds}
        </SummaryChip>
      )}
      <SummaryChip size={size} part={SummaryPart.enum.levels} color="grape" icon={SECTION_ICONS.level} onPick={onPick}>
        {facts.levels}
      </SummaryChip>
      <SummaryChip
        size={size}
        part={SummaryPart.enum.visibility}
        color={isPublic ? 'teal' : 'gray'}
        icon={isPublic ? <Globe /> : <LockSimple />}
        onPick={onPick}
      >
        {facts.visibility}
      </SummaryChip>
    </Group>
  );
});

export const SessionEstimate: FC<{ settings: Settings; playerCount: number; pairs: Pair[] }> = ({
  settings,
  playerCount,
  pairs,
}) => {
  const guess = estimate(settings, playerCount, pairs);
  let main: ReactNode = <Trans>Add players to see how long it takes.</Trans>;
  let detail: ReactNode = null;
  if (guess) {
    const perRound = minutesText(guess.roundMinutes);
    if (guess.totalMinutes === null || guess.rounds === null) {
      main = <Trans>About {perRound} per round</Trans>;
      detail = <Trans>Play as long as you like.</Trans>;
    } else {
      const total = durationText(guess.totalMinutes);
      main = <Trans>About {total}</Trans>;
      detail = (
        <Trans>
          <Plural value={guess.rounds} one="# round" other="# rounds" />, about {perRound} each
        </Trans>
      );
    }
  }
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" color="brand" radius="xl" size={40}>
        <Clock />
      </ThemeIcon>
      <Stack gap={0}>
        <Text fw={700} size={guess ? 'lg' : 'sm'} c={guess ? undefined : 'dimmed'}>
          {main}
        </Text>
        {detail && (
          <Text size="sm" c="dimmed">
            {detail}
          </Text>
        )}
      </Stack>
    </Group>
  );
};
