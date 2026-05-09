import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @novel-isr/ui — vite library build
 *
 * 跟 isr-engine 工具链对齐：vite 只负责 .js，d.ts 由 tsc 直接 emit
 * （vite-plugin-dts 在 GitHub Actions runner 上 prepare 链路下行为不稳）。
 *
 * 关键点：
 *   - 主入口 index 给 'use client' banner —— 99% 组件用 React hooks，
 *     缺这个 banner 下游 @vitejs/plugin-rsc 会把整个包当 Server Component 解析
 *   - theme-utils sub-entry **不加 banner** —— SSR 框架（业务侧 Layout）需要在
 *     server component 里调 parseThemeCookie / resolveServerTheme，染色就炸
 *   - external 把 react / react-dom / @radix-ui/* 标外部
 */
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'theme-utils': resolve(__dirname, 'src/components/theme-utils.ts'),
      },
      formats: ['es'],
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
        entryFileNames: '[name].js',
        // 只给 client chunk 加 banner；theme-utils 是 server-safe 纯函数。
        banner: chunk => (chunk.name === 'theme-utils' ? '' : "'use client';"),
      },
    },
    sourcemap: true,
    minify: false,
    emptyOutDir: false,
    target: 'es2022',
  },
});
