/** @vitest-environment happy-dom */
import { act, createRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import * as UI from '../../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const container = document.createElement('div');
document.body.append(container);
let root = createRoot(container);
afterEach(() => { act(() => root.unmount()); root = createRoot(container); });
const input = () => container.querySelector<HTMLInputElement>('input')!;
function type(value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), value);
    input().dispatchEvent(new Event('input', { bubbles: true }));
  });
}
function key(value: string, composing = false) {
  const event = new KeyboardEvent('keydown', { key: value, isComposing: composing, bubbles: true, cancelable: true });
  act(() => input().dispatchEvent(event));
  return event;
}
function fixture(props: Partial<UI.TagInputProps> = {}) {
  expect(UI).toHaveProperty('TagInput');
  const changed = vi.fn();
  function App() {
    const [value, setValue] = useState(['React']);
    return <UI.TagInput value={value} onValueChange={next => { setValue(next); changed(next); }}
      options={['React', 'Vue', 'Vue']} aria-label="Tags" {...props} />;
  }
  act(() => root.render(<App />));
  return changed;
}

it('creates trimmed tags, selects suggestions and does not duplicate selected values', () => {
  const changed = fixture();
  act(() => input().focus());
  expect(container.querySelectorAll('[role="option"]')).toHaveLength(1);
  type(' Custom ');
  key('Enter');
  expect(changed).toHaveBeenLastCalledWith(['React', 'Custom']);
  expect(input().value).toBe('');
  type('React');
  key('Enter');
  expect(changed).toHaveBeenCalledTimes(1);
  type('Vu');
  act(() => Array.from(container.querySelectorAll('[role="option"]')).find(el => el.textContent === 'Vue')!
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })));
  expect(changed).toHaveBeenLastCalledWith(['React', 'Custom', 'Vue']);
});

it('does not submit tags while confirming Chinese IME composition or submit the enclosing form on empty Enter', () => {
  const changed = fixture();
  act(() => input().focus());
  type('\u4e2d\u6587');
  key('Enter', true);
  expect(changed).not.toHaveBeenCalled();
  key('Enter');
  expect(changed).toHaveBeenLastCalledWith(['React', '\u4e2d\u6587']);
  expect(key('Enter').defaultPrevented).toBe(true);
  expect(changed).toHaveBeenCalledTimes(1);
});

it('commits on blur, cancels the draft with Escape and offers labeled remove and clear actions', () => {
  const changed = fixture();
  act(() => input().focus());
  type('Draft');
  act(() => input().blur());
  expect(changed).toHaveBeenLastCalledWith(['React', 'Draft']);
  act(() => input().focus());
  type('Discard');
  key('Escape');
  act(() => input().blur());
  expect(changed).toHaveBeenCalledTimes(1);
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="Remove React"]')!.click());
  expect(changed).toHaveBeenLastCalledWith(['Draft']);
  expect(document.activeElement).toBe(input());
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="Clear tags"]')!.click());
  expect(changed).toHaveBeenLastCalledWith([]);
});

it('selects a suggestion with arrow keys even with an empty draft', () => {
  const changed = fixture();
  act(() => input().focus());
  key('ArrowDown');
  key('Enter');
  expect(changed).toHaveBeenLastCalledWith(['React', 'Vue']);
});

it('allows explicit navigation away from a duplicate draft to a different suggestion', () => {
  const changed = fixture({ options: ['React Native'] });
  act(() => input().focus());
  type('React');
  key('ArrowDown');
  key('Enter');
  expect(changed).toHaveBeenLastCalledWith(['React', 'React Native']);
});

it('creates the draft independently of the localized create label', () => {
  const changed = fixture({ createLabel: () => 'Create new tag' });
  act(() => input().focus());
  type('Vu');
  key('Enter');
  expect(changed).toHaveBeenLastCalledWith(['React', 'Vu']);
});

it('submits selected values, not the draft, and omits disabled fields from native forms', () => {
  const render = (disabled = false) => act(() => root.render(<form>
    <UI.TagInput name="tags" value={['React', 'Vue']} onValueChange={vi.fn()} disabled={disabled} />
  </form>));
  render();
  type('Draft');
  expect(new FormData(container.querySelector('form')!).getAll('tags')).toEqual(['React', 'Vue']);
  render(true);
  expect(new FormData(container.querySelector('form')!).getAll('tags')).toEqual([]);
});

it('uses composition lifecycle when the confirming key lacks isComposing', () => {
  const changed = fixture();
  act(() => input().focus());
  act(() => input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
  type('\u6d4b\u8bd5');
  key('Enter');
  key('Escape');
  expect(changed).not.toHaveBeenCalled();
  expect(input().value).toBe('\u6d4b\u8bd5');
  act(() => input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
  key('Enter');
  expect(changed).toHaveBeenLastCalledWith(['React', '\u6d4b\u8bd5']);
});

it('inherits field label/error/disabled and read-only state and forwards the input ref', () => {
  expect(UI).toHaveProperty('TagInput');
  const ref = createRef<HTMLInputElement>();
  const changed = vi.fn();
  act(() => root.render(<UI.FormField label="Article tags" errorMessage="Invalid tag" isDisabled>
    <UI.TagInput ref={ref} value={['React']} onValueChange={changed} />
  </UI.FormField>));
  expect(ref.current).toBe(input());
  expect(input().id).toBe(container.querySelector('label')?.htmlFor);
  expect(input().getAttribute('aria-invalid')).toBe('true');
  expect(input().parentElement?.classList.contains('ui-input-error')).toBe(true);
  expect(input().parentElement?.classList.contains('ui-input-disabled')).toBe(true);
  expect(input().disabled).toBe(true);
  expect(Array.from(container.querySelectorAll('button')).every(button => button.disabled)).toBe(true);
  key('Enter');
  expect(changed).not.toHaveBeenCalled();
  act(() => root.render(<UI.FormField label="Article tags" isReadOnly>
    <UI.TagInput value={['React']} onValueChange={changed} />
  </UI.FormField>));
  expect(input().readOnly).toBe(true);
  expect(container.querySelector('[aria-label="Remove React"]')).toBeNull();
  act(() => input().focus());
  expect(container.querySelector('[role="listbox"]')).toBeNull();
});
