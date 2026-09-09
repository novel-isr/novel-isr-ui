import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button, IconButton } from '../Button';
import { cn } from '../../utils/cn';

export interface MonthCalendarEvent {
  id: string;
  /** Local YYYY-MM-DD, without a time or timezone. */
  date: string;
  title: string;
}

export interface MonthCalendarProps {
  month: Date;
  /** Receives the first day of the requested month, at local midnight. */
  onMonthChange: (month: Date) => void;
  value?: string;
  onValueChange: (dayKey: string) => void;
  events: readonly MonthCalendarEvent[];
  onEventClick?: (event: MonthCalendarEvent) => void;
  disabled?: boolean;
  showSelectedDayEvents?: boolean;
  className?: string;
  'aria-label'?: string;
}

function localDate(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayKey(date: Date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number) {
  return localDate(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function monthStart(date: Date, offset = 0) {
  return localDate(date.getFullYear(), date.getMonth() + offset, 1);
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function MonthCalendar({
  month, onMonthChange, value, onValueChange, events, onEventClick,
  disabled = false, showSelectedDayEvents = true, className, 'aria-label': label = '月历',
}: MonthCalendarProps) {
  const headingId = useId();
  const [focusedKey, setFocusedKey] = useState('');
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  const first = monthStart(month);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const visibleKeys = days.map(dayKey);
  const today = new Date();
  const todayKey = dayKey(today);
  const activeKey = [focusedKey, value, sameMonth(today, month) ? todayKey : '', dayKey(first)]
    .find(key => key && visibleKeys.includes(key));
  const monthKey = dayKey(first);
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.date, (counts.get(event.date) ?? 0) + 1);
  const selectedEvents = events.filter(event => event.date === value);

  useEffect(() => {
    if (disabled || !pendingFocus.current) return;
    const button = buttons.current.get(pendingFocus.current);
    if (button) {
      pendingFocus.current = null;
      button.focus();
    }
  }, [monthKey, focusedKey, disabled]);

  function select(date: Date) {
    if (disabled) return;
    onValueChange(dayKey(date));
    if (!sameMonth(date, month)) onMonthChange(monthStart(date));
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!event.repeat) select(date);
      return;
    }
    let target: Date;
    const weekday = (date.getDay() + 6) % 7;
    switch (event.key) {
      case 'ArrowLeft': target = addDays(date, -1); break;
      case 'ArrowRight': target = addDays(date, 1); break;
      case 'ArrowUp': target = addDays(date, -7); break;
      case 'ArrowDown': target = addDays(date, 7); break;
      case 'Home': target = addDays(date, -weekday); break;
      case 'End': target = addDays(date, 6 - weekday); break;
      case 'PageUp':
      case 'PageDown': {
        const offset = (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1);
        const next = monthStart(date, offset);
        const lastDay = addDays(monthStart(next, 1), -1).getDate();
        target = localDate(next.getFullYear(), next.getMonth(), Math.min(date.getDate(), lastDay));
        break;
      }
      default: return;
    }
    event.preventDefault();
    pendingFocus.current = dayKey(target);
    setFocusedKey(dayKey(target));
    if (!sameMonth(target, month)) onMonthChange(monthStart(target));
  }

  return (
    <section className={cn('ui-month-calendar', className)} aria-label={label} aria-disabled={disabled || undefined}>
      <div className="ui-month-calendar-toolbar">
        <h2 id={headingId} aria-live="polite">{month.getFullYear()}年{month.getMonth() + 1}月</h2>
        <div className="ui-month-calendar-navigation">
          <IconButton label="上个月" disabled={disabled} onClick={() => onMonthChange(monthStart(month, -1))}>
            <ChevronLeft />
          </IconButton>
          <Button variant="ghost" intent="neutral" aria-label="今天" disabled={disabled}
            leftIcon={<CalendarDays size={16} aria-hidden="true" />} onClick={() => onMonthChange(monthStart(new Date()))}>
            今天
          </Button>
          <IconButton label="下个月" disabled={disabled} onClick={() => onMonthChange(monthStart(month, 1))}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>
      <div role="grid" aria-labelledby={headingId} className="ui-month-calendar-grid">
        <div role="row" className="ui-month-calendar-week">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => <div role="columnheader" key={day}>{day}</div>)}
        </div>
        {Array.from({ length: 6 }, (_, week) => (
          <div role="row" className="ui-month-calendar-week" key={week}>
            {days.slice(week * 7, week * 7 + 7).map(date => {
              const key = dayKey(date);
              const count = counts.get(key) ?? 0;
              return (
                <div role="gridcell" aria-selected={value === key} key={key}>
                  <Button variant="ghost" intent="neutral" className="ui-month-calendar-day"
                    ref={element => { if (element) buttons.current.set(key, element); else buttons.current.delete(key); }}
                    data-date={key} data-outside={!sameMonth(date, month) || undefined}
                    aria-label={`${key}${count ? `，${count} 项日程` : ''}`}
                    aria-pressed={value === key} aria-current={key === todayKey ? 'date' : undefined}
                    disabled={disabled} tabIndex={!disabled && key === activeKey ? 0 : -1}
                    onFocus={() => setFocusedKey(key)} onClick={() => select(date)} onKeyDown={event => handleKey(event, date)}>
                    <span>{date.getDate()}</span>
                    <span className="ui-month-calendar-count" aria-hidden="true">{count ? (count > 99 ? '99+' : count) : '\u00a0'}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {showSelectedDayEvents && value && (
        <section className="ui-month-calendar-events" aria-label={`${value} 日程`}>
          <h3>{value}</h3>
          {selectedEvents.length ? <ul>{selectedEvents.map(event => (
            <li key={event.id}>{onEventClick ? (
              <Button variant="ghost" intent="neutral" disabled={disabled} aria-label={event.title}
                onClick={() => onEventClick(event)}>{event.title}</Button>
            ) : <span>{event.title}</span>}</li>
          ))}</ul> : <p>暂无日程</p>}
        </section>
      )}
    </section>
  );
}
