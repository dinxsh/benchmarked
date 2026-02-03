import PageContainer from '@/components/layout/page-container';
import React from 'react';
import { KPICards } from '@/features/overview/components/kpi-cards';
import { LeaderboardTable } from '@/features/overview/components/leaderboard-table';

export default function OverViewLayout() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>benchmarked</h2>
        </div>

        <KPICards />

        <div className='grid grid-cols-1 gap-4'>
          <LeaderboardTable />
        </div>
      </div>
    </PageContainer>
  );
}
