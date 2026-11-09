import type { Tool } from 'sanity';

import { SquaresFour } from '~/components/ui/icons';

import { StartTool } from './StartTool';

export const START_TOOL: Tool = { name: 'start', title: 'Start', icon: SquaresFour, component: StartTool };
