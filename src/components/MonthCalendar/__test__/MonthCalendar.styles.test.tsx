import { Window } from 'happy-dom';
import { compile } from 'sass';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MonthCalendar } from '../MonthCalendar';

const css = compile('src/styles/index.scss').css;

describe('MonthCalendar responsive styles', () => {
  it.each([320, 375, 768, 1440])('retains seven fixed columns at %ipx', (width) => {
    const window = new Window({ width });
    const document = window.document;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
    document.body.innerHTML = renderToStaticMarkup(<MonthCalendar month={new Date(2024, 1, 1)}
      onMonthChange={() => {}} onValueChange={() => {}} events={[]} />);
    const rows = document.querySelectorAll('.ui-month-calendar-week');
    expect(rows).toHaveLength(7);
    for (const row of rows) {
      expect(window.getComputedStyle(row).gridTemplateColumns).toBe('repeat(7, minmax(0, 1fr))');
      expect(row.children).toHaveLength(7);
    }
    const button = document.querySelector('.ui-month-calendar-day')!;
    expect(window.getComputedStyle(button).height).toBe(width <= 512 ? '52px' : '64px');
    window.close();
  });
});
