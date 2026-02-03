'use client';

import PageContainer from '@/components/layout/page-container';
import { EdgeCloudComparison } from '@/features/overview/components/edge-comparison';

export default function EdgeComparisonPage() {
    return (
        <PageContainer>
            <div className='flex flex-col gap-6 p-4 md:px-8'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-3xl font-bold tracking-tight'>Edge vs Cloud Comparison</h1>
                    <p className='text-muted-foreground'>
                        Test the latency difference between your browser (Edge) and our optimized servers (Cloud).
                    </p>
                </div>
                <div className='max-w-3xl'>
                    <EdgeCloudComparison />
                </div>
            </div>
        </PageContainer>
    );
}
