import { defineConfig } from 'tsup';

/**
 * @novel-isr/ui 的 tsup 配置。
 *
 * 关键点：在 bundle 顶部 banner 加 'use client'，因为 99% 组件都用 React hooks。
 * 不加这个 banner，consumer 的 @vitejs/plugin-rsc 会把整个包当 Server Component
 * 解析，createContext / useEffect 等 hook 在 RSC 环境下找不到。
 *
 * 副作用：导出的纯函数（如 cn / utility）也会被标成 client reference，
 * RSC 树里调用会被 plugin-rsc 强制走客户端边界 —— 但 cn 在 RSC 渲染时调用是
 * 纯字符串拼接，没问题。
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
  banner: {
    js: `'use client';`,
  },
});
