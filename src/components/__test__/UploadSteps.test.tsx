// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as UI from '../../index';

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('shared upload and steps', () => {
  it('exports the reusable controls', () => {
    expect(UI).toHaveProperty('Upload');
    expect(UI).toHaveProperty('Steps');
  });
  it('accepts image drops and rejects unsupported or oversized files', () => {
    const onFilesSelected = vi.fn();
    act(() => root.render(<UI.Upload label="Cover" accept="image/*" maxSize={8}
      value={[]} onFilesSelected={onFilesSelected} />));
    const drop = (file: File) => {
      const event = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });
      act(() => container.querySelector('.ui-upload-dropzone')!.dispatchEvent(event));
    };
    const file = new File(['png'], 'cover.png', { type: 'image/png' });
    drop(file);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
    drop(new File(['text'], 'notes.txt', { type: 'text/plain' }));
    drop(new File(['123456789'], 'large.png', { type: 'image/png' }));
    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });
  it('blocks selection when busy or at capacity and preserves controlled retry/remove', () => {
    const onFilesSelected = vi.fn(); const onRemove = vi.fn(); const onRetry = vi.fn();
    const item = { id: 'failed', name: 'cover.png', status: 'error' as const, error: 'Offline' };
    act(() => root.render(<UI.Upload label="Cover" value={[item]} maxCount={1}
      onFilesSelected={onFilesSelected} onRemove={onRemove} onRetry={onRetry} />));
    expect(container.querySelector('input')!.disabled).toBe(true);
    act(() => (container.querySelector('[aria-label="重试 cover.png"]') as HTMLButtonElement).click());
    expect(onRetry).toHaveBeenCalledWith(item);
    act(() => (container.querySelector('[aria-label="移除 cover.png"]') as HTMLButtonElement).click());
    expect(onRemove).toHaveBeenCalledWith(item);
    act(() => root.render(<UI.Upload label="Cover" value={[]} busy onFilesSelected={onFilesSelected} />));
    expect(container.querySelector('input')!.disabled).toBe(true);
  });
  it('rejects excess files instead of silently dropping them and can reselect the same file', () => {
    const onFilesSelected = vi.fn();
    act(() => root.render(<UI.Upload label="Files" value={[]} multiple maxCount={2} onFilesSelected={onFilesSelected} />));
    const input = container.querySelector('input')!;
    const file = new File(['a'], 'a.txt');
    Object.defineProperty(input, 'files', { configurable: true, value: [file, file, file] });
    act(() => input.dispatchEvent(new Event('change', { bubbles: true })));
    expect(onFilesSelected).not.toHaveBeenCalled();
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    act(() => input.dispatchEvent(new Event('change', { bubbles: true })));
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
    expect(input.value).toBe('');
  });
  it('uses native disabled steps and exposes the current step', () => {
    const onValueChange = vi.fn();
    act(() => root.render(<UI.Steps value="draft" onValueChange={onValueChange} items={[
      { value: 'draft', label: 'Draft' }, { value: 'review', label: 'Review' },
      { value: 'published', label: 'Published', disabled: true },
    ]} />));
    const buttons = container.querySelectorAll('button');
    expect(buttons[0]!.getAttribute('aria-current')).toBe('step');
    act(() => buttons[1]!.click());
    act(() => buttons[2]!.click());
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('review');
    expect(buttons[2]!.disabled).toBe(true);
  });
  it('allows single-file replacement without requiring the saved file to be removed first', () => {
    const onFilesSelected = vi.fn();
    act(() => root.render(<UI.Upload label="Cover" value={[{ id: 'saved', name: 'old.png', status: 'done' }]}
      replace onFilesSelected={onFilesSelected} />));
    const input = container.querySelector('input')!;
    expect(input.disabled).toBe(false);
    const file = new File(['png'], 'new.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    act(() => input.dispatchEvent(new Event('change', { bubbles: true })));
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });
});
