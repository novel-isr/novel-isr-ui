# @novel-isr/ui

novel-platform 自研组件库。Chakra v3 inspired API + Radix Primitives 行为层 + 现代克制视觉 + 一等公民 dark mode。

## 状态

- 不发 npm。消费方走 **Git URL** 协议(`github:novel-isr/novel-isr-ui#vX.Y.Z`)
- `prepare` 脚本在消费者 install 时自动 `pnpm build`,`dist/` 不进 git
- 单 entry 库,vite (lib mode) + vite-plugin-dts 构建

## 安装(消费方)

```jsonc
// package.json
"dependencies": {
  "@novel-isr/ui": "github:novel-isr/novel-isr-ui#v0.1.0"
}
```

`pnpm install` 时:
1. pnpm 走 git clone 该仓库到 store
2. 跑 `prepare` → 装 devDeps → `vite build` + `sass` 出 `dist/`
3. 把 `dist/` 当作 npm tarball 装进 `node_modules/@novel-isr/ui`

## 使用

```tsx
import '@novel-isr/ui/styles.css';
import { ThemeProvider, ToastProvider, Button, Modal, useDisclosure } from '@novel-isr/ui';

export function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <YourApp />
      </ToastProvider>
    </ThemeProvider>
  );
}
```

## 组件清单

| 类型 | 组件 |
|---|---|
| Provider / hooks | `ThemeProvider` / `useTheme` / `useDisclosure` |
| 基础 | `Button` / `Box` / `Stack` (HStack/VStack) / `Divider` / `Tag` / `Badge` / `Spinner` / `Avatar` |
| 表单 | `Input` / `Textarea` / `Select` / `Checkbox` / `Radio` / `Switch` / `FormControl` |
| 反馈 | `Alert` / `Toast` (toast.success/error/info) / `Tooltip` |
| 浮层 | `Modal` / `Drawer` / `Popover` |
| 导航 / 数据 | `Tabs` / `Pagination` / `Table` |

所有组件接受 `colorScheme: 'brand' | 'gray' | 'success' | 'warning' | 'danger'`、`size: 'sm' | 'md' | 'lg'`、`variant`(因组件而异)等 Chakra 风格 props。

## 本地开发

```bash
pnpm install
pnpm dev          # 同时跑 vite watch + sass watch
pnpm build        # 一次性构建 dist/
pnpm type-check   # tsc --noEmit
pnpm test         # vitest run
```

## 工作流

```bash
# 1. 本地改代码
vim src/components/Button/Button.tsx

# 2. 验证
pnpm build && pnpm type-check

# 3. 提交 + 打 tag
git add . && git commit -m "feat(button): add loading state"
git push
git tag v0.1.1 && git push origin v0.1.1

# 4. 消费方升级 ref
# novel-rating/package.json:
#   "@novel-isr/ui": "github:novel-isr/novel-isr-ui#v0.1.1"
# pnpm install
```

## 本地联调(不打 tag)

```bash
# 在本仓
pnpm link --global

# 在消费方仓库
pnpm link --global @novel-isr/ui
# node_modules/@novel-isr/ui 是 sibling 实时代码,package.json/lockfile 不动

# 联调结束
pnpm unlink --global @novel-isr/ui
pnpm install
```

## 架构

- **构建**:vite (lib mode) → 单 ESM bundle + sourcemap
- **类型**:vite-plugin-dts(`rollupTypes: true`) → 单文件 d.ts
- **样式**:sass → 单 css(`dist/styles.css`),消费方一次性 `import '@novel-isr/ui/styles.css'`
- **客户端边界**:bundle 顶部 banner `'use client';`(99% 组件用 React hooks,缺这个 banner 下游 `@vitejs/plugin-rsc` 会把整个包当 Server Component 解析)
- **行为层**:Modal / Popover / Tabs / Tooltip / Switch / Checkbox / Radio / Select 复用 Radix Primitives 的可访问性与键盘交互
- **样式**:plain CSS(SCSS 编译产物),不依赖 CSS-in-JS / Tailwind

## 边界

- **不涵盖路由**:消费方自己 wrap
- **不涵盖 i18n**:文案是产品/后端管理的内容
- **不涵盖图标**:用 `react-icons` 或 SVG 直接传 `as={Icon}`

## 历史

从 [`novel-isr-libs`](https://github.com/novel-isr/novel-isr-libs) 的 `packages/ui` 抽出,因为消费方走 Git URL 协议,而 npm/pnpm 不原生支持装 monorepo 子包。
