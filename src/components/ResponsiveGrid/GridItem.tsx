import { forwardRef, type HTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../../utils/cn'

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  fullWidth?: boolean
  asChild?: boolean
}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(function GridItem({
  fullWidth = false, asChild = false, className, ...rest
}, ref) {
  const Component = asChild ? Slot : 'div'
  return <Component ref={ref}
    className={cn('ui-grid-item', fullWidth && 'ui-grid-item-full-width', className)} {...rest} />
})
