/** @vitest-environment jsdom */
import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { FormField, JsonField, Textarea } from '../../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const input = () => container.querySelector('textarea')!;
const button = () => container.querySelector('button')!;
const focus = () => act(() => input().dispatchEvent(new FocusEvent('focusin', { bubbles: true })));
const blur = () => act(() => input().dispatchEvent(new FocusEvent('focusout', { bubbles: true })));

it('uses a keyboard-reachable shared format button and preserves the controlled callback', () => {
  const changes: string[] = [];
  act(() => root.render(<JsonField value='{"title":"Draft"}' onChange={value => changes.push(value)} />));
  expect(button().classList.contains('ui-icon-button')).toBe(true);
  expect(button().getAttribute('aria-label')).toBe('格式化 JSON');
  expect(button().tabIndex).toBe(0);
  expect(button().type).toBe('button');
  act(() => button().click());
  expect(changes).toEqual(['{\n  "title": "Draft"\n}']);
});

it('forwards native textarea attributes, form association, event handlers and ref', () => {
  const ref = createRef<HTMLTextAreaElement>();
  const events: string[] = [];
  act(() => root.render(<JsonField ref={ref} value='{}' onChange={() => {}} name="dictionary" form="settings"
    id="json" rows={12} required readOnly maxLength={1000} aria-describedby="help" data-owner="fixture"
    onFocus={() => events.push('focus')} onBlur={() => events.push('blur')} />));
  expect(ref.current).toBe(input());
  expect(input().name).toBe('dictionary');
  expect(input().getAttribute('form')).toBe('settings');
  expect(input().id).toBe('json');
  expect(input().rows).toBe(12);
  expect(input().required).toBe(true);
  expect(input().readOnly).toBe(true);
  expect(input().maxLength).toBe(1000);
  expect(input().dataset.owner).toBe('fixture');
  expect(input().getAttribute('aria-describedby')).toContain('help');
  focus(); blur();
  expect(events).toEqual(['focus', 'blur']);
});

it.each(['disabled', 'readOnly'] as const)('blocks formatting and preserves values when %s', state => {
  let changes = 0;
  act(() => root.render(<JsonField value='{"a":1}' onChange={() => changes++} {...{ [state]: true }} />));
  expect(input()[state]).toBe(true);
  expect(button().disabled).toBe(true);
  act(() => button().click());
  expect(changes).toBe(0);
});

it.each(['isDisabled', 'isReadOnly'] as const)('inherits %s from FormField for textarea and formatting', state => {
  act(() => root.render(<FormField label="Dictionary" {...{ [state]: true }} isRequired>
    <JsonField value='{"a":1}' onChange={() => {}} />
  </FormField>));
  expect(input()[state === 'isDisabled' ? 'disabled' : 'readOnly']).toBe(true);
  expect(input().required).toBe(true);
  expect(container.querySelector('label')?.htmlFor).toBe(input().id);
  expect(button().disabled).toBe(true);
});

it('revalidates external values and associates full syntax errors with the textarea', () => {
  const render = (value: string) => act(() => root.render(<FormField label="Dictionary" helperText="Help">
    <JsonField value={value} onChange={() => {}} aria-describedby="external-help" />
  </FormField>));
  render('{}');
  expect(container.textContent).toContain('JSON 语法正确');
  render('{');
  expect(container.textContent).toContain('JSON 语法错误');
  expect(input().getAttribute('aria-invalid')).toBe('true');
  const status = container.querySelector('[role="status"]')!;
  expect(status.id).not.toBe('');
  expect(input().getAttribute('aria-describedby')?.split(' ')).toContain(status.id);
  expect(input().getAttribute('aria-describedby')).toContain('external-help');
  render('{"reloaded":true}');
  expect(container.textContent).not.toContain('JSON 语法错误');
  expect(input().getAttribute('aria-invalid')).not.toBe('true');
});

it('does not show stale validation while editing and checks the latest value on blur', () => {
  const render = (value: string) => act(() => root.render(<JsonField value={value} onChange={() => {}} />));
  render('{}'); focus(); render('{');
  expect(container.textContent).not.toContain('JSON 语法正确');
  expect(container.textContent).not.toContain('JSON 语法错误');
  blur();
  expect(container.textContent).toContain('JSON 语法错误');
});

it.each(['{"a":1,}', '{/* comment */"a":1}', '{', '[1,]'])('rejects non-JSON syntax without changing %s', value => {
  let changes = 0;
  act(() => root.render(<JsonField value={value} onChange={() => changes++} />));
  act(() => button().click());
  expect(changes).toBe(0);
  expect(input().value).toBe(value);
  expect(input().getAttribute('aria-invalid')).toBe('true');
});

it('formats whitespace without changing numeric tokens, escapes, duplicate keys or property order', () => {
  let formatted = '';
  const value = '{"n":9007199254740993,"huge":1e400,"s":"\\u0061","x":1,"x":2,"10":true,"2":false}';
  act(() => root.render(<JsonField value={value} onChange={text => formatted = text} indent={4} />));
  act(() => button().click());
  expect(formatted).toContain('\n    "n": 9007199254740993');
  expect(formatted).toContain('"huge": 1e400');
  expect(formatted).toContain('"s": "\\u0061"');
  expect(formatted.match(/"x"/g)).toHaveLength(2);
  expect(formatted.indexOf('"10"')).toBeLessThan(formatted.indexOf('"2"'));
});

it('does not emit a change when formatting is already applied', () => {
  let changes = 0;
  act(() => root.render(<JsonField value='{\n  "a": 1\n}' onChange={() => changes++} />));
  act(() => button().click());
  expect(changes).toBe(0);
});

it('retains compact-mode compatibility without rewriting token values', () => {
  let formatted = '';
  act(() => root.render(<JsonField value={'  { "n": 9007199254740993, "s": "a b", "escape": "\\u0061" }  '} onChange={value => formatted = value} indent={0} />));
  act(() => button().click());
  expect(formatted).toBe('{"n":9007199254740993,"s":"a b","escape":"\\u0061"}');
});

it('keeps empty fields neutral and formatting disabled', () => {
  act(() => root.render(<JsonField value='   ' onChange={() => {}} />));
  expect(button().disabled).toBe(true);
  expect(container.querySelector('[role="status"]')?.textContent ?? '').toBe('');
});

it('can hide formatting controls while retaining associated syntax errors', () => {
  act(() => root.render(<JsonField value='{' onChange={() => {}} hideToolbar />));
  expect(container.querySelector('button')).toBeNull();
  expect(container.textContent).toContain('JSON 语法错误');
  expect(input().getAttribute('aria-invalid')).toBe('true');
});

it('allows localized format and validation labels', () => {
  act(() => root.render(<JsonField value='{}' onChange={() => {}} formatLabel="Format JSON" validLabel="Valid JSON" invalidLabel="Invalid JSON" />));
  expect(button().getAttribute('aria-label')).toBe('Format JSON');
  expect(container.textContent).toContain('Valid JSON');
});

it('FormField preserves explicit child aria-invalid while its own error takes precedence', () => {
  act(() => root.render(<FormField label="Text"><Textarea aria-invalid="grammar" /></FormField>));
  expect(input().getAttribute('aria-invalid')).toBe('grammar');
  act(() => root.render(<FormField label="Text" isInvalid errorMessage="Business error"><Textarea aria-invalid={false} /></FormField>));
  expect(input().getAttribute('aria-invalid')).toBe('true');
});

it('reflects explicit invalid state to assistive technology without losing a business error', () => {
  act(() => root.render(<JsonField value='{}' onChange={() => {}} isInvalid />));
  expect(input().getAttribute('aria-invalid')).toBe('true');
  expect(input().classList.contains('ui-textarea-error')).toBe(true);
});

it('does not treat the false ARIA string as an error when preserving a child state', () => {
  act(() => root.render(<FormField label="Text"><Textarea aria-invalid="false" /></FormField>));
  expect(input().getAttribute('aria-invalid')).toBe('false');
  expect(input().classList.contains('ui-textarea-error')).toBe(false);
});
