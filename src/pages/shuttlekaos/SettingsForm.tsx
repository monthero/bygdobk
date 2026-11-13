import { Plural, Trans, useLingui } from '@lingui/react/macro';
import {
  Accordion,
  Button,
  Chip,
  Group,
  Radio,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';

import {
  CalendarBlank,
  Clock,
  Globe,
  Hash,
  Infinity as InfinityIcon,
  Lightning,
  LockSimple,
  UsersThree,
} from '~/components/ui';
import { BoardDatesProvider } from '~/pages/board/BoardDatesProvider';
import { DAY_FORMATTER } from '~/pages/board/format';
import { entrantsNeeded, plannedRounds } from '~/shuttlekaos/engine';
import {
  EVERYONE_ONCE,
  Format,
  Level,
  MAX_COURTS,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_PLAYER_LIMIT,
  Partners,
  PlayStyle,
  Repeat,
  ScoreMode,
  type Pair,
  type Settings,
} from '~/shuttlekaos/model';
import { date, ISO_DAY, today, todayIso } from '~/utils/dates';

import { Field, Section } from './FormParts';
import {
  FORMAT_LABELS,
  lastScheduleDay,
  LEVEL_HINTS,
  PARTNER_HINTS,
  PARTNER_LABELS,
  REPEAT_LABELS,
  REPEAT_WEEKS,
  repeatsLabel,
  RoundsChoice,
  roundsChoice,
  SCORE_MODE_LABELS,
  scheduleMessage,
  scheduleProblem,
  SectionColor,
  STYLE_LABELS,
  suggestedCourts,
  Visibility,
  VISIBILITY_LABELS,
  When,
  WHEN_LABELS,
  type Schedule,
} from './labels';
import { LevelsText } from './Levels';
import { FORMAT_ICONS, PARTNER_ICONS, SECTION_ICONS, STYLE_ICONS } from './sectionIcons';
import { Stepper } from './Stepper';
import { useSettingsEditor, type SettingsEditor } from './useSettingsEditor';

import classes from './SettingsForm.module.css';

const MAX_POINTS = 99;
const POINT_PRESETS: Record<ScoreMode, number[]> = {
  [ScoreMode.enum.total]: [16, 21, 24, 32],
  [ScoreMode.enum.race]: [11, 15, 21],
};
const OTHER_POINTS = 'other';
const SetsChoice = z.enum(['1', '3']);
const LEVEL_CHIP_CLASS_NAMES = { root: classes.levelChipRoot, label: classes.levelChip };
const SEGMENT_CLASS_NAMES = { root: classes.segmented, label: classes.segmentLabel };

const VISIBILITY_ICONS: Record<Visibility, ReactNode> = {
  [Visibility.enum.public]: <Globe />,
  [Visibility.enum.private]: <LockSimple />,
};
const WHEN_ICONS: Record<When, ReactNode> = {
  [When.enum.now]: <Lightning />,
  [When.enum.later]: <CalendarBlank />,
};
const ROUNDS_ICONS: Record<RoundsChoice, ReactNode> = {
  [RoundsChoice.enum.everyone]: <UsersThree />,
  [RoundsChoice.enum.count]: <Hash />,
  [RoundsChoice.enum.open]: <InfinityIcon />,
};

const Option: FC<{ icon: ReactNode; children: ReactNode }> = ({ icon, children }) => (
  <span className={classes.option}>
    {icon}
    {children}
  </span>
);

const Choice: FC<{
  label: string;
  value: string;
  data: { value: string; label: ReactNode }[];
  onChange: (value: string) => void;
}> = ({ label, value, data, onChange }) => (
  <SegmentedControl
    fullWidth
    radius="xl"
    size="md"
    color="brand"
    autoContrast
    classNames={SEGMENT_CLASS_NAMES}
    aria-label={label}
    value={value}
    onChange={onChange}
    data={data}
  />
);

export const VisibilityPicker: FC<{ isPublic: boolean; onChange: (isPublic: boolean) => void }> = ({
  isPublic,
  onChange,
}) => {
  const { t, i18n } = useLingui();
  const visibility = isPublic ? Visibility.enum.public : Visibility.enum.private;
  return (
    <Stack gap={8}>
      <Choice
        label={t`Who can join`}
        value={visibility}
        onChange={(value) => onChange(value === Visibility.enum.public)}
        data={Visibility.options.map((value) => ({
          value,
          label: <Option icon={VISIBILITY_ICONS[value]}>{i18n._(VISIBILITY_LABELS[value].label)}</Option>,
        }))}
      />
      <Text size="sm" c="dimmed">
        {i18n._(VISIBILITY_LABELS[visibility].hint)}
      </Text>
    </Stack>
  );
};

const ScheduleFields: FC<{ schedule: Schedule; onChange: (schedule: Schedule) => void }> = ({ schedule, onChange }) => {
  const { t, i18n } = useLingui();
  const { day, repeat } = schedule;
  const problem = scheduleProblem(schedule);
  const every = REPEAT_WEEKS[repeat];
  const patch = (next: Partial<Schedule>) => onChange({ ...schedule, ...next });

  const pickDay = (next: string | null) =>
    patch({ day: next, endsOn: next && schedule.endsOn && schedule.endsOn < next ? null : schedule.endsOn });

  return (
    <BoardDatesProvider>
      <Stack gap="sm">
        <SimpleGrid cols={2} spacing="sm">
          <DatePickerInput
            size="md"
            label={t`Date`}
            leftSection={<CalendarBlank />}
            valueFormatter={DAY_FORMATTER}
            minDate={todayIso()}
            maxDate={lastScheduleDay()}
            value={day}
            onChange={pickDay}
          />
          <TimeInput
            size="md"
            label={t`Time`}
            leftSection={<Clock />}
            value={schedule.time}
            onChange={(e) => patch({ time: e.currentTarget.value })}
          />
        </SimpleGrid>
        {problem && (
          <Text size="sm" c="red">
            {i18n._(scheduleMessage(problem))}
          </Text>
        )}
        <Field label={<Trans>Repeat</Trans>}>
          <Choice
            label={t`Repeat`}
            value={repeat}
            onChange={(value) => patch({ repeat: Repeat.parse(value) })}
            data={Repeat.options.map((value) => ({ value, label: i18n._(REPEAT_LABELS[value]) }))}
          />
        </Field>
        {every && day && (
          <>
            <DatePickerInput
              size="md"
              label={t`Last date`}
              placeholder={t`No end date`}
              leftSection={<CalendarBlank />}
              valueFormatter={DAY_FORMATTER}
              clearable
              minDate={day}
              value={schedule.endsOn}
              onChange={(endsOn) => patch({ endsOn })}
            />
            <Text size="sm" c="dimmed">
              {i18n._(repeatsLabel({ weekday: date(day).isoWeekday(), every, endsOn: schedule.endsOn }))}.{' '}
              <Trans>The next 2 dates are always open for sign-up.</Trans>
            </Text>
          </>
        )}
      </Stack>
    </BoardDatesProvider>
  );
};

export const WhenPicker: FC<{ schedule: Schedule; onChange: (schedule: Schedule) => void }> = ({
  schedule,
  onChange,
}) => {
  const { t, i18n } = useLingui();
  const later = schedule.when === When.enum.later;

  const pick = (value: string) => {
    const when = When.parse(value);
    onChange({ ...schedule, when, day: schedule.day ?? today().add(1, 'day').format(ISO_DAY) });
  };

  return (
    <Stack gap={8}>
      <Choice
        label={t`When`}
        value={schedule.when}
        onChange={pick}
        data={When.options.map((value) => ({
          value,
          label: <Option icon={WHEN_ICONS[value]}>{i18n._(WHEN_LABELS[value])}</Option>,
        }))}
      />
      <Text size="sm" c="dimmed">
        {later ? (
          <Trans>People can sign up now. You start it when everyone's there.</Trans>
        ) : (
          <Trans>Open for players right away.</Trans>
        )}
      </Text>
      {later && <ScheduleFields schedule={schedule} onChange={onChange} />}
    </Stack>
  );
};

export const PlayerLimitField: FC<{
  value: number | null;
  suggested: number;
  onChange: (value: number | null) => void;
}> = ({ value, suggested, onChange }) => {
  const { t } = useLingui();
  return (
    <Stack gap={8}>
      <Switch
        size="md"
        color="brand"
        label={<Trans>Limit the number of players</Trans>}
        checked={value !== null}
        onChange={(e) => onChange(e.currentTarget.checked ? suggested : null)}
      />
      {value !== null && (
        <Field hint={<Trans>Joining stops at {value}. You can still add people yourself.</Trans>}>
          <Stepper
            label={t`Max players`}
            value={value}
            min={MIN_PLAYER_LIMIT}
            max={MAX_PLAYERS}
            onChange={(limit) => limit !== null && onChange(limit)}
            fullWidth
          />
        </Field>
      )}
    </Stack>
  );
};

const LevelPicker: FC<{ levels: Level[]; onChange: (levels: Level[]) => void }> = ({ levels, onChange }) => {
  const { t, i18n } = useLingui();
  return (
    <Stack gap="sm">
      <Chip.Group multiple value={levels} onChange={(value) => onChange(z.array(Level).catch([]).parse(value))}>
        <SimpleGrid cols={5} spacing={6} aria-label={t`Levels`}>
          {Level.options.map((level) => (
            <Chip
              key={level}
              value={level}
              size="md"
              radius="xl"
              color="brand"
              autoContrast
              classNames={LEVEL_CHIP_CLASS_NAMES}
            >
              {level}
            </Chip>
          ))}
        </SimpleGrid>
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

const GameFields: FC<{ editor: SettingsEditor }> = ({ editor: { settings, onChange } }) => {
  const { t, i18n } = useLingui();
  return (
    <>
      <Field label={<Trans>Format</Trans>} hint={i18n._(FORMAT_LABELS[settings.format].hint)}>
        <Choice
          label={t`Format`}
          value={settings.format}
          onChange={(value) => onChange({ format: Format.parse(value) })}
          data={Format.options.map((value) => ({
            value,
            label: <Option icon={FORMAT_ICONS[value]}>{i18n._(FORMAT_LABELS[value].label)}</Option>,
          }))}
        />
      </Field>
      <Field label={<Trans context="ShuttleKaos setup: singles or doubles">Play</Trans>}>
        <Choice
          label={t({ message: 'Play', context: 'ShuttleKaos setup: singles or doubles' })}
          value={settings.style}
          onChange={(value) => onChange({ style: PlayStyle.parse(value) })}
          data={PlayStyle.options.map((value) => ({
            value,
            label: <Option icon={STYLE_ICONS[value]}>{i18n._(STYLE_LABELS[value])}</Option>,
          }))}
        />
      </Field>
      {settings.style === PlayStyle.enum.doubles && (
        <Field
          label={<Trans context="ShuttleKaos setup: doubles partners, rotating or fixed">Partners</Trans>}
          hint={i18n._(PARTNER_HINTS[settings.partners])}
        >
          <Choice
            label={t({ message: 'Partners', context: 'ShuttleKaos setup: doubles partners, rotating or fixed' })}
            value={settings.partners}
            onChange={(value) => onChange({ partners: Partners.parse(value) })}
            data={Partners.options.map((value) => ({
              value,
              label: <Option icon={PARTNER_ICONS[value]}>{i18n._(PARTNER_LABELS[value])}</Option>,
            }))}
          />
        </Field>
      )}
    </>
  );
};

export const CourtsField: FC<{ editor: SettingsEditor; playerCount: number; hideLabel?: boolean }> = ({
  editor: { settings, onChange },
  playerCount,
  hideLabel,
}) => {
  const { t } = useLingui();
  const courts = settings.courts;
  const needed = courts * entrantsNeeded(settings);
  const suggested = suggestedCourts(settings, playerCount);
  return (
    <Field
      label={!hideLabel && <Trans>Courts</Trans>}
      hint={
        <Trans>
          {needed} players fill <Plural value={courts} one="# court" other="# courts" />. Extra players take turns
          resting.
        </Trans>
      }
    >
      <div className={classes.courts}>
        <Stepper
          label={t`Courts`}
          value={courts}
          min={1}
          max={MAX_COURTS}
          onChange={(courtCount) => courtCount !== null && onChange({ courts: courtCount })}
          fullWidth
        />
        {playerCount >= entrantsNeeded(settings) && suggested !== courts && (
          <Button variant="light" size="compact-md" h={44} onClick={() => onChange({ courts: suggested })}>
            <Trans>Suggested: {suggested}</Trans>
          </Button>
        )}
      </div>
    </Field>
  );
};

const PointsField: FC<{ editor: SettingsEditor }> = ({ editor: { settings, setPoints } }) => {
  const { t } = useLingui();
  const presets = POINT_PRESETS[settings.scoreMode];
  const [custom, setCustom] = useState(() => !presets.includes(settings.points));
  const label = settings.scoreMode === ScoreMode.enum.total ? t`Points per match` : t`Points to win a game`;

  const pick = (value: string) => {
    setCustom(value === OTHER_POINTS);
    if (value !== OTHER_POINTS) setPoints(Number(value));
  };

  return (
    <Field
      label={label}
      hint={settings.scoreMode === ScoreMode.enum.race && <Trans>BWF standard: 15 (21 before 2027)</Trans>}
    >
      <Choice
        label={label}
        value={custom ? OTHER_POINTS : String(settings.points)}
        onChange={pick}
        data={[
          ...presets.map((preset) => ({ value: String(preset), label: String(preset) })),
          { value: OTHER_POINTS, label: t({ message: 'Other', context: 'ShuttleKaos points: pick your own number' }) },
        ]}
      />
      {custom && (
        <Stepper label={label} value={settings.points} min={1} max={MAX_POINTS} onChange={setPoints} fullWidth />
      )}
    </Field>
  );
};

const ScoringFields: FC<{ editor: SettingsEditor }> = ({ editor }) => {
  const { t, i18n } = useLingui();
  const { settings, onChange, pickMode } = editor;
  return (
    <>
      <Stack gap={8}>
        <Choice
          label={t`Scoring`}
          value={settings.scoreMode}
          onChange={pickMode}
          data={ScoreMode.options.map((value) => ({ value, label: i18n._(SCORE_MODE_LABELS[value].short) }))}
        />
        <Text size="sm" c="dimmed">
          {i18n._(SCORE_MODE_LABELS[settings.scoreMode].label)}. {i18n._(SCORE_MODE_LABELS[settings.scoreMode].hint)}
        </Text>
      </Stack>
      <PointsField key={settings.scoreMode} editor={editor} />
      {settings.scoreMode === ScoreMode.enum.race && (
        <Field label={<Trans>Games per match</Trans>}>
          <Choice
            label={t`Games per match`}
            value={String(settings.sets)}
            onChange={(value) => onChange({ sets: value === SetsChoice.enum['3'] ? 3 : 1 })}
            data={[
              { value: SetsChoice.enum['1'], label: t`One game` },
              { value: SetsChoice.enum['3'], label: t`Best of 3` },
            ]}
          />
        </Field>
      )}
    </>
  );
};

const RoundsFields: FC<{ editor: SettingsEditor; playerCount: number; pairs: Pair[] }> = ({
  editor,
  playerCount,
  pairs,
}) => {
  const { t } = useLingui();
  const { settings, pickRounds, setRounds } = editor;
  const rounds = roundsChoice(settings.rounds);
  const plannedEveryone = plannedRounds({ ...settings, rounds: EVERYONE_ONCE }, playerCount, pairs);
  const roundsTitles: Record<RoundsChoice, string> = {
    [RoundsChoice.enum.everyone]: t({
      message: 'Everyone',
      comment: 'Rounds option: until everyone has played together',
    }),
    [RoundsChoice.enum.count]: t`Set number`,
    [RoundsChoice.enum.open]: t`Until we stop`,
  };
  const roundsHints: Record<RoundsChoice, ReactNode> = {
    [RoundsChoice.enum.everyone]: (
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
    ),
    [RoundsChoice.enum.count]: <Trans>Pick how many rounds to play.</Trans>,
    [RoundsChoice.enum.open]: <Trans>Keep going until you call it. Finish any time.</Trans>,
  };
  return (
    <>
      <Radio.Group aria-label={t`Rounds`} value={rounds} onChange={(value) => pickRounds(RoundsChoice.parse(value))}>
        <Stack gap="xs">
          {RoundsChoice.options.map((value) => (
            <Radio.Card key={value} value={value} radius="md" p="sm" className={classes.tile}>
              <Group wrap="nowrap" gap="sm" justify="space-between">
                <Stack gap={0} miw={0}>
                  <Text fw={600} truncate="end">
                    <Option icon={ROUNDS_ICONS[value]}>{roundsTitles[value]}</Option>
                  </Text>
                  <Text size="sm" c="dimmed">
                    {roundsHints[value]}
                  </Text>
                </Stack>
                <Radio.Indicator color="brand" />
              </Group>
            </Radio.Card>
          ))}
        </Stack>
      </Radio.Group>
      {typeof settings.rounds === 'number' && (
        <Stepper label={t`Rounds`} value={settings.rounds} min={1} max={MAX_ROUNDS} onChange={setRounds} fullWidth />
      )}
    </>
  );
};

export const GameSection: FC<{ editor: SettingsEditor; children?: ReactNode }> = ({ editor, children }) => (
  <Section title={<Trans>Game</Trans>} icon={SECTION_ICONS.game} color={SectionColor.enum.brand}>
    <GameFields editor={editor} />
    {children}
  </Section>
);

export const ScoringSection: FC<{ editor: SettingsEditor }> = ({ editor }) => (
  <Section title={<Trans>Scoring</Trans>} icon={SECTION_ICONS.scoring} color={SectionColor.enum.teal}>
    <ScoringFields editor={editor} />
  </Section>
);

export const RoundsSection: FC<{ editor: SettingsEditor; playerCount: number; pairs: Pair[] }> = ({
  editor,
  playerCount,
  pairs,
}) => (
  <Section title={<Trans>Rounds</Trans>} icon={SECTION_ICONS.rounds} color={SectionColor.enum.blue}>
    <RoundsFields editor={editor} playerCount={playerCount} pairs={pairs} />
  </Section>
);

export const LevelSection: FC<{ levels: Level[]; onChange: (levels: Level[]) => void }> = ({ levels, onChange }) => (
  <Section title={<Trans>Level</Trans>} icon={SECTION_ICONS.level} color={SectionColor.enum.grape}>
    <LevelPicker levels={levels} onChange={onChange} />
  </Section>
);

type Props = {
  settings: Settings;
  playerCount: number;
  pairs: Pair[];
  onChange: (patch: Partial<Settings>) => void;
};

export const SettingsForm: FC<Props> = ({ settings, playerCount, pairs, onChange }) => {
  const editor = useSettingsEditor(settings, onChange);
  return (
    <Stack gap="md">
      <GameSection editor={editor}>
        <CourtsField editor={editor} playerCount={playerCount} />
      </GameSection>
      <ScoringSection editor={editor} />
      <RoundsSection editor={editor} playerCount={playerCount} pairs={pairs} />
      <LevelSection levels={settings.levels} onChange={(levels) => onChange({ levels })} />
    </Stack>
  );
};
