import { NextRequest, NextResponse } from "next/server";
import { analyzeICT, Candle } from "@/lib/ict";
import { STOCK_LIST, StockMeta } from "@/lib/stocks";

export const maxDuration = 60;

let _yf: typeof import("yahoo-finance2") | null = null;
async function getYF() {
  if (!_yf) _yf = await import("yahoo-finance2");
  return _yf;
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

  const results = await Promise.all(batch.map(fetchAndAnalyze));
  return NextResponse.json({
    results: results.filter(Boolean),
    done: start + batchSize >= STOCK_LIST.length,
  });
}

// Use a plain type so TS doesn't infer from the yf types
type HistRow = {
  date: Date;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  adjClose?: number | null;
  volume?: number | null;
};

async function fetchAndAnalyze(stock: StockMeta) {
  try {
    const yf = await getYF();
    const yahooFinance = yf.default;

    // Cast to unknown first to avoid strict overload checks
    const hist = (await yahooFinance.historical(stock.ticker, {
      period1: daysAgo(90),
      period2: new Date(),
      interval: "1d",
    }, { validateResult: false })) as unknown as HistRow[];

    if (!hist || hist.length < 20) return null;

    const candles: Candle[] = hist
      .filter((d) => d.open && d.high && d.low && d.close)
      .map((d) => ({
        date:   new Date(d.date).toISOString().slice(0, 10),
        open:   d.open   ?? 0,
        high:   d.high   ?? 0,
        low:    d.low    ?? 0,
        close:  d.adjClose ?? d.close ?? 0,
        volume: d.volume  ?? 0,
      }));

    return analyzeICT(stock.ticker, stock.name, stock.sector, candles);
  } catch {
    return null;
  }
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
