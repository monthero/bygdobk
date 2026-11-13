import { Trans } from '@lingui/react/macro';
import { Paper, Text, Title } from '@mantine/core';
import type { FC } from 'react';
import TrendUp from '~icons/ph/trend-up-bold';

import { Plus, QrCode } from '~/components/ui';

import classes from './HowItWorks.module.css';

const SAMPLE_CODE = 'k7m2p 9xq4r';
const BARS = [{ width: '92%' }, { width: '70%' }, { width: '48%' }];

export const HowItWorks: FC = () => (
  <Paper component="section" withBorder radius="lg" className={classes.card}>
    <div className={classes.head}>
      <Title order={2} className={classes.title}>
        <Trans>How it works</Trans>
      </Title>
      <Text size="sm" c="dimmed">
        <Trans>Americano and Mexicano, without the paper and pens.</Trans>
      </Text>
    </div>
    <ol className={classes.steps}>
      <li className={classes.step}>
        <span className={classes.art} data-step="1" aria-hidden>
          <span className={classes.fab}>
            <Plus />
          </span>
        </span>
        <div className={classes.text}>
          <Text fw={700}>
            <Trans comment="How it works, step 1">Start</Trans>
          </Text>
          <Text size="sm" c="dimmed">
            <Trans>Pick Americano or Mexicano and how many courts. That's it.</Trans>
          </Text>
        </div>
      </li>
      <li className={classes.step}>
        <span className={classes.art} data-step="2" aria-hidden>
          <QrCode className={classes.qr} />
          <span className={classes.code}>{SAMPLE_CODE}</span>
        </span>
        <div className={classes.text}>
          <Text fw={700}>
            <Trans comment="How it works, step 2">Share the code or QR</Trans>
          </Text>
          <Text size="sm" c="dimmed">
            <Trans>Show the QR or read out the code. Everyone joins from their phone.</Trans>
          </Text>
        </div>
      </li>
      <li className={classes.step}>
        <span className={classes.art} data-step="3" aria-hidden>
          <span className={classes.bars}>
            {BARS.map((style, index) => (
              <span key={style.width} className={classes.bar}>
                <span className={classes.rank}>{index + 1}</span>
                <span className={classes.fill} style={style} />
                {index === 0 && <TrendUp className={classes.up} />}
              </span>
            ))}
          </span>
        </span>
        <div className={classes.text}>
          <Text fw={700}>
            <Trans context="ShuttleKaos: play games" comment="How it works, step 3">
              Play
            </Trans>
          </Text>
          <Text size="sm" c="dimmed">
            <Trans>Type the score after each match. Standings update live for everyone.</Trans>
          </Text>
        </div>
      </li>
    </ol>
    <Text className={classes.hint}>
      <Trans comment="Points to the New session button at the bottom of the phone screen">
        Tap New session below to begin
      </Trans>
    </Text>
  </Paper>
);
