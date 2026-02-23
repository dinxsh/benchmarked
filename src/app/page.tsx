'use client';

import { useState } from 'react';
import { RefreshCw, Loader2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveBenchmark } from '@/lib/benchmark/simulate';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import type { GRProvider } from '@/lib/benchmark/data';

import { HeroBand }           from '@/components/goldrush/HeroBand';
import { WinnerCards }        from '@/components/goldrush/WinnerCards';
import { KeyMetricsStrip }    from '@/components/goldrush/KeyMetricsStrip';
import { BenchmarkKanban }    from '@/components/goldrush/BenchmarkTabs';
import { GRProviderTable }    from '@/components/goldrush/GRProviderTable';
import { GRProviderDrawer }   from '@/components/goldrush/GRProviderDrawer';
import { GRCapabilityMatrix } from '@/components/goldrush/GRCapabilityMatrix';
import { StickyNav }          from '@/components/goldrush/StickyNav';

const C = GR_COLORS;

// ─── Top navigation bar ───────────────────────────────────────────────────────

function TopNav({
  loading, onRefresh, providerCount,
}: {
  loading: boolean; onRefresh: () => void; providerCount: number;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 0', borderBottom: `1px solid ${C.border}`, marginBottom: 28,
      flexWrap: 'wrap', gap: 12,
    }}>
      {/* Left: title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Activity size={16} style={{ color: C.blue, flexShrink: 0 }} />
        <span style={{
          fontSize: 15, fontWeight: 700, color: C.textPrimary,
          fontFamily: GR_FONTS.ui, letterSpacing: '-0.01em',
        }}>
          Solana RPC Benchmark
        </span>
        {providerCount > 0 && (
          <span style={{
            fontSize: 11, color: C.textMuted,
            fontFamily: GR_FONTS.mono,
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 3, padding: '2px 7px',
          }}>
            {providerCount} providers
          </span>
        )}
      </div>

      {/* Right: live status + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: C.green,
            display: 'inline-block', animation: 'topnav-pulse 2s infinite',
          }} />
          <span style={{
            fontSize: 11, color: C.green,
            fontFamily: GR_FONTS.mono, fontWeight: 700,
          }}>
            LIVE
          </span>
        </span>

        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            border: `1px solid ${C.borderBright}`, background: 'transparent',
            color: loading ? C.textMuted : C.textPrimary,
            fontSize: 12, fontWeight: 600,
            fontFamily: GR_FONTS.ui,
            transition: 'border-color 150ms, color 150ms',
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderBright;
          }}
        >
          {loading
            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            : <RefreshCw size={12} />
          }
          Run Now
        </button>
      </div>

      <style>{`
        @keyframes topnav-pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 56 }}>
      {children}
    </section>
  );
}

// ─── Divider label ────────────────────────────────────────────────────────────

function SectionLabel({ label, subtitle }: { label: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: subtitle ? 4 : 0 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: C.textMuted,
          fontFamily: GR_FONTS.ui,
        }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>
      {subtitle && (
        <p style={{ fontSize: 11, color: C.textSecondary, fontFamily: GR_FONTS.mono, margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { providers, loading, error, triggerRefresh } = useLiveBenchmark();

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
      fontFamily: GR_FONTS.ui,
    }}>
      {/* Sticky nav on scroll */}
      <StickyNav
        providers={providers}
        loading={loading}
        onRefresh={triggerRefresh}
      />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 28px 72px' }}>
        <TopNav
          loading={loading}
          onRefresh={triggerRefresh}
          providerCount={providers.length}
        />

        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom: 20, padding: '10px 16px',
            background: 'rgba(242,73,92,0.08)', border: `1px solid rgba(242,73,92,0.25)`,
            borderRadius: 4, fontSize: 12, color: C.red,
            fontFamily: GR_FONTS.mono,
          }}>
            {error}
          </div>
        )}

        {/* Loading ↔ content cross-fade */}
        <AnimatePresence mode="wait">
          {loading && providers.length === 0 && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 320, gap: 10, color: C.textMuted,
                fontFamily: GR_FONTS.mono, fontSize: 13,
              }}
            >
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Firing fresh requests to 3 data API providers…
            </motion.div>
          )}

          {providers.length > 0 && (
            <motion.div key="content"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
            >

              {/* ── Hero: #1 ranked provider ── */}
              <motion.div
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0 }}
              >
                <Section id="hero">
                  <HeroBand providers={providers} />
                </Section>
              </motion.div>

              {/* ── Category winners ── */}
              <motion.div
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
              >
                <Section id="winners">
                  <SectionLabel label="Category Leaders" subtitle="After 5 fresh samples per provider, these stood out" />
                  <WinnerCards providers={providers} />
                </Section>
              </motion.div>

              {/* ── KPI strip ── */}
              <motion.div
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0.16 }}
              >
                <Section id="metrics">
                  <SectionLabel label="Key Metrics" subtitle="All numbers measured live — nothing is cached or simulated" />
                  <KeyMetricsStrip providers={providers} />
                </Section>
              </motion.div>

              {/* ── Chart analysis kanban ── */}
              <motion.div
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                <Section id="analysis">
                  <SectionLabel label="Benchmark Analysis" subtitle="Eight charts, one benchmark run — every point is a real HTTP response" />
                  <BenchmarkKanban providers={providers} />
                </Section>
              </motion.div>

              {/* ── Full comparison table ── */}
              <motion.div
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                <Section id="table">
                  <GRProviderTable providers={providers} onSelect={handleSelectProvider} />
                </Section>
              </motion.div>

              {/* ── Feature capability matrix ── */}
              <motion.div
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                <Section id="capabilities">
                  <GRCapabilityMatrix providers={providers} />
                </Section>
              </motion.div>

              {/* ── Footer / methodology ── */}
              <footer style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 16, paddingBottom: 4,
                textAlign: 'center',
                fontSize: 11, color: C.textMuted,
                fontFamily: GR_FONTS.mono,
                lineHeight: 1.8,
              }}>
                Score = Latency 40% + Reliability 35% + Throughput 25%
                {' · '}Jitter = P99 − P50
                {' · '}Value = score ÷ ($/M req)
                <br />
                Data API endpoints · 5 samples · 100ms gap · cache: no-store · no simulated data
              </footer>

            </motion.div>
          )}
        </AnimatePresence>
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
