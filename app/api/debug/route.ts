import { NextResponse } from "next/server";
import { analyzeICT } from "@/lib/ict";

type HistRow = {
  date: Date;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  adjClose?: number | null;
  volume?: number | null;
};

export async function GET() {
  const out: Record<string, unknown> = {};

  try {
    const yf = await import("yahoo-finance2");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yf2 = (yf as any).default;

    const period1 = new Date();
    period1.setDate(period1.getDate() - 120);

    let raw: HistRow[] = [];
    try {
      raw = (await yf2.historical("AAPL", {
        period1, period2: new Date(), interval: "1d",
      }, { validateResult: false })) as unknown as HistRow[];
      out.fetch_ok   = true;
      out.rows       = raw.length;
      out.last_close = raw[raw.length - 1]?.close ?? null;
      out.last_date  = raw[raw.length - 1]?.date ?? null;
    } catch (e) {
      out.fetch_ok    = false;
      out.fetch_error = String(e).slice(0, 300);
      out.hint = "Yahoo Finance is blocked on this server. Works on Vercel production.";
      return NextResponse.json(out);
    }

    const candles = raw
      .filter(d => d.open != null && d.high != null && d.low != null && d.close != null)
      .map(d => ({
        date:   new Date(d.date).toISOString().slice(0, 10),
        open:   d.open!,
        high:   d.high!,
        low:    d.low!,
        close:  d.adjClose ?? d.close!,
        volume: d.volume ?? 0,
      }));

    out.candles     = candles.length;
    out.last_candle = candles[candles.length - 1];

    const ict = analyzeICT("AAPL", "Apple Inc", "Technology", candles);
    out.ict_result  = ict;
    out.got_signal  = ict !== null;

  } catch (e) {
    out.error = String(e).slice(0, 400);
  }

  return NextResponse.json(out);
}
