import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Drawer, Indicator, Loader, Text, Textarea, Tooltip, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { memo, useCallback, useEffect, useRef, useState, type FC, type KeyboardEvent } from 'react';

import { BottomSheet, ChatCircle, PaperPlaneTilt, Trash } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { notifyFailed } from '~/pages/board/format';
import {
  shuttleKaosErrorMessage,
  ShuttleKaosError,
  useDeleteMessage,
  useSendMessage,
  useSessionChat,
  type ChatMessage,
  type SessionView,
} from '~/shuttlekaos/queries';
import { ShuttleKaosProblem } from '~/shuttlekaos/store';
import { safeLocalStorage } from '~/stores/persistence';

import { formatStart } from './labels';
import { PlayerAvatar } from './People';

import classes from './SessionChat.module.css';

const MAX_LENGTH = 500;
const COUNTER_FROM = 400;
const SEEN_KEY = 'shuttlekaos-chat-seen:';
const EMPTY_MESSAGES: ChatMessage[] = [];

const CHAT_PROBLEMS: Partial<Record<ShuttleKaosProblem, MessageDescriptor>> = {
  [ShuttleKaosProblem.enum.tooMany]: msg`Wait a few seconds and try again.`,
  [ShuttleKaosProblem.enum.notAllowed]: msg`Only players and the organizer can chat here.`,
};

const chatErrorMessage = (error: unknown) =>
  (error instanceof ShuttleKaosError && CHAT_PROBLEMS[error.problem]) || shuttleKaosErrorMessage(error);

const seenAt = (code: string) => safeLocalStorage.getItem(SEEN_KEY + code) ?? '';

const hasUnread = (messages: ChatMessage[], seen: string) =>
  messages.some((message) => !message.mine && message.createdAt > seen);

type MessageProps = {
  message: ChatMessage;
  first: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

const Message = memo<MessageProps>(({ message, first, selected, onSelect, onDelete }) => {
  const { t } = useLingui();
  return (
    <li
      className={classes.message}
      data-mine={message.mine || undefined}
      data-first={first || undefined}
      data-selected={selected || undefined}
    >
      <span className={classes.avatar}>{first && !message.mine && <PlayerAvatar player={message} size={30} />}</span>
      <div className={classes.content}>
        {first && (
          <Text size="xs" c="dimmed" className={classes.meta}>
            {!message.mine && <span className={classes.name}>{message.name}</span>}
            {formatStart(message.createdAt)}
          </Text>
        )}
        <div className={classes.bubbleRow}>
          {message.canDelete ? (
            <UnstyledButton className={classes.bubble} aria-pressed={selected} onClick={() => onSelect(message.id)}>
              {message.body}
            </UnstyledButton>
          ) : (
            <p className={classes.bubble}>{message.body}</p>
          )}
          {message.canDelete && (
            <Tooltip label={t`Delete message`} withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                radius="xl"
                className={classes.delete}
                aria-label={t`Delete message`}
                onClick={() => onDelete(message.id)}
              >
                <Trash />
              </ActionIcon>
            </Tooltip>
          )}
        </div>
      </div>
    </li>
  );
});

const Composer: FC<{ code: string }> = ({ code }) => {
  const { t, i18n } = useLingui();
  const [body, setBody] = useState('');
  const send = useSendMessage();
  const text = body.trim();

  const submit = () => {
    if (!text || send.isPending) return;
    send.mutate(
      { code, body: text },
      {
        onSuccess: () => setBody(''),
        onError: (error) => notifyFailed(i18n._(chatErrorMessage(error))),
      },
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  return (
    <div className={classes.composer}>
      <Textarea
        className={classes.input}
        autosize
        minRows={1}
        maxRows={4}
        maxLength={MAX_LENGTH}
        radius="xl"
        size="md"
        placeholder={t`Write a message`}
        aria-label={t`Message`}
        value={body}
        onChange={(event) => setBody(event.currentTarget.value)}
        onKeyDown={onKeyDown}
      />
      <ActionIcon size={44} radius="xl" aria-label={t`Send`} disabled={!text} loading={send.isPending} onClick={submit}>
        <PaperPlaneTilt />
      </ActionIcon>
      {body.length >= COUNTER_FROM && (
        <Text size="xs" c="dimmed" className={classes.counter}>
          {body.length}/{MAX_LENGTH}
        </Text>
      )}
    </div>
  );
};

const ChatBody: FC<{ code: string; messages: ChatMessage[]; loading: boolean }> = ({ code, messages, loading }) => {
  const { i18n } = useLingui();
  const list = useRef<HTMLDivElement>(null);
  const remove = useDeleteMessage();
  const [selected, setSelected] = useState<string | null>(null);
  const select = useCallback((id: string) => setSelected((current) => (current === id ? null : id)), []);
  const newest = messages.at(-1)?.id;

  useEffect(() => {
    if (newest) list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [newest]);

  const onDelete = useCallback(
    (id: string) => remove.mutate({ code, id }, { onError: (error) => notifyFailed(i18n._(chatErrorMessage(error))) }),
    [remove, code, i18n],
  );

  let content = (
    <ol className={classes.messages}>
      {messages.map((message, index) => (
        <Message
          key={message.id}
          message={message}
          first={messages.at(index - 1)?.profileId !== message.profileId || index === 0}
          selected={selected === message.id}
          onSelect={select}
          onDelete={onDelete}
        />
      ))}
    </ol>
  );
  if (loading) content = <Loader size="sm" className={classes.loader} />;
  else if (messages.length === 0) {
    content = (
      <div className={classes.empty}>
        <ChatCircle aria-hidden className={classes.emptyIcon} />
        <Text fw={700}>
          <Trans>No messages yet</Trans>
        </Text>
        <Text size="sm" c="dimmed">
          <Trans>Say hi to the group.</Trans>
        </Text>
      </div>
    );
  }

  return (
    <div className={classes.chat}>
      <div ref={list} className={classes.scroll}>
        {content}
      </div>
      <Text size="xs" c="dimmed" ta="center" className={classes.note}>
        <Trans>Only players and the organizer see this. Messages are deleted 7 days after the session.</Trans>
      </Text>
      <Composer code={code} />
    </div>
  );
};

export const SessionChat: FC<{ view: SessionView }> = ({ view }) => {
  const { t } = useLingui();
  const mobile = useIsMobile();
  const [opened, { open, close }] = useDisclosure(false);
  const code = view.shareCode;
  const member = view.isOwner || view.myPlayerId !== null;
  const chat = useSessionChat(code, { enabled: member });
  const messages = chat.data ?? EMPTY_MESSAGES;
  const [seen, setSeen] = useState(() => seenAt(code));
  const newestAt = messages.at(-1)?.createdAt ?? '';

  if (opened && newestAt > seen) setSeen(newestAt);

  useEffect(() => {
    if (seen) safeLocalStorage.setItem(SEEN_KEY + code, seen);
  }, [code, seen]);

  if (!member) return null;

  const title = t`Session chat`;
  const body = <ChatBody code={code} messages={messages} loading={chat.isPending} />;

  return (
    <>
      <Indicator disabled={!hasUnread(messages, seen)} color="red" size={10} offset={6} withBorder>
        <ActionIcon variant="default" radius="xl" size={44} aria-label={title} onClick={open}>
          <ChatCircle />
        </ActionIcon>
      </Indicator>
      {mobile ? (
        <BottomSheet opened={opened} onClose={close} handle maxHeight="85dvh" bodyClassName={classes.sheetBody}>
          <Drawer.Title className={classes.title}>{title}</Drawer.Title>
          {body}
        </BottomSheet>
      ) : (
        <Drawer
          opened={opened}
          onClose={close}
          position="right"
          size={420}
          title={title}
          classNames={{ body: classes.drawerBody, content: classes.drawerContent }}
          closeButtonProps={{ 'aria-label': t`Close` }}
        >
          {body}
        </Drawer>
      )}
    </>
  );
};
