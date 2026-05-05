/**
 * JsonField —— JSON 编辑文本域，自带格式化按钮 + 实时校验。
 *
 *   <JsonField value={text} onChange={setText} rows={8} />
 *
 * 行为：
 *   - 编辑期间不强制合法 JSON（让用户中途敲半截 JSON 不会被打断）
 *   - 失焦时尝试 JSON.parse，合法则显示 ✓ valid，不合法显示 ⚠ + 错误信息
 *   - 「格式化」按钮：合法时 prettify（2 空格缩进），不合法时弹错误提示
 *   - 不引入 Monaco / Codemirror（避免重 dep），等以后真需要再升级
 */
import { forwardRef, useMemo, useState, type ChangeEvent } from 'react';
import { cn } from '../../utils/cn';
import { Textarea } from '../Textarea/Textarea';

export interface JsonFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** 行数 */
  rows?: number;
  placeholder?: string;
  /** 隐藏顶部工具条（格式化按钮 + 状态指示） */
  hideToolbar?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
  /** 缩进空格，默认 2 */
  indent?: number;
}

interface ValidationState {
  status: 'empty' | 'valid' | 'invalid';
  error?: string;
}

function validate(text: string): ValidationState {
  const trimmed = text.trim();
  if (!trimmed) return { status: 'empty' };
  try {
    JSON.parse(trimmed);
    return { status: 'valid' };
  } catch (e) {
    return { status: 'invalid', error: e instanceof Error ? e.message : String(e) };
  }
}

export const JsonField = forwardRef<HTMLTextAreaElement, JsonFieldProps>(
  function JsonField(props, ref) {
    const {
      value,
      onChange,
      rows = 8,
      placeholder,
      hideToolbar = false,
      className,
      id,
      indent = 2,
      ...attrs
    } = props;
    const [validation, setValidation] = useState<ValidationState>(() => validate(value));

    const onTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    const onBlurValidate = () => setValidation(validate(value));

    const formatNow = () => {
      const trimmed = value.trim();
      if (!trimmed) {
        setValidation({ status: 'empty' });
        return;
      }
      try {
        const parsed = JSON.parse(trimmed);
        const formatted = JSON.stringify(parsed, null, indent);
        onChange(formatted);
        setValidation({ status: 'valid' });
      } catch (e) {
        setValidation({
          status: 'invalid',
          error: e instanceof Error ? e.message : String(e),
        });
      }
    };

    const indicator = useMemo(() => {
      switch (validation.status) {
        case 'valid':
          return { label: '✓ JSON 合法', tone: 'success' as const };
        case 'invalid':
          return {
            label: `⚠ ${validation.error?.slice(0, 80) ?? 'JSON 格式错误'}`,
            tone: 'danger' as const,
          };
        default:
          return null;
      }
    }, [validation]);

    return (
      <div className={cn('ui-json-field', className)}>
        {!hideToolbar && (
          <div className="ui-json-field-toolbar">
            <button
              type="button"
              className="ui-json-field-format"
              onClick={formatNow}
              disabled={!value.trim()}
              tabIndex={-1}
            >
              格式化
            </button>
            {indicator && (
              <span
                className={cn(
                  'ui-json-field-status',
                  `ui-json-field-status-${indicator.tone}`,
                )}
                title={validation.error}
              >
                {indicator.label}
              </span>
            )}
          </div>
        )}
        <Textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={onTextChange}
          onBlur={onBlurValidate}
          className="ui-json-field-textarea"
          spellCheck={false}
          aria-label={attrs['aria-label']}
        />
      </div>
    );
  },
);
