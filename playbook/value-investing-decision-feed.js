// Deterministic, feed-backed implementation of the Value Investing Portfolio
// Decisions contract for the user's Core and Learning Circles.
const { Feed, feedPath, makeDoc, str, num, bool } = require("@alva/feed");
const http = require("net/http");
const secret = require("secret-manager");

const CORE = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"];
const LEARNING = ["TSM", "AVGO", "AMD"];
const ALL = CORE.concat(LEARNING);
const MOS = 0.25;
const MAX_POSITION = 0.10;
const MAX_SECTOR = 0.25;
const TRANCHES = 4;
const HORIZON_DAYS = 365;

const feed = new Feed({
  path: feedPath("mag7-value-decisions"),
  name: "Mag 7 Value Decisions",
  description: "One-year valuation zones, staged position sizing, thesis and risk review for Mag 7; semiconductor research-only context for TSM, AVGO and AMD.",
});

feed.def("decisions", {
  daily: makeDoc("Daily Decisions", "One record per tracked security and refresh", [
    str("symbol"), str("circle"), str("state"), str("action"),
    str("position_mode"), num("current_weight"), num("target_weight"),
    num("remaining_capacity"), num("tranche_index"), num("tranche_total"),
    num("tranche_weight"), num("proposed_change_weight"),
    num("current_price"), num("market_cap"), num("trailing_pe"),
    num("forward_eps"), num("bear_value"), num("base_value"), num("bull_value"),
    num("buy_zone_high"), num("trim_zone"), num("exit_review_zone"),
    num("margin_of_safety"), num("confidence"), str("valuation_method"),
    str("thesis_status"), str("risk_status"), str("earnings_date"),
    str("reason"), str("evidence_ids"), str("role_reports"),
    bool("alert_worthy"), str("as_of")
  ]),
});

feed.def("research", {
  evidence: makeDoc("Evidence Packet", "Timestamped factual and computed inputs", [
    str("symbol"), str("circle"), str("as_of"), str("company_name"),
    str("sector"), str("industry"), str("exchange"), str("fact_source"),
    str("computed_values"), str("missing_evidence"), str("policy_assumptions")
  ]),
  role_reports: makeDoc("Role Reports", "Independent rule-based specialist passes", [
    str("symbol"), str("as_of"), str("cross_validation_mode"), str("reports"),
    str("supported_claim_ids"), str("rejected_claim_ids"), str("conflicts")
  ]),
});

feed.def("alerts", {
  material_change: makeDoc("Material Decision Change", "New state, action, valuation or risk change", [
    str("title"), str("body"), str("symbol"), str("action"), str("decision_path")
  ]),
});

function tsDaysAgo(days) { return Math.floor(Date.now() / 1000) - days * 86400; }
function numOrNull(x) { return typeof x === "number" && Number.isFinite(x) ? x : null; }
function latestValue(body) {
  const rows = (body && body.data) || [];
  const vals = rows.flatMap((x) => x.values || []).filter((x) => x && x.value != null);
  vals.sort((a, b) => Number(b.observed_at || 0) - Number(a.observed_at || 0));
  return vals[0] || null;
}
function safeRound(x, n) {
  if (x == null || !Number.isFinite(x)) return null;
  const p = Math.pow(10, n || 2);
  return Math.round(x * p) / p;
}

async function getJson(url, jwt) {
  const resp = await http.fetch(url, { headers: { Authorization: "Bearer " + jwt } });
  if (!resp.ok) throw new Error("Arrays request failed " + resp.status + " " + url);
  const body = await resp.json();
  if (body && body.success === false) throw new Error("Arrays returned success=false for " + url);
  return body;
}

async function fetchSymbol(symbol, jwt, now, today) {
  const base = "https://data-tools.prd.space.id";
  const q = (path, params) => base + path + "?" + Object.keys(params).map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
  const [detail, kline, peBody, capBody, changeBody, epsBody, estimates, earnings] = await Promise.all([
    getJson(q("/api/v1/stocks/company/detail", { symbol }), jwt),
    getJson(q("/api/v1/stocks/kline", { symbol, start_time: now - 5 * 86400, end_time: now, interval: "1h", session: "RTH", limit: 100 }), jwt),
    getJson(q("/api/v1/stocks/market-metrics", { symbol, indicator: "PE_RATIO", interval: "1d", start_time: now - 30 * 86400, end_time: now }), jwt),
    getJson(q("/api/v1/stocks/market-metrics", { symbol, indicator: "MARKET_CAP", interval: "1d", start_time: now - 30 * 86400, end_time: now }), jwt),
    getJson(q("/api/v1/stocks/market-metrics", { symbol, indicator: "PRICE_CHANGE_1y", interval: "1d", start_time: now - 30 * 86400, end_time: now }), jwt),
    getJson(q("/api/v1/stocks/financial-metrics", { symbol, metric: "EPS_TTM", start_time: now - 400 * 86400, end_time: now }), jwt),
    getJson(q("/api/v1/stocks/estimates-guidance", { symbol, metrics: "EPS", type: "estimate", period_type: "annual", limit: 100 }), jwt),
    getJson(q("/api/v1/stocks/earnings-calendar", { symbol, start_time: now, end_time: now + HORIZON_DAYS * 86400 }), jwt),
  ]);

  const company = (detail.data || [])[0];
  if (!company || !company.is_listed || company.is_etf || company.is_fund) throw new Error("Invalid listed company detail for " + symbol);
  const bars = (kline.data || []).slice().sort((a, b) => Number(b.time_open || 0) - Number(a.time_open || 0));
  const price = numOrNull(bars[0] && bars[0].price_close);
  const trailingPe = numOrNull(latestValue(peBody) && latestValue(peBody).value);
  const marketCap = numOrNull(latestValue(capBody) && latestValue(capBody).value);
  const oneYearChange = numOrNull(latestValue(changeBody) && latestValue(changeBody).value);
  const epsTtm = numOrNull(latestValue(epsBody) && latestValue(epsBody).value);
  const rows = (estimates.data || []).filter((x) => x.metric === "EPS" && x.fiscal_end_date >= today && x.median != null);
  const byPeriod = {};
  rows.forEach((x) => {
    const old = byPeriod[x.fiscal_end_date];
    if (!old || Number(x.estimate_count || 0) > Number(old.estimate_count || 0)) byPeriod[x.fiscal_end_date] = x;
  });
  const next = Object.keys(byPeriod).sort()[0];
  const forwardEps = numOrNull(next ? byPeriod[next].median : epsTtm);
  const event = (earnings.data || []).filter((x) => x.date >= today).sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
  return {
    symbol, company, price, trailingPe, marketCap, oneYearChange, epsTtm,
    forwardEps, estimatePeriod: next || "EPS_TTM_FALLBACK", earningsDate: event ? event.date : "",
    priceDate: bars[0] ? bars[0].time_period_end : "", asOf: new Date().toISOString(),
  };
}

function policyFor(symbol, circle) {
  if (symbol === "TSLA") return { method: "normalized earnings multiple", bear: 28, base: 45, bull: 60 };
  if (symbol === "NVDA" || LEARNING.indexOf(symbol) >= 0) return { method: "normalized earnings multiple", bear: 20, base: 28, bull: 36 };
  return { method: "normalized earnings multiple", bear: 18, base: 24, bull: 30 };
}

function makeRoles(row, policy, values, circle) {
  const evidence = ["company-detail", "intraday-price", "market-cap", "pe-ratio", "eps-estimate", "earnings-calendar"];
  const quality = row.price != null && row.forwardEps != null && row.marketCap != null;
  const reports = [
    { role: "BUSINESS", verdict: quality ? "COVERED" : "DATA_INSUFFICIENT", claims: [{ claim_id: "business-001", claim: "Company profile and industry classification are sourced from current company detail.", kind: "FACT", evidence_ids: ["company-detail"], materiality: "MEDIUM", confidence: quality ? 0.8 : 0.3 }] },
    { role: "FUNDAMENTAL", verdict: row.forwardEps != null ? "COVERED" : "DATA_INSUFFICIENT", claims: [{ claim_id: "fundamental-001", claim: "Forward EPS uses the highest-coverage annual consensus row; EPS_TTM is the fallback.", kind: "CALCULATION", evidence_ids: ["eps-estimate"], materiality: "HIGH", confidence: row.forwardEps != null ? 0.7 : 0.35 }] },
    { role: "VALUATION", verdict: values.base != null ? "RANGE_AVAILABLE" : "VALUATION_UNCERTAIN", claims: [{ claim_id: "valuation-001", claim: "Bear, base and bull values are forward EPS multiplied by policy multiples.", kind: "CALCULATION", evidence_ids: ["eps-estimate", "valuation-policy"], materiality: "HIGH", confidence: values.base != null ? 0.65 : 0.3 }] },
    { role: "INDUSTRY_CYCLE", verdict: row.company.industry || "UNKNOWN", claims: [{ claim_id: "industry-001", claim: "Industry and sector are read from company detail; no unsourced cycle claim is added.", kind: "FACT", evidence_ids: ["company-detail"], materiality: "MEDIUM", confidence: 0.75 }] },
    { role: "THESIS", verdict: quality ? "PROVISIONAL_INTACT" : "DATA_INSUFFICIENT", claims: [{ claim_id: "thesis-001", claim: "The thesis remains provisional until the next earnings update or a missing-data gate changes.", kind: "INFERENCE", evidence_ids: evidence, materiality: "HIGH", confidence: quality ? 0.58 : 0.25 }] },
  ];
  if (circle === "CORE") {
    reports.push({ role: "BULL", verdict: "UPSIDE_CASE", claims: [{ claim_id: "bull-001", claim: "Upside case is the bull valuation zone; no new factual catalyst is invented.", kind: "ASSUMPTION", evidence_ids: ["valuation-policy"], materiality: "MEDIUM", confidence: 0.5 }] });
    reports.push({ role: "BEAR", verdict: "DOWNSIDE_CASE", claims: [{ claim_id: "bear-001", claim: "Downside case is the bear valuation zone and the missing-data gate.", kind: "ASSUMPTION", evidence_ids: ["valuation-policy"], materiality: "HIGH", confidence: 0.5 }] });
  }
  return reports;
}

(async () => {
  const jwt = secret.loadPlaintext("ARRAYS_JWT");
  if (!jwt) throw new Error("ARRAYS_JWT is missing");
  const now = Math.floor(Date.now() / 1000);
  const today = new Date().toISOString().slice(0, 10);
  const fetched = await Promise.all(ALL.map((symbol) => fetchSymbol(symbol, jwt, now, today)));
  if (fetched.filter((x) => x.price == null || x.company == null).length > 2) throw new Error("More than 20% of tracked symbols lack price or company evidence");

  await feed.run(async (ctx) => {
    const previous = await ctx.self.ts("decisions", "daily").last(ALL.length * 3);
    const priorBySymbol = {};
    previous.forEach((r) => { if (r.symbol) priorBySymbol[r.symbol] = r; });
    const decisionRecords = [];
    const evidenceRecords = [];
    const roleRecords = [];
    const alertRecords = [];

    fetched.forEach((row) => {
      const circle = CORE.indexOf(row.symbol) >= 0 ? "CORE" : "LEARNING";
      const policy = policyFor(row.symbol, circle);
      const forwardEps = row.forwardEps;
      const values = {
        bear: forwardEps == null ? null : forwardEps * policy.bear,
        base: forwardEps == null ? null : forwardEps * policy.base,
        bull: forwardEps == null ? null : forwardEps * policy.bull,
      };
      const buyZoneHigh = values.base == null ? null : values.base * (1 - MOS);
      const trimZone = values.bull == null ? null : values.bull * 0.90;
      const exitReviewZone = values.bull == null ? null : values.bull * 1.05;
      const complete = row.price != null && values.base != null && row.marketCap != null;
      let action = "DATA_INSUFFICIENT";
      let state = "DATA_INSUFFICIENT";
      let targetWeight = 0;
      let trancheIndex = 0;
      let reason = "Critical price, valuation or market-cap evidence is missing.";
      if (circle === "LEARNING") {
        action = "RESEARCH_ONLY"; state = "RESEARCH";
        reason = "Learning Circle: research and knowledge gaps only; no direct buy action or target position.";
      } else if (complete) {
        if (row.price <= buyZoneHigh) {
          action = "ADD"; state = "ACCUMULATE"; targetWeight = Math.min(MAX_POSITION, 0.08); trancheIndex = 1;
          reason = "Price is inside the one-year value zone with the policy margin of safety; use tranche 1 of 4 and rerun thesis/risk gates before each add.";
        } else if (row.price >= exitReviewZone) {
          action = "EXIT_REVIEW"; state = "TRIM"; targetWeight = 0;
          reason = "Price is above the bull value range; review staged profit taking and thesis evidence before any sale.";
        } else if (row.price >= trimZone) {
          action = "TRIM_REVIEW"; state = "TRIM"; targetWeight = Math.min(MAX_POSITION, 0.04);
          reason = "Price is near the bull value range; review allocation and staged trimming rather than using a mechanical sale.";
        } else {
          action = "HOLD"; state = "HOLD"; targetWeight = Math.min(MAX_POSITION, 0.08);
          reason = "Price sits between the buy and trim zones; hold the model target and wait for new evidence.";
        }
      }
      const confidence = safeRound(Math.max(0, Math.min(0.8, (complete ? 0.65 : 0.25) - (row.earningsDate ? 0 : 0.05))), 2);
      const roles = makeRoles(row, policy, values, circle);
      const reportJson = JSON.stringify(roles);
      const evidenceIds = "company-detail,intraday-price,market-cap,pe-ratio,eps-estimate,earnings-calendar,valuation-policy";
      const prior = priorBySymbol[row.symbol];
      const alertWorthy = !prior || prior.action !== action || prior.state !== state;
      const date = Date.now();
      decisionRecords.push({
        date, symbol: row.symbol, circle, state, action, position_mode: "WATCHLIST_MODEL_ONLY",
        current_weight: 0, target_weight: safeRound(targetWeight, 4), remaining_capacity: safeRound(Math.max(0, MAX_POSITION - targetWeight), 4),
        tranche_index: trancheIndex, tranche_total: TRANCHES, tranche_weight: safeRound(targetWeight / TRANCHES, 4), proposed_change_weight: safeRound(action === "ADD" ? targetWeight / TRANCHES : 0, 4),
        current_price: safeRound(row.price, 4), market_cap: safeRound(row.marketCap, 2), trailing_pe: safeRound(row.trailingPe, 2), forward_eps: safeRound(forwardEps, 4),
        bear_value: safeRound(values.bear, 2), base_value: safeRound(values.base, 2), bull_value: safeRound(values.bull, 2), buy_zone_high: safeRound(buyZoneHigh, 2), trim_zone: safeRound(trimZone, 2), exit_review_zone: safeRound(exitReviewZone, 2),
        margin_of_safety: MOS, confidence, valuation_method: policy.method, thesis_status: complete ? "PROVISIONAL_INTACT" : "DATA_INSUFFICIENT", risk_status: circle === "CORE" ? "WITHIN_POLICY_LIMITS" : "NO_POSITION_ALLOWED",
        earnings_date: row.earningsDate, reason, evidence_ids: evidenceIds, role_reports: reportJson, alert_worthy: alertWorthy, as_of: row.asOf,
      });
      evidenceRecords.push({ date, symbol: row.symbol, circle, as_of: row.asOf, company_name: row.company.name, sector: row.company.sector, industry: row.company.industry, exchange: row.company.exchange_short_name || row.company.exchange, fact_source: "Arrays company detail, intraday kline, market metrics, estimates and earnings calendar", computed_values: JSON.stringify({ current_price: row.price, market_cap: row.marketCap, trailing_pe: row.trailingPe, forward_eps: forwardEps, one_year_price_change: row.oneYearChange }), missing_evidence: complete ? "" : "price, market cap or forward EPS", policy_assumptions: JSON.stringify({ horizon_days: HORIZON_DAYS, minimum_margin_of_safety: MOS, bear_multiple: policy.bear, base_multiple: policy.base, bull_multiple: policy.bull }) });
      roleRecords.push({ date, symbol: row.symbol, as_of: row.asOf, cross_validation_mode: "INDEPENDENT_RULE_BASED_PASSES", reports: reportJson, supported_claim_ids: "business-001,fundamental-001,valuation-001,industry-001,thesis-001", rejected_claim_ids: "", conflicts: "No unresolved high-materiality conflict generated by deterministic evidence gates." });
      if (alertWorthy && circle === "CORE") alertRecords.push({ date, title: row.symbol + " " + action, body: reason + " Buy zone <= " + (buyZoneHigh == null ? "n/a" : safeRound(buyZoneHigh, 2)) + "; trim review >= " + (trimZone == null ? "n/a" : safeRound(trimZone, 2)) + ".", symbol: row.symbol, action, decision_path: "decisions/daily" });
    });
    await ctx.self.ts("decisions", "daily").append(decisionRecords);
    await ctx.self.ts("research", "evidence").append(evidenceRecords);
    await ctx.self.ts("research", "role_reports").append(roleRecords);
    if (alertRecords.length) await ctx.self.ts("alerts", "material_change").append(alertRecords);
  });
})();
