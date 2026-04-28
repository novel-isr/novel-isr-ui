import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @novel-isr/ui — vite library build
 *
 * 跟 isr-engine 工具链对齐:vite 只负责 .js,d.ts 由 tsc 直接 emit
 * (vite-plugin-dts 在 GitHub Actions runner 上 prepare 链路下行为不稳)。
 *
 * 关键点:
 *   - banner 注入 'use client' —— 99% 组件用 React hooks,缺这个 banner 下游
 *     @vitejs/plugin-rsc 会把整个包当 Server Component 解析
 *   - external 把 react / react-dom / @radix-ui/* 标外部
 */
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dom/client',
        /^@radix-ui\/.*/,
      ],
      output: {
        banner: "'use client';",
      },
    },
    sourcemap: true,
    minify: false,
    // 不清空 dist —— sass / tsc 也写 dist
    emptyOutDir: false,
    target: 'es2022',
  },
});
