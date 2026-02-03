'use client';

import PageContainer from '@/components/layout/page-container';
import { CostCalculator } from '@/features/overview/components/cost-calculator';

export default function CostCalculatorPage() {
    return (
        <PageContainer>
            <div className='flex flex-col gap-6 p-4 md:px-8'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-3xl font-bold tracking-tight'>Smart Cost Calculator</h1>
                    <p className='text-muted-foreground'>
                        Estimate your monthly infrastructure costs based on request volume.
                    </p>
                </div>
                <div className='max-w-3xl'>
                    <CostCalculator />
                </div>
            </div>
        </PageContainer>
    );
}
