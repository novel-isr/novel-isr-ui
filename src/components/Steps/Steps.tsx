import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface StepItem { value: string; label: ReactNode; disabled?: boolean; }
export interface StepsProps { items: StepItem[]; value: string; onValueChange?: (value: string) => void; label?: string; className?: string; }

export function Steps({ items, value, onValueChange, label = '步骤', className }: StepsProps) {
  const current = items.findIndex(item => item.value === value);
  return <ol className={cn('ui-steps', className)} aria-label={label}>{items.map((item, index) => (
    <li key={item.value} className={cn('ui-step', index === current && 'is-current', index < current && 'is-complete')}>
      <button type="button" disabled={item.disabled || !onValueChange} aria-current={item.value === value ? 'step' : undefined}
        onClick={() => { if (item.value !== value) onValueChange?.(item.value); }}>
        <span className="ui-step-number" aria-hidden="true">{index + 1}</span><span>{item.label}</span>
      </button>
    </li>
  ))}</ol>;
}
