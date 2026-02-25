'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Activity } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
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

// ─── Animated number counter ──────────────────────────────────────────────────

function Counter({
  to, decimals = 0,
}: {
  to: number; decimals?: number;
}) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v: number) => v.toFixed(decimals));

  useEffect(() => {
    const controls = animate(count, to, { duration: 1.4, ease: 'easeOut' });
    return () => controls.stop();
  }, [to, count]);

  return (
    <motion.span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </motion.span>
  );
}

// ─── Word-by-word text reveal ─────────────────────────────────────────────────

function WordReveal({
  text, delay = 0, style,
}: {
  text: string; delay?: number; style?: React.CSSProperties;
}) {
  const words = text.split(' ');
  return (
    <span style={style}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.055, duration: 0.38, ease: 'easeOut' }}
          style={{ display: 'inline-block', marginRight: '0.26em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Chapter divider — editorial numbered sections ────────────────────────────

function Chapter({
  n, title, subtitle,
}: {
  n: string; title: string; subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '40px 0 18px',
      }}
    >
      <span style={{
        fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono,
        letterSpacing: '0.14em', fontWeight: 700, flexShrink: 0,
      }}>
        {n}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: C.textPrimary,
          fontFamily: GR_FONTS.ui, letterSpacing: '0.01em',
        }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono }}>
            {subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Opening cinematic statement ──────────────────────────────────────────────

function OpeningStatement({
  providers, loading,
}: {
  providers: GRProvider[]; loading: boolean;
}) {
  const winner = providers[0];
  const ready  = providers.length > 0 && !loading;

  return (
    <div style={{
      paddingTop: 52, paddingBottom: 44,
      borderBottom: `1px solid ${C.border}`,
    }}>
      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 24, fontSize: 10, color: C.textMuted,
          fontFamily: GR_FONTS.mono, letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        <motion.span
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{
            width: 5, height: 5, borderRadius: '50%',
            background: C.green, display: 'inline-block', flexShrink: 0,
          }}
        />
        Live · Solana Mainnet · {providers.length || '—'} data providers
        {loading && ' · measuring…'}
      </motion.div>

      {/* Main headline */}
      <h1 style={{
        fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 800,
        color: C.textPrimary, fontFamily: GR_FONTS.ui,
        lineHeight: 1.06, margin: '0 0 8px', letterSpacing: '-0.025em',
        maxWidth: 760,
      }}>
        <WordReveal text="We benchmarked every" delay={0.15} />
        <br />
        <WordReveal
          text="major Solana data API."
          delay={0.55}
          style={{ color: C.gold }}
        />
      </h1>

      {/* Subhead */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        style={{
          margin: '12px 0 0', fontSize: 14, color: C.textMuted,
          fontFamily: GR_FONTS.mono, letterSpacing: '0.01em',
        }}
      >
        Real HTTP requests. No caches. No simulations.
      </motion.p>

      {/* Dynamic verdict — appears when results are ready */}
      <AnimatePresence>
        {ready && winner && (
          <motion.div
            key="verdict"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease: 'easeOut' }}
            style={{
              marginTop: 28, display: 'flex', flexDirection: 'column', gap: 6,
            }}
          >
            <p style={{
              margin: 0, fontSize: 17, color: C.textSecondary,
              fontFamily: GR_FONTS.ui, lineHeight: 1.65, maxWidth: 660,
            }}>
              <strong style={{ color: C.textPrimary }}>{winner.name}</strong>
              {' '}topped the board — median latency of{' '}
              <strong style={{ color: C.gold, fontFamily: GR_FONTS.mono }}>
                <Counter to={winner.p50} />ms
              </strong>
              {' '}and a composite score of{' '}
              <strong style={{ color: C.amber, fontFamily: GR_FONTS.mono }}>
                <Counter to={winner.score} decimals={1} />/100
              </strong>.
            </p>
            {providers.length > 1 && (
              <p style={{
                margin: 0, fontSize: 13, color: C.textMuted,
                fontFamily: GR_FONTS.mono,
              }}>
                {providers.length - 1} competitor{providers.length - 1 !== 1 ? 's' : ''} tested in the same window
                {' · '}margin over #2:{' '}
                <span style={{ color: C.textSecondary }}>
                  {Math.round(winner.score - (providers[1]?.score ?? winner.score))} pts
                </span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Minimal top nav ──────────────────────────────────────────────────────────

function TopNav({
  loading, onRefresh,
}: {
  loading: boolean; onRefresh: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Activity size={12} style={{ color: C.textMuted }} />
        <span style={{
          fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono,
          letterSpacing: '0.05em',
        }}>
          goldrush / solana-benchmark
        </span>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 3,
          cursor: loading ? 'not-allowed' : 'pointer',
          border: `1px solid ${C.border}`, background: 'transparent',
          color: loading ? C.textMuted : C.textSecondary,
          fontSize: 11, fontFamily: GR_FONTS.mono,
          transition: 'border-color 150ms, color 150ms',
        }}
        onMouseEnter={(e) => {
          if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderBright;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
        }}
      >
        {loading
          ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
          : <RefreshCw size={11} />
        }
        {loading ? 'running…' : 're-run'}
      </button>
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
      <StickyNav providers={providers} loading={loading} onRefresh={triggerRefresh} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 96px' }}>
        <TopNav loading={loading} onRefresh={triggerRefresh} />

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 10, padding: '9px 14px',
              background: 'rgba(242,73,92,0.07)', border: `1px solid rgba(242,73,92,0.2)`,
              borderRadius: 3, fontSize: 11, color: C.red, fontFamily: GR_FONTS.mono,
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Opening statement — always visible, populates once data arrives */}
        <OpeningStatement providers={providers} loading={loading} />

        {/* Loading skeleton */}
        <AnimatePresence mode="wait">
          {loading && providers.length === 0 && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                height: 260, color: C.textMuted,
                fontFamily: GR_FONTS.mono, fontSize: 12,
              }}
            >
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Firing requests to {providers.length || '4'} data API providers…
            </motion.div>
          )}

          {providers.length > 0 && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >

              {/* 01 — THE VERDICT */}
              <Chapter
                n="01"
                title="The Verdict"
                subtitle="highest composite score wins"
              />
              <Section id="hero">
                <HeroBand providers={providers} />
              </Section>

              {/* 02 — CATEGORY LEADERS */}
              <Chapter
                n="02"
                title="Category Leaders"
                subtitle="5 fresh samples · best in each dimension"
              />
              <Section id="winners">
                <WinnerCards providers={providers} />
              </Section>

              {/* 03 — THE NUMBERS */}
              <Chapter
                n="03"
                title="The Numbers"
                subtitle="live measurements · nothing cached or averaged"
              />
              <Section id="metrics">
                <KeyMetricsStrip providers={providers} />
              </Section>

              {/* Narrative insight between metrics and charts */}
              {providers.length >= 2 && (() => {
                const sorted = [...providers].sort((a, b) => a.p50 - b.p50);
                const gap = Math.round(sorted[sorted.length - 1].p50 - sorted[0].p50);
                const allUptimePerfect = providers.every(p => p.uptime >= 100);
                return (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45 }}
                    style={{
                      margin: '20px 0 0', fontSize: 13, color: C.textMuted,
                      fontFamily: GR_FONTS.mono, lineHeight: 1.7,
                      maxWidth: 680, borderLeft: `2px solid ${C.border}`,
                      paddingLeft: 14,
                    }}
                  >
                    The spread between fastest and slowest is{' '}
                    <span style={{ color: C.textSecondary }}>{gap}ms</span>
                    {' '}— a gap that compounds under load.
                    {allUptimePerfect
                      ? ' All providers returned 100% uptime in this window.'
                      : ` Not all providers achieved 100% uptime in this window.`
                    }
                  </motion.p>
                );
              })()}

              {/* 04 — DEEP ANALYSIS */}
              <Chapter
                n="04"
                title="Deep Analysis"
                subtitle="eight charts · one benchmark run · every point is a real response"
              />
              <Section id="analysis">
                <BenchmarkKanban providers={providers} />
              </Section>

              {/* 05 — FULL COMPARISON */}
              <Chapter
                n="05"
                title="Full Comparison"
                subtitle="sort, filter, and inspect every provider"
              />
              <Section id="table">
                <GRProviderTable providers={providers} onSelect={handleSelectProvider} />
              </Section>

              {/* 06 — CAPABILITIES */}
              <Chapter
                n="06"
                title="Capabilities"
                subtitle="what each API can actually deliver"
              />
              <Section id="capabilities">
                <GRCapabilityMatrix providers={providers} />
              </Section>

              {/* Methodology footer */}
              <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 22, marginTop: 12,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 32px',
                }}
              >
                {[
                  'Scoring: Latency 40% + Reliability 35% + Throughput 25%',
                  'Jitter = P99 − P50 · lower is more consistent',
                  '5 sequential samples per provider · 100ms between calls',
                  'Server-side fetch · cache: no-store · no simulated data',
                ].map((line, i) => (
                  <span key={i} style={{
                    fontSize: 10, color: C.textMuted,
                    fontFamily: GR_FONTS.mono, lineHeight: 1.6,
                  }}>
                    {line}
                  </span>
                ))}
              </motion.footer>

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
