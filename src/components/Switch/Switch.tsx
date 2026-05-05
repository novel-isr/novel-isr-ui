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

  /**
   * 用 <span> 而不是 <label>。Radix Switch 渲染 <button>；HTML <label> 只对
   * <input> 有 implicit-click 转发，对 <button> 无效；且被 Tooltip 用 asChild
   * 包起来时 Radix 会把 pointerdown 挂到 <label>，部分浏览器把 click 截在
   * label 阶段，让人误以为「点不动」。span 没有这层语义负担。
   */
  return (
    <span
      className={cn(
        'ui-switch-root',
        `ui-switch-size-${size}`,
        segmented && 'ui-switch-segmented',
        className,
      )}
      data-disabled={isDisabled || undefined}
      data-state={checked ? 'checked' : 'unchecked'}
    >
      {segmented && (
        <button
          type="button"
          className={cn(
            'ui-switch-side ui-switch-side-off',
            !checked && 'ui-switch-side-active',
          )}
          disabled={isDisabled}
          aria-pressed={!checked}
          onClick={() => rest.onCheckedChange?.(false)}
        >
          {offLabel}
        </button>
      )}
      <RadixSwitch.Root
        ref={ref}
        className="ui-switch-control"
        disabled={isDisabled}
        {...rest}
      >
        <RadixSwitch.Thumb className="ui-switch-thumb" />
      </RadixSwitch.Root>
      {segmented && (
        <button
          type="button"
          className={cn(
            'ui-switch-side ui-switch-side-on',
            checked && 'ui-switch-side-active',
          )}
          disabled={isDisabled}
          aria-pressed={Boolean(checked)}
          onClick={() => rest.onCheckedChange?.(true)}
        >
          {onLabel}
        </button>
      )}
      {children && !segmented && <span className="ui-switch-text">{children}</span>}
    </span>
  );
});
