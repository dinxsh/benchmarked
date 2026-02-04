'use client';

import { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options';

import { DataTableFacetedFilter } from '@/components/ui/table/data-table-faceted-filter';
import { DataTableSliderFilter } from '@/components/ui/table/data-table-slider-filter';
import { IconActivity, IconTrendingUp } from '@tabler/icons-react';

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
}

export function LeaderboardToolbar<TData>({
    table
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div className='flex items-center justify-between'>
            <div className='flex flex-1 items-center space-x-2'>

                {table.getColumn('health_status') && (
                    <DataTableFacetedFilter
                        column={table.getColumn('health_status')}
                        title='Status'
                        options={[
                            {
                                label: 'Healthy',
                                value: 'healthy',
                                icon: IconActivity
                            },
                            {
                                label: 'Degraded',
                                value: 'degraded',
                                icon: IconActivity
                            },
                            {
                                label: 'Unhealthy',
                                value: 'unhealthy',
                                icon: IconActivity
                            }
                        ]}
                    />
                )}
                {table.getColumn('trend') && (
                    <DataTableFacetedFilter
                        column={table.getColumn('trend')}
                        title='Trend'
                        options={[
                            {
                                label: 'Up',
                                value: 'up',
                                icon: IconTrendingUp
                            },
                            {
                                label: 'Down',
                                value: 'down',
                                icon: IconTrendingUp
                            },
                            {
                                label: 'Stable',
                                value: 'stable',
                                icon: IconTrendingUp
                            }
                        ]}
                    />
                )}
                {table.getColumn('latency') && (
                    <DataTableSliderFilter
                        column={table.getColumn('latency')!}
                        title="Latency"
                    />
                )}
                {table.getColumn('uptime') && (
                    <DataTableSliderFilter
                        column={table.getColumn('uptime')!}
                        title="Uptime"
                    />
                )}
                {table.getColumn('response_size') && (
                    <DataTableSliderFilter
                        column={table.getColumn('response_size')!}
                        title="Response Size"
                    />
                )}
                {isFiltered && (
                    <Button
                        variant='ghost'
                        onClick={() => table.resetColumnFilters()}
                        className='h-8 px-2 lg:px-3'
                    >
                        Reset
                        <X className='ml-2 h-4 w-4' />
                    </Button>
                )}
            </div>
            <DataTableViewOptions table={table} />
        </div>
    );
}
