/** @vitest-environment happy-dom */
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import * as UI from '../../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const container = document.createElement('div');
document.body.append(container);
let root = createRoot(container);
afterEach(() => { act(() => root.unmount()); root = createRoot(container); });

const initial = [
  { id: 'first', key: 'duplicate', value: 'one' },
  { id: 'second', key: 'duplicate', value: 'two' },
];
const inputs = () => Array.from(container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'));
const button = (label: string) => Array.from(container.querySelectorAll('button'))
  .find(el => (el.getAttribute('aria-label') || el.textContent) === label)!;
function type(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  act(() => {
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
function fixture(props: Partial<UI.KeyValueEditorProps> = {}) {
  expect(UI).toHaveProperty('KeyValueEditor');
  const changed = vi.fn();
  function App() {
    const [entries, setEntries] = useState(initial);
    return <UI.KeyValueEditor entries={entries} onChange={next => { changed(next); setEntries(next); }} {...props} />;
  }
  act(() => root.render(<App />));
  return changed;
}

it('edits by stable row id, preserving duplicate keys, whitespace and untouched entries', () => {
  const changed = fixture();
  type(inputs()[2]!, '  renamed  ');
  const next = changed.mock.lastCall![0];
  expect(next).toEqual([initial[0], { id: 'second', key: '  renamed  ', value: 'two' }]);
  expect(next).not.toBe(initial);
  expect(next[0]).toBe(initial[0]);
  expect(initial[1]).toEqual({ id: 'second', key: 'duplicate', value: 'two' });
  type(inputs()[3]!, '');
  expect(changed.mock.lastCall![0][1]).toEqual({ id: 'second', key: '  renamed  ', value: '' });
});

it('renders the supplied entries until the parent accepts a change', () => {
  const onChange = vi.fn();
  fixture({ entries: initial, onChange });
  type(inputs()[0]!, 'proposed');
  expect(onChange.mock.lastCall![0][0].key).toBe('proposed');
  expect(inputs()[0]!.value).toBe('duplicate');
  act(() => button('Add entry').click());
  expect(inputs()).toHaveLength(4);
  expect(onChange.mock.lastCall![0]).toHaveLength(3);
});

it('preserves multiline translations and legacy keys when editing around newlines', () => {
  expect(UI).toHaveProperty('KeyValueEditor');
  const changed = vi.fn();
  function App() {
    const [entries, setEntries] = useState([{ id: 'translation', key: 'legacy\nkey', value: 'Hello\nworld' }]);
    return <UI.KeyValueEditor entries={entries} onChange={next => { changed(next); setEntries(next); }} />;
  }
  act(() => root.render(<App />));
  expect(inputs().map(el => el.value)).toEqual(['legacy\nkey', 'Hello\nworld']);
  type(inputs()[1]!, 'Hello!\nnew world');
  expect(changed.mock.lastCall![0]).toEqual([{ id: 'translation', key: 'legacy\nkey', value: 'Hello!\nnew world' }]);
  type(inputs()[0]!, 'legacy\nkey.updated');
  expect(changed.mock.lastCall![0]).toEqual([{ id: 'translation', key: 'legacy\nkey.updated', value: 'Hello!\nnew world' }]);
  expect(inputs().map(el => el.value)).toEqual(['legacy\nkey.updated', 'Hello!\nnew world']);
});

it('adds blank rows with unique ids and removes only the requested duplicate-key row', () => {
  const changed = fixture();
  act(() => button('Add entry').click());
  act(() => button('Add entry').click());
  const added = changed.mock.lastCall![0] as UI.KeyValueEntry[];
  expect(added).toHaveLength(4);
  expect(new Set(added.map(entry => entry.id)).size).toBe(4);
  expect(added.slice(2)).toEqual([
    { id: expect.any(String), key: '', value: '' },
    { id: expect.any(String), key: '', value: '' },
  ]);
  expect(added.every(entry => entry.id.length > 0)).toBe(true);
  act(() => button('Remove entry 1').click());
  expect(changed.mock.lastCall![0]).toEqual(added.slice(1));
  expect(inputs()[1]!.value).toBe('two');
  expect(button('Add entry').classList.contains('ui-button')).toBe(true);
  expect(button('Remove entry 1').classList.contains('ui-icon-button')).toBe(true);
  expect(Array.from(container.querySelectorAll('button')).every(el => el.type === 'button')).toBe(true);
});

it('supports removing the last row and adding into an empty editor', () => {
  expect(UI).toHaveProperty('KeyValueEditor');
  const changed = vi.fn();
  function Empty() {
    const [entries, setEntries] = useState<UI.KeyValueEntry[]>([]);
    return <UI.KeyValueEditor entries={entries} onChange={next => { changed(next); setEntries(next); }} />;
  }
  act(() => root.render(<Empty />));
  expect(inputs()).toHaveLength(0);
  act(() => button('Add entry').click());
  expect(inputs()).toHaveLength(2);
  act(() => button('Remove entry 1').click());
  expect(changed.mock.lastCall![0]).toEqual([]);
  expect(inputs()).toHaveLength(0);
});

it('disables every input and mutation control', () => {
  const changed = fixture({ disabled: true });
  expect(inputs().every(el => el.disabled)).toBe(true);
  for (const control of container.querySelectorAll('button')) {
    expect(control.disabled).toBe(true);
    act(() => control.click());
  }
  expect(changed).not.toHaveBeenCalled();
  expect(inputs().map(el => el.value)).toEqual(['duplicate', 'one', 'duplicate', 'two']);
});

it('labels each field and associates errors by row id across reordering', () => {
  const errors: Record<string, UI.KeyValueEntryErrors> = { second: { key: 'Key conflict', value: 'Value required' } };
  const props = { entries: initial, onChange: vi.fn(), keyLabel: 'Header', valueLabel: 'Content',
    addLabel: 'Add header', removeLabel: 'Delete header', errors };
  fixture(props);
  const field = inputs()[2]!;
  const described = field.getAttribute('aria-describedby')!.split(' ');
  expect(field.getAttribute('aria-invalid')).toBe('true');
  expect(described.some(id => document.getElementById(id)?.textContent === 'Key conflict')).toBe(true);
  expect(inputs()[3]!.getAttribute('aria-invalid')).toBe('true');
  expect(inputs()[0]!.getAttribute('aria-invalid')).not.toBe('true');
  expect(inputs().map(input => Array.from(container.querySelectorAll('label'))
    .find(label => label.htmlFor === input.id)?.textContent)).toEqual(['Header 1', 'Content 1', 'Header 2', 'Content 2']);
  expect(button('Add header')).toBeDefined();
  expect(button('Delete header 2')).toBeDefined();
  act(() => root.render(<UI.KeyValueEditor {...props} />));
  const stableField = inputs()[2]!;
  act(() => stableField.focus());
  act(() => root.render(<UI.KeyValueEditor {...props} entries={[initial[1]!, initial[0]!]} />));
  expect(inputs()[0]).toBe(stableField);
  expect(document.activeElement).toBe(stableField);
  expect(inputs()[0]!.getAttribute('aria-invalid')).toBe('true');
  expect(inputs()[2]!.getAttribute('aria-invalid')).not.toBe('true');
});

it('keeps field ids distinct across multiple editors', () => {
  expect(UI).toHaveProperty('KeyValueEditor');
  act(() => root.render(<><UI.KeyValueEditor entries={initial} onChange={() => {}} />
    <UI.KeyValueEditor entries={initial} onChange={() => {}} /></>));
  expect(new Set(inputs().map(el => el.id)).size).toBe(8);
  expect(inputs().every(el => !!el.id)).toBe(true);
});
