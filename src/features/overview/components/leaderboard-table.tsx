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
        <CardTitle>Market Leaderboard</CardTitle>
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
                      (provider.current_metrics?.latency_p50 || 0) < 150
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {provider.current_metrics?.latency_p50 ?? 0} ms
                  </Badge>
                </TableCell>
                <TableCell>
                  {provider.current_metrics?.uptime_percent ?? 0}%
                </TableCell>
                <TableCell>
                  <Badge
                    variant='outline'
                    className={
                      provider.health_status === 'healthy'
                        ? 'border-green-500 text-green-500'
                        : 'border-yellow-500 text-yellow-500'
                    }
                  >
                    {provider.health_status}
                  </Badge>
                </TableCell>
                <TableCell className='text-right'>
                  {provider.trend === 'up'
                    ? '↗'
                    : provider.trend === 'down'
                      ? '↘'
                      : '→'}
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
