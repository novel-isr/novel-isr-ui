import { Plus, X } from 'lucide-react';
import { useId, useRef, type HTMLAttributes } from 'react';
import { Button } from '../Button/Button';
import { IconButton } from '../Button/IconButton';
import { FormField } from '../FormControl/FormControl';
import { Textarea } from '../Textarea/Textarea';
import { cn } from '../../utils/cn';

export interface KeyValueEntry {
  id: string;
  key: string;
  value: string;
}

export interface KeyValueEntryErrors {
  key?: string;
  value?: string;
}

export interface KeyValueEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  entries: KeyValueEntry[];
  onChange: (entries: KeyValueEntry[]) => void;
  disabled?: boolean;
  keyLabel?: string;
  valueLabel?: string;
  addLabel?: string;
  removeLabel?: string;
  /** Field errors indexed by the stable entry id. Validation belongs to the consumer. */
  errors?: Record<string, KeyValueEntryErrors>;
}

export function KeyValueEditor({
  entries, onChange, disabled = false, keyLabel = 'Key', valueLabel = 'Value',
  addLabel = 'Add entry', removeLabel = 'Remove entry', errors, className, ...rest
}: KeyValueEditorProps) {
  const editorId = useId();
  const nextId = useRef(0);
  const add = () => {
    if (disabled) return;
    let id: string;
    do { id = `key-value-${editorId}-${nextId.current++}`; }
    while (entries.some(entry => entry.id === id));
    onChange([...entries, { id, key: '', value: '' }]);
  };
  const update = (id: string, field: 'key' | 'value', value: string) => {
    if (disabled) return;
    onChange(entries.map(entry => entry.id === id ? { ...entry, [field]: value } : entry));
  };

  return <div {...rest} className={cn('ui-key-value-editor', className)} data-disabled={disabled || undefined}>
    {entries.map((entry, index) => <div className="ui-key-value-editor-row" key={entry.id}>
      <FormField label={<>{keyLabel}<span className="ui-sr-only"> {index + 1}</span></>}
        isDisabled={disabled} isInvalid={Boolean(errors?.[entry.id]?.key)} errorMessage={errors?.[entry.id]?.key}>
        <Textarea className="ui-key-value-editor-key" size="sm" rows={1} resize="vertical"
          value={entry.key} onChange={event => update(entry.id, 'key', event.target.value)} />
      </FormField>
      <FormField label={<>{valueLabel}<span className="ui-sr-only"> {index + 1}</span></>}
        isDisabled={disabled} isInvalid={Boolean(errors?.[entry.id]?.value)} errorMessage={errors?.[entry.id]?.value}>
        <Textarea size="sm" rows={2} resize="vertical"
          value={entry.value} onChange={event => update(entry.id, 'value', event.target.value)} />
      </FormField>
      <IconButton className="ui-key-value-editor-remove" label={`${removeLabel} ${index + 1}`} type="button"
        size="sm" disabled={disabled} onClick={() => {
          if (!disabled) onChange(entries.filter(item => item.id !== entry.id));
        }}><X size={16} /></IconButton>
    </div>)}
    <Button className="ui-key-value-editor-add" type="button" variant="outline" intent="neutral" size="sm"
      leftIcon={<Plus size={16} />} disabled={disabled} onClick={add}>{addLabel}</Button>
  </div>;
}
