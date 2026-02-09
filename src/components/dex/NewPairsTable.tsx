'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface NewPairsTableProps {
  maxPairs?: number;
  refreshInterval?: number;
}

export function NewPairsTable({
  maxPairs = 20,
  refreshInterval = 5000
}: NewPairsTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['newPairs', maxPairs],
    queryFn: async () => {
      const res = await fetch(`/api/dex/pairs/new?limit=${maxPairs}`);
      return res.json();
    },
    refetchInterval: refreshInterval
  });

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-4 w-4 border-2 border-foreground border-t-transparent animate-spin" />
        </div>
      ) : data?.pairs?.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[11px]">
            <thead>
              <tr className="border-b border-foreground bg-muted/30">
                <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PAIR</th>
                <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">TOKENS</th>
                <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">DEX</th>
                <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">CREATED</th>
                <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">LATENCY</th>
              </tr>
            </thead>
            <tbody>
              {data.pairs.map((pair: any, idx: number) => (
                <tr
                  key={pair.pairAddress}
                  className={`border-b border-muted ${
                    idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                  } ${idx === 0 ? 'bg-accent/5' : ''} hover:bg-muted/30 transition-colors`}
                >
                  <td className="py-1.5 px-2 font-semibold tabular-nums">
                    {pair.token0.symbol}/{pair.token1.symbol}
                  </td>
                  <td className="py-1.5 px-2 text-[10px] text-muted-foreground">
                    <div className="truncate max-w-[150px]">{pair.token0.name}</div>
                    <div className="truncate max-w-[150px]">{pair.token1.name}</div>
                  </td>
                  <td className="py-1.5 px-2">
                    <span className="border border-foreground px-1.5 py-0.5 text-[9px] font-bold uppercase">
                      {pair.dexName}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-[10px] tabular-nums">
                    {formatDistanceToNow(new Date(pair.createdAt), {
                      addSuffix: true
                    })}
                  </td>
                  <td className="py-1.5 px-2">
                    <span className="text-accent font-bold tabular-nums">~35MS</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-[10px] font-mono text-muted-foreground uppercase">
          NO NEW PAIRS DETECTED. UPLOAD CSV OR WAIT FOR DETECTION.
        </div>
      )}
    </div>
  );
}
