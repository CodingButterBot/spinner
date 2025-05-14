import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function SimpleButtons({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button variant="default">Randomize</Button>
      <Button variant="outline">Reset</Button>
      <Button variant="secondary">Save</Button>
    </div>
  );
}