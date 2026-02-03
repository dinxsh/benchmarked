'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { IconClock } from '@tabler/icons-react';

interface RaceResult {
  id: string;
  name: string;
  blockHeight: number;
  latency: number;
  blocksBehind: number;
  status: 'leading' | 'lagging' | 'error';
}

interface RaceData {
  latestBlock: number;
  timestamp: string;
  providers: RaceResult[];
}

export function BlockPropagation() {
  const [data, setData] = useState<RaceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/benchmarks/head');
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Find the true winner (synced + lowest latency)
  const winnerId = data?.providers?.find(
    (p) => p.status === 'leading'
  )?.id;

  return (
    <Card className='col-span-1 border-neutral-800 bg-neutral-950/50 md:col-span-2 lg:col-span-3'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-6'>
        <div className='space-y-1'>
          <CardTitle className='text-xl font-semibold tracking-tight text-white'>
            Block Propagation Race
          </CardTitle>
          <p className='text-sm text-neutral-400'>
            Real-time block discovery competition. Which provider sees the chain tip first?
          </p>
        </div>
        <div className='flex items-center space-x-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]'>
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className='font-mono text-sm text-neutral-300'>
            Head: <span className='text-white font-bold'>#{data?.latestBlock?.toLocaleString() ?? '...'}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {loading ? (
          <div className='flex h-40 items-center justify-center text-neutral-500'>Initializing race data...</div>
        ) : (
          <div className='space-y-6'>
            {data?.providers.map((p) => {
              const isWinner = p.id === winnerId;
              const isSynced = p.status === 'leading';

              return (
                <div key={p.id} className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <div className='flex items-center gap-3'>
                      <span className={`font-medium ${isWinner ? 'text-emerald-400' : 'text-neutral-300'}`}>
                        {p.name}
                      </span>
                      {isWinner && (
                        <Badge variant='default' className='border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold tracking-wider text-emerald-500 uppercase'>
                          Fastest
                        </Badge>
                      )}
                      {!isWinner && isSynced && (
                        <Badge variant='secondary' className='bg-neutral-800 text-[10px] text-neutral-400'>
                          Synced
                        </Badge>
                      )}
                      {p.status === 'error' && (
                        <Badge variant='destructive' className='opacity-50 text-[10px]'>Offline</Badge>
                      )}
                    </div>
                    <div className='font-mono text-xs text-neutral-500'>
                      {p.status === 'leading'
                        ? `${p.latency}ms`
                        : p.status === 'error'
                          ? window.location.hostname === 'localhost' ? 'Check Console' : 'Timeout'
                          : `-${p.blocksBehind}`}
                    </div>
                  </div>

                  {/* Modern Bar */}
                  <div className='relative h-2 w-full overflow-hidden rounded-full bg-neutral-900'>
                    {p.status !== 'error' ? (
                      <div
                        className={`h-full transition-all duration-700 ease-out relative overflow-hidden ${isWinner
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : isSynced
                            ? 'bg-neutral-600'
                            : 'bg-amber-600'
                          }`}
                        style={{
                          width: isSynced ? '100%' : `${Math.max(5, 100 - p.blocksBehind * 10)}%`
                        }}
                      >
                        {/* Shimmer effect for winner */}
                        {isWinner && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full -translate-x-full animate-shimmer" />}
                      </div>
                    ) : (
                      <div className='h-full w-full bg-red-900/20' />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
