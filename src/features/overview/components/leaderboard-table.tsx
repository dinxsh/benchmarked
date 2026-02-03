'use client';

import { useLeaderboard } from '@/hooks/use-api';
import { IconChevronRight } from '@tabler/icons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export function LeaderboardTable() {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const router = useRouter();

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[50px]'>Rank</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Latency (p50)</TableHead>
              <TableHead>Uptime</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Trend</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard?.data?.map((provider: any) => (
              <TableRow
                key={provider.id}
                className='hover:bg-muted/50 cursor-pointer'
                onClick={() =>
                  router.push(`/dashboard/provider/${provider.slug}`)
                }
              >
                <TableCell className='font-medium'>#{provider.rank}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage
                        src={provider.logo_url}
                        alt={provider.name}
                      />
                      <AvatarFallback>{provider.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className='font-semibold'>{provider.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <span className='text-lg font-bold'>
                      {provider.scores?.final_score ?? 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      (provider.current_metrics?.latency_p50 || 0) < 50
                        ? 'default' // Greenish (Shadcn default is usually black/primary, need overrides or utilize outline for colors)
                        : (provider.current_metrics?.latency_p50 || 0) < 150
                          ? 'secondary'
                          : 'destructive'
                    }
                    className={
                      (provider.current_metrics?.latency_p50 || 0) < 50
                        ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white'
                        : (provider.current_metrics?.latency_p50 || 0) < 150
                          ? 'bg-amber-500 hover:bg-amber-600 border-transparent text-white'
                          : ''
                    }
                  >
                    {provider.current_metrics?.latency_p50 ?? 0} ms
                  </Badge>
                </TableCell>
                <TableCell>
                  {provider.current_metrics?.uptime_percent?.toFixed(2) ?? '0.00'}%
                </TableCell>
                <TableCell>
                  <Badge
                    variant='outline'
                    className={
                      provider.health_status === 'healthy'
                        ? 'border-emerald-500 text-emerald-500'
                        : 'border-amber-500 text-amber-500'
                    }
                  >
                    {provider.health_status}
                  </Badge>
                </TableCell>
                <TableCell className='text-right'>
                  {provider.trend === 'up' ? (
                    <span className="text-emerald-500 font-bold">↗</span>
                  ) : provider.trend === 'down' ? (
                    <span className="text-red-500 font-bold">↘</span>
                  ) : (
                    <span className="text-muted-foreground">→</span>
                  )}
                </TableCell>
                <TableCell>
                  <IconChevronRight className='text-muted-foreground h-4 w-4' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
