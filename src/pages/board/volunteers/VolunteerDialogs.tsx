import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Group, Modal, SegmentedControl, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { useMemo, useState, type FC } from 'react';
import { z } from 'zod';

import type { Shift } from '~/cms/calendar';
import { shiftTime, TeamBadge } from '~/components/events';
import { FloppyDisk, Trash, UserPlus, Warning } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { Translate } from '~/i18n/current';
import { findProfileByEmail } from '~/memberships/queries';
import { notifyDone } from '~/pages/board/format';
import { NAME_MAX, NOTE_MAX, volunteerName, type AdminShiftVolunteer } from '~/volunteers/model';
import {
  useAddVolunteer,
  useRemoveVolunteer,
  useUpdateVolunteerNote,
  volunteerErrorMessage,
} from '~/volunteers/queries';

import { DialogKind, type Dialog } from './dialog';

const Who = z.enum(['name', 'account']);
type Who = z.infer<typeof Who>;

type AddValues = { who: Who; name: string; email: string; note: string };

const INITIAL_ADD: AddValues = { who: Who.enum.name, name: '', email: '', note: '' };
const IS_EMAIL = z.email();
const NO_ACCOUNT = msg`No account with that email`;
const LOOKUP_FAILED = msg`Couldn't look up that email. Try again.`;

const addSchema = (t: Translate) =>
  z.object({ who: Who, name: z.string(), email: z.string(), note: z.string().max(NOTE_MAX) }).superRefine((v, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (v.who === Who.enum.name && !v.name.trim()) issue('name', t(msg`Enter a name`));
    if (v.who === Who.enum.account && !IS_EMAIL.safeParse(v.email.trim()).success) {
      issue('email', t(msg`Enter a valid email address`));
    }
  });

const blankToNull = (value: string) => value.trim() || null;

const ShiftLine: FC<{ shift: Shift }> = ({ shift }) => (
  <Group gap="sm">
    <TeamBadge team={shift.team} />
    <Text fw={600} className="tabular">
      {shiftTime(shift)}
    </Text>
  </Group>
);

const ErrorAlert: FC<{ message: string }> = ({ message }) => (
  <Alert color="red" variant="light" icon={<Warning />}>
    {message}
  </Alert>
);

type AddProps = { eventId: string; shift: Shift; taken: number; onDone: () => void };

const AddForm: FC<AddProps> = ({ eventId, shift, taken, onDone }) => {
  const { i18n, t } = useLingui();
  const schema = useMemo(() => addSchema(t), [t]);
  const form = useForm<AddValues>({ initialValues: INITIAL_ADD, validate: schemaResolver(schema, { sync: true }) });
  const add = useAddVolunteer();
  const [looking, setLooking] = useState(false);
  const full = taken >= shift.spots;
  const { who } = form.getValues();

  const submit = form.onSubmit(async (values) => {
    let profileId: string | null = null;
    let shown = values.name.trim();
    if (values.who === Who.enum.account) {
      setLooking(true);
      try {
        const profile = await findProfileByEmail(values.email);
        if (!profile) {
          form.setFieldError('email', t(NO_ACCOUNT));
          return;
        }
        profileId = profile.id;
        shown = profile.name;
      } catch {
        form.setFieldError('email', t(LOOKUP_FAILED));
        return;
      } finally {
        setLooking(false);
      }
    }
    add.mutate(
      {
        eventId,
        shiftKey: shift._key,
        profileId,
        volunteerName: values.who === Who.enum.name ? shown : null,
        note: blankToNull(values.note),
      },
      {
        onSuccess: () => {
          notifyDone(t`${shown} is on the shift`);
          onDone();
        },
      },
    );
  });

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        <ShiftLine shift={shift} />
        <SegmentedControl
          fullWidth
          data={[
            { value: Who.enum.name, label: t`Just a name` },
            { value: Who.enum.account, label: t`Link an account` },
          ]}
          {...form.getInputProps('who')}
        />
        {who === Who.enum.name ? (
          <TextInput label={t`Name`} maxLength={NAME_MAX} data-autofocus {...form.getInputProps('name')} />
        ) : (
          <TextInput label={t`Account email`} type="email" data-autofocus {...form.getInputProps('email')} />
        )}
        <Textarea
          label={t`Note`}
          description={t`Only the board sees this.`}
          autosize
          minRows={2}
          maxLength={NOTE_MAX}
          {...form.getInputProps('note')}
        />
        {full && (
          <Alert color="yellow" variant="light" icon={<Warning />}>
            <Trans>This shift is full. Adding one more overbooks it.</Trans>
          </Alert>
        )}
        {add.isError && <ErrorAlert message={i18n._(volunteerErrorMessage(add.error))} />}
        <Group justify="flex-end">
          <Button variant="default" onClick={onDone}>
            <Trans>Cancel</Trans>
          </Button>
          <Button
            type="submit"
            color={full ? 'yellow' : undefined}
            leftSection={<UserPlus />}
            loading={looking || add.isPending}
          >
            {full ? <Trans>Add anyway</Trans> : <Trans>Add</Trans>}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

type NoteProps = { volunteer: AdminShiftVolunteer; onDone: () => void };

const NoteForm: FC<NoteProps> = ({ volunteer, onDone }) => {
  const { i18n, t } = useLingui();
  const [note, setNote] = useState(volunteer.note ?? '');
  const update = useUpdateVolunteerNote();
  const name = volunteerName(volunteer);

  const save = () =>
    update.mutate(
      { id: volunteer.id, note: blankToNull(note) },
      {
        onSuccess: () => {
          notifyDone(t`Note for ${name} saved`);
          onDone();
        },
      },
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Stack gap="md">
        <Textarea
          label={t`Note for ${name}`}
          description={t`Only the board sees this.`}
          autosize
          minRows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          data-autofocus
        />
        {update.isError && <ErrorAlert message={i18n._(volunteerErrorMessage(update.error))} />}
        <Group justify="flex-end">
          <Button variant="default" onClick={onDone}>
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" leftSection={<FloppyDisk />} loading={update.isPending}>
            <Trans>Save</Trans>
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

type RemoveProps = { volunteer: AdminShiftVolunteer; onDone: () => void };

const RemoveConfirm: FC<RemoveProps> = ({ volunteer, onDone }) => {
  const { i18n, t } = useLingui();
  const remove = useRemoveVolunteer();
  const name = volunteerName(volunteer);

  const confirm = () =>
    remove.mutate(volunteer.id, {
      onSuccess: () => {
        notifyDone(t`${name} is off the shift`);
        onDone();
      },
    });

  return (
    <Stack gap="md">
      <Text>
        <Trans>
          Take <strong>{name}</strong> off this shift?
        </Trans>
      </Text>
      {remove.isError && <ErrorAlert message={i18n._(volunteerErrorMessage(remove.error))} />}
      <Group justify="flex-end">
        <Button variant="default" onClick={onDone} data-autofocus>
          <Trans>Cancel</Trans>
        </Button>
        <Button color="red" leftSection={<Trash />} loading={remove.isPending} onClick={confirm}>
          <Trans>Remove</Trans>
        </Button>
      </Group>
    </Stack>
  );
};

const TITLES: Record<DialogKind, MessageDescriptor> = {
  [DialogKind.enum.add]: msg`Add a volunteer`,
  [DialogKind.enum.note]: msg`Edit note`,
  [DialogKind.enum.remove]: msg`Remove volunteer?`,
};

type Props = { eventId: string; dialog: Dialog | undefined; opened: boolean; onClose: () => void };

export const VolunteerDialog: FC<Props> = ({ eventId, dialog, opened, onClose }) => {
  const { i18n } = useLingui();
  const isMobile = useIsMobile();
  let body = null;
  if (dialog?.kind === DialogKind.enum.add) {
    body = (
      <AddForm key={dialog.shift._key} eventId={eventId} shift={dialog.shift} taken={dialog.taken} onDone={onClose} />
    );
  } else if (dialog?.kind === DialogKind.enum.note) {
    body = <NoteForm key={dialog.volunteer.id} volunteer={dialog.volunteer} onDone={onClose} />;
  } else if (dialog?.kind === DialogKind.enum.remove) {
    body = <RemoveConfirm key={dialog.volunteer.id} volunteer={dialog.volunteer} onDone={onClose} />;
  }
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={dialog && i18n._(TITLES[dialog.kind])}
      centered
      fullScreen={isMobile && dialog?.kind !== DialogKind.enum.remove}
    >
      {body}
    </Modal>
  );
};
