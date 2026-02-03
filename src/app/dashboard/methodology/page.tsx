import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function MethodologyPage() {
  return (
    <PageContainer>
      <div className='mx-auto max-w-4xl space-y-6'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Scoring Methodology
          </h1>
          <p className='text-muted-foreground text-lg'>
            How we measure, benchmark, and rank Web3 infrastructure providers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>The Infra Score (0-100)</CardTitle>
            <CardDescription>
              A composite index derived from real-time performance metrics,
              reliability history, and feature coverage.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2'>
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>Latency (40%)</h3>
                <p className='text-muted-foreground text-sm'>
                  Measures the round-trip time for standard RPC calls
                  (eth_blockNumber, eth_call) from multiple global regions.
                  Weighted heavily on p95 and p99 tails to penalize
                  inconsistency.
                </p>
              </div>
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>Reliability (30%)</h3>
                <p className='text-muted-foreground text-sm'>
                  Tracks successful response rates over rolling 30-day windows.
                  Any error codes (5xx, 429 spurious) negatively impact this
                  score.
                </p>
              </div>
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>Coverage (20%)</h3>
                <p className='text-muted-foreground text-sm'>
                  Evaluates the breadth of supported chains, archival depth, and
                  advanced API methods (Trace, Debug, NFT).
                </p>
              </div>
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>Pricing & DX (10%)</h3>
                <p className='text-muted-foreground text-sm'>
                  Comparison of cost-per-million requests and developer
                  experience factors like documentation quality and dashboard
                  usability.
                </p>
              </div>
            </div>

            <Separator />

            <div className='prose dark:prose-invert'>
              <h3>Data Collection</h3>
              <p>
                Our benchmarking engine runs 24/7, executing synthetic
                transactions and read calls against public and paid endpoints.
                To ensure fairness, we normalize for payload size and exclude
                cold-start outliers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
