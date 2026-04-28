/**
 * useDisclosure —— 受控/非受控开关状态。Modal/Drawer/Popover 等 overlay 复用。
 *
 *   const modal = useDisclosure();
 *   <Button onClick={modal.onOpen}>open</Button>
 *   <Modal isOpen={modal.isOpen} onClose={modal.onClose}>...</Modal>
 *
 * 受控用法：
 *   const modal = useDisclosure({ isOpen: parentOpen, onChange: setParentOpen });
 *
 * 设计同 Chakra useDisclosure（API 已是事实标准）。
 */

import { useCallback, useState } from 'react';

export interface UseDisclosureProps {
  /** 受控的当前状态；不传则非受控 */
  isOpen?: boolean;
  /** 受控时父组件的 setter */
  onChange?: (isOpen: boolean) => void;
  /** 非受控的初始状态 */
  defaultIsOpen?: boolean;
}

export interface UseDisclosureReturn {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
}

export function useDisclosure(props: UseDisclosureProps = {}): UseDisclosureReturn {
  const [internal, setInternal] = useState(props.defaultIsOpen ?? false);

  const isControlled = props.isOpen !== undefined;
  const isOpen = isControlled ? (props.isOpen as boolean) : internal;

  const set = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      props.onChange?.(next);
    },
    [isControlled, props]
  );

  const onOpen = useCallback(() => set(true), [set]);
  const onClose = useCallback(() => set(false), [set]);
  const onToggle = useCallback(() => set(!isOpen), [set, isOpen]);

  return { isOpen, onOpen, onClose, onToggle };
}
