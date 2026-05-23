# ICT Smart Money Screener

Real-time US stock screener using ICT / Smart Money Concepts.

## Signals Detected
| Signal | Full Name | Description |
|--------|-----------|-------------|
| **OB** | Order Block | Last opposing candle before a displacement move — institutional demand/supply zone |
| **FVG** | Fair Value Gap | 3-candle price imbalance — unfilled gap acting as magnet/support/resistance |
| **MSB** | Market Structure Break | Confirmed break of prior swing high/low — bias shift signal |
| **LS** | Liquidity Sweep | Swept swing high/low then reversed — stop hunt completed |
| **OTE** | Optimal Trade Entry | Price at 61.8%–78.6% Fibonacci retracement of last major swing |

## Tech Stack
- **Next.js 14** (App Router)
- **yahoo-finance2** — real-time OHLCV data (15-min delay)
- **Tailwind CSS**
- **TypeScript**

---

## Deploy to Vercel (5 minutes)

### Option A — GitHub + Vercel (Recommended)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** — no env vars needed

### Option B — Vercel CLI

```bash
npm i -g vercel
cd ict-screener
vercel
```

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How It Works

1. **SCAN MARKET** button triggers sequential batch API calls (`/api/scan?batch=N`)
2. Each batch fetches 90 days of daily OHLCV for 12 stocks from Yahoo Finance
3. The ICT engine runs 5 signal detectors on each stock's candle array
4. Results stream back live — the table updates as each batch completes
5. Stocks are ranked by signal strength (1–10)

## ICT Engine Logic (`lib/ict.ts`)

### Bullish Setup
- **OB**: Finds displacement bullish candle (body > ATR×1.2), walks back to last bearish candle = OB zone. Triggers when current price retests OB.
- **FVG**: `candle[i].low > candle[i-2].high` → price inside gap zone.
- **MSB**: Close above a prior 5-bar pivot high within last 15 bars.
- **LS**: Candle wick below pivot low, close back above it within last 10 bars.
- **OTE**: Price within 61.8%–78.6% Fibonacci retracement of last swing.

### Bearish Setup (Mirror Logic)
- **OB**: Displacement bearish candle → last bullish candle = supply OB
- **FVG**: `candle[i].high < candle[i-2].low`
- **MSB**: Close below prior 5-bar pivot low
- **LS**: Candle wick above pivot high, close back below it

### Scoring
| Signals | Score |
|---------|-------|
| OB | +2 |
| FVG | +2 |
| MSB | +2 |
| LS | +1.5 |
| OTE | +1 |
| Vol ratio ≥1.5× | +0.5 bonus |

Strength = `round(score / 8.5 × 10)` → 1–10

### Trade Levels
- **Entry**: Current close
- **Stop**: OB boundary ± ATR×0.5
- **Target**: Entry ± risk × 2.5 (R:R = 2.5)

---

## Customization

**Add more stocks** → edit `lib/stocks.ts`

**Change R:R** → edit `lib/ict.ts` line:  
```ts
target = entry + risk * 2.5;   // change 2.5 to your preferred R:R
```

**Change displacement sensitivity** → edit `lib/ict.ts`:  
```ts
const isDisp = body > atr * dispMult;  // default dispMult = 1.2
```

**Vercel free tier note**: API functions are capped at 10s on Hobby plan. The scanner uses parallel batch requests (4 concurrent) to stay within limits. If you hit timeouts, reduce `CONCURRENCY` in `app/page.tsx`.

---

## Disclaimer
For educational and research purposes only. Not financial advice. ICT signal detection is a systematic approximation of subjective concepts — always verify on your own charts before trading.
