import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { Spinner } from '../Spinner'

export type LoadingStateSize = 'compact' | 'default' | 'lg'

export interface LoadingStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: string
  size?: LoadingStateSize
}

export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(function LoadingState(
  { label = 'Loading...', size = 'default', className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('ui-loading-state', `ui-loading-state-size-${size}`, className)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      {...rest}
    >
      <Spinner colorScheme="current" label="" aria-hidden="true" role="presentation" aria-live="off" />
      <span className="ui-loading-state-label">{label}</span>
    </div>
  )
})
