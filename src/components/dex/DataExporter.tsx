'use client';

import { useState } from 'react';
import { Download, Copy, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataExporterProps {
  data: any;
  filename?: string;
}

export function DataExporter({ data, filename = 'export' }: DataExporterProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, extension: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // JSON Formatted
  const exportJSONFormatted = () => {
    const json = JSON.stringify(data, null, 2);
    handleDownload(json, 'json', 'application/json');
  };

  const copyJSONFormatted = () => {
    const json = JSON.stringify(data, null, 2);
    handleCopy(json);
  };

  // JSON Minified
  const exportJSONMinified = () => {
    const json = JSON.stringify(data);
    handleDownload(json, 'json', 'application/json');
  };

  const copyJSONMinified = () => {
    const json = JSON.stringify(data);
    handleCopy(json);
  };

  // CSV
  const exportCSV = () => {
    const items = Array.isArray(data) ? data : [data];
    if (items.length === 0) return;

    // Get all unique keys
    const keys = Array.from(
      new Set(items.flatMap(item => getAllKeys(item)))
    );

    // Create CSV header
    const header = keys.join(',');

    // Create CSV rows
    const rows = items.map(item => {
      return keys.map(key => {
        const value = getNestedValue(item, key);
        const stringValue = value === null || value === undefined ? '' : String(value);
        // Escape quotes and wrap in quotes if contains comma
        return stringValue.includes(',') || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      }).join(',');
    });

    const csv = [header, ...rows].join('\n');
    handleDownload(csv, 'csv', 'text/csv');
  };

  // cURL command
  const copyCurlCommand = () => {
    const json = JSON.stringify(data);
    const curl = `curl -X POST https://api.example.com/data \\
  -H "Content-Type: application/json" \\
  -d '${json}'`;
    handleCopy(curl);
  };

  // Helper functions to flatten nested objects for CSV
  const getAllKeys = (obj: any, prefix = ''): string[] => {
    let keys: string[] = [];
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        keys = keys.concat(getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 border-2 border-foreground font-mono text-[10px] uppercase"
        >
          <Download className="h-3 w-3 mr-1" />
          EXPORT
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-2 border-foreground bg-background font-mono"
      >
        {/* JSON Formatted */}
        <DropdownMenuItem
          onClick={exportJSONFormatted}
          className="text-[11px] uppercase cursor-pointer"
        >
          <Download className="h-3 w-3 mr-2" />
          JSON (FORMATTED)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={copyJSONFormatted}
          className="text-[11px] uppercase cursor-pointer"
        >
          {copied ? (
            <Check className="h-3 w-3 mr-2 text-accent" />
          ) : (
            <Copy className="h-3 w-3 mr-2" />
          )}
          COPY JSON (FORMATTED)
        </DropdownMenuItem>

        {/* Divider */}
        <div className="h-px bg-foreground my-1" />

        {/* JSON Minified */}
        <DropdownMenuItem
          onClick={exportJSONMinified}
          className="text-[11px] uppercase cursor-pointer"
        >
          <Download className="h-3 w-3 mr-2" />
          JSON (MINIFIED)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={copyJSONMinified}
          className="text-[11px] uppercase cursor-pointer"
        >
          {copied ? (
            <Check className="h-3 w-3 mr-2 text-accent" />
          ) : (
            <Copy className="h-3 w-3 mr-2" />
          )}
          COPY JSON (MINIFIED)
        </DropdownMenuItem>

        {/* Divider */}
        <div className="h-px bg-foreground my-1" />

        {/* CSV */}
        <DropdownMenuItem
          onClick={exportCSV}
          className="text-[11px] uppercase cursor-pointer"
        >
          <Download className="h-3 w-3 mr-2" />
          CSV
        </DropdownMenuItem>

        {/* Divider */}
        <div className="h-px bg-foreground my-1" />

        {/* cURL */}
        <DropdownMenuItem
          onClick={copyCurlCommand}
          className="text-[11px] uppercase cursor-pointer"
        >
          {copied ? (
            <Check className="h-3 w-3 mr-2 text-accent" />
          ) : (
            <Copy className="h-3 w-3 mr-2" />
          )}
          COPY CURL
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
