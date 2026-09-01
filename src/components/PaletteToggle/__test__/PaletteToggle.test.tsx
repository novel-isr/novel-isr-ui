/**
 * @vitest-environment happy-dom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../ThemeProvider';
import { PaletteToggle } from '../PaletteToggle';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

function renderToggle() {
  act(() => {
    root.render(
      <ThemeProvider defaultPalette="graphite" disableStorage>
        <PaletteToggle
          palettes={['graphite', 'cool']}
          labels={{ graphite: '石墨灰', cool: '冷灰蓝' }}
        />
      </ThemeProvider>
    );
  });
}

describe('PaletteToggle', () => {
  it('renders only the palettes requested by the consumer', () => {
    renderToggle();
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.map(button => button.textContent)).toEqual(['石墨灰', '冷灰蓝']);
  });

  it('updates the document palette through ThemeProvider', () => {
    renderToggle();
    const coolButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent === '冷灰蓝'
    );
    expect(coolButton).toBeDefined();
    act(() => {
      coolButton?.click();
    });
    expect(document.documentElement.dataset.palette).toBe('cool');
  });
});
