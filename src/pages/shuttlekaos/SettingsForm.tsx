import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Accordion, Button, Chip, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { useState, type FC } from 'react';
import { z } from 'zod';

import { entrantsNeeded, plannedRounds } from '~/shuttlekaos/engine';
import {
  EVERYONE_ONCE,
  Format,
  Level,
  MAX_COURTS,
  MAX_ROUNDS,
  Partners,
  PlayStyle,
  ScoreMode,
  type Pair,
  type Settings,
} from '~/shuttlekaos/model';

import { Field, Section } from './FormParts';
import {
  FORMAT_LABELS,
  LEVEL_HINTS,
  PARTNER_HINTS,
  PARTNER_LABELS,
  SCORE_MODE_LABELS,
  STYLE_LABELS,
  Visibility,
  VISIBILITY_LABELS,
} from './labels';
import { suggestedCourts } from './labels';
import { LevelsText } from './Levels';
import { Stepper } from './Stepper';

import classes from './SettingsForm.module.css';

const MAX_POINTS = 99;
const DEFAULT_ROUNDS = 6;
const POINT_PRESETS: Record<ScoreMode, number[]> = {
  [ScoreMode.enum.total]: [16, 21, 24, 32],
  [ScoreMode.enum.race]: [11, 15, 21],
};
const DEFAULT_POINTS: Record<ScoreMode, number> = {
  [ScoreMode.enum.total]: 21,
  [ScoreMode.enum.race]: 15,
};
const RoundsChoice = z.enum(['everyone', 'count', 'open']);
type RoundsChoice = z.infer<typeof RoundsChoice>;
const SetsChoice = z.enum(['1', '3']);
const CHIP_CLASS_NAMES = { label: classes.chip };
const SEGMENT_CLASS_NAMES = { root: classes.segmented, label: classes.segmentLabel };

const roundsValue = (choice: RoundsChoice, count: number): Settings['rounds'] => {
  if (choice === RoundsChoice.enum.everyone) return EVERYONE_ONCE;
  return choice === RoundsChoice.enum.open ? null : count;
};

export const VisibilityPicker: FC<{ isPublic: boolean; onChange: (isPublic: boolean) => void }> = ({
  isPublic,
  onChange,
}) => {
  const { t, i18n } = useLingui();
  const visibility = isPublic ? Visibility.enum.public : Visibility.enum.private;
  return (
    <Stack gap={8}>
      <SegmentedControl
        fullWidth
        radius="xl"
        size="md"
        classNames={SEGMENT_CLASS_NAMES}
        aria-label={t`Who can join`}
        value={visibility}
        onChange={(value) => onChange(value === Visibility.enum.public)}
        data={Visibility.options.map((value) => ({ value, label: i18n._(VISIBILITY_LABELS[value].label) }))}
      />
      <Text size="sm" c="dimmed">
        {i18n._(VISIBILITY_LABELS[visibility].hint)}
      </Text>
    </Stack>
  );
};

const LevelPicker: FC<{ levels: Level[]; onChange: (levels: Level[]) => void }> = ({ levels, onChange }) => {
  const { t, i18n } = useLingui();
  return (
    <Stack gap="sm">
      <Chip.Group multiple value={levels} onChange={(value) => onChange(z.array(Level).catch([]).parse(value))}>
        <Group gap={6} aria-label={t`Levels`}>
          {Level.options.map((level) => (
            <Chip key={level} value={level} size="md" radius="xl" classNames={CHIP_CLASS_NAMES}>
              {level}
            </Chip>
          ))}
        </Group>
      </Chip.Group>
      <Text size="sm" c="dimmed">
        <LevelsText levels={levels} />.{' '}
        {levels.length > 1 ? (
          <Trans>Any of the picked levels can join.</Trans>
        ) : (
          <Trans>Pick none for all levels.</Trans>
        )}
      </Text>
      <Accordion variant="contained" radius="md" className={classes.levelHelp}>
        <Accordion.Item value="levels">
          <Accordion.Control>
            <Trans>Which level am I?</Trans>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap={6}>
              {Level.options.map((level) => (
                <Text key={level} size="sm">
                  <Text span fw={700} inherit>
                    {level}
                  </Text>
                  {' – '}
                  {i18n._(LEVEL_HINTS[level])}
                </Text>
              ))}
              <Text size="sm" c="dimmed">
                <Trans comment="NBF is the Norwegian badminton federation">
                  Classes follow NBF ranking points from tournaments. No points? Pick what feels like your game.
                </Trans>
              </Text>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
};

const roundsChoice = (rounds: Settings['rounds']): RoundsChoice => {
  if (rounds === EVERYONE_ONCE) return RoundsChoice.enum.everyone;
  return rounds === null ? RoundsChoice.enum.open : RoundsChoice.enum.count;
};

type Props = {
  settings: Settings;
  playerCount: number;
  pairs: Pair[];
  onChange: (patch: Partial<Settings>) => void;
};

export const SettingsForm: FC<Props> = ({ settings, playerCount, pairs, onChange }) => {
  const { t, i18n } = useLingui();
  const [roundCount, setRoundCount] = useState(typeof settings.rounds === 'number' ? settings.rounds : DEFAULT_ROUNDS);
  const [pointsByMode, setPointsByMode] = useState(() => ({
    ...DEFAULT_POINTS,
    [settings.scoreMode]: settings.points,
  }));

  const needed = settings.courts * entrantsNeeded(settings);
  const courts = settings.courts;
  const suggested = suggestedCourts(settings, playerCount);
  const everyone: Settings = { ...settings, rounds: EVERYONE_ONCE };
  const plannedEveryone = plannedRounds(everyone, playerCount, pairs);
  const modeLabel = i18n._(SCORE_MODE_LABELS[settings.scoreMode].label);
  const pointsLabel = settings.scoreMode === ScoreMode.enum.total ? t`Points per match` : t`Points to win a game`;

  const pickMode = (mode: string) => {
    const scoreMode = ScoreMode.parse(mode);
    onChange({ scoreMode, points: pointsByMode[scoreMode] });
  };

  const setPoints = (points: number | null) => {
    if (points === null) return;
    onChange({ points });
    setPointsByMode((current) => ({ ...current, [settings.scoreMode]: points }));
  };

  const rounds = roundsChoice(settings.rounds);

  const setRounds = (count: number | null) => {
    if (count === null) return;
    setRoundCount(count);
    onChange({ rounds: count });
  };

  return (
    <Stack gap="md">
      <Section title={<Trans>Game</Trans>}>
        <Field label={<Trans>Format</Trans>} hint={i18n._(FORMAT_LABELS[settings.format].hint)}>
          <SegmentedControl
            fullWidth
            radius="xl"
            size="md"
            classNames={SEGMENT_CLASS_NAMES}
            value={settings.format}
            onChange={(value) => onChange({ format: Format.parse(value) })}
            data={Format.options.map((value) => ({ value, label: i18n._(FORMAT_LABELS[value].label) }))}
          />
        </Field>
        <Field label={<Trans context="ShuttleKaos setup: singles or doubles">Play</Trans>}>
          <SegmentedControl
            fullWidth
            radius="xl"
            size="md"
            classNames={SEGMENT_CLASS_NAMES}
            value={settings.style}
            onChange={(value) => onChange({ style: PlayStyle.parse(value) })}
            data={PlayStyle.options.map((value) => ({ value, label: i18n._(STYLE_LABELS[value]) }))}
          />
        </Field>
        {settings.style === PlayStyle.enum.doubles && (
          <Field
            label={<Trans context="ShuttleKaos setup: doubles partners, rotating or fixed">Partners</Trans>}
            hint={i18n._(PARTNER_HINTS[settings.partners])}
          >
            <SegmentedControl
              fullWidth
              radius="xl"
              size="md"
              classNames={SEGMENT_CLASS_NAMES}
              value={settings.partners}
              onChange={(value) => onChange({ partners: Partners.parse(value) })}
              data={Partners.options.map((value) => ({ value, label: i18n._(PARTNER_LABELS[value]) }))}
            />
          </Field>
        )}
        <Field
          label={<Trans>Courts</Trans>}
          hint={
            <Trans>
              {needed} players fill <Plural value={courts} one="# court" other="# courts" />. Extra players take turns
              resting.
            </Trans>
          }
        >
          <Group gap="md">
            <Stepper
              label={t`Courts`}
              value={settings.courts}
              min={1}
              max={MAX_COURTS}
              onChange={(courtCount) => courtCount !== null && onChange({ courts: courtCount })}
            />
            {playerCount > 0 && suggested !== courts && (
              <Button variant="subtle" size="compact-md" h={44} onClick={() => onChange({ courts: suggested })}>
                <Trans>Suggested: {suggested}</Trans>
              </Button>
            )}
          </Group>
        </Field>
      </Section>

      <Section title={<Trans>Scoring</Trans>}>
        <Stack gap={8}>
          <SegmentedControl
            fullWidth
            radius="xl"
            size="md"
            classNames={SEGMENT_CLASS_NAMES}
            aria-label={t`Scoring`}
            value={settings.scoreMode}
            onChange={pickMode}
            data={ScoreMode.options.map((value) => ({ value, label: i18n._(SCORE_MODE_LABELS[value].short) }))}
          />
          <Text size="sm" c="dimmed">
            {i18n._(SCORE_MODE_LABELS[settings.scoreMode].label)}. {i18n._(SCORE_MODE_LABELS[settings.scoreMode].hint)}
          </Text>
        </Stack>
        <Field
          label={pointsLabel}
          hint={settings.scoreMode === ScoreMode.enum.race && <Trans>BWF standard: 15 (21 before 2027)</Trans>}
        >
          <div className={classes.points}>
            <Stepper label={pointsLabel} value={settings.points} min={1} max={MAX_POINTS} onChange={setPoints} />
            <Chip.Group value={String(settings.points)} onChange={(value) => setPoints(Number(value))}>
              <Group gap={6} aria-label={t`Common choices for ${modeLabel}`}>
                {POINT_PRESETS[settings.scoreMode].map((preset) => (
                  <Chip key={preset} value={String(preset)} size="md" radius="xl" classNames={CHIP_CLASS_NAMES}>
                    {preset}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </div>
        </Field>
        {settings.scoreMode === ScoreMode.enum.race && (
          <Field label={<Trans>Games per match</Trans>}>
            <SegmentedControl
              fullWidth
              radius="xl"
              size="md"
              classNames={SEGMENT_CLASS_NAMES}
              value={String(settings.sets)}
              onChange={(value) => onChange({ sets: value === SetsChoice.enum['3'] ? 3 : 1 })}
              data={[
                { value: SetsChoice.enum['1'], label: t`One game` },
                { value: SetsChoice.enum['3'], label: t`Best of 3` },
              ]}
            />
          </Field>
        )}
      </Section>

      <Section title={<Trans>Rounds</Trans>}>
        <Stack gap={8}>
          <SegmentedControl
            fullWidth
            radius="xl"
            size="md"
            classNames={SEGMENT_CLASS_NAMES}
            aria-label={t`Rounds`}
            value={rounds}
            onChange={(value) => onChange({ rounds: roundsValue(RoundsChoice.parse(value), roundCount) })}
            data={[
              {
                value: RoundsChoice.enum.everyone,
                label: t({ message: 'Everyone', comment: 'Rounds option: until everyone has played together' }),
              },
              { value: RoundsChoice.enum.count, label: t`Set number` },
              { value: RoundsChoice.enum.open, label: t`Until we stop` },
            ]}
          />
          <Text size="sm" c="dimmed">
            {rounds === RoundsChoice.enum.everyone && (
              <>
                <Trans>Until everyone has played together</Trans>.{' '}
                {plannedEveryone && playerCount >= entrantsNeeded(settings) ? (
                  <Trans>
                    About <Plural value={plannedEveryone} one="# round" other="# rounds" /> with {playerCount} players.
                  </Trans>
                ) : (
                  <Trans>The number of rounds follows the players.</Trans>
                )}
              </>
            )}
            {rounds === RoundsChoice.enum.count && <Trans>Pick how many rounds to play.</Trans>}
            {rounds === RoundsChoice.enum.open && <Trans>Keep going until you call it. Finish any time.</Trans>}
          </Text>
        </Stack>
        {typeof settings.rounds === 'number' && (
          <Stepper label={t`Rounds`} value={settings.rounds} min={1} max={MAX_ROUNDS} onChange={setRounds} />
        )}
      </Section>

      <Section title={<Trans>Level</Trans>}>
        <LevelPicker levels={settings.levels} onChange={(levels) => onChange({ levels })} />
      </Section>
    </Stack>
  );
};
