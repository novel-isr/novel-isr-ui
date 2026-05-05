/**
 * Rating —— 评分展示与采集。
 *
 * 单维只读（最常见，列表/卡片用）：
 *   <Rating value={8.6} />
 *   <Rating value={8.6} showValue ratingCount={3214} />
 *
 * 单维可交互（详情页 / 评分弹窗）：
 *   <Rating value={current} onChange={setRating} max={10} />
 *
 * 多维（优书网风格：综合 / 剧情 / 人设 / 文笔 / 节奏 / ...）：
 *   <RatingScale
 *     dimensions={[
 *       { key: 'overall', label: '综合', value: 8.6 },
 *       { key: 'plot',    label: '剧情', value: 8.2 },
 *       { key: 'writing', label: '文笔', value: 7.5 },
 *     ]}
 *     onChange={(key, value) => ...}    // 不传则只读
 *   />
 *
 * 设计取舍：
 *   - 0..max 任意刻度；UI 上归一到 5 颗星；半星按 0.25 / 0.75 阈值切换
 *   - keyboard a11y：可交互模式下用 role=slider + arrow keys，不发明新交互
 *   - 不依赖第三方（Radix 没有 Rating；自己 SVG 简单且无样式洁癖）
 */
import {
  forwardRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { Star as StarIcon, StarHalf as StarHalfIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type RatingSize = 'sm' | 'md' | 'lg';

export interface RatingProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  /** 当前评分值，范围 0..max */
  value: number;
  /** 满分；默认 10（中文小说站常见）。设 5 即标准 5 星制 */
  max?: number;
  size?: RatingSize;
  /** 是否在右侧显示数值文本 */
  showValue?: boolean;
  /** 评分人数；showValue=true 时附在数值后 */
  ratingCount?: number;
  /** 提供则切换为可交互模式（hover + 点击 + 键盘） */
  onChange?: (value: number) => void;
  /** 强制只读（即使提供了 onChange） */
  readOnly?: boolean;
  /** 当前值的语义标签（屏幕阅读器用），默认 `${value} / ${max}` */
  ariaLabel?: string;
}

const SIZE_PX: Record<RatingSize, number> = { sm: 12, md: 16, lg: 20 };

export const Rating = forwardRef<HTMLSpanElement, RatingProps>(function Rating(props, ref) {
  const {
    value,
    max = 10,
    size = 'md',
    showValue = false,
    ratingCount,
    onChange,
    readOnly = false,
    ariaLabel,
    className,
    ...rest
  } = props;

  const interactive = Boolean(onChange) && !readOnly;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 把 value 归一到 5 星刻度
  const stars5 = (value / max) * 5;
  const fullCount = Math.floor(stars5);
  const fraction = stars5 - fullCount;
  const half = fraction >= 0.25 && fraction < 0.75 ? 1 : 0;
  const roundedFull = fraction >= 0.75 ? fullCount + 1 : fullCount;

  // 交互态下用 hoverIndex 覆盖显示
  const displayFull = hoverIndex !== null ? hoverIndex : roundedFull + half;

  const handleStarClick = (e: MouseEvent<HTMLButtonElement>, starIndex: number) => {
    if (!interactive) return;
    // 半星：点击星左半 → 0.5；右半 → 1
    const rect = e.currentTarget.getBoundingClientRect();
    const halfClick = e.clientX - rect.left < rect.width / 2;
    const starsTo = starIndex + (halfClick ? 0.5 : 1);
    onChange!(Math.round((starsTo / 5) * max * 10) / 10);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (!interactive) return;
    const step = max / 10; // 固定 10 档
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange!(Math.min(max, Math.round((value + step) * 10) / 10));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange!(Math.max(0, Math.round((value - step) * 10) / 10));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange!(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange!(max);
    }
  };

  const px = SIZE_PX[size];
  const computedAriaLabel = ariaLabel ?? `${value.toFixed(1)} / ${max}`;

  return (
    <span
      ref={ref}
      className={cn(
        'ui-rating',
        `ui-rating-size-${size}`,
        interactive && 'ui-rating-interactive',
        className
      )}
      role={interactive ? 'slider' : undefined}
      aria-label={computedAriaLabel}
      aria-valuenow={interactive ? value : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? max : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onMouseLeave={interactive ? () => setHoverIndex(null) : undefined}
      {...rest}
    >
      <span className='ui-rating-stars' aria-hidden='true'>
        {Array.from({ length: 5 }).map((_, i) => {
          const fill: 'full' | 'half' | 'empty' =
            i < Math.floor(displayFull)
              ? 'full'
              : i < displayFull
                ? 'half'
                : 'empty';
          if (interactive) {
            return (
              <button
                key={i}
                type='button'
                className={cn('ui-rating-star-btn', `ui-rating-star-${fill}`)}
                onClick={e => handleStarClick(e, i)}
                onMouseEnter={() => setHoverIndex(i + 1)}
                tabIndex={-1}
              >
                <Star fill={fill} size={px} />
              </button>
            );
          }
          return <Star key={i} fill={fill} size={px} />;
        })}
      </span>
      {showValue && (
        <span className='ui-rating-value'>
          <strong>{value.toFixed(1)}</strong>
          {ratingCount !== undefined && (
            <span className='ui-rating-count'>({ratingCount.toLocaleString('en-US')})</span>
          )}
        </span>
      )}
    </span>
  );
});

function Star({ fill, size }: { fill: 'full' | 'half' | 'empty'; size: number }) {
  // lucide 的 Star 用 fill 控制实心/空心；半星用 StarHalf 自带的左半填充。
  // 视觉与之前自定义 path + linearGradient 几乎一致，行为统一到 ui icon system。
  const className = cn('ui-rating-star', `ui-rating-star-${fill}`);
  if (fill === 'half') {
    return (
      <StarHalfIcon
        size={size}
        className={className}
        fill='currentColor'
        strokeWidth={1.5}
        aria-hidden='true'
      />
    );
  }
  return (
    <StarIcon
      size={size}
      className={className}
      fill={fill === 'full' ? 'currentColor' : 'none'}
      strokeWidth={1.5}
      aria-hidden='true'
    />
  );
}

/* ── RatingScale —— 多维评分 ─────────────────────────────────── */

export interface RatingDimension {
  /** 稳定的英文 key，用于回传（如 'plot' / 'character' / 'writing'） */
  key: string;
  /** UI 显示文案 */
  label: string;
  /** 该维度当前值 */
  value: number;
  /** 该维度可选的描述（hover 提示） */
  hint?: ReactNode;
}

export interface RatingScaleProps {
  dimensions: readonly RatingDimension[];
  /** 单维满分；默认 10。所有维度共享同一刻度 */
  max?: number;
  size?: RatingSize;
  /** 提供则切换为可交互模式 */
  onChange?: (key: string, value: number) => void;
  readOnly?: boolean;
  /** 是否在每行右侧显示数值 */
  showValue?: boolean;
  className?: string;
}

export function RatingScale(props: RatingScaleProps) {
  const {
    dimensions,
    max = 10,
    size = 'md',
    onChange,
    readOnly,
    showValue = true,
    className,
  } = props;
  return (
    <div className={cn('ui-rating-scale', className)}>
      {dimensions.map(dim => (
        <div key={dim.key} className='ui-rating-scale-row' title={typeof dim.hint === 'string' ? dim.hint : undefined}>
          <span className='ui-rating-scale-label'>{dim.label}</span>
          <Rating
            value={dim.value}
            max={max}
            size={size}
            showValue={showValue}
            readOnly={readOnly}
            onChange={onChange ? v => onChange(dim.key, v) : undefined}
            ariaLabel={`${dim.label} ${dim.value.toFixed(1)} / ${max}`}
          />
        </div>
      ))}
    </div>
  );
}
