import { Stack, Text } from '@sanity/ui';
import type { FC } from 'react';
import { getPublishedId, useEditState, type ObjectInputProps } from 'sanity';

import { SHORT_DATE } from '../schema/labels';
import { Editor } from './editor';

const nameOf = (editor: unknown) => {
  const parsed = Editor.safeParse(editor);
  return parsed.success ? parsed.data.name : 'the board';
};

const dateOf = (timestamp: string | undefined) => (timestamp ? ` on ${SHORT_DATE.format(new Date(timestamp))}` : '');

export const EditorStampLine: FC<ObjectInputProps> = (props) => {
  const { value, schemaType } = props;
  const id = typeof value?._id === 'string' ? getPublishedId(value._id) : '';
  const { draft, published } = useEditState(id, schemaType.name);
  const created = `Created by ${nameOf(value?.createdBy)}${dateOf(published?._createdAt ?? draft?._createdAt)}`;
  const lastPublished = published
    ? `Last published by ${nameOf(published.updatedBy)}${dateOf(published._updatedAt)}`
    : 'Not published yet';
  return (
    <Stack gap={4}>
      <Text size={1} muted>
        {created} · {lastPublished}
      </Text>
      {props.renderDefault(props)}
    </Stack>
  );
};
