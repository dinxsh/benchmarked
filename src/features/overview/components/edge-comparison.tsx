'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { IconDeviceLaptop, IconCloud } from '@tabler/icons-react';

export function EdgeCloudComparison() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      // 1. Edge Test (Client-side fetch to a public RPC)
      const edgeStart = performance.now();
      await fetch('https://rpc.ankr.com/eth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      const edgeLatency = Math.round(performance.now() - edgeStart);

      // 2. Cloud Test (Server-side via our API)
      const cloudRes = await fetch('/api/benchmarks/head');
      const cloudJson = await cloudRes.json();
      const fastestCloud = cloudJson.providers?.[0];
      const cloudLatency = fastestCloud?.latency || 0;

      setData([
        { name: 'Edge (You)', latency: edgeLatency, fill: '#3b82f6' },
        { name: 'Cloud (Server)', latency: cloudLatency, fill: '#22c55e' }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='col-span-1'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>Edge vs Cloud</CardTitle>
        <Button size='sm' onClick={runTest} disabled={loading}>
          {loading ? 'Testing...' : 'Run Test'}
        </Button>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className='h-[200px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data} layout='vertical' margin={{ left: -20 }}>
                <XAxis type='number' hide />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className='bg-background rounded-lg border p-2 shadow-sm'>
                          <div className='grid grid-cols-2 gap-2'>
                            <span className='font-medium'>
                              {payload[0].payload.name}:
                            </span>
                            <span className='font-medium'>
                              {payload[0].value}ms
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey='latency' radius={[0, 4, 4, 0]} barSize={32}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className='text-muted-foreground mt-4 flex items-center justify-center gap-6 text-sm'>
              <div className='flex items-center gap-2'>
                <IconDeviceLaptop className='h-4 w-4 text-blue-500' />
                <span>Browser Direct</span>
              </div>
              <div className='flex items-center gap-2'>
                <IconCloud className='h-4 w-4 text-green-500' />
                <span>Server Relay</span>
              </div>
            </div>
          </div>
        ) : (
          <div className='text-muted-foreground flex h-[200px] flex-col items-center justify-center space-y-3 text-center'>
            <IconDeviceLaptop className='h-12 w-12 opacity-20' />
            <p className='text-sm'>
              Compare your local latency vs our optimized cloud infrastructure.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
