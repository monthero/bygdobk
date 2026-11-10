import { useCallback } from 'react';
import {
  useDocumentOperation,
  type DocumentActionComponent,
  type DuplicateDocumentActionComponent,
  type SanityDocumentLike,
} from 'sanity';
import { z } from 'zod';

import { StampField, useEditor } from './editor';

const StampedAction = z.enum(['publish', 'duplicate']);

const stampPublish = (publish: DocumentActionComponent): DocumentActionComponent => {
  const useStampedPublish: DocumentActionComponent = (props) => {
    const description = publish(props);
    const { patch } = useDocumentOperation(props.id, props.type);
    const editor = useEditor();
    const onHandle = description?.onHandle;
    if (!description || !onHandle) return description;
    if (!editor) return { ...description, disabled: true };
    return {
      ...description,
      disabled: description.disabled || Boolean(patch.disabled),
      onHandle: () => {
        patch.execute([{ set: { [StampField.enum.updatedBy]: editor } }]);
        onHandle();
      },
    };
  };
  useStampedPublish.action = publish.action;
  useStampedPublish.displayName = 'StampedPublishAction';
  return useStampedPublish;
};

const stampDuplicate = (duplicate: DuplicateDocumentActionComponent): DocumentActionComponent => {
  const useStampedDuplicate: DocumentActionComponent = (props) => {
    const editor = useEditor();
    const mapDocument = useCallback(
      (document: SanityDocumentLike) => ({
        ...document,
        [StampField.enum.createdBy]: editor,
        [StampField.enum.updatedBy]: undefined,
      }),
      [editor],
    );
    const description = duplicate({ ...props, mapDocument });
    return description && !editor ? { ...description, disabled: true } : description;
  };
  useStampedDuplicate.action = duplicate.action;
  useStampedDuplicate.displayName = 'StampedDuplicateAction';
  return useStampedDuplicate;
};

const STAMPED = new WeakMap<DocumentActionComponent, DocumentActionComponent>();

const stamp = (action: DocumentActionComponent) => {
  switch (action.action) {
    case StampedAction.enum.publish:
      return stampPublish(action);
    case StampedAction.enum.duplicate:
      return stampDuplicate(action);
    default:
      return action;
  }
};

export const stampActions = (action: DocumentActionComponent) => {
  const known = STAMPED.get(action);
  if (known) return known;
  const stamped = stamp(action);
  STAMPED.set(action, stamped);
  return stamped;
};
