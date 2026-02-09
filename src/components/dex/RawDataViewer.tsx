'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RawDataViewerProps {
  data: any;
  title?: string;
}

export function RawDataViewer({ data, title = 'Raw Data' }: RawDataViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-6 px-2 border border-foreground font-mono text-[10px] uppercase"
      >
        <ChevronRight className="h-3 w-3 mr-1" />
        VIEW JSON
      </Button>
    );
  }

  return (
    <div className="border-2 border-foreground bg-background mt-2">
      {/* Header */}
      <div className="border-b-2 border-foreground px-2 py-1 flex items-center justify-between bg-muted/10">
        <button
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider hover:text-accent"
        >
          <ChevronDown className="h-3 w-3" />
          {title}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-5 px-2 border border-foreground"
        >
          {copied ? (
            <Check className="h-3 w-3 text-accent" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* JSON Content - Terminal style */}
      <div className="p-2 max-h-[400px] overflow-auto bg-[#0a0a0a] text-[#00ff00]">
        <pre className="font-mono text-[10px] leading-relaxed">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
