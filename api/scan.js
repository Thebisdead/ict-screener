// ─────────────────────────────────────────────────────────────────────────────
// ICT Screener – Vercel Serverless Function
// Same architecture as martin-luk-screener (plain Node.js, no Next.js)
// ─────────────────────────────────────────────────────────────────────────────
const yahooFinance = require('yahoo-finance2').default;

// ── Stock Universe ────────────────────────────────────────────────────────────
const STOCKS = [
  // Technology
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
  ["AMBA","Ambarella Inc","Technology"],["IPGP","IPG Photonics","Technology"],
  ["MTSI","MACOM Technology","Technology"],["SWKS","Skyworks Solutions","Technology"],
  ["QRVO","Qorvo Inc","Technology"],["SITM","SiTime Corp","Technology"],
  ["ALGM","Allegro MicroSystems","Technology"],["AEIS","Advanced Energy Industries","Technology"],
  ["LSCC","Lattice Semiconductor","Technology"],["ENTG","Entegris Inc","Technology"],
  ["MKSI","MKS Instruments","Technology"],["MRCY","Mercury Systems","Technology"],
  ["COHU","Cohu Inc","Technology"],["FORM","FormFactor Inc","Technology"],
  ["ACLS","Axcelis Technologies","Technology"],["WOLF","Wolfspeed Inc","Technology"],
  ["DIOD","Diodes Inc","Technology"],["CEVA","CEVA Inc","Technology"],
  ["PI","Impinj Inc","Technology"],["NOVT","Novanta Inc","Technology"],
  ["VIAV","Viavi Solutions","Technology"],["NSIT","Insight Enterprises","Technology"],
  // Software
  ["META","Meta Platforms","Software"],["GOOGL","Alphabet Inc","Software"],
  ["CRM","Salesforce Inc","Software"],["NOW","ServiceNow Inc","Software"],
  ["ADBE","Adobe Inc","Software"],["INTU","Intuit Inc","Software"],
  ["WDAY","Workday Inc","Software"],["SNOW","Snowflake Inc","Software"],
  ["DDOG","Datadog Inc","Software"],["HUBS","HubSpot Inc","Software"],
  ["PANW","Palo Alto Networks","Software"],["CRWD","CrowdStrike Holdings","Software"],
  ["ZS","Zscaler Inc","Software"],["OKTA","Okta Inc","Software"],
  ["FTNT","Fortinet Inc","Software"],["S","SentinelOne","Software"],
  ["PLTR","Palantir Technologies","Software"],["PATH","UiPath Inc","Software"],
  ["AI","C3.ai Inc","Software"],["SOUN","SoundHound AI","Software"],
  ["ASAN","Asana Inc","Software"],["MNDY","Monday.com","Software"],
  ["MDB","MongoDB Inc","Software"],["GTLB","GitLab Inc","Software"],
  ["DOMO","Domo Inc","Software"],["VEEV","Veeva Systems","Software"],
  ["PCOR","Procore Technologies","Software"],["TOST","Toast Inc","Software"],
  ["BILL","Bill.com Holdings","Software"],["DT","Dynatrace Inc","Software"],
  ["ESTC","Elastic NV","Software"],["CFLT","Confluent Inc","Software"],
  ["BRZE","Braze Inc","Software"],["ZI","ZoomInfo Technologies","Software"],
  ["SPSC","SPS Commerce","Software"],["MANH","Manhattan Associates","Software"],
  ["PAYC","Paycom Software","Software"],["RPD","Rapid7 Inc","Software"],
  ["QLYS","Qualys Inc","Software"],["TENB","Tenable Holdings","Software"],
  ["VRNS","Varonis Systems","Software"],["RNG","RingCentral Inc","Software"],
  ["FIVN","Five9 Inc","Software"],["FOUR","Shift4 Payments","Software"],
  ["UPWK","Upwork Inc","Software"],["YEXT","Yext Inc","Software"],
  ["BBAI","BigBear.ai Holdings","Software"],["NCNO","nCino Inc","Software"],
  ["APPN","Appian Corp","Software"],["PEGA","Pegasystems Inc","Software"],
  // Cloud
  ["AMZN","Amazon.com Inc","Cloud"],["NET","Cloudflare Inc","Cloud"],
  ["AKAM","Akamai Technologies","Cloud"],["FSLY","Fastly Inc","Cloud"],
  ["DOCN","DigitalOcean Holdings","Cloud"],["TWLO","Twilio Inc","Cloud"],
  ["BAND","Bandwidth Inc","Cloud"],["INFA","Informatica Inc","Cloud"],
  // Financials
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
  ["ICE","Intercontinental Exchange","Financials"],["CBOE","Cboe Global Markets","Financials"],
  ["ALLY","Ally Financial Inc","Financials"],["LC","LendingClub Corp","Financials"],
  ["IBKR","Interactive Brokers","Financials"],["MKTX","MarketAxess Holdings","Financials"],
  ["WU","Western Union","Financials"],["VIRT","Virtu Financial","Financials"],
  ["MQ","Marqeta Inc","Financials"],["DFS","Discover Financial","Financials"],
  // Healthcare
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
  ["CRSP","CRISPR Therapeutics","Healthcare"],["BEAM","Beam Therapeutics","Healthcare"],
  ["RXRX","Recursion Pharmaceuticals","Healthcare"],["RVMD","Revolution Medicines","Healthcare"],
  ["CI","The Cigna Group","Healthcare"],["HUM","Humana Inc","Healthcare"],
  ["CVS","CVS Health Corp","Healthcare"],["MCK","McKesson Corp","Healthcare"],
  ["IDXX","IDEXX Laboratories","Healthcare"],["HOLX","Hologic Inc","Healthcare"],
  ["ZBH","Zimmer Biomet Holdings","Healthcare"],["DXCM","DexCom Inc","Healthcare"],
  ["ALGN","Align Technology","Healthcare"],["INMD","InMode Ltd","Healthcare"],
  ["AXNX","Axonics Modulation Technologies","Healthcare"],["PODD","Insulet Corp","Healthcare"],
  ["NVCR","NovoCure Ltd","Healthcare"],["EXAS","Exact Sciences Corp","Healthcare"],
  ["PACB","Pacific Biosciences","Healthcare"],["TXG","10x Genomics","Healthcare"],
  ["RARE","Ultragenyx Pharmaceutical","Healthcare"],["RCKT","Rocket Pharmaceuticals","Healthcare"],
  ["SRPT","Sarepta Therapeutics","Healthcare"],["TGTX","TG Therapeutics","Healthcare"],
  ["VKTX","Viking Therapeutics","Healthcare"],["AXSM","Axsome Therapeutics","Healthcare"],
  ["KRTX","Karuna Therapeutics","Healthcare"],["KRYS","Krystal Biotech","Healthcare"],
  ["MORF","Morphic Holding","Healthcare"],["XNCR","Xencor Inc","Healthcare"],
  // Consumer
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
  ["CVNA","Carvana Co","Consumer"],["KMX","CarMax Inc","Consumer"],
  ["WMT","Walmart Inc","Consumer"],["COST","Costco Wholesale","Consumer"],
  ["TGT","Target Corp","Consumer"],["DG","Dollar General","Consumer"],
  ["SHOP","Shopify Inc","Consumer"],["ETSY","Etsy Inc","Consumer"],
  ["MELI","MercadoLibre Inc","Consumer"],["SE","Sea Ltd","Consumer"],
  // Energy
  ["XOM","Exxon Mobil Corp","Energy"],["CVX","Chevron Corp","Energy"],
  ["COP","ConocoPhillips","Energy"],["EOG","EOG Resources","Energy"],
  ["SLB","Schlumberger Ltd","Energy"],["HAL","Halliburton Co","Energy"],
  ["DVN","Devon Energy Corp","Energy"],["FANG","Diamondback Energy","Energy"],
  ["MPC","Marathon Petroleum","Energy"],["VLO","Valero Energy","Energy"],
  ["OXY","Occidental Petroleum","Energy"],["MRO","Marathon Oil","Energy"],
  ["LNG","Cheniere Energy","Energy"],["OVV","Ovintiv Inc","Energy"],
  ["MTDR","Matador Resources","Energy"],["PR","Permian Resources","Energy"],
  ["KMI","Kinder Morgan","Energy"],["WMB","Williams Companies","Energy"],
  ["OKE","ONEOK Inc","Energy"],["ET","Energy Transfer","Energy"],
  // Clean Energy
  ["ENPH","Enphase Energy","Clean Energy"],["FSLR","First Solar Inc","Clean Energy"],
  ["SEDG","SolarEdge Technologies","Clean Energy"],["RUN","Sunrun Inc","Clean Energy"],
  ["BE","Bloom Energy Corp","Clean Energy"],["PLUG","Plug Power Inc","Clean Energy"],
  ["RIVN","Rivian Automotive","Clean Energy"],["LCID","Lucid Group","Clean Energy"],
  ["NIO","NIO Inc","Clean Energy"],["XPEV","XPeng Inc","Clean Energy"],
  ["LI","Li Auto Inc","Clean Energy"],["CHPT","ChargePoint Holdings","Clean Energy"],
  ["BLNK","Blink Charging","Clean Energy"],["EVGO","EVgo Inc","Clean Energy"],
  ["NKLA","Nikola Corp","Clean Energy"],["FSR","Fisker Inc","Clean Energy"],
  // Industrials
  ["GE","GE Aerospace","Industrials"],["HON","Honeywell International","Industrials"],
  ["CAT","Caterpillar Inc","Industrials"],["DE","Deere & Company","Industrials"],
  ["RTX","RTX Corp","Industrials"],["LMT","Lockheed Martin","Industrials"],
  ["BA","Boeing Co","Industrials"],["NOC","Northrop Grumman","Industrials"],
  ["GD","General Dynamics","Industrials"],["LHX","L3Harris Technologies","Industrials"],
  ["AXON","Axon Enterprise","Industrials"],["KTOS","Kratos Defense & Security","Industrials"],
  ["JOBY","Joby Aviation","Industrials"],["ACHR","Archer Aviation","Industrials"],
  ["UNP","Union Pacific Corp","Industrials"],["CSX","CSX Corp","Industrials"],
  ["FDX","FedEx Corp","Industrials"],["UPS","United Parcel Service","Industrials"],
  ["DAL","Delta Air Lines","Industrials"],["UAL","United Airlines Holdings","Industrials"],
  ["URI","United Rentals","Industrials"],["PWR","Quanta Services","Industrials"],
  ["ETN","Eaton Corp","Industrials"],["EMR","Emerson Electric","Industrials"],
  ["ROK","Rockwell Automation","Industrials"],["AME","AMETEK Inc","Industrials"],
  ["TT","Trane Technologies","Industrials"],["CARR","Carrier Global","Industrials"],
  ["FAST","Fastenal Co","Industrials"],["GWW","W.W. Grainger","Industrials"],
  ["WM","Waste Management","Industrials"],["RSG","Republic Services","Industrials"],
  ["VMC","Vulcan Materials","Industrials"],["MLM","Martin Marietta Materials","Industrials"],
  ["BLDR","Builders FirstSource","Industrials"],["IBP","Installed Building Products","Industrials"],
  ["EME","EMCOR Group","Industrials"],["MTZ","MasTec Inc","Industrials"],
  // Materials
  ["FCX","Freeport-McMoRan","Materials"],["NEM","Newmont Corp","Materials"],
  ["AA","Alcoa Corp","Materials"],["NUE","Nucor Corp","Materials"],
  ["STLD","Steel Dynamics","Materials"],["CLF","Cleveland-Cliffs Inc","Materials"],
  ["ALB","Albemarle Corp","Materials"],["MP","MP Materials Corp","Materials"],
  ["LAC","Lithium Americas","Materials"],["LIN","Linde plc","Materials"],
  ["APD","Air Products and Chemicals","Materials"],["SHW","Sherwin-Williams Co","Materials"],
  ["PPG","PPG Industries","Materials"],["ECL","Ecolab Inc","Materials"],
  ["CE","Celanese Corp","Materials"],["CF","CF Industries Holdings","Materials"],
  // Communications
  ["T","AT&T Inc","Communications"],["VZ","Verizon Communications","Communications"],
  ["TMUS","T-Mobile US","Communications"],["NFLX","Netflix Inc","Communications"],
  ["DIS","Walt Disney Co","Communications"],["CMCSA","Comcast Corp","Communications"],
  ["SPOT","Spotify Technology","Communications"],["PINS","Pinterest Inc","Communications"],
  ["SNAP","Snap Inc","Communications"],["RDDT","Reddit Inc","Communications"],
  ["TTWO","Take-Two Interactive","Communications"],["EA","Electronic Arts","Communications"],
  ["RBLX","Roblox Corp","Communications"],["U","Unity Software","Communications"],
  ["MTCH","Match Group","Communications"],["BMBL","Bumble Inc","Communications"],
  ["TTD","The Trade Desk","Communications"],["DV","DoubleVerify Holdings","Communications"],
  ["PUBM","PubMatic Inc","Communications"],["MGNI","Magnite Inc","Communications"],
  ["AMC","AMC Entertainment Holdings","Communications"],["CHTR","Charter Communications","Communications"],
  // Real Estate
  ["AMT","American Tower Corp","Real Estate"],["PLD","Prologis Inc","Real Estate"],
  ["EQIX","Equinix Inc","Real Estate"],["CCI","Crown Castle Inc","Real Estate"],
  ["DLR","Digital Realty Trust","Real Estate"],["PSA","Public Storage","Real Estate"],
  ["WELL","Welltower Inc","Real Estate"],["SPG","Simon Property Group","Real Estate"],
  ["O","Realty Income Corp","Real Estate"],["VICI","VICI Properties","Real Estate"],
  ["CSGP","CoStar Group","Real Estate"],["COLD","Americold Realty Trust","Real Estate"],
  ["REXR","Rexford Industrial Realty","Real Estate"],["EGP","EastGroup Properties","Real Estate"],
  ["LEN","Lennar Corp","Real Estate"],["DHI","D.R. Horton Inc","Real Estate"],
  ["PHM","PulteGroup Inc","Real Estate"],["TOL","Toll Brothers","Real Estate"],
  // Crypto
  ["COIN","Coinbase Global","Crypto"],["MSTR","MicroStrategy Inc","Crypto"],
  ["RIOT","Riot Platforms","Crypto"],["MARA","Marathon Digital Holdings","Crypto"],
  ["CLSK","CleanSpark Inc","Crypto"],["HUT","Hut 8 Mining Corp","Crypto"],
  ["WULF","TeraWulf Inc","Crypto"],["IREN","Iris Energy Ltd","Crypto"],
  ["BITF","Bitfarms Ltd","Crypto"],["CIFR","Cipher Mining","Crypto"],
  // ETFs
  ["SPY","SPDR S&P 500 ETF","ETF"],["QQQ","Invesco QQQ Trust","ETF"],
  ["IWM","iShares Russell 2000 ETF","ETF"],["SOXX","iShares PHLX Semiconductor","ETF"],
  ["XLK","Technology Select Sector","ETF"],["XLF","Financial Select Sector","ETF"],
  ["XLE","Energy Select Sector","ETF"],["XLV","Health Care Select Sector","ETF"],
  ["ARKK","ARK Innovation ETF","ETF"],["TQQQ","ProShares UltraPro QQQ","ETF"],
  ["SQQQ","ProShares UltraPro Short QQQ","ETF"],["GLD","SPDR Gold Shares","ETF"],
  ["GDX","VanEck Gold Miners ETF","ETF"],
].map(([ticker, name, sector]) => ({ ticker, name, sector }));

// ── ICT Engine ────────────────────────────────────────────────────────────────
function calcATR(candles, period = 14) {
  if (candles.length < 2) return candles[0]?.close * 0.015 || 1;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    trs.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low  - candles[i - 1].close)
    ));
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length);
}

function calcAvgVol(candles, period = 20) {
  const s = candles.slice(-period);
  return s.reduce((a, c) => a + c.volume, 0) / s.length;
}

function pivotHighs(candles, n = 3) {
  const out = [];
  for (let i = n; i < candles.length - n; i++) {
    const h = candles[i].high;
    let ok = true;
    for (let j = i - n; j <= i + n; j++) {
      if (j !== i && candles[j].high >= h) { ok = false; break; }
    }
    if (ok) out.push(i);
  }
  return out;
}

function pivotLows(candles, n = 3) {
  const out = [];
  for (let i = n; i < candles.length - n; i++) {
    const l = candles[i].low;
    let ok = true;
    for (let j = i - n; j <= i + n; j++) {
      if (j !== i && candles[j].low <= l) { ok = false; break; }
    }
    if (ok) out.push(i);
  }
  return out;
}

function detectBullOB(candles, atr, lookback = 40, dispMult = 0.8) {
  for (let i = candles.length - 1; i >= Math.max(1, candles.length - lookback); i--) {
    const body = candles[i].close - candles[i].open;
    if (body < atr * dispMult) continue;
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      if (candles[j].close < candles[j].open)
        return { high: candles[j].high, low: candles[j].low };
    }
  }
  return null;
}

function detectBearOB(candles, atr, lookback = 40, dispMult = 0.8) {
  for (let i = candles.length - 1; i >= Math.max(1, candles.length - lookback); i--) {
    const body = candles[i].open - candles[i].close;
    if (body < atr * dispMult) continue;
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      if (candles[j].close > candles[j].open)
        return { high: candles[j].high, low: candles[j].low };
    }
  }
  return null;
}

function detectBullFVG(candles, atr, lookback = 40) {
  const end = candles.length - 1;
  for (let i = end; i >= Math.max(2, end - lookback); i--) {
    const bot = candles[i - 2].high, top = candles[i].low;
    if (top <= bot || (top - bot) < atr * 0.1) continue;
    let filled = false;
    for (let k = i + 1; k <= end; k++) {
      if (candles[k].close < bot) { filled = true; break; }
    }
    if (!filled) return { top, bot };
  }
  return null;
}

function detectBearFVG(candles, atr, lookback = 40) {
  const end = candles.length - 1;
  for (let i = end; i >= Math.max(2, end - lookback); i--) {
    const top = candles[i - 2].low, bot = candles[i].high;
    if (bot >= top || (top - bot) < atr * 0.1) continue;
    let filled = false;
    for (let k = i + 1; k <= end; k++) {
      if (candles[k].close > top) { filled = true; break; }
    }
    if (!filled) return { top, bot };
  }
  return null;
}

function detectBullMSB(candles, phIdxs, window = 20) {
  const end = candles.length - 1;
  for (const idx of [...phIdxs].reverse()) {
    const level = candles[idx].high;
    for (let i = idx + 1; i <= end; i++) {
      if (candles[i].close > level) {
        if (i >= end - window) return level;
        break;
      }
    }
  }
  return null;
}

function detectBearMSB(candles, plIdxs, window = 20) {
  const end = candles.length - 1;
  for (const idx of [...plIdxs].reverse()) {
    const level = candles[idx].low;
    for (let i = idx + 1; i <= end; i++) {
      if (candles[i].close < level) {
        if (i >= end - window) return level;
        break;
      }
    }
  }
  return null;
}

function detectBullLS(candles, plIdxs, window = 20) {
  const end = candles.length - 1;
  for (const idx of plIdxs) {
    if (idx > end - window) continue;
    const level = candles[idx].low;
    for (let i = idx + 1; i <= end; i++) {
      if (candles[i].low < level && candles[i].close > level && i >= end - window)
        return true;
    }
  }
  return false;
}

function detectBearLS(candles, phIdxs, window = 20) {
  const end = candles.length - 1;
  for (const idx of phIdxs) {
    if (idx > end - window) continue;
    const level = candles[idx].high;
    for (let i = idx + 1; i <= end; i++) {
      if (candles[i].high > level && candles[i].close < level && i >= end - window)
        return true;
    }
  }
  return false;
}

function detectBullOTE(candles, plIdxs, phIdxs) {
  if (!plIdxs.length || !phIdxs.length) return false;
  const lastPL = plIdxs[plIdxs.length - 1];
  const lastPH = phIdxs[phIdxs.length - 1];
  if (lastPL >= lastPH) return false;
  const range = candles[lastPH].high - candles[lastPL].low;
  if (range <= 0) return false;
  const p = candles[candles.length - 1].close;
  const ote786 = candles[lastPH].high - range * 0.786;
  const ote618 = candles[lastPH].high - range * 0.618;
  return p >= ote786 * 0.998 && p <= ote618 * 1.002;
}

function detectBearOTE(candles, plIdxs, phIdxs) {
  if (!plIdxs.length || !phIdxs.length) return false;
  const lastPL = plIdxs[plIdxs.length - 1];
  const lastPH = phIdxs[phIdxs.length - 1];
  if (lastPH >= lastPL) return false;
  const range = candles[lastPH].high - candles[lastPL].low;
  if (range <= 0) return false;
  const p = candles[candles.length - 1].close;
  const ote618 = candles[lastPL].low + range * 0.618;
  const ote786 = candles[lastPL].low + range * 0.786;
  return p >= ote618 * 0.998 && p <= ote786 * 1.002;
}

function analyzeICT(ticker, name, sector, candles) {
  if (candles.length < 20) return null;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const price = last.close;
  const atr = calcATR(candles);
  const avgVol = calcAvgVol(candles);
  const volRatio = avgVol > 0 ? last.volume / avgVol : 1;
  const changePct = prev.close > 0 ? ((price - prev.close) / prev.close) * 100 : 0;

  const phIdxs = pivotHighs(candles, 3);
  const plIdxs = pivotLows(candles, 3);

  const bullOB  = detectBullOB(candles, atr);
  const bearOB  = detectBearOB(candles, atr);
  const bullFVG = detectBullFVG(candles, atr);
  const bearFVG = detectBearFVG(candles, atr);
  const bullMSB = detectBullMSB(candles, phIdxs);
  const bearMSB = detectBearMSB(candles, plIdxs);
  const bullLS  = detectBullLS(candles, plIdxs);
  const bearLS  = detectBearLS(candles, phIdxs);
  const bullOTE = detectBullOTE(candles, plIdxs, phIdxs);
  const bearOTE = detectBearOTE(candles, plIdxs, phIdxs);

  const bullScore = (bullOB?2:0)+(bullFVG?2:0)+(bullMSB?2:0)+(bullLS?1.5:0)+(bullOTE?1:0);
  const bearScore = (bearOB?2:0)+(bearFVG?2:0)+(bearMSB?2:0)+(bearLS?1.5:0)+(bearOTE?1:0);

  const MIN = 1.5;
  if (bullScore < MIN && bearScore < MIN) return null;

  let bias, signals = [], score;
  if (bullScore >= bearScore && bullScore >= MIN) {
    bias = "bullish"; score = bullScore;
    if (bullOB)  signals.push("OB");
    if (bullFVG) signals.push("FVG");
    if (bullMSB) signals.push("MSB");
    if (bullLS)  signals.push("LS");
    if (bullOTE) signals.push("OTE");
  } else {
    bias = "bearish"; score = bearScore;
    if (bearOB)  signals.push("OB");
    if (bearFVG) signals.push("FVG");
    if (bearMSB) signals.push("MSB");
    if (bearLS)  signals.push("LS");
    if (bearOTE) signals.push("OTE");
  }
  if (volRatio >= 1.5) score = Math.min(8.5, score + 0.5);
  const strength = Math.max(1, Math.min(10, Math.round((score / 8.5) * 10)));

  const obZone  = bias === "bullish" ? bullOB  : bearOB;
  const fvgZone = bias === "bullish" ? bullFVG : bearFVG;
  const msbLvl  = bias === "bullish" ? bullMSB : bearMSB;

  let entry = price, stop, target;
  if (bias === "bullish") {
    stop   = obZone ? obZone.low - atr * 0.5
           : plIdxs.length ? candles[plIdxs[plIdxs.length-1]].low - atr*0.3
           : price - atr*2;
    target = entry + (entry - stop) * 2.5;
  } else {
    stop   = obZone ? obZone.high + atr * 0.5
           : phIdxs.length ? candles[phIdxs[phIdxs.length-1]].high + atr*0.3
           : price + atr*2;
    target = entry - (stop - entry) * 2.5;
  }
  const rr = Math.abs(entry - stop) > 0
    ? Math.abs(target - entry) / Math.abs(entry - stop)
    : 0;

  const parts = [];
  if (signals.includes("OB"))  parts.push("Order Block");
  if (signals.includes("FVG")) parts.push("open FVG");
  if (signals.includes("MSB")) parts.push("structure break");
  if (signals.includes("LS"))  parts.push("liquidity sweep");
  if (signals.includes("OTE")) parts.push("OTE zone");

  return {
    ticker, name, sector,
    price:     +price.toFixed(2),
    changePct: +changePct.toFixed(2),
    volume:    last.volume,
    avgVolume: Math.round(avgVol),
    volRatio:  +volRatio.toFixed(2),
    signals, strength, bias,
    description: `${bias==="bullish"?"Bullish":"Bearish"}: ${parts.join(", ")}.`,
    obHigh:   obZone?.high  ?? null,
    obLow:    obZone?.low   ?? null,
    fvgTop:   fvgZone?.top  ?? null,
    fvgBot:   fvgZone?.bot  ?? null,
    msbLevel: msbLvl        ?? null,
    entry:    +entry.toFixed(2),
    stop:     +stop.toFixed(2),
    target:   +target.toFixed(2),
    rr:       +rr.toFixed(2),
    atr:      +atr.toFixed(2),
  };
}

// ── Yahoo Finance fetch ───────────────────────────────────────────────────────
async function fetchCandles(ticker) {
  const period1 = new Date();
  period1.setDate(period1.getDate() - 120);
  const hist = await yahooFinance.historical(ticker, {
    period1,
    period2: new Date(),
    interval: "1d",
  }, { validateResult: false });
  if (!hist || hist.length < 20) return null;
  return hist
    .filter(d => d.open != null && d.high != null && d.low != null && d.close != null)
    .map(d => ({
      date:   new Date(d.date).toISOString().slice(0, 10),
      open:   d.open,
      high:   d.high,
      low:    d.low,
      close:  d.adjClose ?? d.close,
      volume: d.volume ?? 0,
    }));
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const batch = parseInt(req.query.batch ?? "0", 10);
  const size  = 10;

  if (req.query.meta !== undefined) {
    return res.json({ total: STOCKS.length, batchSize: size });
  }

  const slice = STOCKS.slice(batch * size, (batch + 1) * size);
  if (!slice.length) return res.json({ results: [], done: true });

  const settled = await Promise.allSettled(
    slice.map(async ({ ticker, name, sector }) => {
      const candles = await fetchCandles(ticker);
      if (!candles) return null;
      return analyzeICT(ticker, name, sector, candles);
    })
  );

  const results = settled
    .filter(r => r.status === "fulfilled" && r.value !== null)
    .map(r => r.value);

  const errors = settled.filter(r => r.status === "rejected").length;
  const nulls  = settled.filter(r => r.status === "fulfilled" && r.value === null).length;

  return res.json({
    results,
    done:   (batch + 1) * size >= STOCKS.length,
    _debug: { batch, fetched: slice.length, signals: results.length, errors, nulls },
  });
};
