import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Badge, Button, Combobox, Loader, Stack, Text, TextInput, useCombobox } from '@mantine/core';
import { useRef, useState, type FC, type KeyboardEvent } from 'react';

import { LinkSimple, Plus, X } from '~/components/ui';
import { shortName } from '~/shuttlekaos/engine';
import { MAX_NAME, MAX_PLAYERS, type AccountMatch, type Player } from '~/shuttlekaos/model';

import { asMe, sameName, YOU } from './labels';
import { PlayerAvatar } from './People';
import { useAccountLookup } from './useAccountLookup';

import classes from './PlayerPicker.module.css';

const newPlayer = (name: string, account?: AccountMatch): Player => ({
  id: crypto.randomUUID(),
  name: name.trim().slice(0, MAX_NAME),
  profileId: account?.profileId ?? null,
  avatarUrl: account?.avatarUrl ?? null,
});

const PlayerRow: FC<{ player: Player; me?: boolean; onRemove?: (id: string) => void }> = ({ player, me, onRemove }) => {
  const { t, i18n } = useLingui();
  const playerName = player.name;
  return (
    <li className={classes.player} data-me={me || undefined}>
      <PlayerAvatar player={me ? asMe(player, i18n._(YOU)) : player} />
      <span className={classes.name}>{me ? i18n._(YOU) : playerName}</span>
      {player.profileId && (
        <Badge variant="light" color="blue" size="sm" leftSection={<LinkSimple />} className={classes.linked}>
          <Trans comment="Badge on a player that is linked to a club account">Account</Trans>
        </Badge>
      )}
      {onRemove && (
        <ActionIcon
          variant="subtle"
          color="gray"
          size={44}
          radius="xl"
          aria-label={t`Remove ${playerName}`}
          onClick={() => onRemove(player.id)}
        >
          <X />
        </ActionIcon>
      )}
    </li>
  );
};

export const PlayerList: FC<{ players: Player[]; highlight?: string | null; onRemove?: (id: string) => void }> = ({
  players,
  highlight,
  onRemove,
}) =>
  players.length > 0 ? (
    <ul className={classes.list}>
      {players.map((p) => (
        <PlayerRow key={p.id} player={p} me={p.id === highlight} onRemove={onRemove} />
      ))}
    </ul>
  ) : (
    <Text c="dimmed" className={classes.empty}>
      <Trans>No players yet.</Trans>
    </Text>
  );

type Props = { players: Player[]; signedIn: boolean; onChange: (players: Player[]) => void };

export const PlayerPicker: FC<Props> = ({ players, signedIn, onChange }) => {
  const { t } = useLingui();
  const input = useRef<HTMLInputElement>(null);
  const combobox = useCombobox();
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const taken = trimmed !== '' && players.some((p) => sameName(p.name, trimmed));
  const full = players.length >= MAX_PLAYERS;

  const linked = new Set(players.flatMap((p) => (p.profileId ? [p.profileId] : [])));
  const { query, matches, searching, failed } = useAccountLookup(name, signedIn, linked);
  const showDropdown = query !== '' && (matches.length > 0 || failed);

  const done = () => {
    setName('');
    combobox.closeDropdown();
    input.current?.focus();
  };

  const addName = () => {
    if (!trimmed || taken || full) return;
    onChange([...players, newPlayer(trimmed)]);
    done();
  };

  const link = (profileId: string) => {
    const account = matches.find((a) => a.profileId === profileId);
    if (!account || account.busy) return;
    const first = shortName(account.name, []);
    const plain = players.find((p) => !p.profileId && (sameName(p.name, account.name) || sameName(p.name, first)));
    const playerName = shortName(
      account.name,
      players.filter((p) => p !== plain),
    );
    if (plain) {
      onChange(players.map((p) => (p === plain ? { ...newPlayer(playerName, account), id: p.id } : p)));
    } else if (!full) {
      onChange([...players, newPlayer(playerName, account)]);
    }
    done();
  };

  const remove = (id: string) => onChange(players.filter((p) => p.id !== id));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (combobox.dropdownOpened && combobox.getSelectedOptionIndex() !== -1) return;
    event.preventDefault();
    addName();
  };

  let error: string | undefined;
  if (taken) error = t`${trimmed} is already playing.`;
  else if (full) error = t`That's the max: ${MAX_PLAYERS} players.`;

  return (
    <Stack gap="md">
      <Combobox store={combobox} onOptionSubmit={link}>
        <div className={classes.add}>
          <Combobox.Target>
            <TextInput
              ref={input}
              size="lg"
              className={classes.input}
              aria-label={t`Player name`}
              placeholder={t`Add a name`}
              value={name}
              maxLength={MAX_NAME}
              enterKeyHint="done"
              autoComplete="off"
              error={error}
              disabled={full}
              rightSection={searching ? <Loader size="xs" /> : null}
              onChange={(e) => {
                setName(e.currentTarget.value);
                combobox.openDropdown();
              }}
              onFocus={() => combobox.openDropdown()}
              onBlur={() => combobox.closeDropdown()}
              onKeyDown={onKeyDown}
            />
          </Combobox.Target>
          <Button size="lg" leftSection={<Plus />} disabled={!trimmed || taken || full} onClick={addName}>
            <Trans>Add</Trans>
          </Button>
        </div>
        <Combobox.Dropdown hidden={!showDropdown}>
          <Combobox.Header>
            <Text size="sm" c="dimmed">
              <Trans>Club accounts. Pick one to link it.</Trans>
            </Text>
          </Combobox.Header>
          <Combobox.Options>
            {failed && (
              <Combobox.Empty>
                <Trans>Couldn't search accounts. You can still add the name.</Trans>
              </Combobox.Empty>
            )}
            {matches.map((account) => (
              <Combobox.Option
                key={account.profileId}
                value={account.profileId}
                disabled={account.busy}
                className={classes.account}
              >
                <PlayerAvatar player={account} />
                <span className={classes.accountText}>
                  <span className={classes.accountName}>{account.name}</span>
                  {account.busy && (
                    <Text span size="xs" c="dimmed">
                      <Trans>Playing in another session. Add the name instead.</Trans>
                    </Text>
                  )}
                </span>
                {!account.busy && <LinkSimple className={classes.accountIcon} aria-hidden />}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>

      {signedIn && (
        <Text size="xs" c="dimmed" mt={-8}>
          <Trans>Club members show up as you type. Pick one to link their account.</Trans>
        </Text>
      )}
      <PlayerList players={players} onRemove={remove} />
    </Stack>
  );
};
