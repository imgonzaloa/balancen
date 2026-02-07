/**
 * Mobile-aware Select wrapper
 * Uses Drawer on mobile, standard Select on desktop
 */

import React, { useState } from 'react';
import { useWindowSize } from '@/hooks/useWindowSize';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function MobileSelectWrapper({
  value,
  onValueChange,
  children,
  trigger,
  label,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange} {...props}>
        {trigger}
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    );
  }

  // Extract items from children
  const items = React.Children.toArray(children).filter(
    child => child?.type?.name === 'SelectItem'
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-left flex items-center justify-between hover:bg-white/15 transition-colors"
      >
        <span className="text-sm">
          {items.find(item => item.props.value === value)?.props.children || trigger}
        </span>
        <span className="text-white/60">›</span>
      </button>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{label || 'Select option'}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-2">
            {items.map(item => (
              <Button
                key={item.props.value}
                onClick={() => {
                  onValueChange(item.props.value);
                  setIsOpen(false);
                }}
                variant="ghost"
                className={`w-full justify-between h-12 ${
                  value === item.props.value
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {item.props.children}
                {value === item.props.value && (
                  <Check size={18} className="text-teal-300" />
                )}
              </Button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}