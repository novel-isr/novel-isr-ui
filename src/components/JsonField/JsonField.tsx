import { forwardRef, useId, useMemo, useState } from 'react';
import { applyEdits, createScanner, format } from 'jsonc-parser';
import { CircleAlert, CircleCheck, Braces } from 'lucide-react';
import { cn } from '../../utils/cn';
import { IconButton } from '../Button/IconButton';
import { useFormControlContext } from '../FormControl/FormControl';
import { HStack, VStack } from '../Stack/Stack';
import { Textarea, type TextareaProps } from '../Textarea/Textarea';

export interface JsonFieldProps extends Omit<TextareaProps, 'value' | 'defaultValue' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  /** Hides formatting controls, but syntax feedback remains accessible. */
  hideToolbar?: boolean;
  /** Spaces per indentation level, 0 to 10. Zero produces compact JSON. */
  indent?: number;
  formatLabel?: string;
  validLabel?: string;
  invalidLabel?: string;
}

type Validation = { status: 'empty' | 'valid' } | { status: 'invalid'; error: string };

function validate(value: string): Validation {
  if (!value.trim()) return { status: 'empty' };
  try {
    JSON.parse(value);
    return { status: 'valid' };
  } catch (error) {
    return { status: 'invalid', error: error instanceof Error ? error.message : String(error) };
  }
}

function formatJson(value: string, indent: number): string {
  const spaces = Math.min(10, Math.max(0, Math.trunc(indent) || 0));
  if (spaces > 0) {
    return applyEdits(value, format(value, undefined, { tabSize: spaces, insertSpaces: true, eol: '\n' }));
  }
  // Keep numeric lexemes and escaped strings intact, including in compact mode.
  const scanner = createScanner(value, true);
  const tokens: string[] = [];
  while (scanner.getPosition() < value.length) {
    scanner.scan();
    tokens.push(value.slice(scanner.getTokenOffset(), scanner.getTokenOffset() + scanner.getTokenLength()));
  }
  return tokens.join('');
}

export const JsonField = forwardRef<HTMLTextAreaElement, JsonFieldProps>(function JsonField({
  value, onChange, rows = 8, hideToolbar = false, indent = 2, className,
  formatLabel = '格式化 JSON', validLabel = 'JSON 语法正确', invalidLabel = 'JSON 语法错误',
  disabled: disabledProp, readOnly: readOnlyProp, required: requiredProp,
  onFocus, onBlur, isInvalid, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid,
  spellCheck = false, ...rest
}, ref) {
  const field = useFormControlContext();
  const disabled = Boolean(disabledProp || field?.isDisabled);
  const readOnly = Boolean(readOnlyProp || field?.isReadOnly);
  const required = Boolean(requiredProp || field?.isRequired);
  const statusId = `json-status-${useId()}`;
  const [focused, setFocused] = useState(false);
  const validation = useMemo<Validation>(() => focused ? { status: 'empty' } : validate(value), [value, focused]);
  const invalid = validation.status === 'invalid';

  const formatNow = () => {
    if (disabled || readOnly || validate(value).status !== 'valid') return;
    const formatted = formatJson(value, indent);
    if (formatted !== value) onChange(formatted);
  };

  return (
    <VStack gap={2} className={cn('ui-json-field', className)}>
      {!hideToolbar && <HStack justify="end">
        <IconButton label={formatLabel} size="sm" disabled={disabled || readOnly || !value.trim()} onClick={formatNow}>
          <Braces size={18} />
        </IconButton>
      </HStack>}
      <Textarea {...rest} ref={ref} rows={rows} value={value} disabled={disabled} readOnly={readOnly}
        required={required} spellCheck={spellCheck} className="ui-json-field-textarea"
        aria-invalid={invalid || isInvalid ? true : ariaInvalid === 'false' ? false : ariaInvalid}
        aria-describedby={[describedBy, invalid ? statusId : undefined].filter(Boolean).join(' ') || undefined}
        onChange={event => { if (!disabled && !readOnly) onChange(event.target.value); }}
        onFocus={event => { setFocused(true); onFocus?.(event); }}
        onBlur={event => { setFocused(false); onBlur?.(event); }}
      />
      <HStack id={statusId} role="status" aria-live="polite" align="start" gap={2}
        className={cn('ui-json-field-status', invalid && 'ui-json-field-status-invalid')}>
        {validation.status === 'valid' && <><CircleCheck size={16} aria-hidden="true" /><span>{validLabel}</span></>}
        {validation.status === 'invalid' && <><CircleAlert size={16} aria-hidden="true" /><span>{invalidLabel}: {validation.error}</span></>}
      </HStack>
    </VStack>
  );
});
