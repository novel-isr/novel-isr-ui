// @vitest-environment happy-dom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MonthCalendar, type MonthCalendarProps } from '../MonthCalendar';

let container: HTMLDivElement;
let root: Root;
const events = [
  { id: 'a', date: '2024-02-29', title: 'Release' },
  { id: 'b', date: '2024-03-01', title: 'Review' },
];
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); });
function render(props: Partial<MonthCalendarProps> = {}) {
  act(() => root.render(<MonthCalendar month={new Date(2024, 1, 29)}
    onMonthChange={vi.fn()} onValueChange={vi.fn()} events={events} {...props} />));
}
function button(label: string) {
  return container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
}
function day(key: string) {
  return container.querySelector<HTMLButtonElement>(`button[data-date="${key}"]`)!;
}
function key(element: HTMLElement, value: string) {
  act(() => element.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })));
}

describe('MonthCalendar', () => {
  it.each([
    [new Date(2024, 1, 29), '2024-01-29', '2024-03-10'],
    [new Date(2025, 11, 31), '2025-12-01', '2026-01-11'],
    [new Date(2026, 1, 1), '2026-01-26', '2026-03-08'],
  ])('renders six Monday-first weeks for %s', (month, first, last) => {
    render({ month });
    const days = container.querySelectorAll('button[data-date]');
    expect(days).toHaveLength(42);
    expect(days[0]!.getAttribute('data-date')).toBe(first);
    expect(days[41]!.getAttribute('data-date')).toBe(last);
    expect(container.querySelectorAll('[role="columnheader"]')).toHaveLength(7);
    expect(container.querySelector('[role="columnheader"]')!.textContent).toBe('一');
    expect(container.querySelectorAll('button[data-date][tabindex="0"]')).toHaveLength(1);
  });

  it.each([
    [new Date(2025, 11, 31), '下个月', new Date(2026, 0, 1)],
    [new Date(2026, 0, 31), '上个月', new Date(2025, 11, 1)],
    [new Date(2024, 0, 31), '下个月', new Date(2024, 1, 1)],
  ])('navigates without overflowing a month or mutating the input', (month, label, expected) => {
    const before = month.getTime(); const onMonthChange = vi.fn();
    render({ month, onMonthChange });
    act(() => button(label).click());
    expect(onMonthChange).toHaveBeenCalledWith(expected);
    expect(month.getTime()).toBe(before);
  });

  it('returns to the local current month without changing the controlled selection', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 0, 1, 0, 15));
    const onMonthChange = vi.fn(); const onValueChange = vi.fn();
    render({ onMonthChange, onValueChange });
    act(() => button('今天').click());
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 0, 1));
    expect(onValueChange).not.toHaveBeenCalled();
    render({ month: new Date(2026, 0, 1) });
    expect(day('2026-01-01').getAttribute('aria-current')).toBe('date');
  });

  it('keeps selection controlled and displays only selected-day events on demand', () => {
    const onValueChange = vi.fn(); const onEventClick = vi.fn();
    render({ value: '2024-02-29', onValueChange, onEventClick });
    act(() => day('2024-03-01').click());
    expect(onValueChange).toHaveBeenCalledWith('2024-03-01');
    expect(day('2024-02-29').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[aria-label="2024-02-29 日程"]')!.textContent).toContain('Release');
    expect(container.querySelector('[aria-label="2024-02-29 日程"]')!.textContent).not.toContain('Review');
    act(() => button('Release').click());
    expect(onEventClick).toHaveBeenCalledWith(events[0]);
    render({ value: '2024-02-29', showSelectedDayEvents: false });
    expect(container.querySelector('[aria-label="2024-02-29 日程"]')).toBeNull();
  });

  it('moves keyboard focus across years and clamps PageDown to the last day of February', () => {
    function Controlled() {
      const [month, setMonth] = useState(new Date(2023, 11, 1));
      const [value, setValue] = useState('2023-12-31');
      return <MonthCalendar month={month} onMonthChange={setMonth} value={value}
        onValueChange={setValue} events={[]} />;
    }
    act(() => root.render(<Controlled />));
    act(() => day('2023-12-31').focus());
    key(day('2023-12-31'), 'ArrowRight');
    expect(document.activeElement).toBe(day('2024-01-01'));
    key(day('2024-01-01'), 'End');
    expect(document.activeElement).toBe(day('2024-01-07'));
    key(day('2024-01-07'), 'Home');
    expect(document.activeElement).toBe(day('2024-01-01'));
    act(() => day('2024-01-31').focus());
    key(day('2024-01-31'), 'PageDown');
    expect(document.activeElement).toBe(day('2024-02-29'));
    key(day('2024-02-29'), 'Enter');
    expect(day('2024-02-29').getAttribute('aria-pressed')).toBe('true');
    key(day('2024-02-29'), 'ArrowDown');
    expect(document.activeElement).toBe(day('2024-03-07'));
    key(day('2024-03-07'), ' ');
    expect(day('2024-03-07').getAttribute('aria-pressed')).toBe('true');
    key(day('2024-03-07'), 'PageUp');
    expect(document.activeElement).toBe(day('2024-02-07'));
    key(day('2024-02-07'), 'ArrowUp');
    expect(document.activeElement).toBe(day('2024-01-31'));
  });

  it('blocks all navigation, selection and event callbacks when disabled', () => {
    const onMonthChange = vi.fn(); const onValueChange = vi.fn(); const onEventClick = vi.fn();
    render({ disabled: true, value: '2024-02-29', onMonthChange, onValueChange, onEventClick });
    for (const element of container.querySelectorAll('button')) {
      expect(element.disabled).toBe(true);
      act(() => element.click());
    }
    key(day('2024-02-29'), 'ArrowRight'); key(day('2024-02-29'), 'Enter');
    expect(onMonthChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onEventClick).not.toHaveBeenCalled();
  });
});
