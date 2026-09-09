// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { EditorProps, Monaco } from '@monaco-editor/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../../ThemeProvider';
import { MonacoCodeEditor, type MonacoCodeEditorProps } from '../MonacoCodeEditor';

const adapter = vi.hoisted(() => ({
  props: {} as EditorProps,
  config: vi.fn(), init: vi.fn(), mount: true,
  monaco: { editor: { create() {} } } as unknown as Monaco,
}));
vi.mock('@monaco-editor/react', async () => {
  const { useEffect } = await import('react');
  return {
    loader: { config: adapter.config, init: adapter.init },
    default: (props: EditorProps) => {
      adapter.props = props;
      useEffect(() => {
        if (adapter.mount) props.onMount?.({} as Parameters<NonNullable<EditorProps['onMount']>>[0], adapter.monaco);
      }, []);
      return null;
    },
  };
});

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  adapter.init.mockReset().mockResolvedValue(adapter.monaco); adapter.mount = true; adapter.props = {};
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); });

async function render(props: Partial<MonacoCodeEditorProps> = {}) {
  await act(async () => root.render(<ThemeProvider disableStorage defaultTheme="light">
    <MonacoCodeEditor monaco={adapter.monaco} value="<p>Hello</p>" onChange={() => {}} label="HTML source" {...props} />
  </ThemeProvider>));
}

describe('MonacoCodeEditor', () => {
  it('configures a supplied local engine before initialization and normalizes controlled changes', async () => {
    const onChange = vi.fn();
    await render({ onChange, language: 'html' });
    expect(adapter.config).toHaveBeenCalledWith({ monaco: adapter.monaco });
    expect(adapter.config.mock.invocationCallOrder[0]).toBeLessThan(adapter.init.mock.invocationCallOrder[0]!);
    expect(adapter.props.value).toBe('<p>Hello</p>');
    expect(adapter.props.language).toBe('html');
    expect(adapter.props.options).toMatchObject({ ariaLabel: 'HTML source', readOnly: false, automaticLayout: true });
    act(() => adapter.props.onChange?.(undefined, {} as never));
    expect(onChange).toHaveBeenCalledWith('');
    await render({ onChange, disabled: true, value: 'Updated' });
    expect(adapter.props.value).toBe('Updated');
    expect(adapter.props.options?.readOnly).toBe(true);
    act(() => adapter.props.onChange?.('blocked', {} as never));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('follows changes to the shared theme context', async () => {
    function Toggle() { const { setTheme } = useTheme(); return <button onClick={() => setTheme('dark')}>Theme</button>; }
    await act(async () => root.render(<ThemeProvider disableStorage defaultTheme="light"><Toggle />
      <MonacoCodeEditor monaco={adapter.monaco} value="" onChange={() => {}} label="Source" />
    </ThemeProvider>));
    expect(adapter.props.theme).toBe('light');
    act(() => container.querySelector('button')!.click());
    expect(adapter.props.theme).toBe('vs-dark');
  });

  it('rejects a missing or conflicting engine without invoking the network loader', async () => {
    await render({ monaco: undefined as unknown as Monaco });
    expect(adapter.init).not.toHaveBeenCalled();
    expect(container.querySelector('textarea')!.value).toBe('<p>Hello</p>');
    await render();
    adapter.init.mockClear();
    await render({ monaco: { editor: { create() {} } } as unknown as Monaco });
    expect(adapter.init).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('offers an editable fallback after failure and retries with the latest controlled value', async () => {
    adapter.init.mockRejectedValueOnce(new Error('Engine unavailable'));
    const onChange = vi.fn();
    await render({ onChange });
    const input = container.querySelector('textarea')!;
    expect(input.getAttribute('aria-label')).toBe('HTML source');
    expect(input.id).not.toBe('');
    expect(container.querySelector('label')!.htmlFor).toBe(input.id);
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input, 'Edited');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith('Edited');
    await render({ value: 'Edited', onChange });
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="重试编辑器"]')!.click());
    expect(adapter.init).toHaveBeenCalledTimes(2);
    expect(container.querySelector('textarea')).toBeNull();
    expect(adapter.props.value).toBe('Edited');
  });

  it('ends indefinite initialization and adapter mounting with a disabled fallback', async () => {
    vi.useFakeTimers(); adapter.mount = false;
    await render({ disabled: true });
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    await act(async () => { vi.advanceTimersByTime(10000); });
    expect(container.querySelector('textarea')!.disabled).toBe(true);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('ignores a late loader resolution after timeout until explicitly retried', async () => {
    vi.useFakeTimers();
    let resolve!: (monaco: Monaco) => void;
    adapter.init.mockReturnValueOnce(new Promise<Monaco>(done => { resolve = done; }));
    await render();
    await act(async () => { vi.advanceTimersByTime(10000); });
    await act(async () => resolve(adapter.monaco));
    expect(container.querySelector('textarea')).not.toBeNull();
  });

  it('keeps a bounded editor height throughout loading and failure', async () => {
    adapter.init.mockReturnValue(new Promise(() => {}));
    await render({ height: 900, maxHeight: 500 });
    expect(container.querySelector<HTMLElement>('.ui-monaco-code-editor-surface')!.style.height).toBe('500px');
    await render({ height: 20, minHeight: 160, maxHeight: 500 });
    expect(container.querySelector<HTMLElement>('.ui-monaco-code-editor-surface')!.style.height).toBe('160px');
  });
});
