import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { FC } from 'react';

import { CourtOut } from './CourtOut';
import { KeepItUp } from './KeepItUp';
import { Scoreboard } from './Scoreboard';

export type Concept = { slug: string; name: MessageDescriptor; idea: MessageDescriptor; Component: FC };

export const CONCEPTS: Concept[] = [
  {
    slug: 'court-out',
    name: msg`Out!`,
    idea: msg`A court in perspective, the shuttle lands just out.`,
    Component: CourtOut,
  },
  {
    slug: 'keep-it-up',
    name: msg`Keep it up`,
    idea: msg`A tiny game: keep the shuttle in the air.`,
    Component: KeepItUp,
  },
  {
    slug: 'scoreboard',
    name: msg`Scoreboard`,
    idea: msg`The hall scoreboard reads 4–04, fault.`,
    Component: Scoreboard,
  },
];
