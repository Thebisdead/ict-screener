module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const out = {};

  try {
    const today = new Date();
    const d2 = today.toISOString().slice(0,10).replace(/-/g,'');
    const past = new Date(today); past.setDate(past.getDate()-30);
    const d1 = past.toISOString().slice(0,10).replace(/-/g,'');

    const url = `https://stooq.com/q/d/l/?s=aapl.us&d1=${d1}&d2=${d2}&i=d`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    out.http_status = r.status;
    out.data_source = "Stooq.com (no API key needed)";
    const text = await r.text();
    out.raw_preview = text.slice(0, 200);

    if (r.ok && !text.includes('No data')) {
      const lines = text.trim().split('\n');
      out.rows = lines.length - 1;
      out.last_row = lines[lines.length - 1];
      out.ok = true;
    } else {
      out.ok = false;
      out.error = text.slice(0, 100);
    }
  } catch(e) {
    out.ok = false;
    out.error = String(e).slice(0, 300);
  }

  res.json(out);
};
