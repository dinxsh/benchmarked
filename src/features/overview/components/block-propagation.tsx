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
    const interval = setInterval(fetchData, 4000); // 4s polling (simulating blocks)
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className='col-span-1 md:col-span-2 lg:col-span-3'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-base font-medium'>
          Block Propagation Race (Live)
        </CardTitle>
        <div className='text-muted-foreground flex items-center space-x-2 text-sm'>
          <IconClock className='h-4 w-4 animate-pulse text-green-500' />
          <span>
            Current Head: #{data?.latestBlock?.toLocaleString() ?? '...'}
          </span>
        </div>
      </CardHeader>
      <CardContent className='space-y-6 pt-6'>
        {loading ? (
          <div>Loading race data...</div>
        ) : (
          <div className='space-y-5'>
            {data?.providers.map((p) => (
              <div key={p.id} className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{p.name}</span>
                    {p.status === 'leading' && (
                      <Badge
                        variant='default'
                        className='h-5 bg-green-500/15 px-1.5 text-[10px] text-green-600 hover:bg-green-500/25'
                      >
                        WINNER
                      </Badge>
                    )}
                    {p.status === 'error' && (
                      <Badge
                        variant='destructive'
                        className='h-5 px-1.5 text-[10px]'
                      >
                        OFFLINE
                      </Badge>
                    )}
                  </div>
                  <div className='text-muted-foreground text-xs'>
                    {p.status === 'leading'
                      ? `${p.latency}ms discovery`
                      : p.status === 'error'
                        ? 'Error'
                        : `-${p.blocksBehind} blocks behind`}
                  </div>
                </div>

                {/* Visual Bar */}
                <div className='bg-secondary relative h-3 w-full overflow-hidden rounded-full'>
                  {p.status !== 'error' ? (
                    <div
                      className={`h-full transition-all duration-500 ease-out ${
                        p.status === 'leading' ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                      style={{
                        // If leading, width is 100%. If lagging, reduce width by 10% per block behind
                        width:
                          p.status === 'leading'
                            ? '100%'
                            : `${Math.max(5, 100 - p.blocksBehind * 10)}%`
                      }}
                    />
                  ) : (
                    <div className='h-full w-full bg-red-500/20' />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
