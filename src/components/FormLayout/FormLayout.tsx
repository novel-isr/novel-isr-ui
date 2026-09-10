import { forwardRef, type FormHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { ResponsiveGrid, type GridColumns } from '../ResponsiveGrid/ResponsiveGrid'

export interface FormLayoutProps extends FormHTMLAttributes<HTMLFormElement> {
  columns?: GridColumns
  gap?: string | number
  rowGap?: string | number
  columnGap?: string | number
}

export const FormLayout = forwardRef<HTMLFormElement, FormLayoutProps>(function FormLayout({
  columns, gap, rowGap, columnGap, className, children, ...rest
}, ref) {
  return (
    <form ref={ref} className={cn('ui-form-layout', className)} {...rest}>
      <ResponsiveGrid columns={columns} gap={gap} rowGap={rowGap} columnGap={columnGap}>
        {children}
      </ResponsiveGrid>
    </form>
  )
})
