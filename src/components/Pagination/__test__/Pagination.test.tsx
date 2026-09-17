import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Pagination } from '../Pagination';
import { DataTable } from '../../Table/DataTable';

describe('Pagination totals', () => {
  it('renders an optional total without leaking the prop to the DOM', () => {
    const html = renderToStaticMarkup(<Pagination total={27} pageSize={10} page={2} onPageChange={() => {}} showTotal />);
    expect(html).toContain('共 27 条');
    expect(html).not.toContain('showTotal=');
  });

  it('supplies a bounded visible range and supports empty results', () => {
    const format = (total: number, range: [number, number]) => `${range[0]}-${range[1]} / ${total}`;
    const render = (total: number, page: number) => renderToStaticMarkup(
      <Pagination total={total} pageSize={10} page={page} onPageChange={() => {}} showTotal={format} />,
    );
    expect(render(27, 3)).toContain('21-27 / 27');
    expect(render(0, 1)).toContain('0-0 / 0');
    expect(render(5, 3)).toContain('1-5 / 5');
  });

  it('keeps existing pagination unchanged unless requested', () => {
    const html = renderToStaticMarkup(<Pagination total={27} pageSize={10} page={1} onPageChange={() => {}} />);
    expect(html).not.toContain('ui-pagination-total');
  });

  it('exposes totals through DataTable pagination', () => {
    const html = renderToStaticMarkup(<DataTable<{ id: string }> data={[]} columns={[{ key: 'id', header: 'ID' }]} rowKey={row => row.id}
      pagination={{ total: 0, page: 1, pageSize: 10, onPageChange: () => {}, showTotal: true }} />);
    expect(html).toContain('共 0 条');
  });
});
