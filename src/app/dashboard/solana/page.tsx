'use client';

import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useLiveBenchmark } from '@/lib/benchmark/simulate';
import { GR_COLORS } from '@/lib/benchmark/data';
import type { GRProvider } from '@/lib/benchmark/data';

import { HeroBand }           from '@/components/goldrush/HeroBand';
import { WinnerCards }         from '@/components/goldrush/WinnerCards';
import { KeyMetricsStrip }     from '@/components/goldrush/KeyMetricsStrip';
import { BenchmarkTabs }       from '@/components/goldrush/BenchmarkTabs';
import { GRProviderTable }     from '@/components/goldrush/GRProviderTable';
import { GRProviderDrawer }    from '@/components/goldrush/GRProviderDrawer';
import { GRCapabilityMatrix }  from '@/components/goldrush/GRCapabilityMatrix';
import { CTABand }             from '@/components/goldrush/CTABand';
import { StickyNav }           from '@/components/goldrush/StickyNav';

const C = GR_COLORS;

// ─── Inline top nav ──────────────────────────────────────────────────────────

function TopNav({
  secsLeft, loading, isLive, lastUpdated, onRefresh,
}: {
  secsLeft: number; loading: boolean; isLive: boolean;
  lastUpdated: Date | null; onRefresh: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: `1px solid ${C.border}`, marginBottom: 24,
      flexWrap: 'wrap', gap: 12,
    }}>
      {/* Left: logo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: C.gold,
          fontFamily: 'JetBrains Mono, monospace' }}>
          ⚡ GoldRush
        </span>
        <span style={{ fontSize: 13, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
          Solana RPC Benchmark
        </span>
      </div>

      {/* Right: live indicator + countdown + run now */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Live badge */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block',
            animation: 'gr-topnav-pulse 2s infinite',
          }} />
          <span style={{ fontSize: 12, color: C.green, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
            LIVE
          </span>
          {!isLive && (
            <span style={{ fontSize: 11, color: C.amber, fontFamily: 'JetBrains Mono, monospace', marginLeft: 4 }}>
              (sim)
            </span>
          )}
        </span>

        {/* Countdown */}
        <span style={{ fontSize: 12, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
          next in {secsLeft}s
        </span>

        {/* Run Now button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
            border: `1px solid ${C.borderBright}`, background: 'transparent',
            color: loading ? C.textMuted : C.textPrimary,
            fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            transition: 'border-color 150ms, color 150ms',
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderBright; }}
        >
          {loading
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <RefreshCw size={13} />
          }
          Run Now
        </button>
      </div>

      <style>{`
        @keyframes gr-topnav-pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 60 }}>
      {children}
    </section>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SolanaBenchmarksPage() {
  const { providers, loading, error, secsLeft, lastUpdated, isLive, triggerRefresh } = useLiveBenchmark();
  const [selectedProvider, setSelectedProvider] = useState<GRProvider | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSelectProvider(p: GRProvider) {
    setSelectedProvider(p);
    setDrawerOpen(true);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bgBase,
      color: C.textPrimary,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Sticky nav (appears after scroll) */}
      <StickyNav
        providers={providers}
        secsLeft={secsLeft}
        loading={loading}
        onRefresh={triggerRefresh}
      />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 60px' }}>
        {/* Top nav */}
        <TopNav
          secsLeft={secsLeft}
          loading={loading}
          isLive={isLive}
          lastUpdated={lastUpdated}
          onRefresh={triggerRefresh}
        />

        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom: 20, padding: '10px 16px',
            background: 'rgba(255,77,77,0.1)', border: `1px solid rgba(255,77,77,0.3)`,
            borderRadius: 6, fontSize: 12, color: C.red, fontFamily: 'JetBrains Mono, monospace',
          }}>
            {error} — showing simulated data
          </div>
        )}

        {/* Loading skeleton (first load only) */}
        {loading && providers.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 300, gap: 10, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Running benchmarks across 8 Solana providers…
          </div>
        )}

        {providers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Section 1: Hero ── */}
            <Section id="hero">
              <HeroBand providers={providers} />
            </Section>

            {/* ── Section 2: Winner cards ── */}
            <Section id="winners">
              <WinnerCards providers={providers} />
            </Section>

            {/* ── Section 3: Key Metrics Strip ── */}
            <Section id="metrics">
              <KeyMetricsStrip providers={providers} />
            </Section>

            {/* ── Section 4: Benchmark Analysis Tabs ── */}
            <Section id="analysis">
              <BenchmarkTabs providers={providers} />
            </Section>

            {/* ── Section 5: Full Provider Comparison Table ── */}
            <Section id="table">
              <GRProviderTable providers={providers} onSelect={handleSelectProvider} />
            </Section>

            {/* ── Section 6: Capability Matrix ── */}
            <Section id="capabilities">
              <GRCapabilityMatrix providers={providers} />
            </Section>

            {/* ── Section 7: CTA Band ── */}
            <Section id="cta">
              <CTABand />
            </Section>

            {/* Footer */}
            <footer style={{ textAlign: 'center', fontSize: 10, color: C.textMuted,
              fontFamily: 'JetBrains Mono, monospace', paddingTop: 8 }}>
              Score: Latency 40% + Reliability 35% + Throughput 25% · Jitter = P99−P50 · Value = score ÷ ($/M)
              <br />
              JSON-RPC = Solana getSlot benchmark · REST API = structured query · Data API = market/price endpoint
              {!isLive && ' · (sim) = simulated data — add API key for live measurements'}
            </footer>
          </div>
        )}
      </div>

      {/* Provider detail drawer */}
      <GRProviderDrawer
        provider={selectedProvider}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        allProviders={providers}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
