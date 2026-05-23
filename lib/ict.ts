// ─────────────────────────────────────────────────────────────────────────────
// ICT / Smart Money Concepts – Analysis Engine
// Signals: OB · FVG · MSB · LS · OTE
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
  strength: number;         // 1-10
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
  if (candles.length < period + 1) {
    const last = candles[candles.length - 1];
    return (last.high - last.low) || last.close * 0.015;
  }
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
  return slice.reduce((a, c) => a + c.volume, 0) / slice.length;
}

/** 5-bar pivot highs (returns index in candles array) */
function swingHighs(candles: Candle[], n = 5): number[] {
  const idxs: number[] = [];
  for (let i = n; i < candles.length - n; i++) {
    const h = candles[i].high;
    let isPH = true;
    for (let j = i - n; j <= i + n; j++) {
      if (j !== i && candles[j].high >= h) { isPH = false; break; }
    }
    if (isPH) idxs.push(i);
  }
  return idxs;
}

/** 5-bar pivot lows */
function swingLows(candles: Candle[], n = 5): number[] {
  const idxs: number[] = [];
  for (let i = n; i < candles.length - n; i++) {
    const l = candles[i].low;
    let isPL = true;
    for (let j = i - n; j <= i + n; j++) {
      if (j !== i && candles[j].low <= l) { isPL = false; break; }
    }
    if (isPL) idxs.push(i);
  }
  return idxs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal Detectors
// ─────────────────────────────────────────────────────────────────────────────

/** Bullish OB: last bearish candle before a displacement bullish candle.
 *  Returns OB {high, low} if current price is retesting the OB zone. */
function detectBullOB(
  candles: Candle[],
  atr: number,
  dispMult = 1.2,
): { high: number; low: number } | null {
  const price = candles[candles.length - 1].close;
  // scan last 40 bars for displacement candle
  for (let i = candles.length - 2; i >= Math.max(1, candles.length - 40); i--) {
    const c = candles[i];
    const body = c.close - c.open;
    const isDisp = c.close > c.open && body > atr * dispMult;
    if (!isDisp) continue;
    // walk back to find last bearish candle before i
    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      const ob = candles[j];
      if (ob.close < ob.open) {
        // valid OB: price retesting zone
        const obH = ob.high;
        const obL = ob.low;
        if (price >= obL * 0.99 && price <= obH * 1.05) {
          return { high: obH, low: obL };
        }
        break; // only need last bearish before displacement
      }
    }
  }
  return null;
}

/** Bearish OB: last bullish candle before a displacement bearish candle. */
function detectBearOB(
  candles: Candle[],
  atr: number,
  dispMult = 1.2,
): { high: number; low: number } | null {
  const price = candles[candles.length - 1].close;
  for (let i = candles.length - 2; i >= Math.max(1, candles.length - 40); i--) {
    const c = candles[i];
    const body = c.open - c.close;
    const isDisp = c.close < c.open && body > atr * dispMult;
    if (!isDisp) continue;
    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      const ob = candles[j];
      if (ob.close > ob.open) {
        const obH = ob.high;
        const obL = ob.low;
        if (price <= obH * 1.01 && price >= obL * 0.95) {
          return { high: obH, low: obL };
        }
        break;
      }
    }
  }
  return null;
}

/** Bullish FVG: candle[i].low > candle[i-2].high — price inside gap */
function detectBullFVG(
  candles: Candle[],
  minPct = 0.05,
): { top: number; bot: number } | null {
  const price = candles[candles.length - 1].close;
  for (let i = candles.length - 1; i >= Math.max(2, candles.length - 25); i--) {
    const top = candles[i].low;
    const bot = candles[i - 2].high;
    if (top <= bot) continue;
    const sizePct = ((top - bot) / bot) * 100;
    if (sizePct < minPct) continue;
    // price inside or just above gap
    if (price >= bot * 0.99 && price <= top * 1.02) {
      return { top, bot };
    }
  }
  return null;
}

/** Bearish FVG: candle[i].high < candle[i-2].low */
function detectBearFVG(
  candles: Candle[],
  minPct = 0.05,
): { top: number; bot: number } | null {
  const price = candles[candles.length - 1].close;
  for (let i = candles.length - 1; i >= Math.max(2, candles.length - 25); i--) {
    const bot = candles[i].high;
    const top = candles[i - 2].low;
    if (bot >= top) continue;
    const sizePct = ((top - bot) / top) * 100;
    if (sizePct < minPct) continue;
    if (price <= top * 1.01 && price >= bot * 0.98) {
      return { top, bot };
    }
  }
  return null;
}

/** Bullish MSB: recent close broke above a swing high */
function detectBullMSB(
  candles: Candle[],
  shIdxs: number[],
): number | null {
  if (!shIdxs.length) return null;
  const recent = candles.slice(-15);
  // look for a close that broke a prior swing high
  for (const shIdx of shIdxs.slice().reverse()) {
    const shVal = candles[shIdx].high;
    // break must have happened in last 15 bars, after the swing formed
    for (let i = shIdx + 1; i < candles.length; i++) {
      if (candles[i].close > shVal) {
        // confirm it's within the last 15 bars
        if (i >= candles.length - 15) return shVal;
        break;
      }
    }
  }
  return null;
}

/** Bearish MSB: recent close broke below a swing low */
function detectBearMSB(
  candles: Candle[],
  slIdxs: number[],
): number | null {
  if (!slIdxs.length) return null;
  for (const slIdx of slIdxs.slice().reverse()) {
    const slVal = candles[slIdx].low;
    for (let i = slIdx + 1; i < candles.length; i++) {
      if (candles[i].close < slVal) {
        if (i >= candles.length - 15) return slVal;
        break;
      }
    }
  }
  return null;
}

/** Bullish LS: a candle swept below a swing low then closed above it */
function detectBullLS(candles: Candle[], slIdxs: number[]): boolean {
  if (!slIdxs.length) return false;
  const recentSLs = slIdxs.filter(i => i >= candles.length - 30);
  for (const slIdx of recentSLs) {
    const slVal = candles[slIdx].low;
    for (let i = slIdx + 1; i < candles.length; i++) {
      if (candles[i].low < slVal && candles[i].close > slVal) {
        if (i >= candles.length - 10) return true;
      }
    }
  }
  return false;
}

/** Bearish LS: a candle swept above a swing high then closed below it */
function detectBearLS(candles: Candle[], shIdxs: number[]): boolean {
  if (!shIdxs.length) return false;
  const recentSHs = shIdxs.filter(i => i >= candles.length - 30);
  for (const shIdx of recentSHs) {
    const shVal = candles[shIdx].high;
    for (let i = shIdx + 1; i < candles.length; i++) {
      if (candles[i].high > shVal && candles[i].close < shVal) {
        if (i >= candles.length - 10) return true;
      }
    }
  }
  return false;
}

/** OTE: price in 61.8%–78.6% Fibonacci retracement of last major swing up */
function detectBullOTE(candles: Candle[], slIdxs: number[], shIdxs: number[]): boolean {
  if (!slIdxs.length || !shIdxs.length) return false;
  const lastSL = candles[slIdxs[slIdxs.length - 1]].low;
  const lastSH = candles[shIdxs[shIdxs.length - 1]].high;
  if (lastSL >= lastSH) return false;
  const range = lastSH - lastSL;
  const ote618 = lastSH - range * 0.618;
  const ote786 = lastSH - range * 0.786;
  const price = candles[candles.length - 1].close;
  return price >= ote786 * 0.99 && price <= ote618 * 1.01;
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
  if (candles.length < 22) return null;

  const last    = candles[candles.length - 1];
  const prev    = candles[candles.length - 2];
  const price   = last.close;
  const atr     = calcATR(candles);
  const avgVol  = calcAvgVolume(candles);
  const volRatio = avgVol > 0 ? last.volume / avgVol : 1;
  const changePct = prev.close > 0 ? ((price - prev.close) / prev.close) * 100 : 0;

  const shIdxs = swingHighs(candles);
  const slIdxs = swingLows(candles);

  // ── Detect all signals ────────────────────────────────────────────────────
  const bullOB  = detectBullOB(candles, atr);
  const bearOB  = detectBearOB(candles, atr);
  const bullFVG = detectBullFVG(candles);
  const bearFVG = detectBearFVG(candles);
  const bullMSB = detectBullMSB(candles, shIdxs);
  const bearMSB = detectBearMSB(candles, slIdxs);
  const bullLS  = detectBullLS(candles, slIdxs);
  const bearLS  = detectBearLS(candles, shIdxs);
  const bullOTE = detectBullOTE(candles, slIdxs, shIdxs);

  // ── Score ─────────────────────────────────────────────────────────────────
  const bullScore = (bullOB ? 2 : 0) + (bullFVG ? 2 : 0) +
                    (bullMSB ? 2 : 0) + (bullLS ? 1.5 : 0) + (bullOTE ? 1 : 0);
  const bearScore = (bearOB ? 2 : 0) + (bearFVG ? 2 : 0) +
                    (bearMSB ? 2 : 0) + (bearLS ? 1.5 : 0);

  const maxRaw = 8.5;
  let bias: ICTResult["bias"] = "neutral";
  let signals: string[] = [];
  let score = 0;

  if (bullScore >= 2 && bullScore >= bearScore) {
    bias = "bullish";
    score = bullScore;
    if (bullOB)  signals.push("OB");
    if (bullFVG) signals.push("FVG");
    if (bullMSB) signals.push("MSB");
    if (bullLS)  signals.push("LS");
    if (bullOTE) signals.push("OTE");
  } else if (bearScore >= 2) {
    bias = "bearish";
    score = bearScore;
    if (bearOB)  signals.push("OB");
    if (bearFVG) signals.push("FVG");
    if (bearMSB) signals.push("MSB");
    if (bearLS)  signals.push("LS");
  }

  if (!signals.length) return null;

  // Volume bonus
  if (volRatio >= 1.5) score = Math.min(maxRaw, score + 0.5);

  const strength = Math.max(1, Math.min(10, Math.round((score / maxRaw) * 10)));

  // ── Entry / Stop / Target ────────────────────────────────────────────────
  let entry: number, stop: number, target: number;

  if (bias === "bullish") {
    const ob = bullOB;
    entry = price;
    stop  = ob ? ob.low - atr * 0.5 : (slIdxs.length
      ? candles[slIdxs[slIdxs.length - 1]].low - atr * 0.5
      : price - atr * 2);
    const risk = entry - stop;
    target = entry + risk * 2.5;
  } else {
    const ob = bearOB;
    entry = price;
    stop  = ob ? ob.high + atr * 0.5 : (shIdxs.length
      ? candles[shIdxs[shIdxs.length - 1]].high + atr * 0.5
      : price + atr * 2);
    const risk = stop - entry;
    target = entry - risk * 2.5;
  }

  const riskAbs = Math.abs(entry - stop);
  const rr = riskAbs > 0 ? Math.abs(target - entry) / riskAbs : 0;

  // ── Description ──────────────────────────────────────────────────────────
  const sigParts: string[] = [];
  if (signals.includes("OB"))  sigParts.push("Order Block retest");
  if (signals.includes("FVG")) sigParts.push("FVG support");
  if (signals.includes("MSB")) sigParts.push("structure break confirmed");
  if (signals.includes("LS"))  sigParts.push("liquidity sweep reversed");
  if (signals.includes("OTE")) sigParts.push("OTE Fib zone");
  const description = `${bias === "bullish" ? "Bullish" : "Bearish"}: ${sigParts.join(", ")}.`;

  return {
    ticker, name, sector,
    price: +price.toFixed(2),
    changePct: +changePct.toFixed(2),
    volume: last.volume,
    avgVolume: Math.round(avgVol),
    volRatio: +volRatio.toFixed(2),
    signals,
    strength,
    bias,
    description,
    obHigh: bullOB?.high ?? bearOB?.high ?? null,
    obLow:  bullOB?.low  ?? bearOB?.low  ?? null,
    fvgTop: bullFVG?.top ?? bearFVG?.top ?? null,
    fvgBot: bullFVG?.bot ?? bearFVG?.bot ?? null,
    msbLevel: bullMSB ?? bearMSB ?? null,
    entry: +entry.toFixed(2),
    stop:  +stop.toFixed(2),
    target: +target.toFixed(2),
    rr: +rr.toFixed(2),
    atr: +atr.toFixed(2),
  };
}
