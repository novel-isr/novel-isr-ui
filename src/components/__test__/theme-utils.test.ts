/**
 * theme-utils —— ThemeProvider 跟 SSR 框架共享的纯函数 + 常量行为锁定。
 *
 * 关键不变量：
 *   - parseThemeCookie 只接受 'light' / 'dark' / 'system'，其它一律回退到 system
 *   - THEME_INIT_SCRIPT 是常量字符串（server / client 必须输出完全一致，否则 React
 *     hydration 会报 mismatch），且必须正确处理 cookie 缺失 / 非法值 / system 三种 case
 *
 * theme-utils 是 client + server 跨 lib 共用，行为漂移会直接造成 hydration mismatch
 * 或 FOUC，必须锁死。
 */
import { describe, expect, it } from 'vitest';
import {
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  THEME_INIT_SCRIPT,
  parseThemeCookie,
} from '../theme-utils';

describe('parseThemeCookie', () => {
  it('合法值原样返回', () => {
    expect(parseThemeCookie('light')).toBe('light');
    expect(parseThemeCookie('dark')).toBe('dark');
    expect(parseThemeCookie('system')).toBe('system');
  });

  it('undefined → system 兜底', () => {
    expect(parseThemeCookie(undefined)).toBe('system');
  });

  it('非法 / 残缺值 → system 兜底（防 cookie 损坏 / 跨版本残留）', () => {
    expect(parseThemeCookie('')).toBe('system');
    expect(parseThemeCookie('LIGHT')).toBe('system');
    expect(parseThemeCookie('auto')).toBe('system');
    expect(parseThemeCookie('null')).toBe('system');
  });
});

describe('THEME_INIT_SCRIPT', () => {
  it('包含 cookie 名（跟 THEME_COOKIE_NAME 联动，单一真值）', () => {
    expect(THEME_INIT_SCRIPT).toContain(`${THEME_COOKIE_NAME}=`);
  });

  it('包含 prefers-color-scheme 兜底（system 模式必须）', () => {
    expect(THEME_INIT_SCRIPT).toContain('prefers-color-scheme: dark');
  });

  it('包含三种合法值的白名单（防 cookie 注入异常值）', () => {
    expect(THEME_INIT_SCRIPT).toContain("'light'");
    expect(THEME_INIT_SCRIPT).toContain("'dark'");
    expect(THEME_INIT_SCRIPT).toContain("'system'");
  });

  it('try/catch 包裹 —— 浏览器禁用 cookie / matchMedia 时不 throw', () => {
    expect(THEME_INIT_SCRIPT).toMatch(/try\s*\{/);
    expect(THEME_INIT_SCRIPT).toMatch(/catch\s*\(/);
  });

  it('实际执行 cookie=light → documentElement.dataset.theme=light', () => {
    const stub = stubDom({ cookie: `${THEME_COOKIE_NAME}=light` });
    new Function(THEME_INIT_SCRIPT).call(stub);
    expect(stub.documentElementDataset.theme).toBe('light');
  });

  it('实际执行 cookie=system + 系统是 dark → dark', () => {
    const stub = stubDom({
      cookie: `${THEME_COOKIE_NAME}=system`,
      prefersDark: true,
    });
    new Function(THEME_INIT_SCRIPT).call(stub);
    expect(stub.documentElementDataset.theme).toBe('dark');
  });

  it('实际执行 cookie=system + 系统是 light → light', () => {
    const stub = stubDom({
      cookie: `${THEME_COOKIE_NAME}=system`,
      prefersDark: false,
    });
    new Function(THEME_INIT_SCRIPT).call(stub);
    expect(stub.documentElementDataset.theme).toBe('light');
  });

  it('实际执行 cookie 不存在 + 系统是 light → light（默认走 system）', () => {
    const stub = stubDom({ cookie: '', prefersDark: false });
    new Function(THEME_INIT_SCRIPT).call(stub);
    expect(stub.documentElementDataset.theme).toBe('light');
  });
});

describe('cookie 常量', () => {
  it('cookie 名固定为 "theme"，对齐 next-themes 默认（迁移友好）', () => {
    expect(THEME_COOKIE_NAME).toBe('theme');
  });

  it('过期时间为 1 年（行业惯例：主题偏好不需要短期过期）', () => {
    expect(THEME_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
  });
});

interface StubDom {
  documentElementDataset: { theme?: string };
  document: { cookie: string; documentElement: { dataset: Record<string, string> } };
  window: {
    matchMedia: (q: string) => { matches: boolean };
  };
}

function stubDom(opts: { cookie: string; prefersDark?: boolean }): StubDom {
  const dataset: Record<string, string> = {};
  const stub = {
    documentElementDataset: dataset,
    document: {
      cookie: opts.cookie,
      documentElement: { dataset },
    },
    window: {
      matchMedia: (q: string) => ({
        matches: q.includes('dark') && opts.prefersDark === true,
      }),
    },
  };
  // inline script 用 `document.cookie` / `window.matchMedia` / `document.documentElement` —— 走 globalThis
  Object.assign(globalThis, {
    document: stub.document,
    window: stub.window,
  });
  return stub;
}
