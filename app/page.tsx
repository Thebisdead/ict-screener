"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { STOCK_LIST } from "@/lib/stocks";
import type { ICTResult } from "@/lib/ict";

// ─── Signal config ────────────────────────────────────────────────────────────
const SIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  OB:  { label: "OB",  color: "#10b981", bg: "rgba(16,185,129,.15)",  desc: "Order Block"         },
  FVG: { label: "FVG", color: "#818cf8", bg: "rgba(129,140,248,.15)", desc: "Fair Value Gap"      },
  MSB: { label: "MSB", color: "#f59e0b", bg: "rgba(245,158,11,.15)",  desc: "Market Str Break"    },
  LS:  { label: "LS",  color: "#f87171", bg: "rgba(248,113,113,.15)", desc: "Liquidity Sweep"     },
  OTE: { label: "OTE", color: "#38bdf8", bg: "rgba(56,189,248,.15)",  desc: "Optimal Trade Entry" },
};

const SECTORS = ["All Sectors", ...Array.from(new Set(STOCK_LIST.map(s => s.sector))).sort()];
const TOTAL_STOCKS = STOCK_LIST.length;
const BATCH_SIZE   = 15;
const TOTAL_BATCHES = Math.ceil(TOTAL_STOCKS / BATCH_SIZE);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number, dec = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtVol = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

function SignalBadge({ sig }: { sig: string }) {
  const s = SIG[sig];
  if (!s) return null;
  return (
    <span
      title={s.desc}
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}44` }}
      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
    >
      {s.label}
    </span>
  );
}

function StrengthBar({ value }: { value: number }) {
  const color = value >= 8 ? "#10b981" : value >= 6 ? "#f59e0b" : "#818cf8";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <span style={{ color }} className="text-[11px] font-semibold">{value}/10</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [results, setResults]     = useState<ICTResult[]>([]);
  const [scanning, setScanning]   = useState(false);
  const [progress, setProgress]   = useState(0);       // 0-100
  const [scanned, setScanned]     = useState(0);
  const [found, setFound]         = useState(0);
  const [fetchErrors, setFetchErrors] = useState(0);
  const [filter, setFilter]       = useState("All");   // signal filter
  const [sector, setSector]       = useState("All Sectors");
  const [biasFilter, setBias]     = useState("All");   // bullish | bearish | All
  const [sortBy, setSortBy]       = useState("strength");
  const [minStrength, setMinStr]  = useState(4);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"scanner" | "watchlist">("scanner");
  const [expandedRow, setExpanded]= useState<string | null>(null);
  const [lastScan, setLastScan]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load watchlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ict-watchlist-v2");
      if (saved) setWatchlist(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const saveWatchlist = useCallback((wl: Set<string>) => {
    localStorage.setItem("ict-watchlist-v2", JSON.stringify(Array.from(wl)));
    setWatchlist(new Set(wl));
  }, []);

  const toggleWL = useCallback((ticker: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      localStorage.setItem("ict-watchlist-v2", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  // ── Scan ──────────────────────────────────────────────────────────────────
  const startScan = useCallback(async () => {
    if (scanning) {
      abortRef.current?.abort();
      setScanning(false);
      return;
    }

    abortRef.current = new AbortController();
    setScanning(true);
    setResults([]);
    setScanned(0);
    setFound(0);
    setProgress(0);
    setFetchErrors(0);

    const CONCURRENCY = 8; // parallel batch requests — faster scan
    let batchIdx = 0;
    let totalScanned = 0;
    let totalFound = 0;
    const allResults: ICTResult[] = [];

    const runBatch = async (idx: number): Promise<void> => {
      try {
        const res = await fetch(`/api/scan?batch=${idx}`, {
          signal: abortRef.current?.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const batch: ICTResult[] = data.results ?? [];
        const dbg = data._debug as {errors?:number;nulls?:number}|undefined;
        if (dbg?.errors) setFetchErrors(prev => prev + dbg.errors!);
        totalScanned += BATCH_SIZE;
        totalFound += batch.length;
        allResults.push(...batch);

        setScanned(Math.min(totalScanned, TOTAL_STOCKS));
        setFound(totalFound);
        setProgress(Math.min(100, Math.round((totalScanned / TOTAL_STOCKS) * 100)));
        setResults(prev => {
          const map = new Map(prev.map(r => [r.ticker, r]));
          batch.forEach(r => map.set(r.ticker, r));
          return Array.from(map.values()).sort((a, b) => b.strength - a.strength);
        });
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    };

    // Dispatch batches with limited concurrency
    const queue: Promise<void>[] = [];
    for (let i = 0; i < TOTAL_BATCHES; i++) {
      if (abortRef.current?.signal.aborted) break;
      const p = runBatch(batchIdx++);
      queue.push(p);
      if (queue.length >= CONCURRENCY) {
        await Promise.all(queue.splice(0, CONCURRENCY));
      }
    }
    await Promise.all(queue);

    setScanning(false);
    setProgress(100);
    setLastScan(new Date().toLocaleTimeString());
  }, [scanning]);

  // ── Filter & Sort ─────────────────────────────────────────────────────────
  const displayed = results
    .filter(r => filter === "All" || r.signals.includes(filter))
    .filter(r => sector === "All Sectors" || r.sector === sector)
    .filter(r => biasFilter === "All" || r.bias === biasFilter)
    .filter(r => r.strength >= minStrength)
    .filter(r => activeTab === "watchlist" ? watchlist.has(r.ticker) : true)
    .sort((a, b) => {
      if (sortBy === "strength")  return b.strength - a.strength;
      if (sortBy === "change")    return b.changePct - a.changePct;
      if (sortBy === "rr")        return b.rr - a.rr;
      if (sortBy === "volume")    return b.volRatio - a.volRatio;
      if (sortBy === "signals")   return b.signals.length - a.signals.length;
      return 0;
    });

  const bullCount = results.filter(r => r.bias === "bullish").length;
  const bearCount = results.filter(r => r.bias === "bearish").length;
  const wlResults = activeTab === "watchlist"
    ? results.filter(r => watchlist.has(r.ticker))
    : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-white/[0.06] px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-400 text-black text-[11px] font-black px-2 py-0.5 rounded tracking-widest">ICT</span>
          <div>
            <div className="text-[15px] font-semibold tracking-tight">Smart Money Screener</div>
            <div className="text-[10px] text-white/30 tracking-wider">OB · FVG · MSB · LS · OTE · Real-time US Stocks</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          {lastScan && <span className="text-white/30">Last scan: {lastScan}</span>}
          <div className="flex items-center gap-2 text-white/40">
            <span>{TOTAL_STOCKS} stocks</span>
            <span className="text-white/20">·</span>
            <span className="text-emerald-400">{bullCount} bullish</span>
            <span className="text-white/20">·</span>
            <span className="text-red-400">{bearCount} bearish</span>
          </div>
          <button
            onClick={startScan}
            className={`flex items-center gap-2 px-4 py-1.5 rounded border text-[12px] font-semibold tracking-wider transition-all ${
              scanning
                ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                : "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            {scanning && <span className="w-2 h-2 rounded-full bg-current pulse-dot" />}
            {scanning ? `STOP  ${scanned}/${TOTAL_STOCKS}` : "⟳  SCAN MARKET"}
          </button>
        </div>
      </header>

      {/* ── Progress bar ── */}
      {scanning && (
        <div className="h-0.5 bg-white/5 relative overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-6 border-b border-white/[0.06]">
        {[
          { label: "Scanned",       value: `${scanned}/${TOTAL_STOCKS}`,    color: "text-white/70" },
          { label: "Signals Found", value: found,                           color: "text-emerald-400" },
          { label: "Bullish",       value: bullCount,                       color: "text-emerald-400" },
          { label: "Bearish",       value: bearCount,                       color: "text-red-400" },
          { label: "Watchlist",     value: watchlist.size,                  color: "text-amber-400" },
          { label: "Best Signal",   value: results[0]?.ticker ?? "—",       color: "text-violet-400" },
        ].map((s, i) => (
          <div key={i} className="px-5 py-2.5 border-r border-white/[0.06] last:border-0">
            <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1">{s.label}</div>
            <div className={`text-xl font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/[0.06] flex-wrap">

        {/* Tabs */}
        {(["scanner", "watchlist"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1 rounded text-[12px] font-semibold capitalize transition-all ${
              activeTab === t
                ? "bg-emerald-400 text-black"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t}{t === "watchlist" && watchlist.size > 0 && (
              <span className="ml-1.5 text-[10px] bg-emerald-400/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                {watchlist.size}
              </span>
            )}
          </button>
        ))}

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Signal filter */}
        <span className="text-[10px] text-white/30">Signal:</span>
        {["All", "OB", "FVG", "MSB", "LS", "OTE"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={filter === f && f !== "All"
              ? { background: SIG[f]?.bg, color: SIG[f]?.color, borderColor: SIG[f]?.color + "66" }
              : {}}
            className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold transition-all ${
              filter === f
                ? "border-current"
                : "border-white/[0.08] text-white/40 hover:text-white/70"
            }`}
          >
            {f}
          </button>
        ))}

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Bias filter */}
        <span className="text-[10px] text-white/30">Bias:</span>
        {[
          { v: "All",     label: "All",     cls: "text-white/40" },
          { v: "bullish", label: "▲ Bull",  cls: "text-emerald-400" },
          { v: "bearish", label: "▼ Bear",  cls: "text-red-400" },
        ].map(b => (
          <button
            key={b.v}
            onClick={() => setBias(b.v)}
            className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold transition-all ${
              biasFilter === b.v
                ? "border-current " + b.cls
                : "border-white/[0.08] text-white/30 hover:text-white/60"
            }`}
          >
            {b.label}
          </button>
        ))}

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Sector */}
        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="bg-transparent border border-white/[0.08] text-white/60 text-[11px] rounded px-2 py-0.5 cursor-pointer"
        >
          {SECTORS.map(s => <option key={s} value={s} className="bg-[#111]">{s}</option>)}
        </select>

        {/* Strength */}
        <span className="text-[10px] text-white/30">Min strength:</span>
        <select
          value={minStrength}
          onChange={e => setMinStr(Number(e.target.value))}
          className="bg-transparent border border-white/[0.08] text-white/60 text-[11px] rounded px-2 py-0.5 cursor-pointer"
        >
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <option key={n} value={n} className="bg-[#111]">{n}+</option>
          ))}
        </select>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-white/30">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-transparent border border-white/[0.08] text-white/60 text-[11px] rounded px-2 py-0.5 cursor-pointer"
          >
            <option value="strength" className="bg-[#111]">Strength</option>
            <option value="change"   className="bg-[#111]">% Change</option>
            <option value="rr"       className="bg-[#111]">R:R Ratio</option>
            <option value="volume"   className="bg-[#111]">Vol Ratio</option>
            <option value="signals"  className="bg-[#111]">Signal Count</option>
          </select>
          <span className="text-[11px] text-white/30">{displayed.length} results</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/20">
            <div className="text-5xl opacity-30">⬡</div>
            <div className="text-[14px] text-white/40">
              {scanning ? "Scanning market..." : results.length ? "No results match filters" : "Click SCAN MARKET to start"}
            </div>
            {!scanning && !results.length && (
              <div className="text-[12px] text-center leading-7">
                <span className="text-emerald-400">OB</span> Order Block &nbsp;·&nbsp;
                <span className="text-violet-400">FVG</span> Fair Value Gap &nbsp;·&nbsp;
                <span className="text-amber-400">MSB</span> Market Structure Break<br />
                <span className="text-red-400">LS</span> Liquidity Sweep &nbsp;·&nbsp;
                <span className="text-sky-400">OTE</span> Optimal Trade Entry
              </div>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-white/25 border-b border-white/[0.06]">
                <th className="text-left px-5 py-2.5 w-8">#</th>
                <th className="text-left px-3 py-2.5">Ticker</th>
                <th className="text-left px-3 py-2.5">Name</th>
                <th className="text-left px-3 py-2.5">Sector</th>
                <th className="text-right px-3 py-2.5">Price</th>
                <th className="text-right px-3 py-2.5">Chg %</th>
                <th className="text-left px-3 py-2.5">ICT Signals</th>
                <th className="text-left px-3 py-2.5">Strength</th>
                <th className="text-left px-3 py-2.5">Bias</th>
                <th className="text-right px-3 py-2.5">Entry</th>
                <th className="text-right px-3 py-2.5">Stop</th>
                <th className="text-right px-3 py-2.5">Target</th>
                <th className="text-right px-3 py-2.5">R:R</th>
                <th className="text-right px-3 py-2.5">Vol×</th>
                <th className="text-center px-3 py-2.5">WL</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r, idx) => {
                const isExpanded = expandedRow === r.ticker;
                const isInWL = watchlist.has(r.ticker);
                const chgColor = r.changePct >= 0 ? "text-emerald-400" : "text-red-400";
                const biasColor = r.bias === "bullish" ? "text-emerald-400" : r.bias === "bearish" ? "text-red-400" : "text-white/40";

                return (
                  <>
                    <tr
                      key={r.ticker}
                      onClick={() => setExpanded(isExpanded ? null : r.ticker)}
                      className={`border-b border-white/[0.04] cursor-pointer transition-colors slide-in ${
                        isExpanded ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"
                      } ${isInWL ? "border-l-2 border-l-amber-400/50" : ""}`}
                    >
                      <td className="px-5 py-2.5 text-white/20 text-[11px]">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold tracking-wide text-white">{r.ticker}</span>
                      </td>
                      <td className="px-3 py-2.5 text-white/50 max-w-[140px] truncate text-[11px]">{r.name}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] text-white/30 bg-white/[0.04] px-2 py-0.5 rounded">{r.sector}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">${fmt(r.price)}</td>
                      <td className={`px-3 py-2.5 text-right font-semibold ${chgColor}`}>
                        {r.changePct >= 0 ? "+" : ""}{fmt(r.changePct)}%
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {r.signals.map(s => <SignalBadge key={s} sig={s} />)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><StrengthBar value={r.strength} /></td>
                      <td className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${biasColor}`}>
                        {r.bias === "bullish" ? "▲ Bull" : r.bias === "bearish" ? "▼ Bear" : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right text-white/80">${fmt(r.entry)}</td>
                      <td className="px-3 py-2.5 text-right text-red-400">${fmt(r.stop)}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-400">${fmt(r.target)}</td>
                      <td className="px-3 py-2.5 text-right text-sky-400 font-semibold">1:{fmt(r.rr)}</td>
                      <td className={`px-3 py-2.5 text-right text-[11px] font-semibold ${r.volRatio >= 1.5 ? "text-amber-400" : "text-white/40"}`}>
                        {fmt(r.volRatio, 1)}×
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); toggleWL(r.ticker); }}
                          className={`text-[14px] transition-all ${isInWL ? "opacity-100" : "opacity-20 hover:opacity-60"}`}
                          title={isInWL ? "Remove from watchlist" : "Add to watchlist"}
                        >
                          {isInWL ? "★" : "☆"}
                        </button>
                      </td>
                    </tr>

                    {/* ── Expanded detail row ── */}
                    {isExpanded && (
                      <tr key={r.ticker + "-detail"} className="bg-white/[0.02] border-b border-white/[0.06]">
                        <td colSpan={15} className="px-8 py-4">
                          <div className="grid grid-cols-4 gap-6">

                            {/* ICT Levels */}
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2">ICT Levels</div>
                              <div className="space-y-1.5">
                                {r.obHigh && (
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-white/40">Order Block</span>
                                    <span className="text-emerald-400">${fmt(r.obLow!)} – ${fmt(r.obHigh)}</span>
                                  </div>
                                )}
                                {r.fvgTop && (
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-white/40">Fair Value Gap</span>
                                    <span className="text-violet-400">${fmt(r.fvgBot!)} – ${fmt(r.fvgTop)}</span>
                                  </div>
                                )}
                                {r.msbLevel && (
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-white/40">MSB Level</span>
                                    <span className="text-amber-400">${fmt(r.msbLevel)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-white/40">ATR (14)</span>
                                  <span className="text-white/60">${fmt(r.atr)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Trade Plan */}
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2">Trade Plan</div>
                              <div className="space-y-1.5">
                                {[
                                  { l: "Entry",  v: `$${fmt(r.entry)}`,  c: "text-white" },
                                  { l: "Stop",   v: `$${fmt(r.stop)}`,   c: "text-red-400" },
                                  { l: "Target", v: `$${fmt(r.target)}`, c: "text-emerald-400" },
                                  { l: "R:R",    v: `1:${fmt(r.rr)}`,    c: "text-sky-400" },
                                ].map(x => (
                                  <div key={x.l} className="flex justify-between text-[11px]">
                                    <span className="text-white/40">{x.l}</span>
                                    <span className={x.c + " font-semibold"}>{x.v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Volume */}
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2">Volume</div>
                              <div className="space-y-1.5">
                                {[
                                  { l: "Today",   v: fmtVol(r.volume),    c: "text-white" },
                                  { l: "Avg 20D", v: fmtVol(r.avgVolume), c: "text-white/60" },
                                  { l: "Ratio",   v: `${fmt(r.volRatio)}×`, c: r.volRatio >= 1.5 ? "text-amber-400" : "text-white/60" },
                                ].map(x => (
                                  <div key={x.l} className="flex justify-between text-[11px]">
                                    <span className="text-white/40">{x.l}</span>
                                    <span className={x.c + " font-semibold"}>{x.v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2">Analysis</div>
                              <p className="text-[11px] text-white/50 leading-5 border-l-2 border-white/10 pl-3">
                                {r.description}
                              </p>
                              <div className="flex gap-2 mt-3">
                                <a
                                  href={`https://finance.yahoo.com/chart/${r.ticker}`}
                                  target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-[11px] text-white/40 hover:text-white/80 underline underline-offset-2"
                                >
                                  Yahoo Chart ↗
                                </a>
                                <a
                                  href={`https://www.tradingview.com/chart/?symbol=${r.ticker}`}
                                  target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-[11px] text-white/40 hover:text-white/80 underline underline-offset-2"
                                >
                                  TradingView ↗
                                </a>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Loading skeleton rows */}
        {scanning && displayed.length === 0 && (
          <div className="space-y-px px-5 py-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 rounded shimmer" />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-6 py-2.5 flex items-center justify-between text-[10px] text-white/20">
        <div className="flex items-center gap-4">
          <span>ICT Smart Money Screener</span>
          <span className="text-white/10">·</span>
          <span>Data: Yahoo Finance (15-min delay)</span>
          <span className="text-white/10">·</span>
          <span className="text-amber-400/60">Not financial advice</span>
        </div>
        <div className="flex gap-4">
          {Object.entries(SIG).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1" style={{ color: v.color + "99" }}>
              <span className="font-bold">{v.label}</span>
              <span className="text-white/20">{v.desc}</span>
            </span>
          ))}
        </div>
      </footer>

    </div>
  );
}
