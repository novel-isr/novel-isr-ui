import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @novel-isr/ui — vite library build
 *
 * 关键点:
 *   - 单 entry (src/index.ts) → 单文件 dist/index.js + 单文件 dist/index.d.ts
 *   - banner 注入 'use client' —— 99% 组件用 React hooks,缺这个 banner 下游
 *     @vitejs/plugin-rsc 会把整个包当 Server Component 解析,createContext /
 *     useEffect 等 hook 在 RSC 环境下找不到
 *   - external 把 react / react-dom / @radix-ui/* 标外部,不打进 bundle(由消费者
 *     的 react / radix install 提供)
 */
export default defineConfig({
  plugins: [
    dts({
      // 单 entry 场景 rollupTypes 完全 OK,产出单文件 dist/index.d.ts
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
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
        // 'use client' banner —— 见上述 RSC 边界注解
        banner: "'use client';",
      },
    },
    sourcemap: true,
    minify: false,
    // 不清空 dist —— sass 在 build:css 步骤写 dist/styles.css
    // build 顺序:vite (build:js) → sass (build:css),前者清空会破坏后者
    // 但因为 build:js 在 build:css 之前,清空再写 css 也 OK,主要是为了保留扩展性
    emptyOutDir: false,
    target: 'es2022',
  },
});
