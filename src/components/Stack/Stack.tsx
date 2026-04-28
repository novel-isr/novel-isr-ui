/**
 * Stack / HStack / VStack —— flex 布局容器。
 */

import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

const alignMap: Record<FlexAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const justifyMap: Record<FlexJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

function resolveSpace(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return `var(--ui-space-${v})`;
  if (/^\d+(\.\d+)?$/.test(v)) return `var(--ui-space-${v})`;
  return v;
}

export interface StackProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  direction?: FlexDirection;
  gap?: string | number;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: boolean;
}

export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(props, ref) {
  const {
    as = 'div',
    direction = 'column',
    gap,
    align,
    justify,
    wrap,
    style,
    className,
    children,
    ...rest
  } = props;

  const Tag = as as ElementType;
  const computedStyle: CSSProperties = {
    ...(gap !== undefined && { gap: resolveSpace(gap) }),
    ...(align && { alignItems: alignMap[align] }),
    ...(justify && { justifyContent: justifyMap[justify] }),
    ...style,
  };

  return (
    <Tag
      ref={ref}
      className={cn('ui-stack', `ui-stack-${direction}`, wrap && 'ui-stack-wrap', className)}
      style={computedStyle}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export const HStack = forwardRef<HTMLElement, Omit<StackProps, 'direction'>>(function HStack(
  props,
  ref
) {
  return <Stack ref={ref} direction="row" align={props.align ?? 'center'} {...props} />;
});

export const VStack = forwardRef<HTMLElement, Omit<StackProps, 'direction'>>(function VStack(
  props,
  ref
) {
  return <Stack ref={ref} direction="column" align={props.align ?? 'stretch'} {...props} />;
});
