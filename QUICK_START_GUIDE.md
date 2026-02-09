# Birdeye Theme Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Start the Development Server
```bash
npm run dev
```
Open http://localhost:3000

### 2. Switch to Birdeye Theme
1. Look for the theme selector (usually in top-right corner or settings)
2. Click and select **"Birdeye"**
3. Your dashboard will instantly transform to the brutalist design

### 3. Explore New Features
- **Dense Tables**: Scroll through 50+ pairs in the left column
- **Split-Screen**: View tables + charts simultaneously
- **Developer Tools**: Try the new buttons in each section

---

## 🎨 Theme Overview

**Birdeye Theme Features:**
- ✅ Pure black/white contrast
- ✅ Zero rounded corners (sharp edges everywhere)
- ✅ Monospace typography (terminal aesthetic)
- ✅ Hard shadows (4px solid offset)
- ✅ 2-3x data density vs default theme
- ✅ Developer-focused tools

**Best For:**
- Traders who need maximum information density
- Developers building on top of the data
- Users who prefer minimalist/terminal UIs
- High-frequency data monitoring

---

## 🛠️ New Components Usage

### 1. RawDataViewer - JSON Inspector

**Location:** Add to any component that fetches data

```tsx
import { RawDataViewer } from '@/components/dex/RawDataViewer';

// In your component
const { data } = useQuery({ ... });

return (
  <div>
    {/* Your existing UI */}
    <RawDataViewer data={data} title="Live Pairs API Response" />
  </div>
);
```

**Features:**
- Click "VIEW JSON" to expand
- Syntax highlighted in terminal green
- Copy button to clipboard
- Collapsible to save space

---

### 2. AdvancedFilters - Multi-Field Filtering

**Location:** Add above tables for filtering

```tsx
import { AdvancedFilters, FilterCriteria } from '@/components/dex/AdvancedFilters';
import { useState } from 'react';

export function MyTable() {
  const [filters, setFilters] = useState<FilterCriteria>({});

  // Filter your data
  const filteredData = allPairs.filter(pair => {
    if (filters.dexName && !pair.dexName.includes(filters.dexName)) {
      return false;
    }
    if (filters.volumeMin && pair.volume24h < filters.volumeMin) {
      return false;
    }
    if (filters.volumeMax && pair.volume24h > filters.volumeMax) {
      return false;
    }
    if (filters.liquidityMin && pair.liquidity < filters.liquidityMin) {
      return false;
    }
    if (filters.liquidityMax && pair.liquidity > filters.liquidityMax) {
      return false;
    }
    if (filters.addressPattern) {
      try {
        const regex = new RegExp(filters.addressPattern);
        if (!regex.test(pair.address)) return false;
      } catch {
        // Invalid regex, skip filter
      }
    }
    return true;
  });

  return (
    <div>
      <AdvancedFilters onFilterChange={setFilters} />
      <MyTableComponent data={filteredData} />
    </div>
  );
}
```

**Keyboard Shortcut:** Press `Ctrl+F` to open filters

**Filter Options:**
- **DEX Name**: Text search (e.g., "Uniswap")
- **Volume Min/Max**: USD range filter
- **Liquidity Min/Max**: USD range filter
- **Address Pattern**: Regex matching (e.g., `^0x[a-f0-9]{40}$`)

---

### 3. DataExporter - Export Any Data

**Location:** Add next to any data section

```tsx
import { DataExporter } from '@/components/dex/DataExporter';

export function PairsList({ pairs }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2>Top Pairs</h2>
        <DataExporter data={pairs} filename="top-pairs-export" />
      </div>
      {/* Your table/grid */}
    </div>
  );
}
```

**Export Formats:**
- **JSON (Formatted)**: Pretty-printed with 2-space indent
- **JSON (Minified)**: Single-line for APIs
- **CSV**: Flattened nested objects to spreadsheet
- **cURL Command**: Copy API command for terminal

**Actions:**
- Download to file
- Copy to clipboard

---

## 📐 Layout Changes

### Before (Default Theme)
```
┌─────────────────────────────────┐
│  Large Hero Section             │
│  (decorative, takes 20% screen) │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  Performance Card               │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  CSV Uploader Card              │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  [Tab] [Tab] [Tab]              │
│  (only one visible at a time)   │
│                                 │
│  Shows 10-12 pairs              │
└─────────────────────────────────┘
```

### After (Birdeye Theme)
```
┌───────────────────────────────────────┐
│ MEGAETH DEX • LIVE [●] [↻][⚙][⬇]     │ ← Minimal header (2% screen)
├───────────────────────────────────────┤
│ [LOAD CSV] ✓ LOADED 20 PAIRS CSV:... │ ← Compact uploader (2% screen)
├─────────────────────┬─────────────────┤
│ NEW_PAIRS (50 rows) │ OHLCV_CHART     │
│ ┌─────────────────┐ │ ┌─────────────┐ │
│ │ Dense table     │ │ │ Price chart │ │
│ │ 11px mono       │ │ │ 300px high  │ │
│ │ Border lines    │ │ └─────────────┘ │
│ └─────────────────┘ │                 │
├─────────────────────┤ STREAM_METRICS  │
│ TOP_PAIRS (20 rows) │ ┌─────────────┐ │
│ ┌─────────────────┐ │ │ 35ms latency│ │
│ │ Table with      │ │ │ 99.8% uptime│ │
│ │ Price/Vol/Liq   │ │ └─────────────┘ │
│ └─────────────────┘ │                 │
│                     │ LIVE_STATS      │
│                     │ ┌───┬───┐       │
│                     │ │50 │35ms│      │
│                     │ ├───┼───┤       │
│                     │ │320│158│       │
│                     │ └───┴───┘       │
└─────────────────────┴─────────────────┘
```

**Key Improvements:**
- 70+ pairs visible (vs 10-12)
- All data sections visible simultaneously
- 96% screen space for data (vs 60%)
- No hidden content behind tabs

---

## 🎯 Typography Scale

| Element | Font Size | Weight | Usage |
|---------|-----------|--------|-------|
| Section Headers | 10px | Bold | "NEW_PAIRS", "OHLCV_CHART" |
| Table Headers | 10px | Bold | Column names |
| Table Body | 11px | Regular | Data cells |
| Metrics Values | 16-24px | Bold | Live stats, prices |
| Hints/Labels | 9px | Regular | Helper text |

**Font Stack:**
```css
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas',
             'SF Mono', 'Monaco', 'Cascadia Code', monospace;
```

---

## 🎨 Color Usage

### Light Mode
```
Background: #FFFFFF (pure white)
Foreground: #000000 (pure black)
Borders:    #000000 (2px solid)
Accent:     #00D084 (crypto green)
Destructive: #E74C3C (crypto red)
Muted:      #F0F0F0 (light gray)
```

### Dark Mode
```
Background: #1A1A1A (near-black)
Foreground: #F2F2F2 (off-white)
Borders:    #F2F2F2 (2px solid)
Accent:     #00FF9C (bright green)
Destructive: #FF5C4C (bright red)
Muted:      #333333 (dark gray)
```

**When to Use Each Color:**
- **Black/White**: Default text, borders, backgrounds
- **Green**: ↑ Positive changes, success, live indicators
- **Red**: ↓ Negative changes, errors, warnings
- **Gray**: Muted text, disabled states, subtle backgrounds

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` | Open Advanced Filters |

*More shortcuts can be added in future versions*

---

## 📱 Responsive Behavior

**Desktop (>1024px):**
- Split-screen 7:5 layout
- All data visible

**Tablet (768-1024px):**
- Stacked layout (tables above chart)
- Still uses dense styling

**Mobile (<768px):**
- Full-width single column
- Horizontal scroll for wide tables
- Reduced font sizes maintained

---

## 🔧 Customization Tips

### Adjust Table Density
Edit `src/components/dex/NewPairsTable.tsx`:

```tsx
// Current (very dense)
className="py-1.5 px-2 text-[11px]"

// Less dense
className="py-2 px-3 text-[12px]"
```

### Change Accent Color
Edit `src/styles/themes/birdeye.css`:

```css
/* Change from green to blue */
--accent: oklch(0.55 0.20 240); /* Blue instead of green */
```

### Add Border Radius
If you want slightly rounded corners:

```css
[data-theme='birdeye'] {
  --radius: 2px; /* Change from 0px */
}
```

---

## 🐛 Common Issues

### "Theme not applying"
**Solution:**
1. Clear browser cache (Ctrl+Shift+Del)
2. Check browser DevTools → Application → Local Storage
3. Delete theme preference and reload

### "Fonts look wrong"
**Solution:**
- Install JetBrains Mono or Fira Code from Google Fonts
- Browser will fall back to Consolas (Windows) or SF Mono (Mac)

### "Too dense, hard to read"
**Solution:**
- Use dark mode for better contrast
- Adjust font sizes in component files (see Customization Tips)
- Switch to a different theme for comparison

### "Data not loading"
**Solution:**
- This is a styling theme, it doesn't affect data fetching
- Check API endpoints in Network tab
- Verify CSV was uploaded successfully

---

## 📚 Resources

**Documentation:**
- Full Implementation Guide: `BIRDEYE_IMPLEMENTATION.md`
- Component API Reference: See individual component files
- Theme System: `src/styles/themes/README.md` (if exists)

**Inspiration:**
- [Birdeye.so](https://birdeye.so) - Original inspiration
- [Terminal Design Systems](https://github.com/topics/terminal-ui)

**Support:**
- GitHub Issues: Report bugs or request features
- Component Source: All code is in `src/components/dex/`

---

## ✅ Quick Checklist

After switching to Birdeye theme, verify:

- [ ] Header is minimal (2px border, uppercase text)
- [ ] Tables have 1px cell borders
- [ ] All fonts are monospace
- [ ] No rounded corners visible
- [ ] Colors are black/white/green/red only
- [ ] 50+ pairs visible in New Pairs table
- [ ] Charts have sharp corners and black lines
- [ ] Metrics card is horizontal layout
- [ ] CSV uploader is inline in header bar
- [ ] Can see 20 top pairs without scrolling

**If any item fails, try:**
1. Hard refresh: Ctrl+Shift+R
2. Clear cache and reload
3. Check browser console for errors

---

## 🚀 Next Steps

1. **Try the filters**: Press Ctrl+F and filter by DEX or volume
2. **Export data**: Click any export button to download JSON/CSV
3. **View raw JSON**: Open the RawDataViewer to inspect API responses
4. **Customize colors**: Edit `birdeye.css` to match your brand
5. **Add more shortcuts**: Extend keyboard navigation in components

---

**Happy Trading! 📈**

*Built with ❤️ for crypto developers and traders*
