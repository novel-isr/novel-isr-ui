/**
 * FormControl —— 表单字段容器，统一管 label / helper / error 关联 + a11y。
 *
 *   <FormControl isInvalid={!!errors.email} isRequired>
 *     <FormLabel>邮箱</FormLabel>
 *     <Input value={email} onChange={...} />
 *     <FormHelperText>用于登录</FormHelperText>
 *     <FormErrorMessage>{errors.email}</FormErrorMessage>
 *   </FormControl>
 *
 * 设计：
 *   - 通过 Context 把 id / isInvalid / isRequired / isDisabled 下传
 *   - 子组件（Input/Textarea/Select 等）用 useFormControlContext() 自动接 a11y
 *   - HelperText 在 invalid 时被替换为 ErrorMessage（不并列显示）
 */

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';

interface FormControlContextValue {
  id: string;
  helperId: string;
  errorId: string;
  isInvalid: boolean;
  isRequired: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
}

const FormControlContext = createContext<FormControlContextValue | null>(null);

/** 子组件 hook：拿 a11y 关联属性 */
export function useFormControlContext(): FormControlContextValue | null {
  return useContext(FormControlContext);
}

/** 子组件用：把 a11y props 接到自家 input 上 */
export function useFormControlProps<P extends { id?: string; disabled?: boolean }>(
  props: P
): P & {
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
  'aria-readonly'?: true;
} {
  const ctx = useFormControlContext();
  if (!ctx) return props;

  const incomingDescribedBy = (props as P & { 'aria-describedby'?: string })['aria-describedby'];
  const describedBy = [ctx.isInvalid ? ctx.errorId : null, ctx.helperId, incomingDescribedBy]
    .filter(Boolean)
    .join(' ');

  return {
    ...props,
    id: props.id ?? ctx.id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': (ctx.isInvalid || undefined) as true | undefined,
    'aria-required': (ctx.isRequired || undefined) as true | undefined,
    'aria-readonly': (ctx.isReadOnly || undefined) as true | undefined,
    disabled: ctx.isDisabled || props.disabled,
  };
}

export interface FormControlProps extends HTMLAttributes<HTMLDivElement> {
  isInvalid?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  /** 显式 id（不传自动生成） */
  id?: string;
}

export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(function FormControl(
  props,
  ref
) {
  const {
    isInvalid = false,
    isRequired = false,
    isDisabled = false,
    isReadOnly = false,
    id: idProp,
    className,
    children,
    ...rest
  } = props;

  const autoId = useId();
  const id = idProp ?? `field-${autoId}`;

  const ctx = useMemo<FormControlContextValue>(
    () => ({
      id,
      helperId: `${id}-helper`,
      errorId: `${id}-error`,
      isInvalid,
      isRequired,
      isDisabled,
      isReadOnly,
    }),
    [id, isInvalid, isRequired, isDisabled, isReadOnly]
  );

  return (
    <FormControlContext.Provider value={ctx}>
      <div
        ref={ref}
        className={cn('ui-form-control', className)}
        data-invalid={isInvalid || undefined}
        data-disabled={isDisabled || undefined}
        {...rest}
      >
        {children}
      </div>
    </FormControlContext.Provider>
  );
});

// ─── FormLabel ────────────────────────────────────────────────────────────

export interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** 必填星号文本（默认 *） */
  requiredIndicator?: ReactNode;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(function FormLabel(
  props,
  ref
) {
  const { requiredIndicator = '*', className, children, htmlFor, ...rest } = props;
  const ctx = useFormControlContext();

  return (
    <label
      ref={ref}
      htmlFor={htmlFor ?? ctx?.id}
      className={cn('ui-form-label', className)}
      {...rest}
    >
      {children}
      {ctx?.isRequired && (
        <span className="ui-form-required" aria-hidden="true">
          {requiredIndicator}
        </span>
      )}
    </label>
  );
});

// ─── FormHelperText ───────────────────────────────────────────────────────

export interface FormHelperTextProps extends HTMLAttributes<HTMLDivElement> {}

export const FormHelperText = forwardRef<HTMLDivElement, FormHelperTextProps>(
  function FormHelperText(props, ref) {
    const ctx = useFormControlContext();
    const { className, children, ...rest } = props;

    // invalid 时让位给 ErrorMessage
    if (ctx?.isInvalid) return null;

    return (
      <div ref={ref} id={ctx?.helperId} className={cn('ui-form-helper', className)} {...rest}>
        {children}
      </div>
    );
  }
);

// ─── FormErrorMessage ─────────────────────────────────────────────────────

export interface FormErrorMessageProps extends HTMLAttributes<HTMLDivElement> {}

export const FormErrorMessage = forwardRef<HTMLDivElement, FormErrorMessageProps>(
  function FormErrorMessage(props, ref) {
    const ctx = useFormControlContext();
    const { className, children, ...rest } = props;

    // 只在 invalid 时显示
    if (!ctx?.isInvalid) return null;

    return (
      <div
        ref={ref}
        id={ctx.errorId}
        role="alert"
        className={cn('ui-form-error', className)}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
