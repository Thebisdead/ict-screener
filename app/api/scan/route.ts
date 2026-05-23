import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yahooFinance = require("yahoo-finance2").default;
import { analyzeICT, Candle } from "@/lib/ict";
import { STOCK_LIST, StockMeta } from "@/lib/stocks";

export const maxDuration = 60; // Vercel Pro; hobby plan capped at 10s automatically

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchParam = searchParams.get("batch");
  const batchSize  = 15;

  // Return total batches count
  if (batchParam === null) {
    return NextResponse.json({ total: STOCK_LIST.length, batchSize });
  }

  const batchIdx = parseInt(batchParam, 10);
  const start    = batchIdx * batchSize;
  const batch    = STOCK_LIST.slice(start, start + batchSize);
  if (!batch.length) return NextResponse.json({ results: [], done: true });

  const results = await Promise.all(
    batch.map((stock) => fetchAndAnalyze(stock))
  );

  return NextResponse.json({
    results: results.filter(Boolean),
    done: start + batchSize >= STOCK_LIST.length,
  });
}

async function fetchAndAnalyze(stock: StockMeta) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hist: any[] = await yahooFinance.historical(stock.ticker, {
      period1: daysAgo(90),
      period2: new Date(),
      interval: "1d",
    }, { validateResult: false });

    if (!hist || hist.length < 20) return null;

    const candles: Candle[] = hist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((d: any) => d.open && d.high && d.low && d.close)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((d: any) => ({
        date:   new Date(d.date).toISOString().slice(0, 10),
        open:   d.open as number,
        high:   d.high as number,
        low:    d.low  as number,
        close:  (d.adjClose ?? d.close) as number,
        volume: (d.volume ?? 0) as number,
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
