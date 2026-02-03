
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import dbConnect from '../src/lib/db';
import Benchmark from '../src/models/Benchmark';
import * as adapters from '../src/lib/adapters';
import { ProviderMetrics, ProviderScores } from '../src/lib/benchmark-types';

async function updateBenchmarks() {
    console.log('Starting benchmark update...');

    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not defined');
        process.exit(1);
    }

    try {
        await dbConnect();
        console.log('Connected to MongoDB');

        const adapterList = Object.values(adapters).map(
            (AdapterClass) => new AdapterClass()
        );

        console.log(`Found ${adapterList.length} adapters`);

        // Run all measurements in parallel
        await Promise.all(adapterList.map(async (adapter) => {
            console.log(`Measuring ${adapter.name}...`);

            try {
                const metrics = await adapter.measure();
                const metadata = adapter.getMetadata();
                const scores = calculateScores(metrics, metadata.pricing, metadata.capabilities);

                // Update or Insert
                await Benchmark.findOneAndUpdate(
                    { slug: metadata.slug },
                    {
                        providerId: metadata.id,
                        name: metadata.name,
                        slug: metadata.slug,
                        metadata,
                        metrics,
                        scores,
                        timestamp: new Date(),
                        // Push to history, keep last 24 points (assuming hourly/frequent updates)
                        // For now, simpler: just push a new point. In prod, careful with unbounded arrays.
                        $push: {
                            metrics_history: {
                                $each: [{ timestamp: new Date(), value: metrics.latency_p50 }],
                                $slice: -24 // Keep last 24 points
                            }
                        }
                    },
                    { upsert: true, new: true }
                );

                console.log(`Updated ${adapter.name} (Latency: ${metrics.latency_p50}ms)`);
            } catch (e) {
                console.error(`Failed to measure ${adapter.name}:`, e);
            }
        }));

        console.log('Benchmark update complete');
        process.exit(0);
    } catch (error) {
        console.error('Fatal error during update:', error);
        process.exit(1);
    }
}

function calculateScores(metrics: ProviderMetrics, pricing: any, capabilities: any) {
    // 1. Latency Score (0-40) - Lower is better. <50ms = 40, >500ms = 0
    const latScore = Math.max(0, 40 * (1 - metrics.latency_p50 / 500));

    // 2. Reliability Score (0-30) - Higher is better
    const relScore = Math.max(0, 30 * (metrics.uptime_percent / 100));

    // 3. Coverage (0-20)
    let capScore = 10; // Base
    if (capabilities.historical_depth === 'full') capScore += 5;
    if (capabilities.traces) capScore += 5;

    // 4. Pricing & DX (0-10)
    let priceScore = 5;
    if (pricing.cost_per_million < 1.0) priceScore += 5;

    const final = latScore + relScore + capScore + priceScore;

    return {
        final_score: Number(final.toFixed(1)),
        latency_score: Number(latScore.toFixed(1)),
        reliability_score: Number(relScore.toFixed(1)),
        coverage_score: Number(capScore.toFixed(1)),
        dx_score: 5, // Placeholder
        pricing_score: Number(priceScore.toFixed(1))
    };
}

updateBenchmarks();
