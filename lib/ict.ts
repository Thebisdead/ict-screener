// ─────────────────────────────────────────────────────────────────────────────
// ICT / Smart Money Concepts – Analysis Engine  v2
// Signals: OB · FVG · MSB · LS · OTE
//
// Design philosophy:
//   Each detector asks "did this signal OCCUR in recent bars?" — not "is the
//   price sitting exactly at the zone right now?"  That makes the screener act
//   like a real watchlist: it surfaces stocks where smart-money events have
//   recently fired, so the trader can draw the zones and watch for entries.
// ─────────────────────────────────────────────────────────────────────────────

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ICTResult {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  volRatio: number;
  signals: string[];
  strength: number;
  bias: "bullish" | "bearish" | "neutral";
  description: string;
  obHigh: number | null;
  obLow: number | null;
  fvgTop: number | null;
  fvgBot: number | null;
  msbLevel: number | null;
  entry: number;
  stop: number;
  target: number;
  rr: number;
  atr: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return (candles[0]?.close ?? 0) * 0.015 || 1;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    trs.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low  - candles[i - 1].close),
    ));
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function calcAvgVolume(candles: Candle[], period = 20): number {
  const slice = candles.slice(-period);
  if (!slice.length) return 0;
  return slice.reduce((a, c) => a + c.volume, 0) / slice.length;
}

/** n-bar pivot highs: bar[i] is highest of [i-n .. i+n]. Returns bar indices. */
function pivotHighs(candles: Candle[], n = 3): number[] {
  const out: number[] = [];
  for (let i = n; i < candles.length - n; i++) {
    const h = candles[i].high;
    let ok = true;
    for (let j = i - n; j <= i + n; j++) {
      if (j !== i && candles[j].high >= h) { ok = false; break; }
    }
    if (ok) out.push(i);
  }
  return out;
}

/** n-bar pivot lows */
function pivotLows(candles: Candle[], n = 3): number[] {
  const out: number[] = [];
  for (let i = n; i < candles.length - n; i++) {
    const l = candles[i].low;
    let ok = true;
    for (let j = i - n; j <= i + n; j++) {
      if (j !== i && candles[j].low <= l) { ok = false; break; }
    }
    if (ok) out.push(i);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORDER BLOCK
// Bullish OB = the last bearish candle before a strong bullish displacement
// We look for the OB formation in the last LOOKBACK bars — current price does
// NOT have to be inside the zone (the zone is the key level to watch).
// ─────────────────────────────────────────────────────────────────────────────
function detectBullOB(
  candles: Candle[],
  atr: number,
  lookback = 40,
  dispMult = 0.8,   // lowered: displacement body > 0.8× ATR
): { high: number; low: number } | null {
  const end = candles.length - 1;
  const start = Math.max(2, end - lookback);

  for (let i = end; i >= start; i--) {
    const c = candles[i];
    const body = c.close - c.open;
    // Bullish displacement candle
    if (body < atr * dispMult) continue;
    // Walk back up to 4 bars to find the last bearish candle (the OB)
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      const ob = candles[j];
      if (ob.close < ob.open) {
        return { high: ob.high, low: ob.low };
      }
    }
  }
  return null;
}

function detectBearOB(
  candles: Candle[],
  atr: number,
  lookback = 40,
  dispMult = 0.8,
): { high: number; low: number } | null {
  const end = candles.length - 1;
  const start = Math.max(2, end - lookback);

  for (let i = end; i >= start; i--) {
    const c = candles[i];
    const body = c.open - c.close;
    if (body < atr * dispMult) continue;
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      const ob = candles[j];
      if (ob.close > ob.open) {
        return { high: ob.high, low: ob.low };
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FAIR VALUE GAP
// Bullish FVG: candle[i-2].high < candle[i].low  (gap between them)
// We scan for any FVG formed in the last LOOKBACK bars.
// "Open" means price hasn't fully closed back into the gap since it formed.
// ─────────────────────────────────────────────────────────────────────────────
function detectBullFVG(
  candles: Candle[],
  lookback = 40,
  minAtrMult = 0.1, // gap must be at least 0.1× ATR
  atr: number,
): { top: number; bot: number } | null {
  const end = candles.length - 1;

  for (let i = end; i >= Math.max(2, end - lookback); i--) {
    const bot = candles[i - 2].high;
    const top = candles[i].low;
    if (top <= bot) continue;              // no gap
    if (top - bot < atr * minAtrMult) continue; // too small
    // Check the gap is still "open" (price hasn't closed below bot since bar i)
    let filled = false;
    for (let k = i + 1; k <= end; k++) {
      if (candles[k].close < bot) { filled = true; break; }
    }
    if (!filled) return { top, bot };
  }
  return null;
}

function detectBearFVG(
  candles: Candle[],
  lookback = 40,
  minAtrMult = 0.1,
  atr: number,
): { top: number; bot: number } | null {
  const end = candles.length - 1;

  for (let i = end; i >= Math.max(2, end - lookback); i--) {
    const top = candles[i - 2].low;
    const bot = candles[i].high;
    if (bot >= top) continue;
    if (top - bot < atr * minAtrMult) continue;
    // Gap still open = price hasn't closed above top since bar i
    let filled = false;
    for (let k = i + 1; k <= end; k++) {
      if (candles[k].close > top) { filled = true; break; }
    }
    if (!filled) return { top, bot };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MARKET STRUCTURE BREAK
// A close above a prior pivot high (bullish) or below a prior pivot low (bearish)
// within the last MSB_WINDOW bars.
// ─────────────────────────────────────────────────────────────────────────────
function detectBullMSB(
  candles: Candle[],
  phIdxs: number[],
  msbWindow = 20,
): number | null {
  const end = candles.length - 1;
  // Check each pivot high (most recent first)
  for (const phIdx of phIdxs.slice().reverse()) {
    const level = candles[phIdx].high;
    // Scan forward from pivot to find first close above level
    for (let i = phIdx + 1; i <= end; i++) {
      if (candles[i].close > level) {
        // Was this break recent?
        if (i >= end - msbWindow) return level;
        break; // break happened but too long ago — try earlier pivot
      }
    }
  }
  return null;
}

function detectBearMSB(
  candles: Candle[],
  plIdxs: number[],
  msbWindow = 20,
): number | null {
  const end = candles.length - 1;
  for (const plIdx of plIdxs.slice().reverse()) {
    const level = candles[plIdx].low;
    for (let i = plIdx + 1; i <= end; i++) {
      if (candles[i].close < level) {
        if (i >= end - msbWindow) return level;
        break;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LIQUIDITY SWEEP
// A wick that punches through a pivot level then closes back on the other side.
// ─────────────────────────────────────────────────────────────────────────────
function detectBullLS(
  candles: Candle[],
  plIdxs: number[],
  lsWindow = 20,
): boolean {
  const end = candles.length - 1;
  for (const plIdx of plIdxs) {
    if (plIdx > end - lsWindow) continue; // pivot must pre-date the window
    const level = candles[plIdx].low;
    for (let i = plIdx + 1; i <= end; i++) {
      // Wick below level but close above — classic stop hunt
      if (candles[i].low < level && candles[i].close > level) {
        if (i >= end - lsWindow) return true;
      }
    }
  }
  return false;
}

function detectBearLS(
  candles: Candle[],
  phIdxs: number[],
  lsWindow = 20,
): boolean {
  const end = candles.length - 1;
  for (const phIdx of phIdxs) {
    if (phIdx > end - lsWindow) continue;
    const level = candles[phIdx].high;
    for (let i = phIdx + 1; i <= end; i++) {
      if (candles[i].high > level && candles[i].close < level) {
        if (i >= end - lsWindow) return true;
      }
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. OPTIMAL TRADE ENTRY (OTE)
// Current price sits in the 61.8%–78.6% Fib retracement of the most recent
// swing up (bullish) or down (bearish).
// ─────────────────────────────────────────────────────────────────────────────
function detectBullOTE(
  candles: Candle[],
  plIdxs: number[],
  phIdxs: number[],
): boolean {
  if (!plIdxs.length || !phIdxs.length) return false;
  const lastPL = plIdxs[plIdxs.length - 1];
  const lastPH = phIdxs[phIdxs.length - 1];
  // OTE only valid when swing low came BEFORE swing high
  if (lastPL >= lastPH) return false;
  const swLow  = candles[lastPL].low;
  const swHigh = candles[lastPH].high;
  const range  = swHigh - swLow;
  if (range <= 0) return false;
  const ote786 = swHigh - range * 0.786;
  const ote618 = swHigh - range * 0.618;
  const price  = candles[candles.length - 1].close;
  return price >= ote786 * 0.998 && price <= ote618 * 1.002;
}

function detectBearOTE(
  candles: Candle[],
  plIdxs: number[],
  phIdxs: number[],
): boolean {
  if (!plIdxs.length || !phIdxs.length) return false;
  const lastPL = plIdxs[plIdxs.length - 1];
  const lastPH = phIdxs[phIdxs.length - 1];
  // Bear OTE: swing high came before swing low
  if (lastPH >= lastPL) return false;
  const swHigh = candles[lastPH].high;
  const swLow  = candles[lastPL].low;
  const range  = swHigh - swLow;
  if (range <= 0) return false;
  const ote618 = swLow + range * 0.618;
  const ote786 = swLow + range * 0.786;
  const price  = candles[candles.length - 1].close;
  return price >= ote618 * 0.998 && price <= ote786 * 1.002;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Analyser
// ─────────────────────────────────────────────────────────────────────────────
export function analyzeICT(
  ticker: string,
  name: string,
  sector: string,
  candles: Candle[],
): ICTResult | null {
  if (candles.length < 20) return null;

  const last    = candles[candles.length - 1];
  const prev    = candles[candles.length - 2];
  const price   = last.close;
  const atr     = calcATR(candles);
  const avgVol  = calcAvgVolume(candles);
  const volRatio = avgVol > 0 ? last.volume / avgVol : 1;
  const changePct = prev.close > 0 ? ((price - prev.close) / prev.close) * 100 : 0;

  // Pivot points with n=3 (less strict than n=5 — catches more swings on daily)
  const phIdxs = pivotHighs(candles, 3);
  const plIdxs = pivotLows(candles, 3);

  // ── Detect signals ────────────────────────────────────────────────────────
  const bullOB  = detectBullOB(candles, atr);
  const bearOB  = detectBearOB(candles, atr);
  const bullFVG = detectBullFVG(candles, 40, 0.1, atr);
  const bearFVG = detectBearFVG(candles, 40, 0.1, atr);
  const bullMSB = detectBullMSB(candles, phIdxs, 20);
  const bearMSB = detectBearMSB(candles, plIdxs, 20);
  const bullLS  = detectBullLS(candles, plIdxs, 20);
  const bearLS  = detectBearLS(candles, phIdxs, 20);
  const bullOTE = detectBullOTE(candles, plIdxs, phIdxs);
  const bearOTE = detectBearOTE(candles, plIdxs, phIdxs);

  // ── Score (each signal contributes) ──────────────────────────────────────
  const bullScore =
    (bullOB  ? 2   : 0) +
    (bullFVG ? 2   : 0) +
    (bullMSB ? 2   : 0) +
    (bullLS  ? 1.5 : 0) +
    (bullOTE ? 1   : 0);

  const bearScore =
    (bearOB  ? 2   : 0) +
    (bearFVG ? 2   : 0) +
    (bearMSB ? 2   : 0) +
    (bearLS  ? 1.5 : 0) +
    (bearOTE ? 1   : 0);

  // Minimum 1 signal to appear in results (score >= 1.5)
  const MIN_SCORE = 1.5;
  if (bullScore < MIN_SCORE && bearScore < MIN_SCORE) return null;

  let bias: ICTResult["bias"];
  let signals: string[] = [];
  let score: number;

  if (bullScore >= bearScore && bullScore >= MIN_SCORE) {
    bias  = "bullish";
    score = bullScore;
    if (bullOB)  signals.push("OB");
    if (bullFVG) signals.push("FVG");
    if (bullMSB) signals.push("MSB");
    if (bullLS)  signals.push("LS");
    if (bullOTE) signals.push("OTE");
  } else {
    bias  = "bearish";
    score = bearScore;
    if (bearOB)  signals.push("OB");
    if (bearFVG) signals.push("FVG");
    if (bearMSB) signals.push("MSB");
    if (bearLS)  signals.push("LS");
    if (bearOTE) signals.push("OTE");
  }

  // Volume bonus
  if (volRatio >= 1.5) score = Math.min(8.5, score + 0.5);

  const maxRaw  = 8.5;
  const strength = Math.max(1, Math.min(10, Math.round((score / maxRaw) * 10)));

  // ── Key levels ────────────────────────────────────────────────────────────
  const obZone = bias === "bullish" ? bullOB : bearOB;
  const fvgZone = bias === "bullish" ? bullFVG : bearFVG;
  const msbLvl  = bias === "bullish" ? bullMSB : bearMSB;

  // ── Trade levels ──────────────────────────────────────────────────────────
  let entry: number, stop: number, target: number;

  if (bias === "bullish") {
    entry = price;
    // Stop below OB low, or below recent swing low, or 2× ATR
    stop = obZone
      ? obZone.low - atr * 0.5
      : plIdxs.length
        ? candles[plIdxs[plIdxs.length - 1]].low - atr * 0.3
        : price - atr * 2;
    target = entry + (entry - stop) * 2.5;
  } else {
    entry = price;
    stop = obZone
      ? obZone.high + atr * 0.5
      : phIdxs.length
        ? candles[phIdxs[phIdxs.length - 1]].high + atr * 0.3
        : price + atr * 2;
    target = entry - (stop - entry) * 2.5;
  }

  const riskAbs = Math.abs(entry - stop);
  const rr = riskAbs > 0 ? +(Math.abs(target - entry) / riskAbs).toFixed(2) : 0;

  // ── Description ───────────────────────────────────────────────────────────
  const parts: string[] = [];
  if (signals.includes("OB"))  parts.push("Order Block formed");
  if (signals.includes("FVG")) parts.push("open FVG gap");
  if (signals.includes("MSB")) parts.push("structure break");
  if (signals.includes("LS"))  parts.push("liquidity sweep");
  if (signals.includes("OTE")) parts.push("OTE Fib zone");
  const description = `${bias === "bullish" ? "Bullish" : "Bearish"}: ${parts.join(", ")}.`;

  return {
    ticker, name, sector,
    price:      +price.toFixed(2),
    changePct:  +changePct.toFixed(2),
    volume:     last.volume,
    avgVolume:  Math.round(avgVol),
    volRatio:   +volRatio.toFixed(2),
    signals,
    strength,
    bias,
    description,
    obHigh:   obZone?.high   ?? null,
    obLow:    obZone?.low    ?? null,
    fvgTop:   fvgZone?.top   ?? null,
    fvgBot:   fvgZone?.bot   ?? null,
    msbLevel: msbLvl         ?? null,
    entry:    +entry.toFixed(2),
    stop:     +stop.toFixed(2),
    target:   +target.toFixed(2),
    rr,
    atr:      +atr.toFixed(2),
  };
}
