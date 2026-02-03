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
    const pricingMap: Record<string, { cost: number; free: number; source: string }> = {
      // Alchemy: Free 300M CUs/mo. New "Pay As You Go" is ~$0.45/Million CUs.
      // Source: https://www.alchemy.com/pricing
      alchemy: { cost: 0.45, free: 300_000_000, source: 'https://www.alchemy.com/pricing' },

      // Infura: Free 3M requests/day (~90M/mo). Core plan upgrades imply ~$1.00/1M effective cost.
      // Source: https://www.infura.io/pricing
      infura: { cost: 1.0, free: 90_000_000, source: 'https://www.infura.io/pricing' },

      // QuickNode: Free 10M credits/mo. "Build" overage is $0.62/1M.
      // Source: https://www.quicknode.com/pricing
      quicknode: { cost: 0.62, free: 10_000_000, source: 'https://www.quicknode.com/pricing' },

      // Ankr: Pay-as-you-go is $0.10 per 1M credits. No "monthly free bucket" for Premium, but very low entry.
      // Source: https://www.ankr.com/pricing
      ankr: { cost: 0.10, free: 0, source: 'https://www.ankr.com/pricing' },

      // Chainstack: Free 3M RUs/mo. Growth ($49/20M) ~= $2.45/1M.
      // Source: https://chainstack.com/pricing
      chainstack: { cost: 2.45, free: 3_000_000, source: 'https://chainstack.com/pricing' },

      // Subsquid: Open Source / Network Free Tier.
      // Source: https://subsquid.io
      subsquid: { cost: 0, free: Infinity, source: 'https://subsquid.io' }
    };

    return leaderboard.data
      .map((p: any) => {
        const price = pricingMap[p.id] || { cost: 1.0, free: 0 };

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
