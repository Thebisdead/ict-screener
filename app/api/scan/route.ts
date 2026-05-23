import { NextRequest, NextResponse } from "next/server";
import { analyzeICT, Candle } from "@/lib/ict";
import { STOCK_LIST, StockMeta } from "@/lib/stocks";

export const maxDuration = 60;

type HistRow = {
  date: Date;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  adjClose?: number | null;
  volume?: number | null;
};

// Module-level cache so we don't re-import on every request
let _yf: { default: { historical: Function } } | null = null;
async function getYF() {
  if (!_yf) {
    const mod = await import("yahoo-finance2");
    _yf = mod as unknown as typeof _yf;
  }
  return _yf!.default;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchParam = searchParams.get("batch");
  const batchSize  = 15;

  if (batchParam === null) {
    return NextResponse.json({ total: STOCK_LIST.length, batchSize });
  }

  const batchIdx = parseInt(batchParam, 10);
  const start    = batchIdx * batchSize;
  const batch    = STOCK_LIST.slice(start, start + batchSize);
  if (!batch.length) return NextResponse.json({ results: [], done: true });

  const settled = await Promise.allSettled(batch.map(fetchAndAnalyze));

  const results = settled
    .filter(r => r.status === "fulfilled" && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<ReturnType<typeof analyzeICT>>).value);

  // Count errors for diagnostics header
  const errors = settled.filter(r => r.status === "rejected").length;
  const nulls  = settled.filter(r => r.status === "fulfilled" && r.value === null).length;

  return NextResponse.json({
    results,
    done:   start + batchSize >= STOCK_LIST.length,
    _debug: { batchIdx, fetched: batch.length, signals: results.length, errors, nulls },
  });
}

async function fetchAndAnalyze(stock: StockMeta) {
  try {
    const yahooFinance = await getYF();
    const period1 = new Date();
    period1.setDate(period1.getDate() - 120); // 120 days for more candle history

    const raw = (await yahooFinance.historical(stock.ticker, {
      period1,
      period2: new Date(),
      interval: "1d",
    }, { validateResult: false })) as unknown as HistRow[];

    if (!raw || raw.length < 20) return null;

    const candles: Candle[] = raw
      .filter(d => d.open != null && d.high != null && d.low != null && d.close != null)
      .map(d => ({
        date:   new Date(d.date).toISOString().slice(0, 10),
        open:   d.open!,
        high:   d.high!,
        low:    d.low!,
        close:  d.adjClose ?? d.close!,
        volume: d.volume ?? 0,
      }));

    if (candles.length < 20) return null;
    return analyzeICT(stock.ticker, stock.name, stock.sector, candles);
  } catch {
    return null;
  }
}
