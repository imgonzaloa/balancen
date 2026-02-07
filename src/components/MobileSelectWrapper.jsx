/**
 * Mobile-friendly Select Wrapper
 * Uses Drawer (bottom sheet) on mobile, regular Select on desktop
 */

import React, { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export function MobileSelect({
  value,
  onValueChange,
  children,
  placeholder,
  label,
  triggerClassName,
  contentClassName,
  ...props
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  if (!isMobile) {
    // Desktop: use regular Select
    return (
      <Select value={value} onValueChange={onValueChange} {...props}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {children}
        </SelectContent>
      </Select>
    );
  }

  // Mobile: use Drawer
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={triggerClassName || 'w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm'}
      >
        <span className="text-muted-foreground">
          {value ? value : placeholder}
        </span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{label || 'Select option'}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-2 p-4">
            {React.Children.map(children, (child) => {
              if (!child || child.type !== SelectItem) return child;
              
              return (
                <Button
                  key={child.props.value}
                  onClick={() => {
                    onValueChange(child.props.value);
                    setOpen(false);
                  }}
                  variant={value === child.props.value ? 'default' : 'outline'}
                  className="justify-start h-10"
                >
                  {child.props.children}
                </Button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default MobileSelect;