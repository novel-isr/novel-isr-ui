/**
 * Tabs —— 选项卡，基于 Radix Tabs。
 *
 *   <Tabs defaultValue="overview">
 *     <TabList>
 *       <Tab value="overview">概览</Tab>
 *       <Tab value="rules">规则</Tab>
 *     </TabList>
 *     <TabPanel value="overview">...</TabPanel>
 *     <TabPanel value="rules">...</TabPanel>
 *   </Tabs>
 *
 * variant: line (默认下划线) / enclosed (浏览器 tab 风) / soft (圆角软背景)
 */

import * as RadixTabs from '@radix-ui/react-tabs';
import { createContext, forwardRef, useContext, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type TabsVariant = 'line' | 'enclosed' | 'soft';
export type TabsOrientation = 'horizontal' | 'vertical';

interface TabsCtxValue {
  variant: TabsVariant;
  orientation: TabsOrientation;
}

const TabsContext = createContext<TabsCtxValue>({ variant: 'line', orientation: 'horizontal' });

export interface TabsProps extends Omit<RadixTabs.TabsProps, 'asChild'> {
  variant?: TabsVariant;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(props, ref) {
  const { variant = 'line', orientation = 'horizontal', className, children, ...rest } = props;
  return (
    <TabsContext.Provider value={{ variant, orientation }}>
      <RadixTabs.Root
        ref={ref}
        orientation={orientation}
        className={cn(
          'ui-tabs',
          `ui-tabs-variant-${variant}`,
          `ui-tabs-orientation-${orientation}`,
          className
        )}
        {...rest}
      >
        {children}
      </RadixTabs.Root>
    </TabsContext.Provider>
  );
});

export interface TabListProps extends Omit<RadixTabs.TabsListProps, 'asChild'> {}
export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(props, ref) {
  const { className, ...rest } = props;
  return <RadixTabs.List ref={ref} className={cn('ui-tabs-list', className)} {...rest} />;
});

export interface TabProps extends Omit<RadixTabs.TabsTriggerProps, 'asChild'> {
  children: ReactNode;
}
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(props, ref) {
  const { className, children, ...rest } = props;
  return (
    <RadixTabs.Trigger ref={ref} className={cn('ui-tabs-trigger', className)} {...rest}>
      {children}
    </RadixTabs.Trigger>
  );
});

export interface TabPanelProps extends Omit<RadixTabs.TabsContentProps, 'asChild'> {}
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(props, ref) {
  const { className, ...rest } = props;
  return <RadixTabs.Content ref={ref} className={cn('ui-tabs-content', className)} {...rest} />;
});

void useContext; // for type-only re-export hygiene
