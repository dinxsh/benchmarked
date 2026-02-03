import PageContainer from '@/components/layout/page-container';
import { SmartCostCalculator } from '@/features/calculator/components/smart-cost-calculator';

export default function CostCalculatorPage() {
    return (
        <PageContainer>
            <div className='flex flex-col gap-6 p-4 md:px-8'>
                <div className='max-w-7xl mx-auto w-full'>
                    <SmartCostCalculator />
                </div>
            </div>
        </PageContainer>
    );
}
