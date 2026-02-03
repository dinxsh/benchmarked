import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlockPropagation } from '@/features/overview/components/block-propagation';
import { CostCalculator } from '@/features/overview/components/cost-calculator';
import { EdgeCloudComparison } from '@/features/overview/components/edge-comparison';

export default function OverviewPage() {
  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Overview</h2>
        <div className='flex items-center space-x-2'>
          {/* <CalendarDateRangePicker /> */}
          <Button>Download</Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {/* Row 1: Race (Full width on mobile, 2/3 on desktop) + Cost Calculator */}
        <div className='col-span-1 md:col-span-2'>
          <BlockPropagation />
        </div>
        <div className='col-span-1'>
          <CostCalculator />
        </div>

        {/* Row 2: Edge Comparison + Placeholder/Other Widgets */}
        <div className='col-span-1'>
          <EdgeCloudComparison />
        </div>
        {/* Add more widgets here if needed to fill the grid */}
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='analytics' disabled>
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value='overview' className='space-y-4'>
          {/* Existing content or new content can go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
