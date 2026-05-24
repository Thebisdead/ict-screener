const yahooFinance = require('yahoo-finance2').default;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const out = {};
  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - 30);
    const hist = await yahooFinance.historical("AAPL", {
      period1, period2: new Date(), interval: "1d",
    }, { validateResult: false });
    out.ok = true;
    out.rows = hist?.length ?? 0;
    out.last = hist?.[hist.length - 1]
      ? { date: hist[hist.length-1].date, close: hist[hist.length-1].close }
      : null;
  } catch(e) {
    out.ok = false;
    out.error = String(e).slice(0, 300);
  }
  res.json(out);
};
