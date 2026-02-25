'use client';

import { useEffect } from 'react';
import { RefreshCw, Loader2, Activity } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { useLiveBenchmark } from '@/lib/benchmark/simulate';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import type { GRProvider } from '@/lib/benchmark/data';

import { HeroBand }        from '@/components/goldrush/HeroBand';
import { WinnerCards }     from '@/components/goldrush/WinnerCards';
import { KeyMetricsStrip } from '@/components/goldrush/KeyMetricsStrip';
import { BenchmarkKanban } from '@/components/goldrush/BenchmarkTabs';
import { GRProviderTable } from '@/components/goldrush/GRProviderTable';
import { StickyNav }       from '@/components/goldrush/StickyNav';

const C = GR_COLORS;

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const count   = useMotionValue(0);
  const display = useTransform(count, (v: number) => v.toFixed(decimals));
  useEffect(() => {
    const ctrl = animate(count, to, { duration: 1.4, ease: 'easeOut' });
    return () => ctrl.stop();
  }, [to, count]);
  return <motion.span style={{ fontVariantNumeric: 'tabular-nums' }}>{display}</motion.span>;
}

// ─── Word reveal ──────────────────────────────────────────────────────────────

function WordReveal({ text, delay = 0, style }: { text: string; delay?: number; style?: React.CSSProperties }) {
  return (
    <span style={style}>
      {text.split(' ').map((word, i) => (
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

// ─── Chapter divider ──────────────────────────────────────────────────────────

function Chapter({ n, title }: { n: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '40px 0 18px' }}
    >
      <span style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, letterSpacing: '0.14em', fontWeight: 700, flexShrink: 0 }}>
        {n}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, fontFamily: GR_FONTS.ui, letterSpacing: '-0.01em', flexShrink: 0, textTransform: 'uppercase' }}>
        {title}
      </span>
    </motion.div>
  );
}

// ─── Opening statement ────────────────────────────────────────────────────────

function OpeningStatement({ providers, loading }: { providers: GRProvider[]; loading: boolean }) {
  const winner = providers[0];
  const ready  = providers.length > 0 && !loading;

  return (
    <div style={{ paddingTop: 52, paddingBottom: 44, borderBottom: `1px solid ${C.border}` }}>
      {/* Live eyebrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, letterSpacing: '0.12em', textTransform: 'uppercase' }}
      >
        <motion.span
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block', flexShrink: 0 }}
        />
        Live · Solana Mainnet · {providers.length || '—'} providers{loading && ' · measuring…'}
      </motion.div>

      {/* Main headline — very bold */}
      <h1 style={{
        fontSize: 'clamp(56px, 7vw, 96px)', fontWeight: 900,
        color: C.textPrimary, fontFamily: GR_FONTS.ui,
        lineHeight: 1.0, margin: '0 0 8px', letterSpacing: '-0.035em',
        maxWidth: 820,
      }}>
        <WordReveal text="We benchmarked every" delay={0.15} />
        <br />
        <WordReveal text="major Solana data API." delay={0.55} style={{ color: C.gold }} />
      </h1>

      {/* One-line verdict */}
      <AnimatePresence>
        {ready && winner && (
          <motion.p
            key="verdict"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease: 'easeOut' }}
            style={{ margin: '20px 0 0', fontSize: 16, color: C.textSecondary, fontFamily: GR_FONTS.ui, lineHeight: 1.5, maxWidth: 540 }}
          >
            <strong style={{ color: C.textPrimary }}>{winner.name}</strong>
            {' leads — '}
            <strong style={{ color: C.gold, fontFamily: GR_FONTS.mono }}><Counter to={winner.p50} />ms P50</strong>
            {' · '}
            <strong style={{ color: C.amber, fontFamily: GR_FONTS.mono }}><Counter to={winner.score} decimals={1} />/100</strong>
            {' composite'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Top nav ──────────────────────────────────────────────────────────────────

function TopNav({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Activity size={12} style={{ color: C.textMuted }} />
        <span style={{ fontSize: 11, color: C.textMuted, fontFamily: GR_FONTS.mono, letterSpacing: '0.05em' }}>
          goldrush / benchmark
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
          fontSize: 11, fontFamily: GR_FONTS.mono, transition: 'border-color 150ms, color 150ms',
        }}
        onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderBright; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
      >
        {loading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={11} />}
        {loading ? 'running…' : 're-run'}
      </button>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} style={{ scrollMarginTop: 56 }}>{children}</section>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { providers, loading, error, triggerRefresh } = useLiveBenchmark();

  return (
    <div style={{ minHeight: '100vh', background: C.bgBase, color: C.textPrimary, fontFamily: GR_FONTS.ui }}>
      <StickyNav providers={providers} loading={loading} onRefresh={triggerRefresh} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 96px' }}>
        <TopNav loading={loading} onRefresh={triggerRefresh} />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 10, padding: '9px 14px', background: 'rgba(242,73,92,0.07)', border: `1px solid rgba(242,73,92,0.2)`, borderRadius: 3, fontSize: 11, color: C.red, fontFamily: GR_FONTS.mono }}
          >
            {error}
          </motion.div>
        )}

        <OpeningStatement providers={providers} loading={loading} />

        <AnimatePresence mode="wait">
          {loading && providers.length === 0 && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, height: 260, color: C.textMuted, fontFamily: GR_FONTS.mono, fontSize: 12 }}
            >
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Measuring {providers.length || '4'} providers…
            </motion.div>
          )}

          {providers.length > 0 && (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>

              <Chapter n="01" title="The Verdict" />
              <Section id="hero"><HeroBand providers={providers} /></Section>

              <Chapter n="02" title="Category Leaders" />
              <Section id="winners"><WinnerCards providers={providers} /></Section>

              <Chapter n="03" title="Live Numbers" />
              <Section id="metrics"><KeyMetricsStrip providers={providers} /></Section>

              <Chapter n="04" title="Deep Analysis" />
              <Section id="analysis"><BenchmarkKanban providers={providers} /></Section>

              <Chapter n="05" title="All Providers" />
              <Section id="table">
                <GRProviderTable providers={providers} onSelect={() => {}} />
              </Section>

              {/* Measurement context footer */}
              <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{ borderTop: `1px solid ${C.border}`, paddingTop: 22, marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: '6px 40px' }}
              >
                {[
                  'Server-to-server · benchmarked from US-East (Vercel origin) · not browser RTT',
                  '5 sequential HTTP requests per provider · 100ms between calls · cache: no-store',
                  'Composite score: latency 40% + reliability 35% + throughput 25%',
                ].map((line, i) => (
                  <span key={i} style={{ fontSize: 10, color: C.textMuted, fontFamily: GR_FONTS.mono, lineHeight: 1.6 }}>
                    {line}
                  </span>
                ))}
              </motion.footer>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
