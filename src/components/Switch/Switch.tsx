/**
 * Switch —— 开关 toggle，基于 Radix Switch primitives。
 *
 * 单标签（紧凑）：
 *   <Switch checked={dark} onCheckedChange={setDark}>深色模式</Switch>
 *
 * 双标签 / segmented（左右各一标签，整条都能点）：
 *   <Switch
 *     checked={enabled}
 *     onCheckedChange={setEnabled}
 *     offLabel="Business BFF"
 *     onLabel="Mock fixture"
 *   />
 *   ─ 高亮的是当前 active 一侧；点 label 等于 set 该侧。
 */

import * as RadixSwitch from '@radix-ui/react-switch';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useFormControlContext } from '../FormControl/FormControl';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<RadixSwitch.SwitchProps, 'asChild' | 'children'> {
  size?: SwitchSize;
  /** 单标签：右侧紧凑文本，会随 checked 切换颜色 */
  children?: ReactNode;
  /** 双标签的左侧（off 状态）。提供 offLabel + onLabel 时启用 segmented 模式 */
  offLabel?: ReactNode;
  /** 双标签的右侧（on 状态）。和 offLabel 配套用 */
  onLabel?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(props, ref) {
  const { size = 'md', className, children, offLabel, onLabel, ...rest } = props;
  const fc = useFormControlContext();
  const checked = rest.checked ?? rest.defaultChecked;
  const isDisabled = rest.disabled ?? fc?.isDisabled;
  const segmented = offLabel !== undefined && onLabel !== undefined;

  /* segmented 模式直接渲染分段 pill —— 两半各一个 button，激活半有 brand 底色。
   * 不再渲染 Radix Switch 的 slider thumb：当左右都是显式文本时，中间的滑块
   * 既不传额外信息又容易跟「Switch 看上去有方向感但点了不动」的体验割裂。
   * iOS / macOS 的 SegmentedControl 也是这个范式。
   *
   * 单标签（非 segmented）继续走 Radix Switch + 滑块的原版形态。
   */
  if (segmented) {
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement> as never}
        className={cn(
          'ui-switch-segmented',
          `ui-switch-segmented-size-${size}`,
          className,
        )}
        role="group"
        data-disabled={isDisabled || undefined}
        data-state={checked ? 'checked' : 'unchecked'}
      >
        <button
          type="button"
          className={cn(
            'ui-switch-segment',
            !checked && 'ui-switch-segment-active',
          )}
          disabled={isDisabled}
          aria-pressed={!checked}
          onClick={() => rest.onCheckedChange?.(false)}
        >
          {offLabel}
        </button>
        <button
          type="button"
          className={cn(
            'ui-switch-segment',
            checked && 'ui-switch-segment-active',
          )}
          disabled={isDisabled}
          aria-pressed={Boolean(checked)}
          onClick={() => rest.onCheckedChange?.(true)}
        >
          {onLabel}
        </button>
      </span>
    );
  }

  /* 单标签经典 Switch。<span> 而非 <label> 是因为 Radix Switch 渲染 <button>
   * 而 HTML <label> 对 <button> 没有 implicit click 转发；且被 Tooltip 用
   * asChild 包起来时 Radix 会把 pointerdown 挂到 <label>，部分浏览器把
   * click 截在 label 阶段，让人误以为「点不动」。 */
  return (
    <span
      className={cn('ui-switch-root', `ui-switch-size-${size}`, className)}
      data-disabled={isDisabled || undefined}
      data-state={checked ? 'checked' : 'unchecked'}
    >
      <RadixSwitch.Root
        ref={ref}
        className="ui-switch-control"
        disabled={isDisabled}
        {...rest}
      >
        <RadixSwitch.Thumb className="ui-switch-thumb" />
      </RadixSwitch.Root>
      {children && <span className="ui-switch-text">{children}</span>}
    </span>
  );
});
