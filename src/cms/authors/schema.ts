import { defineField, type DocumentDefinition } from 'sanity';

import { resolveEditor, StampField } from './editor';
import { EditorStampLine } from './EditorStampLine';

const EDITOR_FIELDS = [
  defineField({ name: 'id', title: 'Sanity user ID', type: 'string' }),
  defineField({ name: 'name', title: 'Name', type: 'string' }),
];

const STAMP_FIELDS = [
  defineField({
    name: StampField.enum.createdBy,
    title: 'Created by',
    type: 'object',
    readOnly: true,
    hidden: true,
    fields: EDITOR_FIELDS,
    initialValue: (_params, context) => resolveEditor(context),
  }),
  defineField({
    name: StampField.enum.updatedBy,
    title: 'Last published by',
    type: 'object',
    readOnly: true,
    hidden: true,
    fields: EDITOR_FIELDS,
  }),
];

export const withEditorStamps = <T extends DocumentDefinition>(type: T): T => ({
  ...type,
  fields: [...type.fields, ...STAMP_FIELDS],
  components: { ...type.components, input: EditorStampLine },
});
