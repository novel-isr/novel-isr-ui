/**
 * Button —— 主操作按钮。
 *
 *   <Button>Save</Button>
 *   <Button variant="outline" colorScheme="danger" size="lg">Delete</Button>
 *   <Button isLoading loadingText="Saving...">Save</Button>
 *   <Button leftIcon={<Plus />} fullWidth>Add</Button>
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner/Spinner';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonColorScheme =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'brand'
  | 'danger'
  | 'success'
  | 'warning'
  | 'gray';
export type ButtonIntent =
  | 'primary'
  | 'secondary'
  | 'confirm'
  | 'danger'
  | 'warning'
  | 'neutral';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 业务语义。优先用 intent，colorScheme 只作为视觉 token 兼容。 */
  intent?: ButtonIntent;
  colorScheme?: ButtonColorScheme;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'solid',
      size = 'md',
      intent,
      colorScheme,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      type = 'button',
      ...rest
    } = props;

    const spinnerSize = size === 'xs' || size === 'sm' ? 'xs' : 'sm';
    const resolvedColorScheme = colorScheme ?? colorSchemeFromIntent(intent);

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'ui-button',
          `ui-button-variant-${variant}`,
          `ui-button-size-${size}`,
          `ui-button-color-${resolvedColorScheme}`,
          intent && `ui-button-intent-${intent}`,
          fullWidth && 'ui-button-fullwidth',
          isLoading && 'ui-button-loading',
          className
        )}
        data-loading={isLoading || undefined}
        {...rest}
      >
        {isLoading && (
          <span className="ui-button-spinner">
            <Spinner size={spinnerSize} colorScheme="current" />
          </span>
        )}
        {isLoading && loadingText ? (
          <span>{loadingText}</span>
        ) : (
          <>
            {leftIcon && (
              <span
                className={cn(
                  'ui-button-icon',
                  isLoading && 'ui-button-hidden'
                )}
              >
                {leftIcon}
              </span>
            )}
            <span
              className={cn(
                'ui-button-label',
                isLoading && !loadingText && 'ui-button-hidden'
              )}
            >
              {children}
            </span>
            {rightIcon && (
              <span
                className={cn(
                  'ui-button-icon',
                  isLoading && 'ui-button-hidden'
                )}
              >
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

function colorSchemeFromIntent(intent?: ButtonIntent): ButtonColorScheme {
  if (intent === 'danger') return 'danger';
  if (intent === 'warning') return 'warning';
  if (intent === 'confirm') return 'success';
  if (intent === 'secondary') return 'secondary';
  if (intent === 'neutral') return 'neutral';
  return 'primary';
}
