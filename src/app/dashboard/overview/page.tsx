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
          <Button>Download</Button>
        </div>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='analytics' disabled>
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
            {/* Left Column (Main) */}
            <div className='col-span-1 flex flex-col gap-4 md:col-span-2 lg:col-span-4'>
              <BlockPropagation />
              <EdgeCloudComparison />
            </div>

            {/* Right Column (Sidebar-ish) */}
            <div className='col-span-1 flex flex-col gap-4 lg:col-span-3'>
              <CostCalculator />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
