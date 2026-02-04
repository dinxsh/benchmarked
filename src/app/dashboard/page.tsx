'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaderboardTable } from '@/features/overview/components/leaderboard-table';
import { RankingCards } from '@/features/overview/components/ranking-cards';
import { PerformanceStats } from '@/features/overview/components/performance-stats';
import { LatencyTrendsChart } from '@/features/overview/components/latency-trends-chart';
import { UptimeDistributionChart } from '@/features/overview/components/uptime-distribution-chart';
import { ResponseSizeChart } from '@/features/overview/components/response-size-chart';
import { ScoreRadarChart } from '@/features/overview/components/score-radar-chart';
import { PerformanceMatrix } from '@/features/overview/components/performance-matrix';
import PageContainer from '@/components/layout/page-container';
import { useLeaderboard } from '@/hooks/use-api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeFilter = searchParams.get('sort') as 'fastest' | 'slowest' | 'smallest' | 'biggest' | null;
    const { data: leaderboard } = useLeaderboard();

    const handleFilterClick = (filter: 'fastest' | 'slowest' | 'smallest' | 'biggest') => {
        const params = new URLSearchParams(searchParams.toString());
        if (activeFilter === filter) {
            params.delete('sort');
        } else {
            params.set('sort', filter);
        }
        router.push(`/dashboard?${params.toString()}`);
    };

    return (
        <div className='flex flex-col gap-4'>
            {/* Performance Stats Cards */}
            {leaderboard?.data && <PerformanceStats providers={leaderboard.data} />}

            {/* Ranking Cards */}
            {leaderboard?.data && (
                <RankingCards
                    providers={leaderboard.data}
                    onFilterClick={handleFilterClick}
                    activeFilter={activeFilter || undefined}
                />
            )}

            {/* Charts & Table */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 items-start'>
                {/* Left Column */}
                <div className='flex flex-col gap-4'>
                    {leaderboard?.data && <LatencyTrendsChart providers={leaderboard.data} />}
                    {leaderboard?.data && <PerformanceMatrix providers={leaderboard.data} />}
                    <LeaderboardTable sortBy={activeFilter} />
                </div>

                {/* Right Column */}
                <div className='flex flex-col gap-4'>
                    {leaderboard?.data && <UptimeDistributionChart providers={leaderboard.data} />}
                    {leaderboard?.data && <ScoreRadarChart providers={leaderboard.data} />}
                    {leaderboard?.data && <ResponseSizeChart providers={leaderboard.data} />}
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <PageContainer>
            <div className='flex items-center justify-between space-y-2 mb-4'>
                <h2 className='text-3xl font-bold tracking-tight'>Benchmarked Dashboard</h2>
                <div className='flex items-center space-x-2'>
                    <Button>Download</Button>
                </div>
            </div>

            <Suspense fallback={<div>Loading dashboard...</div>}>
                <DashboardContent />
            </Suspense>
        </PageContainer>
    );
}
