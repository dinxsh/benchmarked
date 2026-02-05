'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconChevronRight } from '@tabler/icons-react';
import { Trophy } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatDecimal } from '@/lib/utils';
import { isGoldRush } from '@/lib/goldrush-theme';

export type Provider = {
  id: string;
  name: string;
  slug: string;
  rank: number;
  logo_url?: string;
  scores: {
    final_score: number;
  };
  current_metrics: {
    latency_p50: number;
    uptime_percent: number;
    response_size_bytes?: number;
  };
  last_response_body?: any;
  health_status: 'healthy' | 'degraded' | 'unhealthy';
  trend: 'up' | 'down' | 'stable';
};

export const columns: ColumnDef<Provider>[] = [
  {
    accessorKey: 'rank',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Rank' />
    ),
    cell: ({ row }) => {
      const provider = row.original;
      const isGR = isGoldRush(provider.name);
      return (
        <div className='w-[50px] font-medium flex items-center gap-1'>
          {isGR && <Trophy className="h-4 w-4 text-amber-500" />}
          <span className={isGR ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
            #{row.getValue('rank')}
          </span>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
    sortingFn: 'basic',
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Provider' />
    ),
    cell: ({ row }) => {
      const provider = row.original;
      const isGR = isGoldRush(provider.name);
      return (
        <div className='flex items-center gap-2'>
          <Avatar className={isGR ? 'h-8 w-8 ring-2 ring-amber-500' : 'h-8 w-8'}>
            <AvatarImage src={provider.logo_url} alt={provider.name} />
            <AvatarFallback>{provider.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={isGR ? 'font-bold text-lg' : 'font-semibold'}>{provider.name}</span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'scores.final_score',
    id: 'score',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Score' />
    ),
    cell: ({ row }) => {
      const score = row.original.scores?.final_score;
      return (
        <div className='flex items-center gap-2'>
          <span className='text-lg font-bold'>{score ?? 'N/A'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'current_metrics.latency_p50',
    id: 'latency',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Latency (p50)' />
    ),
    cell: ({ row }) => {
      const latency = row.original.current_metrics?.latency_p50 || 0;
      return (
        <Badge
          variant={
            latency < 50
              ? 'default'
              : latency < 150
                ? 'secondary'
                : 'destructive'
          }
          className={
            latency < 50
              ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white'
              : latency < 150
                ? 'bg-amber-500 hover:bg-amber-600 border-transparent text-white'
                : ''
          }
        >
          {latency} ms
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as number;
      if (Array.isArray(value) && value.length === 2) {
        return rowValue >= value[0] && rowValue <= value[1];
      }
      return true;
    },
    meta: {
      unit: 'ms',
      range: [0, 500] // Reasonable max for filter
    }
  },
  {
    accessorKey: 'current_metrics.uptime_percent',
    id: 'uptime',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Uptime' />
    ),
    cell: ({ row }) => {
      const uptime = row.original.current_metrics?.uptime_percent;
      return (
        <div>{uptime !== undefined ? formatDecimal(uptime) : '0'}%</div>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as number;
      if (Array.isArray(value) && value.length === 2) {
        return rowValue >= value[0] && rowValue <= value[1];
      }
      return true;
    },
    meta: {
      unit: '%',
      range: [0, 100]
    }
  },
  {
    accessorKey: 'current_metrics.response_size_bytes',
    id: 'response_size',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Response Size' />
    ),
    cell: ({ row }) => {
      const bytes = row.original.current_metrics?.response_size_bytes;
      if (bytes === undefined || bytes === null) return <span className="text-muted-foreground">-</span>;

      const kbs = formatDecimal(bytes / 1024);
      return (
        <div className="font-mono text-xs">
          {kbs} KB
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as number;
      if (Array.isArray(value) && value.length === 2) {
        // Convert filter value (KB) to bytes for comparison
        const minBytes = value[0] * 1024;
        const maxBytes = value[1] * 1024;
        return rowValue >= minBytes && rowValue <= maxBytes;
      }
      return true;
    },
    meta: {
      unit: 'KB',
      range: [0, 1024]
    }
  },
  {
    accessorKey: 'health_status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('health_status') as string;
      return (
        <Badge
          variant='outline'
          className={
            status === 'healthy'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-amber-500 text-amber-500'
          }
        >
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'trend',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Trend' />
    ),
    cell: ({ row }) => {
      const trend = row.getValue('trend') as string;
      return (
        <div className="text-right">
          {trend === 'up' ? (
            <span className="text-emerald-500 font-bold">↗</span>
          ) : trend === 'down' ? (
            <span className="text-red-500 font-bold">↘</span>
          ) : (
            <span className="text-muted-foreground">→</span>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <IconChevronRight className='text-muted-foreground h-4 w-4' />,
  },
];
