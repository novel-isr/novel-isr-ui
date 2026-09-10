'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Autocomplete, type AutocompleteOption, type AutocompleteProps } from '../Autocomplete/Autocomplete';
import { IconButton } from '../Button/IconButton';
import { Tag } from '../Tag/Tag';
import { useFormControlContext } from '../FormControl/FormControl';
import { cn } from '../../utils/cn';

export interface TagInputProps extends Pick<AutocompleteProps,
  'id' | 'name' | 'placeholder' | 'aria-label' | 'aria-describedby' | 'disabled' | 'readOnly' | 'size' | 'emptyText' | 'className'> {
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  options?: readonly string[];
  commitOnBlur?: boolean;
  addLabel?: string;
  clearLabel?: string;
  removeLabel?: (tag: string) => string;
  createLabel?: (tag: string) => string;
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(function TagInput({
  value, onValueChange, options = [], commitOnBlur = true, addLabel = 'Add tag',
  clearLabel = 'Clear tags', removeLabel = tag => `Remove ${tag}`,
  createLabel = tag => `Add "${tag}"`, disabled: disabledProp, readOnly: readOnlyProp,
  className, name, ...inputProps
}, ref) {
  const field = useFormControlContext();
  const disabled = Boolean(disabledProp || field?.isDisabled);
  const readOnly = Boolean(readOnlyProp || field?.isReadOnly);
  const inputRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const navigating = useRef(false);
  useImperativeHandle(ref, () => inputRef.current!, []);
  const [draft, setDraft] = useState('');
  const trimmed = draft.trim();
  const candidates = [...new Set(options.map(option => option.trim()).filter(Boolean))]
    .filter(option => !value.includes(option));
  const suggestions: AutocompleteOption[] = candidates.map(tag => ({ id: tag, label: tag }));
  if (trimmed && !value.includes(trimmed) && !candidates.includes(trimmed)) {
    suggestions.unshift({ id: trimmed, label: createLabel(trimmed), filterValue: trimmed });
  }
  const commit = (text: string) => {
    if (disabled || readOnly || composing.current) return;
    const tag = text.trim();
    if (tag && !value.includes(tag)) onValueChange([...value, tag]);
    navigating.current = false;
    setDraft('');
  };
  return (
    <div className={cn('ui-tag-input', className)} data-disabled={disabled || undefined}>
      {value.length > 0 && <div className="ui-tag-input-values">
        {value.map((tag, index) => <Tag key={`${index}-${tag}`} size="lg" disabled={disabled}
          closeLabel={removeLabel(tag)} onClose={readOnly ? undefined : () => {
            if (disabled) return;
            onValueChange(value.filter((_, position) => position !== index));
            inputRef.current?.focus();
          }}><span className="ui-tag-input-label">{tag}</span></Tag>)}
      </div>}
      <div className="ui-tag-input-entry">
        <Autocomplete {...inputProps} ref={inputRef} value={draft} onValueChange={next => { navigating.current = false; setDraft(next); }}
          disabled={disabled} readOnly={readOnly} options={suggestions}
          onSelect={option => commit(option.id)} onSubmit={commit}
          onCompositionStart={() => { composing.current = true; }}
          onCompositionEnd={() => { composing.current = false; }}
          onBlur={() => { if (commitOnBlur) commit(draft); }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') navigating.current = true;
            if (event.key === 'Enter' && !navigating.current && (!trimmed || value.includes(trimmed))) {
              event.preventDefault();
              commit(draft);
            }
            if (event.key === 'Escape') { navigating.current = false; setDraft(''); }
          }} />
        {!readOnly && <>
          <IconButton label={addLabel} disabled={disabled || !trimmed || value.includes(trimmed)}
            onMouseDown={event => event.preventDefault()} onClick={() => { commit(draft); inputRef.current?.focus(); }}>
            <Plus />
          </IconButton>
          <IconButton label={clearLabel} disabled={disabled || value.length === 0}
            onMouseDown={event => event.preventDefault()} onClick={() => {
              setDraft(''); onValueChange([]); inputRef.current?.focus();
            }}><X /></IconButton>
        </>}
      </div>
      {name && value.map((tag, index) => <input key={index} type="hidden" name={name} value={tag} disabled={disabled} />)}
    </div>
  );
});
