// ─────────────────────────────────────────────────────────────────────────────
// ICT Screener – Vercel Serverless Function
// Data: Yahoo Finance v8 chart API  (no crumb · no API key · no npm deps)
// Same fetch method as martin-luk-screener
// ─────────────────────────────────────────────────────────────────────────────

// ── Stock Universe (500 stocks) ───────────────────────────────────────────────
const STOCKS = [
  ["AAPL","Apple Inc","Technology"],["MSFT","Microsoft Corp","Technology"],
  ["NVDA","NVIDIA Corp","Technology"],["AVGO","Broadcom Inc","Technology"],
  ["AMD","Advanced Micro Devices","Technology"],["QCOM","Qualcomm Inc","Technology"],
  ["TXN","Texas Instruments","Technology"],["AMAT","Applied Materials","Technology"],
  ["LRCX","Lam Research","Technology"],["MU","Micron Technology","Technology"],
  ["KLAC","KLA Corp","Technology"],["ADI","Analog Devices","Technology"],
  ["MRVL","Marvell Technology","Technology"],["INTC","Intel Corp","Technology"],
  ["ARM","Arm Holdings","Technology"],["ALAB","Astera Labs","Technology"],
  ["CRDO","Credo Technology","Technology"],["SMCI","Super Micro Computer","Technology"],
  ["DELL","Dell Technologies","Technology"],["HPQ","HP Inc","Technology"],
  ["CSCO","Cisco Systems","Technology"],["MPWR","Monolithic Power Systems","Technology"],
  ["MCHP","Microchip Technology","Technology"],["ON","ON Semiconductor","Technology"],
  ["CDNS","Cadence Design Systems","Technology"],["ANSS","Ansys Inc","Technology"],
  ["RMBS","Rambus Inc","Technology"],["ONTO","Onto Innovation","Technology"],
  ["AMBA","Ambarella Inc","Technology"],["MTSI","MACOM Technology","Technology"],
  ["SWKS","Skyworks Solutions","Technology"],["SITM","SiTime Corp","Technology"],
  ["ALGM","Allegro MicroSystems","Technology"],["AEIS","Advanced Energy Industries","Technology"],
  ["LSCC","Lattice Semiconductor","Technology"],["ENTG","Entegris Inc","Technology"],
  ["MKSI","MKS Instruments","Technology"],["MRCY","Mercury Systems","Technology"],
  ["COHU","Cohu Inc","Technology"],["FORM","FormFactor Inc","Technology"],
  ["ACLS","Axcelis Technologies","Technology"],["DIOD","Diodes Inc","Technology"],
  ["CEVA","CEVA Inc","Technology"],["PI","Impinj Inc","Technology"],
  ["NOVT","Novanta Inc","Technology"],["VIAV","Viavi Solutions","Technology"],
  ["NSIT","Insight Enterprises","Technology"],["WOLF","Wolfspeed Inc","Technology"],
  ["ENVX","Enovix Corp","Technology"],["OLED","Universal Display Corp","Technology"],
  ["IPGP","IPG Photonics","Technology"],["IIVI","Coherent Corp","Technology"],
  ["META","Meta Platforms","Software"],["GOOGL","Alphabet Inc","Software"],
  ["GOOG","Alphabet Class C","Software"],["CRM","Salesforce Inc","Software"],
  ["NOW","ServiceNow Inc","Software"],["ADBE","Adobe Inc","Software"],
  ["INTU","Intuit Inc","Software"],["WDAY","Workday Inc","Software"],
  ["SNOW","Snowflake Inc","Software"],["DDOG","Datadog Inc","Software"],
  ["HUBS","HubSpot Inc","Software"],["PANW","Palo Alto Networks","Software"],
  ["CRWD","CrowdStrike Holdings","Software"],["ZS","Zscaler Inc","Software"],
  ["OKTA","Okta Inc","Software"],["FTNT","Fortinet Inc","Software"],
  ["S","SentinelOne","Software"],["PLTR","Palantir Technologies","Software"],
  ["PATH","UiPath Inc","Software"],["AI","C3.ai Inc","Software"],
  ["SOUN","SoundHound AI","Software"],["ASAN","Asana Inc","Software"],
  ["MNDY","Monday.com","Software"],["MDB","MongoDB Inc","Software"],
  ["GTLB","GitLab Inc","Software"],["VEEV","Veeva Systems","Software"],
  ["PCOR","Procore Technologies","Software"],["TOST","Toast Inc","Software"],
  ["BILL","Bill.com Holdings","Software"],["DT","Dynatrace Inc","Software"],
  ["ESTC","Elastic NV","Software"],["CFLT","Confluent Inc","Software"],
  ["BRZE","Braze Inc","Software"],["ZI","ZoomInfo Technologies","Software"],
  ["SPSC","SPS Commerce","Software"],["MANH","Manhattan Associates","Software"],
  ["PAYC","Paycom Software","Software"],["RPD","Rapid7 Inc","Software"],
  ["QLYS","Qualys Inc","Software"],["TENB","Tenable Holdings","Software"],
  ["VRNS","Varonis Systems","Software"],["RNG","RingCentral Inc","Software"],
  ["FIVN","Five9 Inc","Software"],["FOUR","Shift4 Payments","Software"],
  ["TTD","The Trade Desk","Software"],["ADSK","Autodesk Inc","Software"],
  ["NCNO","nCino Inc","Software"],["APPN","Appian Corp","Software"],
  ["PEGA","Pegasystems Inc","Software"],["UPWK","Upwork Inc","Software"],
  ["BBAI","BigBear.ai Holdings","Software"],["CWAN","Clearwater Analytics","Software"],
  ["AMZN","Amazon.com Inc","Cloud"],["NET","Cloudflare Inc","Cloud"],
  ["AKAM","Akamai Technologies","Cloud"],["FSLY","Fastly Inc","Cloud"],
  ["DOCN","DigitalOcean Holdings","Cloud"],["TWLO","Twilio Inc","Cloud"],
  ["INFA","Informatica Inc","Cloud"],["BAND","Bandwidth Inc","Cloud"],
  ["CVLT","Commvault Systems","Cloud"],["EPAM","EPAM Systems","Cloud"],
  ["JPM","JPMorgan Chase","Financials"],["BAC","Bank of America","Financials"],
  ["WFC","Wells Fargo","Financials"],["GS","Goldman Sachs","Financials"],
  ["MS","Morgan Stanley","Financials"],["C","Citigroup Inc","Financials"],
  ["V","Visa Inc","Financials"],["MA","Mastercard Inc","Financials"],
  ["PYPL","PayPal Holdings","Financials"],["SQ","Block Inc","Financials"],
  ["AFRM","Affirm Holdings","Financials"],["SOFI","SoFi Technologies","Financials"],
  ["UPST","Upstart Holdings","Financials"],["HOOD","Robinhood Markets","Financials"],
  ["COIN","Coinbase Global","Financials"],["MSTR","MicroStrategy Inc","Financials"],
  ["BLK","BlackRock Inc","Financials"],["BX","Blackstone Inc","Financials"],
  ["KKR","KKR & Co Inc","Financials"],["APO","Apollo Global Management","Financials"],
  ["SCHW","Charles Schwab","Financials"],["AXP","American Express","Financials"],
  ["COF","Capital One Financial","Financials"],["FI","Fiserv Inc","Financials"],
  ["GPN","Global Payments","Financials"],["CME","CME Group Inc","Financials"],
  ["NDAQ","Nasdaq Inc","Financials"],["MSCI","MSCI Inc","Financials"],
  ["MCO","Moody's Corp","Financials"],["SPGI","S&P Global Inc","Financials"],
  ["ICE","Intercontinental Exchange","Financials"],["ALLY","Ally Financial Inc","Financials"],
  ["DFS","Discover Financial","Financials"],["IBKR","Interactive Brokers","Financials"],
  ["USB","US Bancorp","Financials"],["PNC","PNC Financial Services","Financials"],
  ["TFC","Truist Financial","Financials"],["WU","Western Union","Financials"],
  ["VIRT","Virtu Financial","Financials"],["MQ","Marqeta Inc","Financials"],
  ["SYF","Synchrony Financial","Financials"],["LPLA","LPL Financial Holdings","Financials"],
  ["RJF","Raymond James Financial","Financials"],["SF","Stifel Financial Corp","Financials"],
  ["LLY","Eli Lilly and Co","Healthcare"],["UNH","UnitedHealth Group","Healthcare"],
  ["JNJ","Johnson & Johnson","Healthcare"],["ABT","Abbott Laboratories","Healthcare"],
  ["TMO","Thermo Fisher Scientific","Healthcare"],["DHR","Danaher Corp","Healthcare"],
  ["MDT","Medtronic plc","Healthcare"],["SYK","Stryker Corp","Healthcare"],
  ["BSX","Boston Scientific","Healthcare"],["ISRG","Intuitive Surgical","Healthcare"],
  ["EW","Edwards Lifesciences","Healthcare"],["AMGN","Amgen Inc","Healthcare"],
  ["GILD","Gilead Sciences","Healthcare"],["BIIB","Biogen Inc","Healthcare"],
  ["REGN","Regeneron Pharmaceuticals","Healthcare"],["VRTX","Vertex Pharmaceuticals","Healthcare"],
  ["MRNA","Moderna Inc","Healthcare"],["PFE","Pfizer Inc","Healthcare"],
  ["MRK","Merck & Co","Healthcare"],["BMY","Bristol-Myers Squibb","Healthcare"],
  ["NVO","Novo Nordisk A/S","Healthcare"],["NTRA","Natera Inc","Healthcare"],
  ["CRSP","CRISPR Therapeutics","Healthcare"],["RXRX","Recursion Pharmaceuticals","Healthcare"],
  ["RVMD","Revolution Medicines","Healthcare"],["CI","The Cigna Group","Healthcare"],
  ["HUM","Humana Inc","Healthcare"],["CVS","CVS Health Corp","Healthcare"],
  ["IDXX","IDEXX Laboratories","Healthcare"],["HOLX","Hologic Inc","Healthcare"],
  ["DXCM","DexCom Inc","Healthcare"],["ALGN","Align Technology","Healthcare"],
  ["VKTX","Viking Therapeutics","Healthcare"],["AXSM","Axsome Therapeutics","Healthcare"],
  ["KRYS","Krystal Biotech","Healthcare"],["SRPT","Sarepta Therapeutics","Healthcare"],
  ["TGTX","TG Therapeutics","Healthcare"],["EXAS","Exact Sciences Corp","Healthcare"],
  ["PACB","Pacific Biosciences","Healthcare"],["TXG","10x Genomics","Healthcare"],
  ["RARE","Ultragenyx Pharmaceutical","Healthcare"],["MORF","Morphic Holding","Healthcare"],
  ["KYMR","Kymera Therapeutics","Healthcare"],["JANX","Janux Therapeutics","Healthcare"],
  ["LNTH","Lantheus Holdings","Healthcare"],["PODD","Insulet Corp","Healthcare"],
  ["INMD","InMode Ltd","Healthcare"],["NVCR","NovoCure Ltd","Healthcare"],
  ["TSLA","Tesla Inc","Consumer"],["HD","Home Depot","Consumer"],
  ["LOW","Lowe's Companies","Consumer"],["NKE","Nike Inc","Consumer"],
  ["SBUX","Starbucks Corp","Consumer"],["MCD","McDonald's Corp","Consumer"],
  ["CMG","Chipotle Mexican Grill","Consumer"],["LULU","Lululemon Athletica","Consumer"],
  ["BKNG","Booking Holdings","Consumer"],["ABNB","Airbnb Inc","Consumer"],
  ["UBER","Uber Technologies","Consumer"],["LYFT","Lyft Inc","Consumer"],
  ["DASH","DoorDash Inc","Consumer"],["DKNG","DraftKings Inc","Consumer"],
  ["RCL","Royal Caribbean Group","Consumer"],["CCL","Carnival Corp","Consumer"],
  ["WYNN","Wynn Resorts","Consumer"],["MGM","MGM Resorts International","Consumer"],
  ["TJX","TJX Companies","Consumer"],["ROST","Ross Stores","Consumer"],
  ["BURL","Burlington Stores","Consumer"],["FIVE","Five Below Inc","Consumer"],
  ["CROX","Crocs Inc","Consumer"],["DECK","Deckers Outdoor","Consumer"],
  ["ELF","e.l.f. Beauty","Consumer"],["ULTA","Ulta Beauty","Consumer"],
  ["ANF","Abercrombie & Fitch","Consumer"],["CELH","Celsius Holdings","Consumer"],
  ["WING","Wingstop Inc","Consumer"],["TXRH","Texas Roadhouse","Consumer"],
  ["CVNA","Carvana Co","Consumer"],["WMT","Walmart Inc","Consumer"],
  ["COST","Costco Wholesale","Consumer"],["TGT","Target Corp","Consumer"],
  ["DG","Dollar General","Consumer"],["SHOP","Shopify Inc","Consumer"],
  ["ETSY","Etsy Inc","Consumer"],["MELI","MercadoLibre Inc","Consumer"],
  ["SE","Sea Ltd","Consumer"],["KR","Kroger Co","Consumer"],
  ["MNST","Monster Beverage","Consumer"],["KHC","Kraft Heinz Co","Consumer"],
  ["QSR","Restaurant Brands International","Consumer"],["YUM","Yum! Brands","Consumer"],
  ["DPZ","Domino's Pizza","Consumer"],["EAT","Brinker International","Consumer"],
  ["CAKE","Cheesecake Factory","Consumer"],["BJRI","BJ's Restaurants","Consumer"],
  ["XOM","Exxon Mobil Corp","Energy"],["CVX","Chevron Corp","Energy"],
  ["COP","ConocoPhillips","Energy"],["EOG","EOG Resources","Energy"],
  ["SLB","Schlumberger Ltd","Energy"],["HAL","Halliburton Co","Energy"],
  ["DVN","Devon Energy Corp","Energy"],["FANG","Diamondback Energy","Energy"],
  ["MPC","Marathon Petroleum","Energy"],["VLO","Valero Energy","Energy"],
  ["OXY","Occidental Petroleum","Energy"],["LNG","Cheniere Energy","Energy"],
  ["OVV","Ovintiv Inc","Energy"],["MTDR","Matador Resources","Energy"],
  ["KMI","Kinder Morgan","Energy"],["WMB","Williams Companies","Energy"],
  ["OKE","ONEOK Inc","Energy"],["ET","Energy Transfer","Energy"],
  ["AR","Antero Resources","Energy"],["EQT","EQT Corp","Energy"],
  ["RRC","Range Resources","Energy"],["CHK","Chesapeake Energy","Energy"],
  ["SWN","Southwestern Energy","Energy"],["TRGP","Targa Resources","Energy"],
  ["ENPH","Enphase Energy","Clean Energy"],["FSLR","First Solar Inc","Clean Energy"],
  ["SEDG","SolarEdge Technologies","Clean Energy"],["BE","Bloom Energy Corp","Clean Energy"],
  ["PLUG","Plug Power Inc","Clean Energy"],["RIVN","Rivian Automotive","Clean Energy"],
  ["LCID","Lucid Group","Clean Energy"],["NIO","NIO Inc","Clean Energy"],
  ["XPEV","XPeng Inc","Clean Energy"],["LI","Li Auto Inc","Clean Energy"],
  ["CHPT","ChargePoint Holdings","Clean Energy"],["BLNK","Blink Charging","Clean Energy"],
  ["FLNC","Fluence Energy","Clean Energy"],["STEM","Stem Inc","Clean Energy"],
  ["ARRY","Array Technologies","Clean Energy"],["RUN","Sunrun Inc","Clean Energy"],
  ["GE","GE Aerospace","Industrials"],["HON","Honeywell International","Industrials"],
  ["CAT","Caterpillar Inc","Industrials"],["DE","Deere & Company","Industrials"],
  ["RTX","RTX Corp","Industrials"],["LMT","Lockheed Martin","Industrials"],
  ["BA","Boeing Co","Industrials"],["NOC","Northrop Grumman","Industrials"],
  ["GD","General Dynamics","Industrials"],["AXON","Axon Enterprise","Industrials"],
  ["KTOS","Kratos Defense & Security","Industrials"],["JOBY","Joby Aviation","Industrials"],
  ["ACHR","Archer Aviation","Industrials"],["DRS","Leonardo DRS","Industrials"],
  ["HEI","HEICO Corp","Industrials"],["TDG","TransDigm Group","Industrials"],
  ["UNP","Union Pacific Corp","Industrials"],["CSX","CSX Corp","Industrials"],
  ["FDX","FedEx Corp","Industrials"],["UPS","United Parcel Service","Industrials"],
  ["DAL","Delta Air Lines","Industrials"],["UAL","United Airlines Holdings","Industrials"],
  ["AAL","American Airlines Group","Industrials"],["LUV","Southwest Airlines","Industrials"],
  ["URI","United Rentals","Industrials"],["PWR","Quanta Services","Industrials"],
  ["ETN","Eaton Corp","Industrials"],["EMR","Emerson Electric","Industrials"],
  ["ROK","Rockwell Automation","Industrials"],["AME","AMETEK Inc","Industrials"],
  ["TT","Trane Technologies","Industrials"],["CARR","Carrier Global","Industrials"],
  ["FAST","Fastenal Co","Industrials"],["GWW","W.W. Grainger","Industrials"],
  ["WM","Waste Management","Industrials"],["RSG","Republic Services","Industrials"],
  ["VMC","Vulcan Materials","Industrials"],["MLM","Martin Marietta Materials","Industrials"],
  ["BLDR","Builders FirstSource","Industrials"],["EME","EMCOR Group","Industrials"],
  ["MTZ","MasTec Inc","Industrials"],["STRL","Sterling Infrastructure","Industrials"],
  ["FCX","Freeport-McMoRan","Materials"],["NEM","Newmont Corp","Materials"],
  ["AA","Alcoa Corp","Materials"],["NUE","Nucor Corp","Materials"],
  ["STLD","Steel Dynamics","Materials"],["CLF","Cleveland-Cliffs Inc","Materials"],
  ["ALB","Albemarle Corp","Materials"],["MP","MP Materials Corp","Materials"],
  ["LIN","Linde plc","Materials"],["APD","Air Products and Chemicals","Materials"],
  ["SHW","Sherwin-Williams Co","Materials"],["ECL","Ecolab Inc","Materials"],
  ["CF","CF Industries Holdings","Materials"],["MOS","The Mosaic Company","Materials"],
  ["ATI","ATI Inc","Materials"],["CMC","Commercial Metals","Materials"],
  ["T","AT&T Inc","Communications"],["VZ","Verizon Communications","Communications"],
  ["TMUS","T-Mobile US","Communications"],["NFLX","Netflix Inc","Communications"],
  ["DIS","Walt Disney Co","Communications"],["CMCSA","Comcast Corp","Communications"],
  ["SPOT","Spotify Technology","Communications"],["PINS","Pinterest Inc","Communications"],
  ["SNAP","Snap Inc","Communications"],["RDDT","Reddit Inc","Communications"],
  ["TTWO","Take-Two Interactive","Communications"],["EA","Electronic Arts","Communications"],
  ["RBLX","Roblox Corp","Communications"],["MTCH","Match Group","Communications"],
  ["BMBL","Bumble Inc","Communications"],["CHTR","Charter Communications","Communications"],
  ["DV","DoubleVerify Holdings","Communications"],["PUBM","PubMatic Inc","Communications"],
  ["AMC","AMC Entertainment Holdings","Communications"],["GME","GameStop Corp","Communications"],
  ["AMT","American Tower Corp","Real Estate"],["PLD","Prologis Inc","Real Estate"],
  ["EQIX","Equinix Inc","Real Estate"],["CCI","Crown Castle Inc","Real Estate"],
  ["DLR","Digital Realty Trust","Real Estate"],["PSA","Public Storage","Real Estate"],
  ["WELL","Welltower Inc","Real Estate"],["SPG","Simon Property Group","Real Estate"],
  ["O","Realty Income Corp","Real Estate"],["VICI","VICI Properties","Real Estate"],
  ["CSGP","CoStar Group","Real Estate"],["COLD","Americold Realty Trust","Real Estate"],
  ["REXR","Rexford Industrial Realty","Real Estate"],["EGP","EastGroup Properties","Real Estate"],
  ["LEN","Lennar Corp","Real Estate"],["DHI","D.R. Horton Inc","Real Estate"],
  ["PHM","PulteGroup Inc","Real Estate"],["TOL","Toll Brothers","Real Estate"],
  ["NVR","NVR Inc","Real Estate"],["TMHC","Taylor Morrison Home","Real Estate"],
  ["COIN","Coinbase Global","Crypto"],["MSTR","MicroStrategy Inc","Crypto"],
  ["RIOT","Riot Platforms","Crypto"],["MARA","Marathon Digital Holdings","Crypto"],
  ["CLSK","CleanSpark Inc","Crypto"],["HUT","Hut 8 Mining Corp","Crypto"],
  ["WULF","TeraWulf Inc","Crypto"],["IREN","Iris Energy Ltd","Crypto"],
  ["BITF","Bitfarms Ltd","Crypto"],["CIFR","Cipher Mining","Crypto"],
  ["BTM","Bitcoin Depot Inc","Crypto"],["SDIG","Stronghold Digital Mining","Crypto"],
  ["SPY","SPDR S&P 500 ETF","ETF"],["QQQ","Invesco QQQ Trust","ETF"],
  ["IWM","iShares Russell 2000 ETF","ETF"],["SOXX","iShares PHLX Semiconductor","ETF"],
  ["XLK","Technology Select Sector","ETF"],["XLF","Financial Select Sector","ETF"],
  ["XLE","Energy Select Sector","ETF"],["XLV","Health Care Select Sector","ETF"],
  ["ARKK","ARK Innovation ETF","ETF"],["TQQQ","ProShares UltraPro QQQ","ETF"],
  ["SQQQ","ProShares UltraPro Short QQQ","ETF"],["GLD","SPDR Gold Shares","ETF"],
  ["GDX","VanEck Gold Miners ETF","ETF"],["TLT","20+ Year Treasury ETF","ETF"],
  ["SLV","iShares Silver Trust","ETF"],["GDXJ","VanEck Junior Gold Miners","ETF"],
].map(([ticker, name, sector]) => ({ ticker, name, sector }));

// ── Yahoo Finance v8 Chart API fetch ─────────────────────────────────────────
// No crumb needed · No API key · Works from Vercel
async function fetchCandles(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=6mo`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "Origin": "https://finance.yahoo.com",
      "Referer": "https://finance.yahoo.com/",
    },
  });

  if (!res.ok) return null;
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return null;

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];
  const opens   = quote.open   || [];
  const highs   = quote.high   || [];
  const lows    = quote.low    || [];
  const closes  = quote.close  || [];
  const volumes = quote.volume || [];

  const candles = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = opens[i], h = highs[i], l = lows[i], c = closes[i];
    if (o == null || h == null || l == null || c == null) continue;
    candles.push({
      date:   new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open:   o,
      high:   h,
      low:    l,
      close:  adjClose[i] ?? c,
      volume: volumes[i] || 0,
    });
  }
  return candles.length >= 20 ? candles : null;
}

// ── ICT Engine ────────────────────────────────────────────────────────────────
function calcATR(candles, period = 14) {
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    trs.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i-1].close),
      Math.abs(candles[i].low  - candles[i-1].close)
    ));
  }
  const sl = trs.slice(-period);
  return sl.reduce((a,b)=>a+b,0) / sl.length || candles[0].close * 0.015;
}

function calcAvgVol(candles, period = 20) {
  const s = candles.slice(-period);
  return s.reduce((a,c)=>a+c.volume,0) / s.length;
}

function pivotHighs(c, n = 3) {
  const out = [];
  for (let i = n; i < c.length - n; i++) {
    let ok = true;
    for (let j = i-n; j <= i+n; j++) { if (j!==i && c[j].high >= c[i].high) {ok=false;break;} }
    if (ok) out.push(i);
  }
  return out;
}

function pivotLows(c, n = 3) {
  const out = [];
  for (let i = n; i < c.length - n; i++) {
    let ok = true;
    for (let j = i-n; j <= i+n; j++) { if (j!==i && c[j].low <= c[i].low) {ok=false;break;} }
    if (ok) out.push(i);
  }
  return out;
}

function bullOB(c, atr, lb=40, dm=0.8) {
  for (let i=c.length-1; i>=Math.max(1,c.length-lb); i--) {
    if (c[i].close-c[i].open < atr*dm) continue;
    for (let j=i-1; j>=Math.max(0,i-4); j--)
      if (c[j].close < c[j].open) return {high:c[j].high,low:c[j].low};
  }
  return null;
}

function bearOB(c, atr, lb=40, dm=0.8) {
  for (let i=c.length-1; i>=Math.max(1,c.length-lb); i--) {
    if (c[i].open-c[i].close < atr*dm) continue;
    for (let j=i-1; j>=Math.max(0,i-4); j--)
      if (c[j].close > c[j].open) return {high:c[j].high,low:c[j].low};
  }
  return null;
}

function bullFVG(c, atr, lb=40) {
  const e=c.length-1;
  for (let i=e; i>=Math.max(2,e-lb); i--) {
    const bot=c[i-2].high, top=c[i].low;
    if (top<=bot || top-bot<atr*0.1) continue;
    let ok=true;
    for (let k=i+1;k<=e;k++) if(c[k].close<bot){ok=false;break;}
    if (ok) return {top,bot};
  }
  return null;
}

function bearFVG(c, atr, lb=40) {
  const e=c.length-1;
  for (let i=e; i>=Math.max(2,e-lb); i--) {
    const top=c[i-2].low, bot=c[i].high;
    if (bot>=top || top-bot<atr*0.1) continue;
    let ok=true;
    for (let k=i+1;k<=e;k++) if(c[k].close>top){ok=false;break;}
    if (ok) return {top,bot};
  }
  return null;
}

function bullMSB(c, phIdxs, win=20) {
  const e=c.length-1;
  for (const idx of [...phIdxs].reverse()) {
    const lv=c[idx].high;
    for (let i=idx+1;i<=e;i++) if(c[i].close>lv){if(i>=e-win)return lv;break;}
  }
  return null;
}

function bearMSB(c, plIdxs, win=20) {
  const e=c.length-1;
  for (const idx of [...plIdxs].reverse()) {
    const lv=c[idx].low;
    for (let i=idx+1;i<=e;i++) if(c[i].close<lv){if(i>=e-win)return lv;break;}
  }
  return null;
}

function bullLS(c, plIdxs, win=20) {
  const e=c.length-1;
  for (const idx of plIdxs) {
    if (idx>e-win) continue;
    const lv=c[idx].low;
    for (let i=idx+1;i<=e;i++)
      if(c[i].low<lv && c[i].close>lv && i>=e-win) return true;
  }
  return false;
}

function bearLS(c, phIdxs, win=20) {
  const e=c.length-1;
  for (const idx of phIdxs) {
    if (idx>e-win) continue;
    const lv=c[idx].high;
    for (let i=idx+1;i<=e;i++)
      if(c[i].high>lv && c[i].close<lv && i>=e-win) return true;
  }
  return false;
}

function bullOTE(c, plIdxs, phIdxs) {
  if (!plIdxs.length||!phIdxs.length) return false;
  const pL=plIdxs[plIdxs.length-1], pH=phIdxs[phIdxs.length-1];
  if (pL>=pH) return false;
  const rng=c[pH].high-c[pL].low; if(rng<=0) return false;
  const p=c[c.length-1].close;
  return p>=(c[pH].high-rng*0.786)*0.998 && p<=(c[pH].high-rng*0.618)*1.002;
}

function bearOTE(c, plIdxs, phIdxs) {
  if (!plIdxs.length||!phIdxs.length) return false;
  const pL=plIdxs[plIdxs.length-1], pH=phIdxs[phIdxs.length-1];
  if (pH>=pL) return false;
  const rng=c[pH].high-c[pL].low; if(rng<=0) return false;
  const p=c[c.length-1].close;
  return p>=(c[pL].low+rng*0.618)*0.998 && p<=(c[pL].low+rng*0.786)*1.002;
}

function analyzeICT(ticker, name, sector, candles) {
  if (candles.length < 20) return null;
  const last=candles[candles.length-1], prev=candles[candles.length-2];
  const price=last.close, atr=calcATR(candles);
  const avgVol=calcAvgVol(candles);
  const volRatio=avgVol>0?last.volume/avgVol:1;
  const changePct=prev.close>0?((price-prev.close)/prev.close)*100:0;
  const phIdxs=pivotHighs(candles,3), plIdxs=pivotLows(candles,3);

  const bOB=bullOB(candles,atr), bFVG=bullFVG(candles,atr);
  const bMSB=bullMSB(candles,phIdxs), bLS=bullLS(candles,plIdxs);
  const bOTE=bullOTE(candles,plIdxs,phIdxs);
  const rOB=bearOB(candles,atr), rFVG=bearFVG(candles,atr);
  const rMSB=bearMSB(candles,plIdxs), rLS=bearLS(candles,phIdxs);
  const rOTE=bearOTE(candles,plIdxs,phIdxs);

  const bullScore=(bOB?2:0)+(bFVG?2:0)+(bMSB?2:0)+(bLS?1.5:0)+(bOTE?1:0);
  const bearScore=(rOB?2:0)+(rFVG?2:0)+(rMSB?2:0)+(rLS?1.5:0)+(rOTE?1:0);
  const MIN=1.5;
  if (bullScore<MIN&&bearScore<MIN) return null;

  let bias, sigs=[], score;
  if (bullScore>=bearScore&&bullScore>=MIN) {
    bias='bullish'; score=bullScore;
    if(bOB)sigs.push("OB"); if(bFVG)sigs.push("FVG"); if(bMSB)sigs.push("MSB");
    if(bLS)sigs.push("LS"); if(bOTE)sigs.push("OTE");
  } else {
    bias='bearish'; score=bearScore;
    if(rOB)sigs.push("OB"); if(rFVG)sigs.push("FVG"); if(rMSB)sigs.push("MSB");
    if(rLS)sigs.push("LS"); if(rOTE)sigs.push("OTE");
  }
  if (volRatio>=1.5) score=Math.min(8.5,score+0.5);
  const strength=Math.max(1,Math.min(10,Math.round((score/8.5)*10)));

  const obZ=bias==='bullish'?bOB:rOB;
  const fvZ=bias==='bullish'?bFVG:rFVG;
  const msL=bias==='bullish'?bMSB:rMSB;

  let entry=price,stop,target;
  if (bias==='bullish') {
    stop=obZ?obZ.low-atr*0.5:plIdxs.length?candles[plIdxs[plIdxs.length-1]].low-atr*0.3:price-atr*2;
    target=entry+(entry-stop)*2.5;
  } else {
    stop=obZ?obZ.high+atr*0.5:phIdxs.length?candles[phIdxs[phIdxs.length-1]].high+atr*0.3:price+atr*2;
    target=entry-(stop-entry)*2.5;
  }
  const rr=Math.abs(entry-stop)>0?Math.abs(target-entry)/Math.abs(entry-stop):0;
  const parts=[];
  if(sigs.includes("OB"))parts.push("Order Block");
  if(sigs.includes("FVG"))parts.push("open FVG");
  if(sigs.includes("MSB"))parts.push("structure break");
  if(sigs.includes("LS"))parts.push("liquidity sweep");
  if(sigs.includes("OTE"))parts.push("OTE zone");

  return {
    ticker,name,sector,
    price:+price.toFixed(2),changePct:+changePct.toFixed(2),
    volume:last.volume,avgVolume:Math.round(avgVol),volRatio:+volRatio.toFixed(2),
    signals:sigs,strength,bias,
    description:`${bias==='bullish'?'Bullish':'Bearish'}: ${parts.join(', ')}.`,
    obHigh:obZ?.high??null,obLow:obZ?.low??null,
    fvgTop:fvZ?.top??null,fvgBot:fvZ?.bot??null,msbLevel:msL??null,
    entry:+entry.toFixed(2),stop:+stop.toFixed(2),target:+target.toFixed(2),
    rr:+rr.toFixed(2),atr:+atr.toFixed(2),
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  const batchSize = 12; // 12 parallel Yahoo Chart requests — well within limits

  if (req.query.meta !== undefined) {
    return res.json({ total: STOCKS.length, batchSize });
  }

  const batch = parseInt(req.query.batch ?? "0", 10);
  const slice = STOCKS.slice(batch * batchSize, (batch + 1) * batchSize);
  if (!slice.length) return res.json({ results: [], done: true });

  const settled = await Promise.allSettled(
    slice.map(async ({ ticker, name, sector }) => {
      try {
        const candles = await fetchCandles(ticker);
        if (!candles) return null;
        return analyzeICT(ticker, name, sector, candles);
      } catch { return null; }
    })
  );

  const results = settled
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);

  return res.json({
    results,
    done: (batch + 1) * batchSize >= STOCKS.length,
    _debug: {
      batch,
      fetched: slice.length,
      signals: results.length,
      nulls: settled.filter(r=>r.status==='fulfilled'&&r.value===null).length,
      errors: settled.filter(r=>r.status==='rejected').length,
    },
  });
};
