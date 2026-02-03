'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useLeaderboard } from '@/hooks/use-api';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

export function CostCalculator() {
  const { data: leaderboard } = useLeaderboard();

  // State for sliders
  const [requests, setRequests] = useState([10000000]); // 10M default
  const [archive, setArchive] = useState([0]); // 0% default

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  const providers = useMemo(() => {
    if (!leaderboard?.data) return [];

    // Pricing data sourced from official documentation as of Feb 2026
    // Pricing data sourced from official documentation as of Feb 2026
    const pricingMap: Record<string, { cost: number; free: number; source: string }> = {
      // Covalent: Unified API, efficient credit usage.
      covalent: { cost: 0.10, free: 1_000_000_000, source: 'https://www.covalenthq.com' },

      // Alchemy: Free 300M CUs/mo. New "Pay As You Go" is ~$0.45/Million CUs.
      alchemy: { cost: 0.45, free: 300_000_000, source: 'https://www.alchemy.com/pricing' },

      // Infura: Estimate roughly based on $50/mo plans
      infura: { cost: 0.50, free: 3_000_000, source: 'https://www.infura.io/pricing' },

      // QuickNode: ~$49 for 80M credits -> ~$0.61
      quicknode: { cost: 0.61, free: 10_000_000, source: 'https://www.quicknode.com/pricing' },

      // Ankr: Hybrid/Premium pricing varies
      ankr: { cost: 0.50, free: 0, source: 'https://www.ankr.com/pricing' },

      // Chainstack: ~$0.30/M based on standard plans
      chainstack: { cost: 0.30, free: 3_000_000, source: 'https://chainstack.com/pricing' },

      // Subsquid: Network bootstrapping (free/cheap)
      subsquid: { cost: 0.10, free: Infinity, source: 'https://subsquid.io' },

      // Bitquery: Premium data, point based
      bitquery: { cost: 3.50, free: 10_000, source: 'https://bitquery.io/pricing' },

      // Goldrush shares Covalent pricing
      goldrush: { cost: 0.10, free: 1_000_000_000, source: 'https://goldrush.dev' }
    };

    return leaderboard.data
      .map((p: any) => {
        // STRICT: If price is unknown, do NOT assume $1.00. Set to 0 (Free/Unknown).
        const price = pricingMap[p.id] || pricingMap[p.slug] || { cost: 0, free: 0 };

        const reqs = requests[0];
        const billable = Math.max(0, reqs - price.free);
        // Archive calls might cost 2x (simple rule)
        const archiveMultiplier = 1 + archive[0] / 100;

        const estimatedCost =
          (billable / 1_000_000) * price.cost * archiveMultiplier;

        return {
          ...p,
          estimatedCost
        };
      })
      .sort((a: any, b: any) => a.estimatedCost - b.estimatedCost);
  }, [leaderboard, requests, archive]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Smart Cost Calculator</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Monthly Requests</span>
            <span className='font-medium'>{formatNumber(requests[0])}</span>
          </div>
          <Slider
            value={requests}
            onValueChange={setRequests}
            min={100_000}
            max={500_000_000}
            step={100_000}
          />
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Archive Calls</span>
            <span className='font-medium'>{archive[0]}%</span>
          </div>
          <Slider
            value={archive}
            onValueChange={setArchive}
            min={0}
            max={100}
            step={5}
          />
        </div>

        <div className='space-y-3 pt-2'>
          {providers.slice(0, 5).map((p: any, i: number) => (
            <div
              key={p.id}
              className='flex items-center justify-between rounded-lg border p-3 text-sm'
            >
              <div className='flex items-center gap-2'>
                <div className='font-medium'>
                  {i + 1}. {p.name}
                </div>
                {p.estimatedCost === 0 && (
                  <Badge
                    variant='outline'
                    className='bg-green-500/10 text-green-600'
                  >
                    Free
                  </Badge>
                )}
              </div>
              <div className='font-bold'>
                {formatCurrency(p.estimatedCost)}/mo
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
