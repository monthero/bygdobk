import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  Alert,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Stepper,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { schemaResolver, useForm } from '@mantine/form';
import { getRouteApi, Navigate } from '@tanstack/react-router';
import { useMemo, useState, type FC, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';

import { PageIntro } from '~/components/styles';
import { slotsOf } from '~/components/styles/court/schedule';
import { Info, User, UsersThree } from '~/components/ui';
import {
  CURRENT_SEASON,
  GROUP_SLUGS,
  PriceKind,
  PRICES,
  seasonTotal,
  type Group as TrainingGroup,
  type Price,
} from '~/data/club';
import { PHOTOS } from '~/data/photos';
import { listFormat, type Translate } from '~/i18n/current';
import { dayjs, weekdayName } from '~/utils/dates';

import { JoinDone } from './JoinDone';
import { groupOfPrice, Joiner, kr, priceForGroup } from './offers';

import classes from './JoinPage.module.css';

const route = getRouteApi('/medlemskap/bli-medlem');

const ADULT_AGE = 18;
const CHILD_PICKER_DATE = '2016-01-01';
const ADULT_PICKER_DATE = '1990-01-01';
const STEPPER_CLASS_NAMES = { step: classes.step, stepBody: classes.stepBody };
const QUESTION_CLASS_NAMES = { label: classes.question };
const PHONE_PATTERN = /^\+?[\d\s]{8,15}$/;
const EMAIL = z.email();
const STEP_FIELDS: string[][] = [
  ['joiner', 'priceId'],
  ['firstName', 'lastName', 'birthDate', 'email', 'phone', 'guardianName', 'guardianEmail', 'guardianPhone'],
  ['consent'],
];
const CONTACT_CHECK_INPUTS = new Set(['joiner']);
const GUARDIAN_CHECK_INPUTS = new Set(['joiner', 'birthDate']);

const JOINER_OPTIONS: Record<Joiner, { label: MessageDescriptor; hint: MessageDescriptor; icon: ReactNode }> = {
  [Joiner.enum.me]: { label: msg`Me`, hint: msg`I want to play`, icon: <User /> },
  [Joiner.enum.child]: { label: msg`My child`, hint: msg`I’m the parent`, icon: <UsersThree /> },
};

const isEmail = (value: string) => EMAIL.safeParse(value.trim()).success;
const isPhone = (value: string) => PHONE_PATTERN.test(value.trim());

const isMinor = (birthDate: string | null) => Boolean(birthDate) && dayjs().diff(dayjs(birthDate), 'year') < ADULT_AGE;

const noIssueOn =
  (inputs: ReadonlySet<string>) =>
  ({ issues }: { issues: readonly { path?: readonly PropertyKey[] }[] }) =>
    !issues.some((issue) => inputs.has(String(issue.path?.at(0))));

const joinSchema = (t: Translate) =>
  z
    .object({
      joiner: z.enum(Joiner.options, { error: t(msg`Choose who is joining`) }),
      priceId: z.string().min(1, t(msg`Choose a membership`)),
      firstName: z
        .string()
        .trim()
        .min(1, t(msg`Enter a first name`)),
      lastName: z
        .string()
        .trim()
        .min(1, t(msg`Enter a last name`)),
      birthDate: z.string({ error: t(msg`Enter a date of birth`) }).min(1, t(msg`Enter a date of birth`)),
      email: z.string(),
      phone: z.string(),
      guardianName: z.string(),
      guardianEmail: z.string(),
      guardianPhone: z.string(),
      consent: z.literal(true, { error: t(msg`You need to accept to continue`) }),
    })
    .superRefine(
      (v, ctx) => {
        const child = v.joiner === Joiner.enum.child;
        if ((!child || v.email.trim()) && !isEmail(v.email))
          ctx.addIssue({ code: 'custom', path: ['email'], message: t(msg`Enter a valid email address`) });
        if ((!child || v.phone.trim()) && !isPhone(v.phone))
          ctx.addIssue({
            code: 'custom',
            path: ['phone'],
            message: t(msg`Enter a phone number with at least 8 digits`),
          });
        if (!child) return;
        if (!v.guardianName.trim())
          ctx.addIssue({ code: 'custom', path: ['guardianName'], message: t(msg`Enter your name`) });
        if (!isEmail(v.guardianEmail))
          ctx.addIssue({ code: 'custom', path: ['guardianEmail'], message: t(msg`Enter a valid email address`) });
        if (!isPhone(v.guardianPhone))
          ctx.addIssue({
            code: 'custom',
            path: ['guardianPhone'],
            message: t(msg`Enter a phone number with at least 8 digits`),
          });
      },
      { when: noIssueOn(CONTACT_CHECK_INPUTS) },
    )
    .superRefine(
      (v, ctx) => {
        if (v.joiner !== Joiner.enum.me || !isMinor(v.birthDate)) return;
        if (!v.guardianName.trim())
          ctx.addIssue({ code: 'custom', path: ['guardianName'], message: t(msg`Enter the name of a parent`) });
        if (!isPhone(v.guardianPhone))
          ctx.addIssue({ code: 'custom', path: ['guardianPhone'], message: t(msg`Enter the parent’s phone number`) });
      },
      { when: noIssueOn(GUARDIAN_CHECK_INPUTS) },
    );

const whenText = (group: TrainingGroup) =>
  slotsOf(group)
    .map((slot) => {
      const days = listFormat().format(slot.weekdays.map((d) => weekdayName(d, 'short')));
      return `${days} ${slot.start}–${slot.end}`;
    })
    .join(' · ');

const PriceAmount: FC<{ price: Price }> = ({ price }) =>
  price.kind === PriceKind.enum.dropin && price.perVisit ? (
    <Trans>
      {kr(price.membership)} + {kr(price.perVisit)} per visit
    </Trans>
  ) : (
    kr(seasonTotal(price))
  );

export const JoinPage: FC = () => {
  const { i18n, t } = useLingui();
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const requestedStep = (search.steg ?? 1) - 1;
  const [today] = useState(() => new Date());

  const schema = useMemo(() => joinSchema(t), [t]);

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      joiner: (search.for ?? null) as Joiner | null,
      priceId: search.pris ?? priceForGroup(GROUP_SLUGS.fromSlug(search.gruppe))?.id ?? '',
      firstName: '',
      lastName: '',
      birthDate: null as string | null,
      email: '',
      phone: '',
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      consent: false,
    },
    validate: schemaResolver(schema, { sync: true }),
  });

  const { values } = form;
  const price = PRICES.find((p) => p.id === values.priceId);
  const child = values.joiner === Joiner.enum.child;
  const minor = !child && isMinor(values.birthDate);

  const reachable = STEP_FIELDS.slice(0, Math.min(requestedStep, 2))
    .flat()
    .every((field) => form.isValid(field));
  const step = reachable ? requestedStep : 0;
  const setStep = (next: number) => {
    void navigate({ search: (prev) => ({ ...prev, steg: next + 1 }), resetScroll: false });
  };

  const next = () => {
    const fields = STEP_FIELDS[step] ?? [];
    const invalid = fields.map((field) => form.validateField(field).hasError).includes(true);
    if (!invalid) setStep(step + 1);
  };

  const send = form.onSubmit(() => setStep(3));
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (step < 2) {
      event.preventDefault();
      next();
      return;
    }
    send(event);
  };

  return (
    <>
      <PageIntro
        photo={PHOTOS.playersCourt}
        eyebrow={<Trans>Season {CURRENT_SEASON.label}</Trans>}
        title={<Trans>Join Bygdø Badmintonklubb</Trans>}
        lede={<Trans>Three short steps. You pay when the season starts, by card or Vipps.</Trans>}
      />
      {!reachable && (
        <Navigate from={route.id} search={(prev) => ({ ...prev, steg: undefined })} replace resetScroll={false} />
      )}
      <Container size="md" py={40}>
        <Alert icon={<Info />} color="yellow" variant="light" mb="xl">
          <Trans>This is a demo of a new sign-up flow. Nothing is sent or saved.</Trans>
        </Alert>
        <form onSubmit={handleSubmit} noValidate>
          <Stepper
            active={step}
            classNames={STEPPER_CLASS_NAMES}
            onStepClick={(s) => s < step && setStep(s)}
            allowNextStepsSelect={false}
          >
            <Stepper.Step label={t`Membership`} description={t`Choose a group`}>
              <Stack gap="xl" mt="lg">
                <Radio.Group
                  label={t`Who is joining?`}
                  classNames={QUESTION_CLASS_NAMES}
                  {...form.getInputProps('joiner')}
                >
                  <SimpleGrid cols={2} spacing="md" mt="xs">
                    {Joiner.options.map((joiner) => {
                      const { label, hint, icon } = JOINER_OPTIONS[joiner];
                      return (
                        <Radio.Card key={joiner} value={joiner} radius="md" p="md" className={classes.option}>
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

                <Radio.Group
                  label={t`Choose a membership`}
                  classNames={QUESTION_CLASS_NAMES}
                  {...form.getInputProps('priceId')}
                >
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="xs">
                    {PRICES.map((p) => {
                      const group = groupOfPrice(p);
                      return (
                        <Radio.Card key={p.id} value={p.id} radius="md" p="md" className={classes.option}>
                          <Group wrap="nowrap" align="flex-start">
                            <Radio.Indicator />
                            <Stack gap={2}>
                              <Text fw={700}>{i18n._(p.name)}</Text>
                              <Text size="sm">{i18n._(p.note)}</Text>
                              {group && (
                                <Text size="sm" c="dimmed" className="tabular">
                                  {whenText(group)}
                                </Text>
                              )}
                              <Text fw={600} mt={4} className="tabular">
                                <PriceAmount price={p} />
                              </Text>
                            </Stack>
                          </Group>
                        </Radio.Card>
                      );
                    })}
                  </SimpleGrid>
                </Radio.Group>
              </Stack>
            </Stepper.Step>

            <Stepper.Step label={child ? t`Your child` : t`About you`} description={t`Name and contact`}>
              <Stack gap="md" mt="lg">
                {child && (
                  <Title order={3} size="h4">
                    <Trans>Your child</Trans>
                  </Title>
                )}
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput
                    label={t`First name`}
                    autoComplete={child ? 'off' : 'given-name'}
                    withAsterisk
                    {...form.getInputProps('firstName')}
                  />
                  <TextInput
                    label={t`Last name`}
                    autoComplete={child ? 'off' : 'family-name'}
                    withAsterisk
                    {...form.getInputProps('lastName')}
                  />
                </SimpleGrid>
                <DateInput
                  label={t`Date of birth`}
                  placeholder={t`Pick a date`}
                  valueFormat="D MMMM YYYY"
                  defaultLevel="decade"
                  defaultDate={child ? CHILD_PICKER_DATE : ADULT_PICKER_DATE}
                  maxDate={today}
                  withAsterisk
                  {...form.getInputProps('birthDate')}
                />
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput
                    label={child ? t`Child’s email (optional)` : t`Email`}
                    type="email"
                    autoComplete={child ? 'off' : 'email'}
                    withAsterisk={!child}
                    {...form.getInputProps('email')}
                  />
                  <TextInput
                    label={child ? t`Child’s phone (optional)` : t`Phone`}
                    type="tel"
                    autoComplete={child ? 'off' : 'tel'}
                    withAsterisk={!child}
                    {...form.getInputProps('phone')}
                  />
                </SimpleGrid>
                {child && (
                  <>
                    <Title order={3} size="h4" mt="md">
                      <Trans>You, the parent</Trans>
                    </Title>
                    <TextInput
                      label={t`Your name`}
                      autoComplete="name"
                      withAsterisk
                      {...form.getInputProps('guardianName')}
                    />
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <TextInput
                        label={t`Your email`}
                        type="email"
                        autoComplete="email"
                        withAsterisk
                        {...form.getInputProps('guardianEmail')}
                      />
                      <TextInput
                        label={t`Your phone`}
                        type="tel"
                        autoComplete="tel"
                        withAsterisk
                        {...form.getInputProps('guardianPhone')}
                      />
                    </SimpleGrid>
                  </>
                )}
                {minor && (
                  <Paper withBorder radius="md" p="md" bg="var(--bk-accent-soft)">
                    <Stack gap="sm">
                      <Text fw={600}>
                        <Trans>Under 18: a parent signs up with you</Trans>
                      </Text>
                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput label={t`Parent’s name`} withAsterisk {...form.getInputProps('guardianName')} />
                        <TextInput
                          label={t`Parent’s phone`}
                          type="tel"
                          withAsterisk
                          {...form.getInputProps('guardianPhone')}
                        />
                      </SimpleGrid>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Stepper.Step>

            <Stepper.Step label={t`Confirm`} description={t`Check and send`}>
              <Stack gap="md" mt="lg">
                <Table variant="vertical" withTableBorder layout="fixed">
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Th w={180}>
                        <Trans>Membership</Trans>
                      </Table.Th>
                      <Table.Td>{price && i18n._(price.name)}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>{child ? <Trans>Player</Trans> : <Trans>Name</Trans>}</Table.Th>
                      <Table.Td>
                        {values.firstName} {values.lastName}
                      </Table.Td>
                    </Table.Tr>
                    {values.email && (
                      <Table.Tr>
                        <Table.Th>
                          <Trans>Email</Trans>
                        </Table.Th>
                        <Table.Td>{values.email}</Table.Td>
                      </Table.Tr>
                    )}
                    {(child || minor) && (
                      <Table.Tr>
                        <Table.Th>
                          <Trans>Parent</Trans>
                        </Table.Th>
                        <Table.Td>
                          {[values.guardianName, child && values.guardianEmail, values.guardianPhone]
                            .filter(Boolean)
                            .join(', ')}
                        </Table.Td>
                      </Table.Tr>
                    )}
                    <Table.Tr>
                      <Table.Th>
                        <Trans>To pay this season</Trans>
                      </Table.Th>
                      <Table.Td fw={700} className="tabular">
                        {price && <PriceAmount price={price} />}
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
                <Text size="sm" c="dimmed">
                  <Trans>Discounts (siblings, first season) are applied by the board.</Trans>
                </Text>
                <Checkbox
                  label={t`I accept the club’s terms and privacy statement`}
                  {...form.getInputProps('consent', { type: 'checkbox' })}
                />
              </Stack>
            </Stepper.Step>

            <Stepper.Completed>
              <JoinDone
                price={price}
                firstName={values.firstName}
                parentName={child ? values.guardianName : undefined}
              />
            </Stepper.Completed>
          </Stepper>

          {step < 3 && (
            <Group justify="space-between" mt="xl">
              <Button variant="default" onClick={() => setStep(step - 1)} disabled={step === 0}>
                <Trans>Back</Trans>
              </Button>
              <Button type="submit">{step < 2 ? <Trans>Next</Trans> : <Trans>Send</Trans>}</Button>
            </Group>
          )}
        </form>
      </Container>
    </>
  );
};
