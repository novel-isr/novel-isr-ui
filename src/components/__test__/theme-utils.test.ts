/**
 * theme-utils —— ThemeProvider 跟 SSR 框架共享的纯函数 + 常量行为锁定。
 *
 * 关键不变量：
 *   - parseThemeCookie 只接受 'light' / 'dark' / 'system'，其它一律回退到 system
 *   - parsePaletteCookie 只接受 'editorial' / 'tech'，其它一律回退到 default
 *   - THEME_INIT_SCRIPT 是常量字符串（server / client 必须输出完全一致），且必须正确处理
 *     theme 的 cookie 缺失 / 非法值 / system + palette 的 cookie 缺失 / 非法值
 *
 * theme-utils 是 client + server 跨 lib 共用，行为漂移会直接造成 hydration mismatch
 * 或 FOUC，必须锁死。
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PALETTE,
  PALETTE_COOKIE_NAME,
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  THEME_INIT_SCRIPT,
  parsePaletteCookie,
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

describe('parsePaletteCookie', () => {
  it('合法值原样返回', () => {
    expect(parsePaletteCookie('editorial')).toBe('editorial');
    expect(parsePaletteCookie('tech')).toBe('tech');
  });

  it('undefined → DEFAULT_PALETTE 兜底', () => {
    expect(parsePaletteCookie(undefined)).toBe(DEFAULT_PALETTE);
  });

  it('非法值 → DEFAULT_PALETTE 兜底', () => {
    expect(parsePaletteCookie('')).toBe(DEFAULT_PALETTE);
    expect(parsePaletteCookie('EDITORIAL')).toBe(DEFAULT_PALETTE);
    expect(parsePaletteCookie('classic')).toBe(DEFAULT_PALETTE);
  });
});

describe('THEME_INIT_SCRIPT', () => {
  it('包含两个 cookie 名（theme + palette），跟常量联动', () => {
    expect(THEME_INIT_SCRIPT).toContain(`${THEME_COOKIE_NAME}=`);
    expect(THEME_INIT_SCRIPT).toContain(`${PALETTE_COOKIE_NAME}=`);
  });

  it('包含 prefers-color-scheme 兜底（system 模式必须）', () => {
    expect(THEME_INIT_SCRIPT).toContain('prefers-color-scheme: dark');
  });

  it('包含 theme 三种合法值的白名单', () => {
    expect(THEME_INIT_SCRIPT).toContain("'light'");
    expect(THEME_INIT_SCRIPT).toContain("'dark'");
    expect(THEME_INIT_SCRIPT).toContain("'system'");
  });

  it('包含 palette 两种合法值的白名单', () => {
    expect(THEME_INIT_SCRIPT).toContain("'editorial'");
    expect(THEME_INIT_SCRIPT).toContain("'tech'");
  });

  it('try/catch 包裹 —— 浏览器禁用 cookie / matchMedia 时不 throw', () => {
    expect(THEME_INIT_SCRIPT).toMatch(/try\s*\{/);
    expect(THEME_INIT_SCRIPT).toMatch(/catch\s*\(/);
  });

  it('cookie=light + palette=tech → dataset.theme=light + dataset.palette=tech', () => {
    const stub = stubDom({
      cookie: `${THEME_COOKIE_NAME}=light; ${PALETTE_COOKIE_NAME}=tech`,
    });
    new Function(THEME_INIT_SCRIPT).call(stub);
    expect(stub.documentElementDataset.theme).toBe('light');
    expect(stub.documentElementDataset.palette).toBe('tech');
  });

  it('cookie=system + 系统 dark → theme=dark；palette 缺失 → DEFAULT', () => {
    const stub = stubDom({
      cookie: `${THEME_COOKIE_NAME}=system`,
      prefersDark: true,
    });
    new Function(THEME_INIT_SCRIPT).call(stub);
    expect(stub.documentElementDataset.theme).toBe('dark');
    expect(stub.documentElementDataset.palette).toBe(DEFAULT_PALETTE);
  });

  it('cookie 全无 + 系统 light → theme=light + palette=DEFAULT', () => {
    const stub = stubDom({ cookie: '', prefersDark: false });
    new Function(THEME_INIT_SCRIPT).call(stub);
    expect(stub.documentElementDataset.theme).toBe('light');
    expect(stub.documentElementDataset.palette).toBe(DEFAULT_PALETTE);
  });

  it('palette 非法值（"classic"）→ DEFAULT 兜底', () => {
    const stub = stubDom({
      cookie: `${THEME_COOKIE_NAME}=light; ${PALETTE_COOKIE_NAME}=classic`,
    });
    new Function(THEME_INIT_SCRIPT).call(stub);
    expect(stub.documentElementDataset.palette).toBe(DEFAULT_PALETTE);
  });
});

describe('cookie 常量', () => {
  it('theme cookie 名固定为 "theme"（对齐 next-themes 默认）', () => {
    expect(THEME_COOKIE_NAME).toBe('theme');
  });

  it('palette cookie 名固定为 "palette"', () => {
    expect(PALETTE_COOKIE_NAME).toBe('palette');
  });

  it('过期时间 1 年（行业惯例：主题偏好不需要短期过期）', () => {
    expect(THEME_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
  });

  it('DEFAULT_PALETTE = editorial（小说评分本命视觉）', () => {
    expect(DEFAULT_PALETTE).toBe('editorial');
  });
});

interface StubDom {
  documentElementDataset: { theme?: string; palette?: string };
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
  // inline script 用 document.cookie / window.matchMedia / document.documentElement —— 走 globalThis
  Object.assign(globalThis, {
    document: stub.document,
    window: stub.window,
  });
  return stub;
}
