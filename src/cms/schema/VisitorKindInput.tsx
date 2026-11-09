import type { FC } from 'react';
import type { StringInputProps } from 'sanity';

import { VISITOR_KINDS } from '~/data/events';

import { EVENT_KIND_TITLES, titledList } from './labels';

const VISITOR_LIST = titledList(EVENT_KIND_TITLES, VISITOR_KINDS);

export const VisitorKindInput: FC<StringInputProps> = (props) =>
  props.renderDefault({
    ...props,
    schemaType: { ...props.schemaType, options: { ...props.schemaType.options, list: VISITOR_LIST } },
  });
