/**
 * Switch —— 开关 toggle，基于 Radix Switch primitives。
 *
 * 三种使用形态：
 *
 *   1) 经典滑块（默认 variant="slider"）
 *      <Switch checked={dark} onCheckedChange={setDark} />
 *      <Switch checked={dark} onCheckedChange={setDark}>深色模式</Switch>
 *
 *   2) 滑块 + 双标签（variant="slider" 同时给 offLabel/onLabel）
 *      <Switch
 *        variant="slider"
 *        checked={enabled}
 *        onCheckedChange={setEnabled}
 *        offLabel="Business BFF"
 *        onLabel="Mock fixture"
 *      />
 *      ─ 滑块在中间，左右两个 label 都可点击直接 set 状态。
 *
 *   3) Segmented pill（variant="segmented"，必须给 offLabel/onLabel）
 *      <Switch
 *        variant="segmented"
 *        checked={enabled}
 *        onCheckedChange={setEnabled}
 *        offLabel="Business BFF"
 *        onLabel="Mock fixture"
 *      />
 *      ─ iOS 风格分段控件，激活半 brand 底色，无滑块。
 */

import * as RadixSwitch from '@radix-ui/react-switch';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useFormControlContext } from '../FormControl/FormControl';

export type SwitchSize = 'sm' | 'md' | 'lg';
export type SwitchVariant = 'slider' | 'segmented';
export type SwitchColorScheme = 'brand' | 'success' | 'info' | 'warning' | 'danger';

export interface SwitchProps extends Omit<RadixSwitch.SwitchProps, 'asChild' | 'children'> {
  size?: SwitchSize;
  /**
   * slider（默认）：经典滑块，可单独存在或与 offLabel/onLabel 组合用作「左标签 + 滑块 + 右标签」。
   * segmented：iOS 风格分段控件，没有滑块，offLabel/onLabel 必填。
   */
  variant?: SwitchVariant;
  /**
   * 激活态颜色。默认 brand（品牌蓝）。需要 iOS 经典绿用 success；告警/危险用
   * warning/danger；信息中立用 info。Chakra / Mantine 都是这个 API 形态。
   */
  colorScheme?: SwitchColorScheme;
  /** 单标签紧凑文本（右侧）。仅对 variant="slider" 有意义；和 offLabel/onLabel 互斥（双标签优先） */
  children?: ReactNode;
  /** 左侧标签（off 状态）。配合 onLabel 启用双标签 */
  offLabel?: ReactNode;
  /** 右侧标签（on 状态）。配合 offLabel 启用双标签 */
  onLabel?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(props, ref) {
  const {
    size = 'md',
    variant = 'slider',
    colorScheme = 'brand',
    className,
    children,
    offLabel,
    onLabel,
    ...rest
  } = props;
  const fc = useFormControlContext();
  const checked = rest.checked ?? rest.defaultChecked;
  const isDisabled = rest.disabled ?? fc?.isDisabled;
  const hasBilateralLabels = offLabel !== undefined && onLabel !== undefined;

  // segmented 必须双标签；缺其一时降级成 slider 经典模式（避免渲染空按钮）
  const effectiveVariant: SwitchVariant =
    variant === 'segmented' && hasBilateralLabels ? 'segmented' : 'slider';

  if (effectiveVariant === 'segmented') {
    /* iOS / macOS SegmentedControl 风格：单一视觉 source of truth，激活半带 brand 底。
     * 没有滑块意味着不会出现「滑块和高亮 label 状态打架」。 */
    return (
      <span
        className={cn(
          'ui-switch-segmented',
          `ui-switch-segmented-size-${size}`,
          `ui-switch-color-${colorScheme}`,
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

  /* slider 变体。<span> 而非 <label>：Radix Switch 渲染 <button>，HTML <label>
   * 对 <button> 没有 implicit click 转发；且被 Tooltip 用 asChild 包起来时
   * Radix 会把 pointerdown 挂到外层 <label>，部分浏览器把 click 截在 label 阶段。 */
  return (
    <span
      className={cn(
        'ui-switch-root',
        `ui-switch-size-${size}`,
        `ui-switch-color-${colorScheme}`,
        hasBilateralLabels && 'ui-switch-bilateral',
        className,
      )}
      data-disabled={isDisabled || undefined}
      data-state={checked ? 'checked' : 'unchecked'}
    >
      {hasBilateralLabels && (
        <button
          type="button"
          className={cn(
            'ui-switch-side ui-switch-side-off',
            !checked && 'ui-switch-side-active',
          )}
          disabled={isDisabled}
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
      {hasBilateralLabels && (
        <button
          type="button"
          className={cn(
            'ui-switch-side ui-switch-side-on',
            checked && 'ui-switch-side-active',
          )}
          disabled={isDisabled}
          onClick={() => rest.onCheckedChange?.(true)}
        >
          {onLabel}
        </button>
      )}
      {children && !hasBilateralLabels && (
        <span className="ui-switch-text">{children}</span>
      )}
    </span>
  );
});
