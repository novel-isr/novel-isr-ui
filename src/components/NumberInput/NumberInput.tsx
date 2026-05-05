/**
 * NumberInput —— 数字输入框，含 stepper 按钮 + 类型守护。
 *
 *   <NumberInput value={n} onChange={setN} min={0} max={100} step={1} />
 *   <NumberInput value={n} onChange={setN} step={0.01} precision={2} hideStepper />
 *
 * 跟原生 <input type="number"> 比的优势：
 *   - 跨浏览器一致的 stepper 视觉（Safari / Firefox / Chrome 自带的 spin button 各家一套）
 *   - 强约束 min/max（粘贴溢出值会自动 clamp，不像原生只在 step 时拒绝）
 *   - precision 保证不会因为浮点误差出现 0.30000000000004
 *   - 受控时只在「值真改变」回调，不会因为非数字字符乱触发
 *   - 滚轮滚动时不会偷偷改值（关掉无障碍的反向操作风险）
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useFormControlProps } from '../FormControl/FormControl';

export type NumberInputSize = 'sm' | 'md' | 'lg';

export interface NumberInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** 小数位数；默认按 step 推导（step=1 → 0, step=0.01 → 2） */
  precision?: number;
  size?: NumberInputSize;
  isInvalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /**
   * 显示右侧 chevron up/down stepper 按钮。默认 false（不显示）——
   * 大多数 admin / 移动端场景下 stepper 多余且占空间，需要时显式开启。
   * 键盘 ArrowUp/Down 始终可调（不依赖此选项）。
   */
  showStepper?: boolean;
  /** 允许清空（输入空字符串时回调 null）；默认 true */
  allowEmpty?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

function inferPrecision(step?: number): number {
  if (!step || step >= 1) return 0;
  const s = String(step);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

function clamp(n: number, min?: number, max?: number): number {
  let v = n;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  return v;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(props, ref) {
    const {
      value,
      onChange,
      min,
      max,
      step = 1,
      precision: precisionProp,
      size = 'md',
      isInvalid: isInvalidProp = false,
      disabled,
      placeholder,
      showStepper = false,
      allowEmpty = true,
      className,
      ...attrs
    } = props;

    const fc = useFormControlProps({ id: attrs.id, disabled });
    const isInvalid = isInvalidProp || !!fc['aria-invalid'];
    const isDisabled = !!fc.disabled;
    const precision = precisionProp ?? inferPrecision(step);

    /* draft：编辑期间允许中间态字符串（"1." / "-" / 空），失焦或显式 commit 时
     * 才规范化成 number。如果只受控传 value，每次 keystroke 都会被父级 sanitize
     * 后回弹，导致用户输不进负号 / 小数点。 */
    const [draft, setDraft] = useState<string>(() => valueToString(value, precision));

    /* value 变了（外部更新或步进按钮）→ 同步到 draft，但只在 draft 不是已 focus 的
     * 中间态时同步，避免抢用户键盘。 */
    useEffect(() => {
      setDraft((current) => {
        const stable = valueToString(value, precision);
        const numericCurrent = parseDraft(current);
        if (numericCurrent !== null && numericCurrent === value) return current;
        return stable;
      });
    }, [value, precision]);

    const commit = useCallback(
      (next: string) => {
        if (next === '' || next === '-') {
          if (allowEmpty) {
            onChange(null);
            setDraft('');
          } else {
            const fallback = clamp(min ?? 0, min, max);
            onChange(Number(fallback.toFixed(precision)));
            setDraft(fallback.toFixed(precision));
          }
          return;
        }
        const parsed = parseDraft(next);
        if (parsed === null) {
          // 非法输入退回上次合法值
          setDraft(valueToString(value, precision));
          return;
        }
        const clamped = clamp(parsed, min, max);
        const rounded = Number(clamped.toFixed(precision));
        onChange(rounded);
        setDraft(rounded.toFixed(precision));
      },
      [onChange, value, min, max, precision, allowEmpty],
    );

    const adjust = (delta: number) => {
      if (isDisabled) return;
      const base = parseDraft(draft) ?? value ?? 0;
      const next = clamp(base + delta, min, max);
      const rounded = Number(next.toFixed(precision));
      onChange(rounded);
      setDraft(rounded.toFixed(precision));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (isDisabled) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjust(step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjust(-step);
      } else if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      commit(e.currentTarget.value);
    };

    return (
      <div
        className={cn(
          'ui-number-input-root',
          `ui-number-input-size-${size}`,
          isInvalid && 'ui-number-input-error',
          isDisabled && 'ui-number-input-disabled',
          !showStepper && 'ui-number-input-no-stepper',
          className,
        )}
        data-invalid={isInvalid || undefined}
        data-disabled={isDisabled || undefined}
      >
        <input
          ref={ref}
          inputMode="decimal"
          type="text"
          className="ui-number-input-field"
          value={draft}
          placeholder={placeholder}
          {...fc}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label={attrs['aria-label']}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value ?? undefined}
        />
        {showStepper && (
          <div className="ui-number-input-stepper" aria-hidden="true">
            <button
              type="button"
              className="ui-number-input-step ui-number-input-step-up"
              tabIndex={-1}
              disabled={isDisabled || (max !== undefined && (value ?? 0) >= max)}
              onClick={() => adjust(step)}
              aria-label="增加"
            >
              <ChevronUp size={12} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="ui-number-input-step ui-number-input-step-down"
              tabIndex={-1}
              disabled={isDisabled || (min !== undefined && (value ?? 0) <= min)}
              onClick={() => adjust(-step)}
              aria-label="减少"
            >
              <ChevronDown size={12} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    );
  },
);

function valueToString(v: number | null | undefined, precision: number): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '';
  return v.toFixed(precision);
}

function parseDraft(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  /* 只允许数字、单个 - 在前、单个 . 中间。Number(trimmed) 处理科学记数法等
   * 但我们刻意不允许 e/E（输入数字时科学记数法是误触陷阱）。 */
  if (!/^-?\d*(\.\d*)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
