'use client';

import React from 'react';
import PageContainer from '@/components/layout/page-container';
import { useProvider, useMetrics } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { IconExternalLink, IconCheck, IconX } from '@tabler/icons-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useParams } from 'next/navigation';

export default function ProviderDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: providerData, isLoading: providerLoading } = useProvider(slug);
  const { data: metricsData, isLoading: metricsLoading } = useMetrics(slug, {
    timeframe: '24h',
    metric: 'latency_p50'
  });

  if (providerLoading) {
    return (
      <PageContainer>
        <Skeleton className='mb-4 h-[200px] w-full' />
        <Skeleton className='h-[400px] w-full' />
      </PageContainer>
    );
  }

  const { provider } = providerData || {};

  if (!provider) {
    return (
      <PageContainer>
        <div>Provider not found</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        {/* Header Section */}
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
              <AvatarImage src={provider.logo_url} alt={provider.name} />
              <AvatarFallback>{provider.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
                {provider.name}
                <Badge variant='outline' className='text-base font-normal'>
                  Rank #{provider.rank}
                </Badge>
              </h1>
              <div className='text-muted-foreground mt-1 flex items-center gap-2'>
                {provider.supported_chains.map((chain: string) => (
                  <Badge key={chain} variant='secondary' className='text-xs'>
                    {chain}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' asChild>
              <a
                href={provider.website_url}
                target='_blank'
                rel='noopener noreferrer'
              >
                Visit Website <IconExternalLink className='ml-2 h-4 w-4' />
              </a>
            </Button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Final Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-primary text-2xl font-bold'>
                {provider.scores.final_score}
              </div>
              <p className='text-muted-foreground text-xs'>/ 100</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Latency (p50)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {provider.current_metrics.latency_p50} ms
              </div>
              <p className='text-muted-foreground text-xs'>Current snapshot</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {provider.current_metrics.uptime_percent}%
              </div>
              <p className='text-muted-foreground text-xs'>Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Pricing Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ${provider.pricing.cost_per_million}
              </div>
              <p className='text-muted-foreground text-xs'>Per 1M requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className='grid gap-6 md:grid-cols-3'>
          {/* Chart Section */}
          <Card className='col-span-2'>
            <CardHeader>
              <CardTitle>Latency Performance (24h)</CardTitle>
              <CardDescription>
                p50 response time in milliseconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[300px]'>
                {metricsLoading ? (
                  <div className='flex h-full items-center justify-center'>
                    <Skeleton className='h-full w-full' />
                  </div>
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={metricsData?.data}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        className='stroke-muted'
                      />
                      <XAxis
                        dataKey='timestamp'
                        tickFormatter={(str) =>
                          new Date(str).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        }
                        className='text-muted-foreground text-xs'
                      />
                      <YAxis className='text-muted-foreground text-xs' />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--popover)',
                          color: 'var(--popover-foreground)',
                          borderColor: 'var(--border)',
                          borderRadius: 'var(--radius)'
                        }}
                        itemStyle={{ color: 'var(--primary)' }}
                        labelFormatter={(label) =>
                          new Date(label).toLocaleString()
                        }
                        formatter={(value: number) => [
                          value.toFixed(2),
                          'Latency'
                        ]}
                      />
                      <Line
                        type='monotone'
                        dataKey='value'
                        stroke='var(--primary)'
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 6,
                          style: { fill: 'var(--primary)', opacity: 0.8 }
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Capabilities Section */}
          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
              <CardDescription>Supported features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {Object.entries(provider.capabilities).map(([key, value]) => (
                  <div key={key} className='flex items-center justify-between'>
                    <span className='text-sm font-medium capitalize'>
                      {key.replace('_', ' ')}
                    </span>
                    {value ? (
                      <IconCheck className='h-4 w-4 text-green-500' />
                    ) : (
                      <IconX className='h-4 w-4 text-red-500' />
                    )}
                  </div>
                ))}
              </div>
              <div className='mt-6 border-t pt-4'>
                <h4 className='mb-2 text-sm font-semibold'>Rate Limits</h4>
                <div className='text-muted-foreground text-sm'>
                  {provider.pricing.rate_limit || 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
