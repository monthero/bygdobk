import { Card, Flex, Spinner, Text, type CardTone } from '@sanity/ui';
import type { MutationState } from '@tanstack/react-query';
import type { FC } from 'react';

import type { TranslateOutcome } from './translate';

export type TranslateState = MutationState<TranslateOutcome, Error, void>;

const plural = (count: number) => `${count} translation${count === 1 ? '' : 's'}`;

type Notice = { tone: CardTone; text: string };

const doneNotice = ({ added, limit }: TranslateOutcome): Notice => {
  if (limit && added === 0) return { tone: 'caution', text: limit };
  if (limit) {
    return {
      tone: 'caution',
      text: `Added ${plural(added)} to the draft (machine-translated, please check them). ${limit}`,
    };
  }
  if (added === 0) {
    return {
      tone: 'default',
      text: 'Nothing left to translate. Empty languages need Norwegian or English text first.',
    };
  }
  return {
    tone: 'positive',
    text: `Added ${plural(added)} to the draft. They are machine-translated, so open the text, check them and publish.`,
  };
};

const noticeOf = (state: TranslateState): Notice | undefined => {
  if (state.status === 'success' && state.data) return doneNotice(state.data);
  if (state.status === 'error' && state.error) return { tone: 'critical', text: state.error.message };
  return undefined;
};

export const TranslateStatus: FC<{ state: TranslateState | undefined }> = ({ state }) => {
  if (!state || state.status === 'idle') return null;
  if (state.status === 'pending') {
    return (
      <Flex as="output" gap={2} align="center" paddingX={3} paddingBottom={3}>
        <Spinner muted />
        <Text size={1} muted>
          Translating…
        </Text>
      </Flex>
    );
  }
  const notice = noticeOf(state);
  if (!notice) return null;
  return (
    <Card as="output" tone={notice.tone} padding={3} radius={2} marginX={2} marginBottom={2}>
      <Text size={1}>{notice.text}</Text>
    </Card>
  );
};
