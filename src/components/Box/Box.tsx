/**
 * Box —— polymorphic 容器，最小集 sx-like prop。
 *
 *   <Box p="4" bg="bg.subtle" rounded="md">              // padding 16px + 浅灰背景 + 圆角
 *   <Box as="section" maxW="720px" mx="auto">            // 居中 max-width 容器
 *
 * 不做 Chakra-style 完整 style props 系统（每个 CSS 属性都映射 prop）—— 太重。
 * 只覆盖 80% 场景的 props：margin / padding / 宽高 / 背景 / 圆角 / 阴影。
 * 复杂样式用 className + .scss 写。
 */

import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes } from 'react';

type SpaceValue = string | number;

/** 解析 spacing：数字/纯数字字符串 → token；否则原样 */
function space(v: SpaceValue | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return `var(--ui-space-${v})`;
  if (/^\d+(\.\d+)?$/.test(v)) return `var(--ui-space-${v})`;
  return v;
}

/** semantic bg alias：bg.subtle / bg.muted / bg.emphasis */
function bgValue(v: string | undefined): string | undefined {
  if (!v) return undefined;
  if (v.startsWith('bg.')) {
    return `var(--ui-color-${v.replace('.', '-')})`;
  }
  return v;
}

/** radius token：sm/md/lg/full 或 CSS value */
function radius(v: string | undefined): string | undefined {
  if (!v) return undefined;
  if (['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].includes(v)) {
    return `var(--ui-radius-${v})`;
  }
  return v;
}

/** shadow token：sm/md/lg/xl */
function shadow(v: string | undefined): string | undefined {
  if (!v) return undefined;
  if (['sm', 'md', 'lg', 'xl'].includes(v)) {
    return `var(--ui-shadow-${v})`;
  }
  return v;
}

export interface BoxProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;

  // padding
  p?: SpaceValue;
  px?: SpaceValue;
  py?: SpaceValue;
  pt?: SpaceValue;
  pr?: SpaceValue;
  pb?: SpaceValue;
  pl?: SpaceValue;

  // margin
  m?: SpaceValue;
  mx?: SpaceValue;
  my?: SpaceValue;
  mt?: SpaceValue;
  mr?: SpaceValue;
  mb?: SpaceValue;
  ml?: SpaceValue;

  // size
  w?: string | number;
  h?: string | number;
  minW?: string | number;
  minH?: string | number;
  maxW?: string | number;
  maxH?: string | number;

  // visual
  bg?: string;
  rounded?: string;
  boxShadow?: string;
  border?: string;
}

export const Box = forwardRef<HTMLElement, BoxProps>(function Box(props, ref) {
  const {
    as = 'div',
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    w,
    h,
    minW,
    minH,
    maxW,
    maxH,
    bg,
    rounded,
    boxShadow,
    border,
    style,
    children,
    ...rest
  } = props;

  const Tag = as as ElementType;

  const computed: CSSProperties = {
    ...(p !== undefined && { padding: space(p) }),
    ...(px !== undefined && { paddingLeft: space(px), paddingRight: space(px) }),
    ...(py !== undefined && { paddingTop: space(py), paddingBottom: space(py) }),
    ...(pt !== undefined && { paddingTop: space(pt) }),
    ...(pr !== undefined && { paddingRight: space(pr) }),
    ...(pb !== undefined && { paddingBottom: space(pb) }),
    ...(pl !== undefined && { paddingLeft: space(pl) }),
    ...(m !== undefined && { margin: space(m) }),
    ...(mx !== undefined && { marginLeft: space(mx), marginRight: space(mx) }),
    ...(my !== undefined && { marginTop: space(my), marginBottom: space(my) }),
    ...(mt !== undefined && { marginTop: space(mt) }),
    ...(mr !== undefined && { marginRight: space(mr) }),
    ...(mb !== undefined && { marginBottom: space(mb) }),
    ...(ml !== undefined && { marginLeft: space(ml) }),
    ...(w !== undefined && { width: typeof w === 'number' ? `${w}px` : w }),
    ...(h !== undefined && { height: typeof h === 'number' ? `${h}px` : h }),
    ...(minW !== undefined && { minWidth: typeof minW === 'number' ? `${minW}px` : minW }),
    ...(minH !== undefined && { minHeight: typeof minH === 'number' ? `${minH}px` : minH }),
    ...(maxW !== undefined && { maxWidth: typeof maxW === 'number' ? `${maxW}px` : maxW }),
    ...(maxH !== undefined && { maxHeight: typeof maxH === 'number' ? `${maxH}px` : maxH }),
    ...(bg !== undefined && { background: bgValue(bg) }),
    ...(rounded !== undefined && { borderRadius: radius(rounded) }),
    ...(boxShadow !== undefined && { boxShadow: shadow(boxShadow) }),
    ...(border !== undefined && { border: border }),
    ...style,
  };

  return (
    <Tag ref={ref} style={computed} {...rest}>
      {children}
    </Tag>
  );
});
