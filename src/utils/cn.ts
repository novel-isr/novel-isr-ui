/**
 * cn —— 类名拼接，过滤 falsy（false / null / undefined）。
 *
 * 不引入 clsx，因为这个函数只有 5 行，独立 dep 不值。
 */

type ClassValue = string | number | false | null | undefined;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ');
}
