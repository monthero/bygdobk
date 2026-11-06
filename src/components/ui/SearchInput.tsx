import { useLingui } from '@lingui/react/macro';
import { CloseButton, TextInput, type TextInputProps } from '@mantine/core';
import type { FC, Ref } from 'react';

import { MagnifyingGlass } from './icons';

type Props = Omit<TextInputProps, 'value' | 'onChange' | 'leftSection' | 'rightSection'> & {
  value: string;
  onChange: (value: string) => void;
  label: string;
  ref?: Ref<HTMLInputElement>;
};

export const SearchInput: FC<Props> = ({ value, onChange, label, placeholder = label, ...rest }) => {
  const { t } = useLingui();
  return (
    <TextInput
      enterKeyHint="search"
      aria-label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      onKeyDown={(e) => e.key === 'Escape' && onChange('')}
      leftSection={<MagnifyingGlass />}
      rightSection={value && <CloseButton size="sm" aria-label={t`Clear search`} onClick={() => onChange('')} />}
      radius="xl"
      {...rest}
    />
  );
};
