import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PageContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function PageContainer({ children, scrollable = false }: PageContainerProps) {
  if (scrollable) {
    return (
      <ScrollArea className="h-[calc(100dvh-52px)]">
        <div className="h-full p-4 md:px-6">{children}</div>
      </ScrollArea>
    );
  }

  return <div className="h-full p-4 md:px-6">{children}</div>;
}
