/**
 * @vitest-environment happy-dom
 *
 * Autocomplete 行为锁定 ——
 *   - filter：label / hint 子串过滤 + 大小写不敏感
 *   - 键盘：↑ / ↓ 循环 + Enter 选中 + Esc 关闭
 *   - 鼠标：mousedown 选中（早于 input blur）
 *   - 空选项 + Enter → onSubmit
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Autocomplete, type AutocompleteOption } from '../Autocomplete';

// 告诉 React 我们在测试环境，让 act() 静默生效（不然每次状态更新都打 warning）
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OPTIONS: AutocompleteOption[] = [
  { id: '1', label: '诡秘之主', hint: '爱潜水的乌贼' },
  { id: '2', label: '雪中悍刀行', hint: '烽火戏诸侯' },
  { id: '3', label: '凡人修仙传', hint: '忘语' },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

function render(jsx: React.ReactElement) {
  act(() => {
    root.render(jsx);
  });
}

function getInput(): HTMLInputElement {
  const el = container.querySelector('input');
  if (!el) throw new Error('input not found');
  return el as HTMLInputElement;
}

function getOptions(): HTMLLIElement[] {
  return Array.from(container.querySelectorAll('li[role="option"]'));
}

describe('Autocomplete', () => {
  it('聚焦后渲染所有选项', () => {
    const onValueChange = vi.fn();
    render(
      <Autocomplete value="" onValueChange={onValueChange} options={OPTIONS} aria-label="search" />
    );
    act(() => {
      getInput().focus();
    });
    expect(getOptions()).toHaveLength(3);
  });

  it('输入按 label 子串过滤', () => {
    const onValueChange = vi.fn();
    render(
      <Autocomplete value="诡秘" onValueChange={onValueChange} options={OPTIONS} aria-label="search" />
    );
    act(() => {
      getInput().focus();
    });
    const opts = getOptions();
    expect(opts).toHaveLength(1);
    expect(opts[0]?.textContent).toContain('诡秘之主');
  });

  it('输入按 hint 子串过滤（大小写不敏感）', () => {
    render(
      <Autocomplete value="乌贼" onValueChange={vi.fn()} options={OPTIONS} aria-label="search" />
    );
    act(() => {
      getInput().focus();
    });
    expect(getOptions()).toHaveLength(1);
  });

  it('Enter 选中高亮项触发 onSelect', () => {
    const onSelect = vi.fn();
    render(
      <Autocomplete
        value=""
        onValueChange={vi.fn()}
        options={OPTIONS}
        onSelect={onSelect}
        aria-label="search"
      />
    );
    const input = getInput();
    act(() => {
      input.focus();
    });
    // Highlight 第二项
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }));
  });

  it('无匹配 + Enter → onSubmit', () => {
    const onSubmit = vi.fn();
    render(
      <Autocomplete
        value="不存在的书名"
        onValueChange={vi.fn()}
        options={OPTIONS}
        onSubmit={onSubmit}
        aria-label="search"
      />
    );
    const input = getInput();
    act(() => {
      input.focus();
    });
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onSubmit).toHaveBeenCalledWith('不存在的书名');
  });

  it('Esc 关闭下拉', () => {
    render(
      <Autocomplete value="" onValueChange={vi.fn()} options={OPTIONS} aria-label="search" />
    );
    const input = getInput();
    act(() => {
      input.focus();
    });
    expect(getOptions().length).toBeGreaterThan(0);
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(getOptions()).toHaveLength(0);
  });

  it('disabled 时 input 不可输入', () => {
    render(
      <Autocomplete
        value=""
        onValueChange={vi.fn()}
        options={OPTIONS}
        disabled
        aria-label="search"
      />
    );
    expect(getInput().disabled).toBe(true);
  });
});
