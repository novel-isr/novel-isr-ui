import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLPreElement>, 'children'> {
  children: string;
  'aria-label': string;
  wrap?: boolean;
  maxHeight?: string | number;
}

export const CodeBlock = forwardRef<HTMLPreElement, CodeBlockProps>(function CodeBlock({
  children, wrap = true, maxHeight = '24rem', className, style, ...rest
}, ref) {
  return <pre ref={ref} className={cn('ui-code-block', className)} role="region" tabIndex={0}
    data-wrap={String(wrap)} style={{ maxHeight, ...style }} {...rest}><code>{children}</code></pre>;
});
