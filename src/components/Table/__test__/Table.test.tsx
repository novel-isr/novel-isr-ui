/**
 * Table 纯函数测试 ——
 *   computeFixedColumnLayout 是 sticky 列布局的算法核心，必须可单测。
 *   行为：左固定从前累加 width；右固定从后累加；边界 key 标识阴影列。
 *
 * 不渲染 React（UI lib 当前没装 RTL，没必要为这点验证拉一坨依赖）；
 * 算法对了，组件那边只是把 number 写进 inline style 上 + data-attrs，没逻辑可错。
 */
import { describe, expect, it } from "vitest";
import { computeFixedColumnLayout, type TableColumn } from "../Table";

interface Row {
  id: number;
}

const cols = (
  ...defs: Array<Partial<TableColumn<Row>> & { key: string }>
): TableColumn<Row>[] =>
  defs.map((d) => ({
    key: d.key,
    header: d.key,
    width: d.width,
    fixed: d.fixed,
  }));

describe("computeFixedColumnLayout", () => {
  it("左固定从前累加：col0 left=0, col1 left=col0.width", () => {
    const r = computeFixedColumnLayout(
      cols(
        { key: "id", width: 80, fixed: "left" },
        { key: "name", width: 120, fixed: "left" },
        { key: "status", width: 100 },
      ),
    );
    expect(r.leftOffsets).toEqual({ id: 0, name: 80 });
    expect(r.rightOffsets).toEqual({});
    expect(r.lastLeftFixedKey).toBe("name");
    expect(r.firstRightFixedKey).toBeUndefined();
  });

  it("右固定从尾累加：lastCol right=0, secondLast right=lastCol.width", () => {
    const r = computeFixedColumnLayout(
      cols(
        { key: "id" },
        { key: "status", width: 100, fixed: "right" },
        { key: "actions", width: 150, fixed: "right" },
      ),
    );
    expect(r.rightOffsets).toEqual({ actions: 0, status: 150 });
    expect(r.firstRightFixedKey).toBe("status");
  });

  it("两侧都有固定 + 中间普通列", () => {
    const r = computeFixedColumnLayout(
      cols(
        { key: "id", width: 60, fixed: "left" },
        { key: "name", width: 120, fixed: "left" },
        { key: "status", width: 100 },
        { key: "notes", width: 200 },
        { key: "actions", width: 140, fixed: "right" },
      ),
    );
    expect(r.leftOffsets).toEqual({ id: 0, name: 60 });
    expect(r.rightOffsets).toEqual({ actions: 0 });
    expect(r.lastLeftFixedKey).toBe("name");
    expect(r.firstRightFixedKey).toBe("actions");
  });

  it("没有任何 fixed 列 → 偏移表全空", () => {
    const r = computeFixedColumnLayout(
      cols({ key: "a" }, { key: "b" }, { key: "c" }),
    );
    expect(r.leftOffsets).toEqual({});
    expect(r.rightOffsets).toEqual({});
    expect(r.lastLeftFixedKey).toBeUndefined();
    expect(r.firstRightFixedKey).toBeUndefined();
  });

  it("width 缺失 → 当 0 算（消费方应该给 fixed 列传 width；这条只是兜底不崩）", () => {
    const r = computeFixedColumnLayout(
      cols(
        { key: "id", fixed: "left" }, // no width
        { key: "name", width: 120, fixed: "left" },
      ),
    );
    expect(r.leftOffsets).toEqual({ id: 0, name: 0 });
  });

  it('width 是字符串 "80px" → parseFloat 取 80', () => {
    const r = computeFixedColumnLayout(
      cols(
        { key: "id", width: "80px", fixed: "left" },
        { key: "name", width: "120px", fixed: "left" },
      ),
    );
    expect(r.leftOffsets).toEqual({ id: 0, name: 80 });
  });

  it("width 是 % 字符串 → parseFloat 取数值（消费方约束 fixed 列别用 %）", () => {
    const r = computeFixedColumnLayout(
      cols(
        { key: "id", width: "10%", fixed: "left" },
        { key: "name", width: "20%", fixed: "left" },
      ),
    );
    // 10 + 20 但单位丢了；这条 case 主要验"不崩"。fixed 列业务约束传 px / number。
    expect(r.leftOffsets).toEqual({ id: 0, name: 10 });
  });

  it("中间穿插非 fixed 列后再出现 fixed 列 → 边界 key 仍是连续区段的最后一个", () => {
    // 业界通用约束：fixed 必须连续声明，但运行时不强校验。这条验证 lastLeft/
    // firstRight 计算逻辑：遇到第一个非 fixed 列后就停止刷新边界。
    const r = computeFixedColumnLayout(
      cols(
        { key: "id", width: 60, fixed: "left" },
        { key: "name", width: 120, fixed: "left" },
        { key: "status", width: 100 }, // 中断
        { key: "extra", width: 80, fixed: "left" }, // 不再被认作 left 边界
      ),
    );
    // 偏移仍累加到 'extra'（因为 for 循环按 fixed 标志走，跳过中间列），但
    // edge key 在中断点结束 → 阴影只画到 'name' 上
    expect(r.lastLeftFixedKey).toBe("name");
  });
});
