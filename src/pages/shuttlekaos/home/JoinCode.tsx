import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Paper, Text, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useId, useState, type FC, type FormEvent } from 'react';

import { ArrowRight, Check, Hash, QrCode } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';

import classes from './JoinCode.module.css';

const CODE_LENGTH = 10;
const GROUP = 5;
const SLOT = '•';
const LINK_CODE = /\/([a-z0-9]{10})(?:[/?#].*)?$/i;
const NOT_CODE = /[^a-z0-9]/g;

const grouped = (code: string) => (code.length > GROUP ? `${code.slice(0, GROUP)} ${code.slice(GROUP)}` : code);

const toCode = (text: string) => {
  const fromLink = LINK_CODE.exec(text.trim())?.at(1);
  return (fromLink ?? text).toLowerCase().replace(NOT_CODE, '').slice(0, CODE_LENGTH);
};

const slotsAfter = (code: string) => grouped(code.padEnd(CODE_LENGTH, SLOT)).slice(grouped(code).length);

export const JoinCode: FC = () => {
  const { t } = useLingui();
  const id = useId();
  const mobile = useIsMobile();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const ready = code.length === CODE_LENGTH;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) void navigate({ to: '/shuttlekaos/$code', params: { code } });
  };

  return (
    <Paper component="section" withBorder radius="lg" className={classes.card}>
      <div className={classes.head}>
        <span className={classes.icon} aria-hidden>
          <Hash />
        </span>
        <div>
          <Title order={2} className={classes.title}>
            <Trans>Join with code</Trans>
          </Title>
          <Text size="sm" c="dimmed">
            <Trans>Got a code from the organizer? Pop it in.</Trans>
          </Text>
        </div>
      </div>
      <form className={classes.form} onSubmit={submit}>
        <label htmlFor={id} className={classes.label}>
          <Trans>Session code</Trans>
        </label>
        <div className={classes.row}>
          <div className={classes.box} data-ready={ready || undefined}>
            <span className={classes.slots} aria-hidden>
              <span className={classes.typed}>{grouped(code)}</span>
              {slotsAfter(code)}
            </span>
            <input
              id={id}
              className={classes.input}
              value={grouped(code)}
              onChange={(event) => setCode(toCode(event.target.value))}
              aria-describedby={`${id}-hint`}
              inputMode="text"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
            />
            {ready && <Check className={classes.ok} aria-label={t`Code looks right`} />}
          </div>
          <Button type="submit" size="lg" disabled={!ready} rightSection={<ArrowRight />} className={classes.join}>
            <Trans context="ShuttleKaos: join a session" comment="Button that opens the session for the typed code">
              Join
            </Trans>
          </Button>
        </div>
        <p id={`${id}-hint`} className={classes.hint}>
          <QrCode aria-hidden />
          <span>
            {mobile ? (
              <Trans>Or point your camera at the organizer's QR code.</Trans>
            ) : (
              <Trans>On your phone? Scan the QR code on the organizer's screen.</Trans>
            )}{' '}
            <Trans>Pasting the link works too.</Trans>
          </span>
        </p>
      </form>
    </Paper>
  );
};
