'use client';

import { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CSVUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csv', file);

      const res = await fetch('/api/dex/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
        // Initialize streaming after successful upload
        await fetch('/api/dex/stream/init', { method: 'POST' });
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={() => document.getElementById('csv-upload')?.click()}
        disabled={uploading}
        variant="outline"
        size="sm"
        className="h-7 px-3 border-2 border-foreground font-mono text-[10px] uppercase"
      >
        {uploading ? (
          <>
            <div className="h-3 w-3 border-2 border-foreground border-t-transparent animate-spin mr-1.5" />
            UPLOADING...
          </>
        ) : (
          <>
            <Upload className="h-3 w-3 mr-1.5" />
            LOAD CSV
          </>
        )}
      </Button>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />

      {result && (
        <div className="flex items-center gap-2 border-2 border-accent bg-accent/5 px-2 py-1">
          <CheckCircle2 className="h-3 w-3 text-accent" />
          <span className="text-[10px] font-mono uppercase font-bold text-accent">
            LOADED {result.loaded} PAIRS
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 border-2 border-destructive bg-destructive/5 px-2 py-1">
          <AlertCircle className="h-3 w-3 text-destructive" />
          <span className="text-[10px] font-mono uppercase text-destructive">
            {error}
          </span>
        </div>
      )}

      <p className="text-[9px] font-mono text-muted-foreground uppercase">
        CSV: PAIRADDRESS, TOKEN0, TOKEN1, DEX
      </p>
    </div>
  );
}
