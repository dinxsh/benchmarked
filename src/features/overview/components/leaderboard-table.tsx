'use client';

import { useLeaderboard } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { columns } from './leaderboard-columns';
import { LeaderboardToolbar } from './leaderboard-toolbar';
import { DataTable } from '@/components/ui/table/data-table';

interface LeaderboardTableProps {
  sortBy?: 'fastest' | 'slowest' | 'smallest' | 'biggest' | null;
}

export function LeaderboardTable({ sortBy }: LeaderboardTableProps) {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const router = useRouter();

  const data = useMemo(() => {
    const baseData = leaderboard?.data || [];
    if (!sortBy) return baseData;

    const sorted = [...baseData];
    switch (sortBy) {
      case 'fastest':
        return sorted.sort((a, b) => a.current_metrics.latency_p50 - b.current_metrics.latency_p50);
      case 'slowest':
        return sorted.sort((a, b) => b.current_metrics.latency_p50 - a.current_metrics.latency_p50);
      case 'smallest':
        return sorted.sort((a, b) =>
          (a.current_metrics.response_size_bytes || Infinity) - (b.current_metrics.response_size_bytes || Infinity)
        );
      case 'biggest':
        return sorted.sort((a, b) =>
          (b.current_metrics.response_size_bytes || 0) - (a.current_metrics.response_size_bytes || 0)
        );
      default:
        return baseData;
    }
  }, [leaderboard?.data, sortBy]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      sorting: [
        {
          id: 'rank',
          desc: false,
        },
      ],
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return <Skeleton className='h-[400px] w-full rounded-xl' />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Market Leaderboard</CardTitle>
          {leaderboard?.last_updated && (
            <span className="text-xs text-muted-foreground font-normal">
              Updated: {new Date(leaderboard.last_updated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          table={table}
          scrollable={false}
          onRowClick={(row) => router.push(`/dashboard/provider/${row.original.slug}`)}
        >
          <LeaderboardToolbar table={table} />
        </DataTable>
      </CardContent>
    </Card>
  );
}
