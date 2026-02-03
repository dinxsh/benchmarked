'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompare } from '@/hooks/use-api';
import { useState } from 'react';
import {
  IconCheck,
  IconX,
  IconTrophy,
  IconTrendingUp,
  IconTrendingDown,
  IconBolt,
  IconServer
} from '@tabler/icons-react';

const PROVIDERS = [
  { value: 'alchemy', label: 'Alchemy' },
  { value: 'infura', label: 'Infura' },
  { value: 'quicknode', label: 'QuickNode' },
  { value: 'goldrush', label: 'GoldRush' },
  { value: 'ankr', label: 'Ankr' },
  { value: 'chainstack', label: 'Chainstack' },
  { value: 'bitquery', label: 'Bitquery' },
  { value: 'subsquid', label: 'Subsquid' }
];

export default function ComparePage() {
  const [providerA, setProviderA] = useState('alchemy');
  const [providerB, setProviderB] = useState('infura');
  const { data, isLoading, error } = useCompare(providerA, providerB);

  return (
    <PageContainer>
      <div className='flex flex-col gap-8 pb-8'>
        {/* Header Section */}
        <div className='flex flex-col items-center justify-center space-y-4 text-center'>
          <h1 className='text-3xl font-bold tracking-tight'>Head-to-Head</h1>
          <p className='text-muted-foreground max-w-[600px]'>
            Compare performance, pricing, and capabilities directly to make the
            best infrastructure decision.
          </p>
        </div>

        {/* Selection Area */}
        <div className='relative flex flex-col items-center gap-4 md:flex-row md:justify-center'>
          {/* Provider A Select */}
          <div className='w-full max-w-[280px]'>
            <Select value={providerA} onValueChange={setProviderA}>
              <SelectTrigger className='h-12 border-2 text-lg font-medium'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem
                    key={p.value}
                    value={p.value}
                    disabled={p.value === providerB}
                  >
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VS Badge */}
          <div className='bg-primary text-primary-foreground ring-background z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black shadow-lg ring-4'>
            VS
          </div>

          {/* Provider B Select */}
          <div className='w-full max-w-[280px]'>
            <Select value={providerB} onValueChange={setProviderB}>
              <SelectTrigger className='h-12 border-2 text-lg font-medium'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem
                    key={p.value}
                    value={p.value}
                    disabled={p.value === providerA}
                  >
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Comparison Grid */}
        {isLoading ? (
          <ComparisonSkeleton />
        ) : error ? (
          <Card className='bg-destructive/10 text-destructive mx-auto max-w-lg text-center'>
            <CardContent className='pt-6'>
              Failed to load comparison data.
            </CardContent>
          </Card>
        ) : data ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {/* Provider A Card */}
            <ProviderCard
              provider={data.provider_a}
              isWinner={data.deltas.winner === 'provider_a'}
            />

            {/* Center Stats Column */}
            <div className='space-y-6'>
              {/* Winner Banner */}
              <Card className='border-primary/20 bg-primary/5 text-center shadow-none'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-muted-foreground text-lg font-medium'>
                    Winner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-primary flex items-center justify-center gap-2 text-2xl font-bold'>
                    <IconTrophy className='h-6 w-6' />
                    {data.deltas.winner === 'provider_a'
                      ? data.provider_a.name
                      : data.deltas.winner === 'provider_b'
                        ? data.provider_b.name
                        : 'Tie'}
                  </div>
                </CardContent>
              </Card>

              {/* Stats List */}
              <Card>
                <CardContent className='divide-y pt-6'>
                  <DeltaRow
                    label='Overall Score'
                    value={data.deltas.final_score}
                    unit='pts'
                  />
                  <DeltaRow
                    label='Latency (P50)'
                    value={data.deltas.latency_p50}
                    unit='ms'
                    inverse
                  />
                  <DeltaRow
                    label='Reliability'
                    value={data.deltas.uptime_percent}
                    unit='%'
                  />
                </CardContent>
              </Card>
            </div>

            {/* Provider B Card */}
            <ProviderCard
              provider={data.provider_b}
              isWinner={data.deltas.winner === 'provider_b'}
            />
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}

function ProviderCard({
  provider,
  isWinner
}: {
  provider: any;
  isWinner: boolean;
}) {
  return (
    <Card
      className={`relative h-full overflow-hidden transition-all duration-300 ${isWinner ? 'border-primary ring-primary ring-1' : 'hover:border-primary/50'}`}
    >
      {isWinner && (
        <div className='bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl-lg px-3 py-1 text-xs font-bold'>
          WINNER
        </div>
      )}

      <CardHeader className='flex flex-col items-center pb-2 text-center'>
        <div className='bg-background mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border p-2 shadow-sm'>
          <img
            src={provider.logo_url}
            alt={provider.name}
            className='h-full w-full object-contain'
          />
        </div>
        <CardTitle className='text-3xl'>{provider.name}</CardTitle>
        <Badge variant='secondary' className='mt-2'>
          Rank #{provider.rank}
        </Badge>
      </CardHeader>

      <CardContent className='space-y-8 pt-6'>
        {/* Score Section */}
        <div className='space-y-2 text-center'>
          <div className='text-foreground text-5xl font-black tracking-tighter'>
            {provider.scores.final_score}
          </div>
          <div className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
            Total Score
          </div>
          <Progress value={provider.scores.final_score} className='h-2' />
        </div>

        {/* Key Metrics Grid */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-muted/40 rounded-lg border p-4 text-center'>
            <div className='text-muted-foreground mb-1 flex justify-center'>
              <IconBolt className='h-4 w-4' />
            </div>
            <div className='text-xl font-bold'>
              {provider.current_metrics.latency_p50}ms
            </div>
            <div className='text-muted-foreground text-xs'>Latency</div>
          </div>
          <div className='bg-muted/40 rounded-lg border p-4 text-center'>
            <div className='text-muted-foreground mb-1 flex justify-center'>
              <IconServer className='h-4 w-4' />
            </div>
            <div className='text-xl font-bold'>
              {provider.current_metrics.uptime_percent}%
            </div>
            <div className='text-muted-foreground text-xs'>Uptime</div>
          </div>
        </div>

        {/* Capabilities List */}
        <div className='space-y-3 rounded-lg border p-4'>
          <div className='text-muted-foreground mb-2 text-xs font-semibold uppercase'>
            Capabilities
          </div>
          {Object.entries(provider.capabilities).map(([key, value]) => (
            <div
              key={key}
              className='flex items-center justify-between text-sm'
            >
              <span className='text-muted-foreground capitalize'>
                {key.replace(/_/g, ' ')}
              </span>
              {value ? (
                <IconCheck className='h-4 w-4 text-green-500' />
              ) : (
                <IconX className='text-muted-foreground/30 h-4 w-4' />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaRow({
  label,
  value,
  unit,
  inverse
}: {
  label: string;
  value: number;
  unit: string;
  inverse?: boolean;
}) {
  const isZero = value === 0;
  const isGood = inverse ? value < 0 : value > 0;

  // Formatting: always show positive number for display, use signs for logic
  const displayValue = Math.abs(value).toFixed(2);

  return (
    <div className='flex items-center justify-between py-4 last:pb-0'>
      <div className='text-muted-foreground text-sm font-medium'>{label}</div>
      <div className='flex items-center gap-2'>
        {!isZero && (
          <Badge
            variant={isGood ? 'default' : 'destructive'}
            className={isGood ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {value > 0 ? (inverse ? '+' : '+') : inverse ? '' : ''}
            {value.toFixed(2)}
            {unit}
          </Badge>
        )}
        {isZero && <Badge variant='secondary'>Diff: 0</Badge>}
      </div>
    </div>
  );
}

function ComparisonSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
      <Skeleton className='h-[600px] w-full rounded-xl' />
      <div className='space-y-6 pt-20'>
        <Skeleton className='h-32 w-full rounded-xl' />
        <Skeleton className='h-64 w-full rounded-xl' />
      </div>
      <Skeleton className='h-[600px] w-full rounded-xl' />
    </div>
  );
}
