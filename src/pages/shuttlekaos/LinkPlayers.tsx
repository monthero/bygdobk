import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Radio,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, type FC } from 'react';

import { useSessionUserId } from '~/components/auth/hooks';
import { LinkBreak, LinkSimple, ResponsiveModal } from '~/components/ui';
import { notifyDone } from '~/pages/board/format';
import { SessionStatus, type Player, type Session } from '~/shuttlekaos/model';
import { shuttleKaosErrorMessage, useLinkPlayer, type SessionView } from '~/shuttlekaos/queries';

import { PlayerAvatar } from './People';
import { useAccountLookup } from './useAccountLookup';

import classes from './LinkPlayers.module.css';
import pickerClasses from './PlayerPicker.module.css';

type FinderProps = {
  player: Player;
  exclude: ReadonlySet<string>;
  pending: boolean;
  onPick: (profileId: string) => void;
  onCancel: () => void;
};

const AccountFinder: FC<FinderProps> = ({ player, exclude, pending, onPick, onCancel }) => {
  const { t } = useLingui();
  const [text, setText] = useState(player.name);
  const { query, matches, searching, failed } = useAccountLookup(text, true, exclude);
  const nothing = query !== '' && !searching && !failed && matches.length === 0;
  return (
    <Stack gap="xs" className={classes.finder}>
      <TextInput
        size="md"
        aria-label={t`Search accounts`}
        placeholder={t`Search accounts`}
        value={text}
        autoComplete="off"
        data-autofocus
        rightSection={searching ? <Loader size="xs" /> : null}
        onChange={(e) => setText(e.currentTarget.value)}
      />
      {failed && (
        <Text size="sm" c="red">
          <Trans>Couldn't search accounts. Try again.</Trans>
        </Text>
      )}
      {nothing && (
        <Text size="sm" c="dimmed">
          <Trans>No account found. People only show up if they allow it in their account menu.</Trans>
        </Text>
      )}
      {matches.length > 0 && (
        <ul className={pickerClasses.list}>
          {matches.map((account) => (
            <li key={account.profileId}>
              <UnstyledButton className={classes.match} disabled={pending} onClick={() => onPick(account.profileId)}>
                <PlayerAvatar player={account} />
                <span className={pickerClasses.accountText}>
                  <span className={pickerClasses.accountName}>{account.name}</span>
                </span>
                <LinkSimple className={pickerClasses.accountIcon} aria-hidden />
              </UnstyledButton>
            </li>
          ))}
        </ul>
      )}
      <Group justify="flex-end">
        <Button variant="subtle" color="gray" onClick={onCancel}>
          <Trans>Cancel</Trans>
        </Button>
      </Group>
    </Stack>
  );
};

export const LinkPlayersModal: FC<{ view: SessionView; opened: boolean; onClose: () => void }> = ({
  view,
  opened,
  onClose,
}) => {
  const { t, i18n } = useLingui();
  const link = useLinkPlayer();
  const [picking, setPicking] = useState<string | null>(null);
  const { session, shareCode } = view;
  const linked = new Set(session.players.flatMap((p) => (p.profileId ? [p.profileId] : [])));
  const busyWith = link.isPending ? link.variables.playerId : null;

  const run = (player: Player, profileId: string | null) => {
    const name = player.name;
    link.mutate(
      { code: shareCode, playerId: player.id, profileId },
      {
        onSuccess: () => {
          setPicking(null);
          notifyDone(profileId ? t`${name} is linked.` : t`${name} is unlinked.`);
        },
      },
    );
  };

  const close = () => {
    setPicking(null);
    link.reset();
    onClose();
  };

  return (
    <ResponsiveModal opened={opened} onClose={close} title={<Trans>Link players</Trans>}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          <Trans>Link a name to a club account. The session then shows up in that person's history.</Trans>
        </Text>
        {link.error && (
          <Alert color="red" variant="light">
            {i18n._(shuttleKaosErrorMessage(link.error))}
          </Alert>
        )}
        <ul className={pickerClasses.list}>
          {session.players.map((player) => {
            const name = player.name;
            return (
              <li key={player.id} className={classes.row}>
                <div className={classes.player}>
                  <PlayerAvatar player={player} />
                  <span className={pickerClasses.name}>{name}</span>
                  {player.profileId ? (
                    <>
                      <Badge variant="light" color="blue" size="sm" leftSection={<LinkSimple />}>
                        <Trans comment="Badge on a player that is linked to a club account">Account</Trans>
                      </Badge>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size={44}
                        radius="xl"
                        aria-label={t`Unlink ${name}`}
                        loading={busyWith === player.id}
                        disabled={link.isPending}
                        onClick={() => run(player, null)}
                      >
                        <LinkBreak />
                      </ActionIcon>
                    </>
                  ) : (
                    picking !== player.id && (
                      <Button
                        variant="light"
                        size="compact-md"
                        h={36}
                        leftSection={<LinkSimple />}
                        disabled={link.isPending}
                        onClick={() => {
                          link.reset();
                          setPicking(player.id);
                        }}
                      >
                        <Trans comment="Button: link this player name to a club account">Link</Trans>
                      </Button>
                    )
                  )}
                </div>
                {picking === player.id && (
                  <AccountFinder
                    player={player}
                    exclude={linked}
                    pending={link.isPending}
                    onPick={(profileId) => run(player, profileId)}
                    onCancel={() => setPicking(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </Stack>
    </ResponsiveModal>
  );
};

export const ClaimNotice: FC<{ view: SessionView; session: Session }> = ({ view, session }) => {
  const { t, i18n } = useLingui();
  const userId = useSessionUserId();
  const [opened, controls] = useDisclosure(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const link = useLinkPlayer();
  const nameOnly = session.players.filter((p) => p.profileId === null);

  const canClaim =
    Boolean(userId) &&
    !view.isOwner &&
    view.myPlayerId === null &&
    session.status === SessionStatus.enum.finished &&
    nameOnly.length > 0;
  if (!canClaim) return null;

  const close = () => {
    setChosen(null);
    link.reset();
    controls.close();
  };

  const claim = () => {
    if (!chosen || !userId) return;
    link.mutate(
      { code: view.shareCode, playerId: chosen, profileId: userId },
      {
        onSuccess: () => {
          close();
          notifyDone(t`Linked. The session is in your history now.`);
        },
      },
    );
  };

  return (
    <>
      <Paper withBorder radius="lg" p="md" className={classes.notice}>
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon variant="light" color="brand" radius="xl" size={40}>
            <LinkSimple />
          </ThemeIcon>
          <Stack gap="xs">
            <Text fw={700}>
              <Trans>Did you play?</Trans>
            </Text>
            <Text size="sm" c="dimmed">
              <Trans>Link your account to your name, and the result shows up in your history.</Trans>
            </Text>
            <Group>
              <Button size="sm" leftSection={<LinkSimple />} onClick={controls.open}>
                <Trans>This is me</Trans>
              </Button>
            </Group>
          </Stack>
        </Group>
      </Paper>

      <ResponsiveModal opened={opened} onClose={close} title={<Trans>Which one is you?</Trans>}>
        <Stack gap="md">
          <Radio.Group aria-label={t`Which one is you?`} value={chosen} onChange={setChosen}>
            <Stack gap="xs">
              {nameOnly.map((player) => (
                <Radio.Card key={player.id} value={player.id} radius="md" p="sm" className={classes.choice}>
                  <Group wrap="nowrap" gap="sm" justify="space-between">
                    <Group wrap="nowrap" gap="sm" miw={0}>
                      <PlayerAvatar player={player} />
                      <Text fw={600} truncate="end">
                        {player.name}
                      </Text>
                    </Group>
                    <Radio.Indicator color="brand" />
                  </Group>
                </Radio.Card>
              ))}
            </Stack>
          </Radio.Group>
          {link.error && (
            <Alert color="red" variant="light">
              {i18n._(shuttleKaosErrorMessage(link.error))}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              <Trans>Cancel</Trans>
            </Button>
            <Button leftSection={<LinkSimple />} disabled={!chosen} loading={link.isPending} onClick={claim}>
              <Trans>Link my account</Trans>
            </Button>
          </Group>
        </Stack>
      </ResponsiveModal>
    </>
  );
};
