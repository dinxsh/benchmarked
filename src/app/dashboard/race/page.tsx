'use client';

import PageContainer from '@/components/layout/page-container';
import { BlockPropagation } from '@/features/overview/components/block-propagation';

export default function BlockRacePage() {
    return (
        <PageContainer>
            <div className='flex flex-col gap-6 p-4 md:px-8'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-3xl font-bold tracking-tight'>Block Propagation Race</h1>
                    <p className='text-muted-foreground'>
                        Real-time visualization of block discovery latency across providers.
                    </p>
                </div>
                <BlockPropagation />
            </div>
        </PageContainer>
    );
}
