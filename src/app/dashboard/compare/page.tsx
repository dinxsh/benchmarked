'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useCompare } from '@/hooks/use-api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { IconCheck, IconX } from '@tabler/icons-react';

const PROVIDERS = [
  { value: 'alchemy', label: 'Alchemy' },
  { value: 'infura', label: 'Infura' },
  { value: 'quicknode', label: 'QuickNode' },
  { value: 'goldrush', label: 'GoldRush (Covalent)' },
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
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Provider Comparison
          </h1>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-1 items-center gap-8 md:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Provider A</label>
                <Select value={providerA} onValueChange={setProviderA}>
                  <SelectTrigger>
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

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Provider B</label>
                <Select value={providerB} onValueChange={setProviderB}>
                  <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Comparison Content */}
        {isLoading ? (
          <Skeleton className='h-[400px] w-full' />
        ) : error ? (
          <Card className='bg-destructive/10'>
            <CardContent className='pt-6'>
              <p className='text-destructive'>Failed to load comparison data</p>
            </CardContent>
          </Card>
        ) : data ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {/* Provider A Column */}
            <ProviderColumn provider={data.provider_a} />

            {/* Comparison Column */}
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-center'>
                    Performance Delta
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-8'>
                  <DeltaRow
                    label='Final Score'
                    value={data.deltas.final_score}
                    unit=''
                    inverse={false}
                  />
                  <DeltaRow
                    label='Latency (p50)'
                    value={data.deltas.latency_p50}
                    unit='ms'
                    inverse={true} // Lower is better
                  />
                  <DeltaRow
                    label='Uptime'
                    value={data.deltas.uptime_percent}
                    unit='%'
                    inverse={false}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Provider B Column */}
            <ProviderColumn provider={data.provider_b} />
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}

function ProviderColumn({ provider }: { provider: any }) {
  return (
    <Card className='h-full'>
      <CardHeader className='border-b pb-6 text-center'>
        <div className='mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full border'>
          <img
            src={provider.logo_url}
            alt={provider.name}
            className='h-full w-full object-cover'
          />
        </div>
        <CardTitle className='text-2xl'>{provider.name}</CardTitle>
        <div className='mt-2 flex justify-center gap-2'>
          <Badge variant='secondary'>Rank #{provider.rank}</Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-6 pt-6'>
        <div className='text-center'>
          <div className='text-primary text-4xl font-bold'>
            {provider.scores.final_score}
          </div>
          <div className='text-muted-foreground mt-1 text-sm tracking-wider uppercase'>
            Total Score
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-muted/50 rounded-lg p-3 text-center'>
            <div className='text-xl font-semibold'>
              {provider.current_metrics.latency_p50}ms
            </div>
            <div className='text-muted-foreground text-xs'>Latency</div>
          </div>
          <div className='bg-muted/50 rounded-lg p-3 text-center'>
            <div className='text-xl font-semibold'>
              {provider.current_metrics.uptime_percent}%
            </div>
            <div className='text-muted-foreground text-xs'>Uptime</div>
          </div>
        </div>

        <div className='space-y-2'>
          <h4 className='mb-2 text-sm font-semibold'>Capabilities</h4>
          {Object.entries(provider.capabilities).map(([key, value]) => (
            <div
              key={key}
              className='flex items-center justify-between text-sm'
            >
              <span className='text-muted-foreground capitalize'>
                {key.replace('_', ' ')}
              </span>
              {value ? (
                <IconCheck className='h-4 w-4 text-green-500' />
              ) : (
                <IconX className='text-muted-foreground h-4 w-4' />
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
  inverse: boolean;
}) {
  const isPositive = value > 0;
  const isZero = value === 0;

  // Color logic
  // If inverse (e.g. latency), negative delta is GOOD (green)
  // If normal (e.g. score), positive delta is GOOD (green)
  let colorClass = 'text-muted-foreground';
  if (!isZero) {
    if (inverse) {
      colorClass = isPositive ? 'text-red-500' : 'text-green-500';
    } else {
      colorClass = isPositive ? 'text-green-500' : 'text-red-500';
    }
  }

  return (
    <div className='text-center'>
      <div className='text-muted-foreground mb-1 text-sm'>
        {label} Difference
      </div>
      <div className={`text-2xl font-bold ${colorClass}`}>
        {isPositive ? '+' : ''}
        {value.toFixed(2)}
        {unit}
      </div>
      <div className='text-muted-foreground text-xs'>(A - B)</div>
    </div>
  );
}
