/**
 * Toast store —— 同 id 替换语义（sonner 标准）
 *
 * 关键不变量：业务侧（admin-api 把错误 message 当 id 做轮询去重）期望同 id 的
 * 后续 push 替换前一条，而不是 append。append 会让 React `key={item.id}` 报
 * "duplicate key" warning，并且页面叠出一墙重复 toast。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { toast, __toastStoreForTesting as store } from '../Toast';

afterEach(() => {
  store.reset();
});

describe('toast store —— 同 id 替换语义', () => {
  it('同 id 多次 push → 只保留一条，内容是最后一次', () => {
    toast.error('first', { id: 'k', duration: 0 });
    toast.error('second', { id: 'k', duration: 0 });
    toast.error('third', { id: 'k', duration: 0 });

    const items = store.peek();
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('k');
    expect(items[0]?.title).toBe('third');
  });

  it('不同 id 正常并存（dedupe 只对同 id 生效）', () => {
    toast.error('a', { id: 'k1', duration: 0 });
    toast.error('b', { id: 'k2', duration: 0 });

    const items = store.peek();
    expect(items).toHaveLength(2);
    expect(items.map(t => t.id)).toEqual(['k1', 'k2']);
  });

  it('未指定 id → 自增 id，每次 push 都新增（与命名 id dedupe 路径正交）', () => {
    toast.info('a', { duration: 0 });
    toast.info('b', { duration: 0 });
    toast.info('c', { duration: 0 });

    expect(store.peek()).toHaveLength(3);
  });

  it('替换 push 同时重置自动关闭定时器（避免 stale toast 提前消失）', async () => {
    toast.error('first', { id: 'k', duration: 30 });
    await new Promise(r => setTimeout(r, 10));
    toast.error('second', { id: 'k', duration: 30 });
    // 第一次 push 在 30ms 后会调 dismiss('k')；第二次 push 必须取消那个定时器，
    // 否则 t=30ms 时（距第二次 push 才 20ms）会把还在显示中的 'second' 关掉。
    await new Promise(r => setTimeout(r, 25));
    expect(store.peek()).toHaveLength(1);
    expect(store.peek()[0]?.title).toBe('second');
  });
});
