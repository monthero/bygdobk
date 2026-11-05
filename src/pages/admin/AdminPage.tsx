import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  EmptyState,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useMemo, useState, type FC } from 'react';
import { z } from 'zod';

import { RoleGate, useUser } from '~/components/auth';
import { NoticeAlert } from '~/components/layout';
import { PageIntro } from '~/components/styles';
import { AddClosureModal, ClosureList } from '~/components/training';
import { ArrowCounterClockwise, Check, LockSimple, Plus, SignIn, Warning } from '~/components/ui';
import type { Translate } from '~/i18n/current';
import { Role, useAuth } from '~/stores/auth';
import { NOTICE_MAX_LENGTH, NoticeTone, useContent, useHasContentEdits } from '~/stores/content';
import { useUi } from '~/stores/ui';
import { toTrainingClosure } from '~/utils/training';

const TONE_LABELS: Record<NoticeTone, MessageDescriptor> = {
  [NoticeTone.enum.info]: msg({ message: 'Info', comment: 'Tone of the site notice' }),
  [NoticeTone.enum.warning]: msg({ message: 'Warning', comment: 'Tone of the site notice' }),
};

const noticeSchema = (t: Translate) =>
  z
    .object({ visible: z.boolean(), tone: NoticeTone, text: z.string().max(NOTICE_MAX_LENGTH) })
    .refine((v) => !v.visible || v.text.trim().length > 0, {
      path: ['text'],
      message: t(msg`Write the notice text, or hide the notice`),
    });

const NO_ADDED_BREAKS = <Trans>No breaks added yet.</Trans>;

const AdminOnly: FC = () => {
  const { t } = useLingui();
  const loggedIn = useUser() !== null;
  const openLogin = useUi((s) => s.openLogin);

  return (
    <EmptyState
      variant="light"
      icon={<LockSimple />}
      title={t`Admins only`}
      description={
        loggedIn
          ? t`You are logged in as a member. Log in as admin to edit the site content.`
          : t`Log in as admin to edit the site content.`
      }
    >
      <EmptyState.Actions>
        <Button leftSection={<SignIn />} onClick={openLogin}>
          <Trans>Log in as admin</Trans>
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
};

const EditModeCard: FC = () => {
  const { t } = useLingui();
  const editMode = useAuth((s) => s.editMode);
  const setEditMode = useAuth((s) => s.setEditMode);

  return (
    <Paper withBorder radius="lg" p="lg">
      <Switch
        size="md"
        label={t`Edit mode`}
        description={t`Show edit buttons on the pages, for example to add breaks on the Training page.`}
        checked={editMode}
        onChange={(e) => setEditMode(e.currentTarget.checked)}
      />
    </Paper>
  );
};

const NoticeEditor: FC = () => {
  const { t } = useLingui();
  const notice = useContent((s) => s.notice);
  const setNotice = useContent((s) => s.setNotice);

  const schema = useMemo(() => noticeSchema(t), [t]);

  const form = useForm({
    mode: 'controlled',
    initialValues: notice,
    validate: schemaResolver(schema, { sync: true }),
  });

  const save = form.onSubmit((values) => {
    const next = { ...values, text: values.text.trim() };
    setNotice(next);
    form.setInitialValues(next);
    form.setValues(next);
    form.resetDirty(next);
  });

  const dirty = form.isDirty();
  const { visible, text } = form.values;
  const length = text.length;
  const toneOptions = useMemo(() => NoticeTone.options.map((value) => ({ value, label: t(TONE_LABELS[value]) })), [t]);

  return (
    <Paper withBorder radius="lg" p="lg">
      <form onSubmit={save} noValidate>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={2}>
              <Trans>Site notice</Trans>
            </Title>
            {dirty ? (
              <Badge color="yellow" variant="light">
                <Trans>Unsaved changes</Trans>
              </Badge>
            ) : (
              <Badge color="teal" variant="light" leftSection={<Check />}>
                <Trans>Saved</Trans>
              </Badge>
            )}
          </Group>
          <Text c="dimmed">
            <Trans>A short message at the top of every page, for example about a canceled training.</Trans>
          </Text>
          <Switch label={t`Show the notice`} {...form.getInputProps('visible', { type: 'checkbox' })} />
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              <Trans>Tone</Trans>
            </Text>
            <SegmentedControl
              data={toneOptions}
              value={form.values.tone}
              onChange={(value) => form.setFieldValue('tone', NoticeTone.parse(value))}
              w="fit-content"
            />
          </Stack>
          <Textarea
            label={t`Text`}
            description={t`${length} of ${NOTICE_MAX_LENGTH} characters`}
            autosize
            minRows={2}
            maxLength={NOTICE_MAX_LENGTH}
            {...form.getInputProps('text')}
          />
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              <Trans>Preview</Trans>
            </Text>
            <Box opacity={visible ? 1 : 0.5}>
              <NoticeAlert notice={{ ...form.values, text: text.trim() || t`Your notice text shows here.` }} />
            </Box>
            {!visible && (
              <Text size="sm" c="dimmed">
                <Trans>Hidden. Visitors do not see the notice.</Trans>
              </Text>
            )}
          </Stack>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" disabled={!dirty} onClick={() => form.reset()}>
              <Trans>Discard changes</Trans>
            </Button>
            <Button type="submit" disabled={!dirty}>
              <Trans>Save notice</Trans>
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};

const ClosuresCard: FC = () => {
  const edited = useContent((s) => s.closures);
  const closures = useMemo(() => edited.map(toTrainingClosure).sort((a, b) => a.from.localeCompare(b.from)), [edited]);
  const [adding, { open, close }] = useDisclosure(false);

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>
            <Trans>Training breaks</Trans>
          </Title>
          <Button variant="light" leftSection={<Plus />} onClick={open}>
            <Trans>Add break</Trans>
          </Button>
        </Group>
        <Text c="dimmed">
          <Trans>
            Breaks you add show on the Training page, in the schedule and in “Next training”. Breaks from the site data
            are not listed here and cannot be removed.
          </Trans>
        </Text>
        <ClosureList closures={closures} editable empty={NO_ADDED_BREAKS} />
      </Stack>
      <AddClosureModal opened={adding} onClose={close} />
    </Paper>
  );
};

const ResetCard: FC<{ onReset: () => void }> = ({ onReset }) => {
  const hasEdits = useHasContentEdits();
  const resetContent = useContent((s) => s.resetContent);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    resetContent();
    setConfirming(false);
    setDone(true);
    onReset();
  };

  const ask = () => {
    setDone(false);
    setConfirming(true);
  };

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Title order={2}>
          <Trans>Reset all edits</Trans>
        </Title>
        <Text c="dimmed">
          <Trans>Removes the site notice and every break you added, and brings back the original content.</Trans>
        </Text>
        {confirming ? (
          <Alert color="red" variant="light" icon={<Warning />} title={<Trans>Reset all edits?</Trans>}>
            <Stack gap="sm">
              <Text size="sm">
                <Trans>This cannot be undone.</Trans>
              </Text>
              <Group gap="sm">
                <Button color="red" onClick={reset}>
                  <Trans>Yes, reset everything</Trans>
                </Button>
                <Button variant="default" onClick={() => setConfirming(false)}>
                  <Trans>Cancel</Trans>
                </Button>
              </Group>
            </Stack>
          </Alert>
        ) : (
          <Group gap="sm">
            <Button
              color="red"
              variant="light"
              leftSection={<ArrowCounterClockwise />}
              disabled={!hasEdits}
              onClick={ask}
            >
              <Trans>Reset all edits</Trans>
            </Button>
            {!hasEdits && (
              <Text size="sm" c={done ? 'teal' : 'dimmed'}>
                {done ? <Trans>All edits are reset.</Trans> : <Trans>Nothing to reset.</Trans>}
              </Text>
            )}
          </Group>
        )}
      </Stack>
    </Paper>
  );
};

const AdminContent: FC = () => {
  const [resets, setResets] = useState(0);

  return (
    <Stack gap="lg">
      <EditModeCard />
      <NoticeEditor key={resets} />
      <ClosuresCard />
      <ResetCard onReset={() => setResets((n) => n + 1)} />
    </Stack>
  );
};

export const AdminPage: FC = () => (
  <>
    <PageIntro
      title={<Trans>Admin panel</Trans>}
      lede={<Trans>Edit the site content. In this demo, changes are saved in this browser only.</Trans>}
    />
    <Container size="md" py={40}>
      <RoleGate role={Role.enum.admin} fallback={<AdminOnly />}>
        <AdminContent />
      </RoleGate>
    </Container>
  </>
);
