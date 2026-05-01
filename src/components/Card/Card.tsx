/**
 * Card —— 内容容器。比 Box 多一层语义：默认有边框、圆角、可选阴影；
 * `interactive` 模式下提供 hover / focus 反馈，适合做可点击卡片。
 *
 * 用法：
 *   <Card>普通内容</Card>
 *   <Card variant="elevated">阴影卡片</Card>
 *   <Card variant="outline" interactive as="a" href="/books/1">书籍卡片</Card>
 *
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>标题</CardTitle>
 *       <CardDescription>副标题 / 描述</CardDescription>
 *     </CardHeader>
 *     <CardBody>主体内容</CardBody>
 *     <CardFooter>底部 actions</CardFooter>
 *   </Card>
 *
 * 设计取舍：
 *   - 不依赖 Radix —— Card 是纯展示容器，不需要 a11y 行为
 *   - 分离子组件而非靠 props 控制内边距，避免 "padding=0 但 header 仍然 padding=12" 这种特例分支
 *   - interactive 用 :hover / :focus-visible 不用 JS 状态，符合可访问性
 */
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';

export type CardVariant = 'outline' | 'elevated' | 'subtle' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

type AsProp = { as?: ElementType };

/**
 * Card 在不同 `as` 标签下需要不同的 HTML 属性集合。完整 polymorphic 组件
 * 类型推导在 React 19 + forwardRef 下样板太多，这里采取**实用主义**：
 * Card 默认接受常见的「容器属性 + 锚点属性 + 按钮属性」并集，覆盖
 * `<div>` / `<a>` / `<button>` / `<article>` 等绝大多数业务用法。
 * 若业务需要其它 HTML 属性，可用 `as` 配合 `{...rest}` 自然透传。
 */
type CardCommonAttributes = HTMLAttributes<HTMLElement> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel' | 'download'> &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled' | 'form'>;

export interface CardProps extends Omit<CardCommonAttributes, 'color'>, AsProp {
  /**
   * 视觉风格
   *   - outline（默认）：1px 边框 + 微背景，适合大面积 grid 卡片
   *   - elevated：阴影 + 无边框，适合需要"漂浮感"的高优先级卡片（如详情页 hero）
   *   - subtle：仅背景填充，无边框无阴影，适合块状区分
   *   - ghost：透明底，hover 时浮现底色，适合 list item
   */
  variant?: CardVariant;
  /** 内边距档位；可被子组件 CardBody/CardHeader 单独覆盖 */
  padding?: CardPadding;
  /** 是否接受 hover/focus 反馈（用于可点击卡片） */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(props, ref) {
  const {
    as: Tag = 'div',
    variant = 'outline',
    padding = 'md',
    interactive = false,
    className,
    children,
    ...rest
  } = props;
  return (
    <Tag
      ref={ref}
      className={cn(
        'ui-card',
        `ui-card-variant-${variant}`,
        `ui-card-padding-${padding}`,
        interactive && 'ui-card-interactive',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** 单独覆盖该段的内边距，省略时随父 Card */
  padding?: CardPadding;
}

export const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(function CardHeader(
  props,
  ref
) {
  const { padding, className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn('ui-card-header', padding && `ui-card-padding-${padding}`, className)}
      {...rest}
    />
  );
});

export const CardBody = forwardRef<HTMLDivElement, CardSectionProps>(function CardBody(
  props,
  ref
) {
  const { padding, className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn('ui-card-body', padding && `ui-card-padding-${padding}`, className)}
      {...rest}
    />
  );
});

export const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(function CardFooter(
  props,
  ref
) {
  const { padding, className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn('ui-card-footer', padding && `ui-card-padding-${padding}`, className)}
      {...rest}
    />
  );
});

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children?: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  props,
  ref
) {
  const { as: Tag = 'h3', className, ...rest } = props;
  return <Tag ref={ref} className={cn('ui-card-title', className)} {...rest} />;
});

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription(props, ref) {
    const { className, ...rest } = props;
    return <p ref={ref} className={cn('ui-card-description', className)} {...rest} />;
  }
);
