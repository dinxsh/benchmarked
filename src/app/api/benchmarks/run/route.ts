import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Benchmark from '@/models/Benchmark';
import {
    AlchemyAdapter,
    InfuraAdapter,
    QuickNodeAdapter,
    GoldRushAdapter,
    AnkrAdapter,
    ChainstackAdapter,
    BitqueryAdapter,
    SubsquidAdapter
} from '@/lib/adapters';

// Initialize all adapters
const adapters = [
    new AlchemyAdapter(),
    new InfuraAdapter(),
    new QuickNodeAdapter(),
    new GoldRushAdapter(),
    new AnkrAdapter(),
    new ChainstackAdapter(),
    new BitqueryAdapter(),
    new SubsquidAdapter()
];

// Calculate scores based on metrics
function calculateScores(metrics: any) {
    // Latency score (lower is better, normalize to 0-100)
    const maxLatency = 1000; // 1 second
    const latency_score = Math.max(
        0,
        100 - (metrics.latency_p50 / maxLatency) * 100
    );

    // Reliability score (uptime percentage)
    const reliability_score = metrics.uptime_percent;

    // Response size score (smaller is better)
    const maxSize = 1024 * 1024; // 1 MB
    const response_size_score = metrics.response_size_bytes
        ? Math.max(0, 100 - (metrics.response_size_bytes / maxSize) * 100)
        : 50; // Default score if no data

    // Coverage score (placeholder - based on supported chains)
    const coverage_score = 75;

    // DX score (placeholder - based on capabilities)
    const dx_score = 80;

    // Pricing score (placeholder - based on cost)
    const pricing_score = 70;

    // Final weighted score
    const final_score = Number(
        (
            latency_score * 0.25 +
            reliability_score * 0.25 +
            response_size_score * 0.15 +
            coverage_score * 0.15 +
            dx_score * 0.1 +
            pricing_score * 0.1
        ).toFixed(2)
    );

    return {
        final_score,
        latency_score: Number(latency_score.toFixed(2)),
        reliability_score: Number(reliability_score.toFixed(2)),
        response_size_score: Number(response_size_score.toFixed(2)),
        coverage_score,
        dx_score,
        pricing_score
    };
}

export async function POST(request: Request) {
    try {
        await dbConnect();

        const results = [];

        // Run benchmarks for all adapters
        for (const adapter of adapters) {
            try {
                console.log(`Running benchmark for ${adapter.name}...`);

                // Get metadata
                const metadata = adapter.getMetadata();

                // Measure performance and capture response
                const metrics = await adapter.measure();

                // Calculate scores
                const scores = calculateScores(metrics);

                // Prepare benchmark document
                const benchmarkData = {
                    providerId: adapter.id,
                    name: adapter.name,
                    slug: adapter.id,
                    metadata: {
                        logo_url: metadata.logo_url,
                        website_url: metadata.website_url,
                        supported_chains: metadata.supported_chains,
                        pricing: metadata.pricing,
                        capabilities: metadata.capabilities
                    },
                    details: {
                        last_response_body: metrics.last_response_body
                    },
                    metrics: {
                        latency_p50: metrics.latency_p50,
                        latency_p95: metrics.latency_p95,
                        latency_p99: metrics.latency_p99,
                        uptime_percent: metrics.uptime_percent,
                        error_rate: metrics.error_rate,
                        response_size_bytes: metrics.response_size_bytes
                    },
                    scores,
                    metrics_history: [
                        {
                            timestamp: new Date(),
                            value: metrics.latency_p50
                        }
                    ],
                    timestamp: new Date()
                };

                // Upsert to database
                await Benchmark.findOneAndUpdate(
                    { providerId: adapter.id },
                    benchmarkData,
                    { upsert: true, new: true }
                );

                results.push({
                    provider: adapter.name,
                    status: 'success',
                    metrics: {
                        latency_p50: metrics.latency_p50,
                        uptime_percent: metrics.uptime_percent,
                        response_size_bytes: metrics.response_size_bytes
                    },
                    scores
                });

                console.log(`✓ ${adapter.name} benchmark complete`);
            } catch (error: any) {
                console.error(`✗ ${adapter.name} benchmark failed:`, error.message);
                results.push({
                    provider: adapter.name,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });
    } catch (error: any) {
        console.error('Benchmark runner error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
