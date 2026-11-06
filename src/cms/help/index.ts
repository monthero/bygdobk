import type { Tool } from 'sanity';

import { Lifebuoy } from '~/components/ui';

import { HelpTool } from './HelpTool';

export const HELP_TOOL: Tool = { name: 'help', title: 'Help', icon: Lifebuoy, component: HelpTool };
