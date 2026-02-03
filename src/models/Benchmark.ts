
import mongoose, { Schema, Document, Model } from 'mongoose';
import { ProviderMetrics, ProviderScores } from '@/lib/benchmark-types';

export interface IBenchmark extends Document {
    providerId: string; // e.g., 'alchemy'
    name: string;
    slug: string;
    metadata: any; // Adapter metadata (pricing, capabilities, etc.)
    metrics: ProviderMetrics;
    scores: ProviderScores;
    metrics_history: { timestamp: Date; value: number }[]; // Snapshot of recent history
    timestamp: Date;
}

const BenchmarkSchema: Schema = new Schema(
    {
        providerId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        slug: { type: String, required: true, index: true },
        metadata: { type: Schema.Types.Mixed, default: {} },
        metrics: {
            latency_p50: { type: Number, required: true },
            latency_p95: { type: Number, required: true },
            latency_p99: { type: Number, required: true },
            uptime_percent: { type: Number, required: true },
            error_rate: { type: Number, required: true }
        },
        scores: {
            final_score: { type: Number, required: true },
            latency_score: { type: Number, required: true },
            reliability_score: { type: Number, required: true },
            coverage_score: { type: Number, required: true },
            dx_score: { type: Number, required: true },
            pricing_score: { type: Number, required: true }
        },
        metrics_history: [
            {
                timestamp: { type: Date, required: true },
                value: { type: Number, required: true }
            }
        ],
        timestamp: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
);

// If model exists, use it. Otherwise, create it.
// This prevents OverwriteModelError during hot reload in dev.
const Benchmark: Model<IBenchmark> =
    mongoose.models.Benchmark || mongoose.model<IBenchmark>('Benchmark', BenchmarkSchema);

export default Benchmark;
