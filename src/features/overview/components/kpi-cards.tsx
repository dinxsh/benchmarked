'use client';

import { useLeaderboard } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconActivity,
  IconBolt,
  IconServer,
  IconTrophy
} from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';

export function KPICards() {
  const { data: leaderboard, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className='h-[120px] rounded-xl' />
        ))}
      </div>
    );
  }

  const providers = leaderboard?.data || [];
  const topProvider = providers[0];

  const validLatencyProviders = providers.filter(
    (p: any) => p.current_metrics?.latency_p50 > 0
  );
  const avgLatency = validLatencyProviders.length
    ? Math.round(
      validLatencyProviders.reduce(
        (acc: number, p: any) => acc + p.current_metrics.latency_p50,
        0
      ) / validLatencyProviders.length
    )
    : 0;
  const uptimeTotal = providers.reduce(
    (acc: number, p: any) => acc + (p.current_metrics?.uptime_percent || 0),
    0
  );
  const avgUptime = providers.length
    ? (uptimeTotal / providers.length).toFixed(2)
    : '0.00';

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Top Provider</CardTitle>
          <div className='rounded-full bg-primary/10 p-2 text-primary'>
            <IconTrophy className='h-4 w-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{topProvider?.name || 'N/A'}</div>
          <p className='text-muted-foreground text-xs'>
            Score: <span className="font-medium text-foreground">{topProvider?.scores?.final_score ?? 'N/A'}</span>
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Avg Latency (p50)
          </CardTitle>
          <div className='rounded-full bg-blue-500/10 p-2 text-blue-500'>
            <IconBolt className='h-4 w-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{avgLatency} ms</div>
          <p className='text-muted-foreground text-xs'>
            Across {providers.length} providers
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Network Uptime</CardTitle>
          <div className='rounded-full bg-green-500/10 p-2 text-green-500'>
            <IconActivity className='h-4 w-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{avgUptime}%</div>
          <p className='text-muted-foreground text-xs'>Global stability</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Active Providers
          </CardTitle>
          <div className='rounded-full bg-orange-500/10 p-2 text-orange-500'>
            <IconServer className='h-4 w-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{providers.length}</div>
          <p className='text-muted-foreground text-xs'>Monitoring now</p>
        </CardContent>
      </Card>
    </div>
  );
}
