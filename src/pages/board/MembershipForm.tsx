import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  Alert,
  Button,
  Group,
  Input,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { schemaResolver, useForm } from '@mantine/form';
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type FC, type FocusEvent } from 'react';
import { z } from 'zod';

import type { Season } from '~/cms/calendar';
import type { Plan } from '~/cms/content';
import { CalendarBlank, CheckCircle, FloppyDisk, MagnifyingGlass, Warning } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { Translate } from '~/i18n/current';
import {
  NAME_MAX,
  NOTE_MAX,
  seasonDates,
  type AdminMembership,
  type MembershipInput,
  type PaymentMethod,
} from '~/memberships/model';
import {
  findProfileByEmail,
  membershipErrorMessage,
  useCreateMembership,
  useUpdateMembership,
} from '~/memberships/queries';
import { planTotal } from '~/pages/join/offers';
import { todayIso } from '~/utils/dates';
import { normalizeEmail } from '~/utils/email';

import { DAY_FORMATTER, NO_METHOD, NO_PAID_DAY, notifyDone, paidAtOf, paidDayOf } from './format';
import { PaymentFields } from './PaymentFields';

const Holder = z.enum(['account', 'other']);
type Holder = z.infer<typeof Holder>;

type FormValues = {
  holder: Holder;
  email: string;
  playerName: string;
  planId: string | null;
  priceNok: number | string;
  startDate: string | null;
  endDate: string | null;
  paid: boolean;
  paidOn: string | null;
  paymentMethod: PaymentMethod | null;
  note: string;
};

const PROFILE_BY_EMAIL_KEY = 'profile-by-email';
const LOOKUP_STALE_MS = 60_000;
const EMAIL_MAX = 254;
const NOTE_COUNT_FROM = 200;
const NO_ACCOUNT = msg`No account with that email`;
// Run even when a field fails, so every error shows on the first submit.
const ALWAYS = { when: () => true };

const IS_EMAIL = z.email();

const profileByEmailQuery = (email: string) =>
  queryOptions({
    queryKey: [PROFILE_BY_EMAIL_KEY, email],
    queryFn: () => findProfileByEmail(email),
    staleTime: LOOKUP_STALE_MS,
  });

const formSchema = (t: Translate) =>
  z
    .object({
      holder: Holder,
      email: z.string(),
      playerName: z.string(),
      planId: z.string(t(msg`Pick a plan`)),
      priceNok: z
        .number(t(msg`Enter a price`))
        .int()
        .min(0, t(msg`The price can't be below 0`)),
      startDate: z.string(t(msg`Pick a start date`)),
      endDate: z.string(t(msg`Pick an end date`)),
      paid: z.boolean(),
      paidOn: z.string().nullable(),
      paymentMethod: z.string().nullable(),
      note: z.string().max(NOTE_MAX, t(msg`Keep the note to ${NOTE_MAX} characters`)),
    })
    .superRefine((v, ctx) => {
      const issue = (path: keyof FormValues, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });
      const email = normalizeEmail(v.email);
      const isOther = v.holder === Holder.enum.other;
      if (!isOther && !email) issue('email', t(msg`Enter the account's email`));
      if (email && !IS_EMAIL.safeParse(email).success) issue('email', t(msg`Enter a valid email address`));
      if (isOther && !v.playerName.trim()) issue('playerName', t(msg`Enter the player's name`));
      if (v.startDate && v.endDate && v.endDate < v.startDate) issue('endDate', t(msg`End can't be before start`));
      if (v.paid && !v.paidOn) issue('paidOn', t(NO_PAID_DAY));
      if (v.paid && !v.paymentMethod) issue('paymentMethod', t(NO_METHOD));
    }, ALWAYS);

const initialValues = (m: AdminMembership | undefined, season: Season): FormValues => {
  if (!m) {
    return {
      holder: Holder.enum.account,
      email: '',
      playerName: '',
      planId: null,
      priceNok: '',
      ...seasonDates(season),
      paid: false,
      paidOn: todayIso(),
      paymentMethod: null,
      note: '',
    };
  }
  return {
    holder: m.playerName === null ? Holder.enum.account : Holder.enum.other,
    email: m.profile?.email ?? '',
    playerName: m.playerName ?? '',
    planId: m.planId,
    priceNok: m.priceNok,
    startDate: m.startDate,
    endDate: m.endDate,
    paid: m.paidAt !== null,
    paidOn: m.paidAt ? paidDayOf(m.paidAt) : todayIso(),
    paymentMethod: m.paymentMethod,
    note: m.note ?? '',
  };
};

const LookupResult: FC<{ email: string }> = ({ email }) => {
  const { i18n } = useLingui();
  const lookup = useQuery({ ...profileByEmailQuery(email), enabled: email !== '' });
  if (!email) return null;
  if (lookup.isFetching) {
    return (
      <Group gap={6} c="dimmed">
        <Loader size={14} />
        <Text size="sm">
          <Trans>Looking for the account…</Trans>
        </Text>
      </Group>
    );
  }
  if (lookup.isError) {
    return (
      <Group gap={6} c="red">
        <Warning />
        <Text size="sm">{i18n._(membershipErrorMessage(lookup.error))}</Text>
      </Group>
    );
  }
  if (!lookup.data) {
    return (
      <Group gap={6} c="orange">
        <Warning />
        <Text size="sm">{i18n._(NO_ACCOUNT)}</Text>
      </Group>
    );
  }
  return (
    <Group gap={6} c="teal">
      <CheckCircle />
      <Text size="sm" fw={600}>
        {lookup.data.name}
      </Text>
    </Group>
  );
};

type FormProps = {
  membership: AdminMembership | undefined;
  email?: string;
  season: Season;
  plans: ReadonlyMap<string, Plan>;
  onDone: () => void;
};

const MembershipFormBody: FC<FormProps> = ({ membership, email: forEmail, season, plans, onDone }) => {
  const { i18n, t } = useLingui();
  const queryClient = useQueryClient();
  const schema = useMemo(() => formSchema(t), [t]);
  const form = useForm<FormValues>({
    initialValues: { ...initialValues(membership, season), ...(forEmail && !membership && { email: forEmail }) },
    validate: schemaResolver(schema, { sync: true }),
  });
  const [lookupEmail, setLookupEmail] = useState(() => normalizeEmail(membership?.profile?.email ?? forEmail ?? ''));
  const create = useCreateMembership();
  const update = useUpdateMembership();
  const saving = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  const { holder, paid, startDate, planId, note } = form.values;
  const isOther = holder === Holder.enum.other;

  const holders = useMemo(
    () => [
      { value: Holder.enum.account, label: t`An account holder` },
      { value: Holder.enum.other, label: t`Someone else` },
    ],
    [t],
  );
  const planOptions = useMemo(() => {
    const options = Array.from(plans.values(), (p) => ({ value: p.id, label: p.name }));
    if (planId && !plans.has(planId)) options.push({ value: planId, label: planId });
    return options;
  }, [plans, planId]);

  const lookUp = () => {
    const email = normalizeEmail(form.getValues().email);
    setLookupEmail(IS_EMAIL.safeParse(email).success ? email : '');
  };

  const emailProps = form.getInputProps('email');
  const blurEmail = (event: FocusEvent<HTMLInputElement>) => {
    emailProps.onBlur?.(event);
    lookUp();
  };

  const pickPlan = (id: string | null) => {
    form.setFieldValue('planId', id);
    const plan = id ? plans.get(id) : undefined;
    if (plan) form.setFieldValue('priceNok', planTotal(plan));
  };

  const findProfile = async (email: string) => {
    if (!email) return null;
    setLookupEmail(email);
    try {
      const profile = await queryClient.fetchQuery(profileByEmailQuery(email));
      if (!profile) form.setFieldError('email', t(NO_ACCOUNT));
      return profile;
    } catch (lookupError) {
      form.setFieldError('email', i18n._(membershipErrorMessage(lookupError)));
      return undefined;
    }
  };

  const submit = form.onSubmit(async (values) => {
    const { planId: plan, priceNok, startDate: start, endDate: end, paidOn } = values;
    if (!plan || !start || !end || typeof priceNok !== 'number') return;
    const email = normalizeEmail(values.email);
    const profile = await findProfile(email);
    if (email && !profile) return;
    const input: MembershipInput = {
      profileId: profile?.id ?? null,
      playerName: values.holder === Holder.enum.other ? values.playerName.trim() : null,
      planId: plan,
      startDate: start,
      endDate: end,
      priceNok,
      paidAt: values.paid && paidOn ? paidAtOf(paidOn) : null,
      paymentMethod: values.paid ? values.paymentMethod : null,
      note: values.note.trim() || null,
    };
    const onSuccess = () => {
      notifyDone(membership ? t`Membership saved` : t`Membership added`);
      onDone();
    };
    if (membership) update.mutate({ id: membership.id, patch: input }, { onSuccess });
    else create.mutate(input, { onSuccess });
  });

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        <Input.Wrapper
          label={t({ message: 'For', comment: 'Label: who the membership is for' })}
          description={isOther ? t`A child, or someone without an account.` : undefined}
        >
          <SegmentedControl fullWidth data={holders} mt={4} {...form.getInputProps('holder')} />
        </Input.Wrapper>
        {isOther && (
          <TextInput
            label={t`Player name`}
            autoComplete="off"
            maxLength={NAME_MAX}
            withAsterisk
            {...form.getInputProps('playerName')}
          />
        )}
        <Stack gap={6}>
          <TextInput
            label={isOther ? t`Linked account email` : t`Account email`}
            description={isOther ? t`Optional. Usually a parent's account.` : undefined}
            type="email"
            autoComplete="off"
            maxLength={EMAIL_MAX}
            withAsterisk={!isOther}
            {...emailProps}
            onBlur={blurEmail}
            rightSectionWidth={80}
            rightSection={
              <Button size="compact-xs" variant="light" leftSection={<MagnifyingGlass />} onClick={lookUp}>
                <Trans comment="Button that looks up an account by email">Find</Trans>
              </Button>
            }
          />
          <LookupResult email={lookupEmail} />
        </Stack>
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
          <Select
            label={t({ message: 'Plan', comment: 'Label: the membership plan, like Adults or Junior' })}
            placeholder={t`Pick a plan`}
            data={planOptions}
            allowDeselect={false}
            withAsterisk
            {...form.getInputProps('planId')}
            onChange={pickPlan}
          />
          <NumberInput
            label={t`Price`}
            prefix="kr "
            thousandSeparator=" "
            allowDecimal={false}
            allowNegative={false}
            withAsterisk
            {...form.getInputProps('priceNok')}
          />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
          <DatePickerInput
            label={t`Start`}
            leftSection={<CalendarBlank />}
            valueFormatter={DAY_FORMATTER}
            withAsterisk
            {...form.getInputProps('startDate')}
          />
          <DatePickerInput
            label={t`End`}
            leftSection={<CalendarBlank />}
            valueFormatter={DAY_FORMATTER}
            minDate={startDate ?? undefined}
            withAsterisk
            {...form.getInputProps('endDate')}
          />
        </SimpleGrid>
        <Switch
          label={t({ message: 'Paid', comment: 'Switch: the membership is paid' })}
          {...form.getInputProps('paid', { type: 'checkbox' })}
        />
        {paid && <PaymentFields day={form.getInputProps('paidOn')} method={form.getInputProps('paymentMethod')} />}
        <Textarea
          label={t`Note`}
          description={note.length >= NOTE_COUNT_FROM ? `${note.length} / ${NOTE_MAX}` : undefined}
          autosize
          minRows={2}
          maxLength={NOTE_MAX}
          {...form.getInputProps('note')}
        />
        {error && (
          <Alert color="red" variant="light" icon={<Warning />}>
            {i18n._(membershipErrorMessage(error))}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onDone}>
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" leftSection={<FloppyDisk />} loading={saving || form.submitting}>
            {membership ? <Trans>Save</Trans> : <Trans>Add membership</Trans>}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

type Props = Omit<FormProps, 'onDone'> & { opened: boolean; onClose: () => void };

export const MembershipFormModal: FC<Props> = ({ opened, onClose, membership, ...rest }) => {
  const { t } = useLingui();
  const isMobile = useIsMobile();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={membership ? t`Edit membership` : t`Add membership`}
      size="lg"
      fullScreen={isMobile}
      centered
    >
      <MembershipFormBody
        key={membership?.id ?? rest.email ?? 'new'}
        membership={membership}
        onDone={onClose}
        {...rest}
      />
    </Modal>
  );
};
