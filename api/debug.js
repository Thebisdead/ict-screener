module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const out = {};

  // Test Yahoo Finance v8 chart API - no crumb needed
  try {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=6mo";
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://finance.yahoo.com",
        "Referer": "https://finance.yahoo.com/",
      }
    });

    out.http_status = r.status;
    if (!r.ok) {
      out.ok = false;
      out.error = `HTTP ${r.status}`;
      const txt = await r.text();
      out.body_preview = txt.slice(0, 200);
      return res.json(out);
    }

    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      out.ok = false;
      out.error = "No chart result";
      return res.json(out);
    }

    const ts = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    out.ok = true;
    out.rows = ts.length;
    out.last_date = ts.length ? new Date(ts[ts.length-1]*1000).toISOString().slice(0,10) : null;
    out.last_close = closes.length ? closes[closes.length-1] : null;
    out.data_source = "Yahoo Finance v8 chart API (no crumb)";
  } catch(e) {
    out.ok = false;
    out.error = String(e).slice(0, 300);
  }

  res.json(out);
};
