// Feed-backed implementation of the Value Investing Portfolio Decisions
// contract. Financial facts come from Arrays; role scores are transparent
// rule-derived analysis, never presented as sourced market facts.
const { Feed, feedPath, makeDoc, str, num, bool } = require("@alva/feed");
const http = require("net/http");
const secret = require("secret-manager");

const CORE = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"];
const LEARNING = ["TSM", "AVGO", "AMD"];
const ALL = CORE.concat(LEARNING);
const MOS = 0.25;
const MAX_POSITION = 0.10;
const TRANCHES = 4;
const HORIZON_DAYS = 365;
const METRICS = [
  "ROIC_TTM",
  "REVENUE_GROWTH_YOY_QUARTERLY",
  "EPS_GROWTH_YOY_QUARTERLY",
  "GROSS_MARGIN_MRQ",
  "OPERATING_MARGIN_MRQ",
  "FCF_MARGIN_MRQ",
  "DEBT_TO_EQUITY_MRQ",
  "CURRENT_RATIO_MRQ",
];
const SECTOR_BENCHMARKS = {
  Technology: "XLK",
  "Communication Services": "XLC",
  "Consumer Cyclical": "XLY",
  "Consumer Defensive": "XLP",
};

const feed = new Feed({
  path: feedPath("mag7-value-decisions"),
  name: "Mag 7 Value Decisions",
  description: "Live company evidence, transparent multi-role review, valuation zones and staged position sizing for the Mag 7 value-investing watchlist.",
});

feed.def("decisions", {
  daily: makeDoc("Daily Decisions", "One record per tracked security and refresh", [
    str("symbol"), str("circle"), str("state"), str("action"),
    str("position_mode"), num("current_weight"), num("target_weight"),
    num("remaining_capacity"), num("tranche_index"), num("tranche_total"),
    num("tranche_weight"), num("proposed_change_weight"),
    num("current_price"), num("market_cap"), num("trailing_pe"),
    num("forward_eps"), str("forward_eps_method"), num("estimate_coverage"),
    num("bear_value"), num("base_value"), num("bull_value"),
    num("buy_zone_high"), num("trim_zone"), num("exit_review_zone"),
    num("margin_of_safety"), num("confidence"), str("confidence_breakdown"),
    str("valuation_method"), str("thesis_status"), str("risk_status"),
    str("earnings_date"), str("reason"), str("decisive_evidence"),
    str("contrary_evidence"), str("evidence_ids"), str("role_reports"),
    str("data_classification"), bool("alert_worthy"), str("as_of")
  ]),
});

feed.def("research", {
  evidence: makeDoc("Evidence Packet", "Timestamped factual, computed and policy inputs", [
    str("symbol"), str("circle"), str("as_of"), str("company_name"),
    str("sector"), str("industry"), str("exchange"), str("fact_source"),
    str("facts"), str("computed_values"), str("missing_evidence"),
    str("policy_assumptions"), str("source_lineage")
  ]),
  role_reports: makeDoc("Role Reports", "Independent transparent specialist passes", [
    str("symbol"), str("as_of"), str("cross_validation_mode"), str("reports"),
    str("supported_claim_ids"), str("rejected_claim_ids"), str("conflicts"),
    str("bull_bear_review"), str("confidence_method"), str("decision_trace"),
    str("implementation_boundary")
  ]),
});

feed.def("alerts", {
  material_change: makeDoc("Material Decision Change", "New state, action, valuation or risk change", [
    str("title"), str("body"), str("symbol"), str("action"), str("decision_path")
  ]),
});

function numOrNull(x) { return typeof x === "number" && Number.isFinite(x) ? x : null; }
function safeRound(x, n) {
  if (x == null || !Number.isFinite(x)) return null;
  const p = Math.pow(10, n == null ? 2 : n);
  return Math.round(x * p) / p;
}
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function average(values) {
  const usable = values.filter((x) => x != null && Number.isFinite(x));
  return usable.length ? usable.reduce((a, b) => a + b, 0) / usable.length : null;
}
function linear(value, low, high) {
  return value == null || high === low ? null : clamp((value - low) / (high - low), 0, 1);
}
function reverse(value, good, bad) {
  return value == null || bad === good ? null : 1 - clamp((value - good) / (bad - good), 0, 1);
}
function stance(score01) { return score01 == null ? 0 : safeRound(score01 * 200 - 100, 1); }
function pctText(value) { return value == null ? "n/a" : safeRound(value * 100, 1) + "%"; }
function moneyText(value) { return value == null ? "n/a" : "$" + safeRound(value, 2); }
function normalizeReturn(value) { return value == null ? null : Math.abs(value) > 3 ? value / 100 : value; }
function latestValue(body) {
  const rows = (body && body.data) || [];
  const vals = rows.flatMap((x) => x.values || []).filter((x) => x && x.value != null);
  vals.sort((a, b) => Number(b.observed_at || 0) - Number(a.observed_at || 0));
  return vals[0] || null;
}
function q(path, params) {
  const base = "https://data-tools.prd.space.id";
  return base + path + "?" + Object.keys(params)
    .filter((k) => params[k] != null && params[k] !== "")
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
}
async function getJson(url, jwt) {
  const resp = await http.fetch(url, { headers: { Authorization: "Bearer " + jwt } });
  if (!resp.ok) throw new Error("Arrays request failed " + resp.status + " " + url);
  const body = await resp.json();
  if (body && body.success === false) throw new Error("Arrays returned success=false for " + url);
  return body;
}
function bestEstimateRows(body, today) {
  const rows = ((body && body.data) || []).filter((x) => x.metric === "EPS" && x.fiscal_end_date >= today && x.median != null);
  const best = {};
  rows.forEach((x) => {
    const old = best[x.fiscal_end_date];
    if (!old || String(x.estimate_date || "") > String(old.estimate_date || "") ||
        (String(x.estimate_date || "") === String(old.estimate_date || "") && Number(x.estimate_count || 0) > Number(old.estimate_count || 0))) {
      best[x.fiscal_end_date] = x;
    }
  });
  return Object.keys(best).sort().map((key) => best[key]);
}
function metricFact(metric, body) {
  const value = latestValue(body);
  return {
    evidence_id: "metric-" + metric.toLowerCase().replace(/_/g, "-"),
    metric,
    value: numOrNull(value && value.value),
    observed_at: value && value.observed_at ? Number(value.observed_at) : null,
    period: value && value.period ? value.period : "",
    fiscal_year: value && value.fiscal_year ? String(value.fiscal_year) : "",
    source: "Arrays financial-metrics",
    kind: "FACT",
  };
}

async function fetchSymbol(symbol, jwt, now, today) {
  const detail = await getJson(q("/api/v1/stocks/company/detail", { symbol }), jwt);
  const company = (detail.data || [])[0];
  if (!company || !company.is_listed || company.is_etf || company.is_fund) throw new Error("Invalid listed company detail for " + symbol);
  const benchmark = SECTOR_BENCHMARKS[company.sector] || "SPY";
  const commonStart = now - 800 * 86400;
  const requests = [
    getJson(q("/api/v1/stocks/kline", { symbol, start_time: now - 5 * 86400, end_time: now, interval: "1h", session: "RTH", limit: 100 }), jwt),
    getJson(q("/api/v1/stocks/market-metrics", { symbol, indicator: "PE_RATIO", interval: "1d", start_time: now - 30 * 86400, end_time: now }), jwt),
    getJson(q("/api/v1/stocks/market-metrics", { symbol, indicator: "MARKET_CAP", interval: "1d", start_time: now - 30 * 86400, end_time: now }), jwt),
    getJson(q("/api/v1/stocks/market-metrics", { symbol, indicator: "PRICE_CHANGE_1y", interval: "1d", start_time: now - 30 * 86400, end_time: now }), jwt),
    getJson(q("/api/v1/stocks/market-metrics", { symbol: benchmark, indicator: "PRICE_CHANGE_1y", interval: "1d", start_time: now - 30 * 86400, end_time: now }), jwt),
    getJson(q("/api/v1/stocks/financial-metrics", { symbol, metric: "EPS_TTM", start_time: commonStart, end_time: now }), jwt),
    getJson(q("/api/v1/stocks/estimates-guidance", { symbol, metrics: "EPS", type: "estimate", period_type: "quarterly", limit: 100 }), jwt),
    getJson(q("/api/v1/stocks/estimates-guidance", { symbol, metrics: "EPS", type: "estimate", period_type: "annual", limit: 100 }), jwt),
    getJson(q("/api/v1/stocks/earnings-calendar", { symbol, start_time: now, end_time: now + HORIZON_DAYS * 86400 }), jwt),
  ].concat(METRICS.map((metric) => getJson(q("/api/v1/stocks/financial-metrics", { symbol, metric, start_time: commonStart, end_time: now }), jwt)));
  const bodies = await Promise.all(requests);
  const kline = bodies[0];
  const bars = (kline.data || []).slice().sort((a, b) => Number(b.time_open || 0) - Number(a.time_open || 0));
  const price = numOrNull(bars[0] && bars[0].price_close);
  const trailingPe = numOrNull(latestValue(bodies[1]) && latestValue(bodies[1]).value);
  const marketCap = numOrNull(latestValue(bodies[2]) && latestValue(bodies[2]).value);
  const rawOneYearChange = numOrNull(latestValue(bodies[3]) && latestValue(bodies[3]).value);
  const rawBenchmarkChange = numOrNull(latestValue(bodies[4]) && latestValue(bodies[4]).value);
  const oneYearChange = normalizeReturn(rawOneYearChange);
  const benchmarkChange = normalizeReturn(rawBenchmarkChange);
  const epsTtm = numOrNull(latestValue(bodies[5]) && latestValue(bodies[5]).value);
  const quarterly = bestEstimateRows(bodies[6], today).slice(0, 4);
  const annual = bestEstimateRows(bodies[7], today);
  let forwardEps = null;
  let forwardEpsMethod = "MISSING";
  let estimateCoverage = 0;
  let estimateDispersion = null;
  let estimatePeriods = [];
  if (quarterly.length === 4) {
    forwardEps = quarterly.reduce((sum, row) => sum + Number(row.median), 0);
    forwardEpsMethod = "NTM_4Q_MEDIAN_CONSENSUS";
    estimateCoverage = average(quarterly.map((row) => Number(row.estimate_count || 0))) || 0;
    estimateDispersion = average(quarterly.map((row) => row.standard_deviation == null || !row.median ? null : Math.abs(Number(row.standard_deviation) / Number(row.median))));
    estimatePeriods = quarterly.map((row) => row.fiscal_end_date);
  } else if (annual.length) {
    forwardEps = numOrNull(Number(annual[0].median));
    forwardEpsMethod = "NEXT_FY_MEDIAN_CONSENSUS";
    estimateCoverage = Number(annual[0].estimate_count || 0);
    estimateDispersion = annual[0].standard_deviation == null || !annual[0].median ? null : Math.abs(Number(annual[0].standard_deviation) / Number(annual[0].median));
    estimatePeriods = [annual[0].fiscal_end_date];
  } else if (epsTtm != null) {
    forwardEps = epsTtm;
    forwardEpsMethod = "EPS_TTM_FALLBACK";
  }
  const earnings = bodies[8];
  const event = (earnings.data || []).filter((x) => x.date >= today).sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
  const metricFacts = {};
  METRICS.forEach((metric, index) => { metricFacts[metric] = metricFact(metric, bodies[9 + index]); });
  return {
    symbol, company, benchmark, price, trailingPe, marketCap, oneYearChange,
    benchmarkChange, rawOneYearChange, rawBenchmarkChange, epsTtm, forwardEps, forwardEpsMethod, estimateCoverage,
    estimateDispersion, estimatePeriods, metrics: metricFacts,
    earningsDate: event ? event.date : "", priceDate: bars[0] ? bars[0].time_period_end : "",
    asOf: new Date().toISOString(),
  };
}

function policyFor(symbol) {
  if (symbol === "TSLA") return { method: "normalized earnings multiple", bear: 28, base: 45, bull: 60 };
  if (symbol === "NVDA" || LEARNING.indexOf(symbol) >= 0) return { method: "normalized earnings multiple", bear: 20, base: 28, bull: 36 };
  return { method: "normalized earnings multiple", bear: 18, base: 24, bull: 30 };
}
function metricValue(row, name) { return row.metrics[name] ? row.metrics[name].value : null; }
function evidenceFreshness(row, now) {
  const ages = METRICS.map((name) => row.metrics[name] && row.metrics[name].observed_at)
    .filter((value) => value).map((value) => (now - value) / 86400);
  if (!ages.length) return 0;
  return average(ages.map((age) => age <= 120 ? 1 : age <= 240 ? 0.75 : age <= 400 ? 0.5 : 0.25));
}
function makeRole(role, score, confidence, verdict, rationale, evidenceIds, formula, missing, orientation) {
  const claimId = role.toLowerCase().replace(/_/g, "-") + "-001";
  return {
    role,
    score: safeRound(score, 1),
    confidence: safeRound(confidence, 2),
    verdict,
    rationale,
    evidence_ids: evidenceIds,
    score_formula: formula,
    missing_evidence: missing,
    orientation: orientation || "STANCE",
    source_kind: "RULE_DERIVED_FROM_ARRAYS",
    claims: [{ claim_id: claimId, claim: rationale, kind: "CALCULATION", evidence_ids: evidenceIds, materiality: "HIGH", confidence: safeRound(confidence, 2) }],
  };
}
function roleVerdict(score, positive, neutral, negative) {
  return score >= 30 ? positive : score <= -30 ? negative : neutral;
}
function makeRoles(row, policy, values, now) {
  const revenueGrowth = metricValue(row, "REVENUE_GROWTH_YOY_QUARTERLY");
  const epsGrowth = metricValue(row, "EPS_GROWTH_YOY_QUARTERLY");
  const grossMargin = metricValue(row, "GROSS_MARGIN_MRQ");
  const opMargin = metricValue(row, "OPERATING_MARGIN_MRQ");
  const roic = metricValue(row, "ROIC_TTM");
  const fcfMargin = metricValue(row, "FCF_MARGIN_MRQ");
  const debtEquity = metricValue(row, "DEBT_TO_EQUITY_MRQ");
  const currentRatio = metricValue(row, "CURRENT_RATIO_MRQ");
  const freshness = evidenceFreshness(row, now);
  const confidenceFor = (valuesNeeded, cap) => safeRound(Math.min(cap == null ? 0.9 : cap, (valuesNeeded.filter((x) => x != null).length / valuesNeeded.length) * (0.7 + 0.3 * freshness)), 2);
  const metricId = (name) => "metric-" + name.toLowerCase().replace(/_/g, "-");
  const business01 = average([linear(revenueGrowth, -0.10, 0.30), linear(grossMargin, 0.10, 0.70), linear(fcfMargin, -0.05, 0.30)]);
  const businessScore = stance(business01);
  const businessIds = [metricId("REVENUE_GROWTH_YOY_QUARTERLY"), metricId("GROSS_MARGIN_MRQ"), metricId("FCF_MARGIN_MRQ")];
  const business = makeRole("BUSINESS", businessScore, confidenceFor([revenueGrowth, grossMargin, fcfMargin], 0.9), roleVerdict(businessScore, "DURABLE_ECONOMICS", "MIXED_ECONOMICS", "WEAK_ECONOMICS"), "营收同比 " + pctText(revenueGrowth) + "，毛利率 " + pctText(grossMargin) + "，自由现金流率 " + pctText(fcfMargin) + "。", businessIds, "equal_weight(linear revenue growth -10%..30%, gross margin 10%..70%, FCF margin -5%..30%)", businessIds.filter((id, i) => [revenueGrowth, grossMargin, fcfMargin][i] == null), "QUALITY");
  const fundamental01 = average([linear(roic, 0, 0.30), linear(opMargin, 0, 0.35), linear(fcfMargin, -0.05, 0.30), linear(epsGrowth, -0.15, 0.35)]);
  const fundamentalScore = stance(fundamental01);
  const fundamentalIds = [metricId("ROIC_TTM"), metricId("OPERATING_MARGIN_MRQ"), metricId("FCF_MARGIN_MRQ"), metricId("EPS_GROWTH_YOY_QUARTERLY")];
  const fundamental = makeRole("FUNDAMENTAL", fundamentalScore, confidenceFor([roic, opMargin, fcfMargin, epsGrowth], 0.9), roleVerdict(fundamentalScore, "FUNDAMENTALS_SUPPORT", "FUNDAMENTALS_MIXED", "FUNDAMENTALS_WEAK"), "ROIC " + pctText(roic) + "，经营利润率 " + pctText(opMargin) + "，EPS 同比 " + pctText(epsGrowth) + "。", fundamentalIds, "equal_weight(linear ROIC 0%..30%, operating margin 0%..35%, FCF margin -5%..30%, EPS growth -15%..35%)", fundamentalIds.filter((id, i) => [roic, opMargin, fcfMargin, epsGrowth][i] == null), "QUALITY");
  const baseDiscount = row.price && values.base ? values.base / row.price - 1 : null;
  const peRelative = row.trailingPe == null ? null : policy.base / row.trailingPe - 1;
  const coverage01 = linear(row.estimateCoverage, 0, 25);
  const valuation01 = average([linear(baseDiscount, -0.50, 0.50), linear(peRelative, -0.60, 0.60), coverage01]);
  const valuationScore = stance(valuation01);
  const valuationIds = ["intraday-price", "eps-estimate", "pe-ratio", "valuation-policy"];
  const valuation = makeRole("VALUATION", valuationScore, confidenceFor([row.price, row.forwardEps, row.trailingPe, row.estimateCoverage], row.forwardEpsMethod === "EPS_TTM_FALLBACK" ? 0.55 : 0.85), roleVerdict(valuationScore, "VALUATION_SUPPORT", "VALUATION_NEUTRAL", "VALUATION_STRETCHED"), "当前价 " + moneyText(row.price) + "，Base " + moneyText(values.base) + "，较 Base " + pctText(baseDiscount) + "；预期覆盖约 " + safeRound(row.estimateCoverage, 0) + " 位分析师。", valuationIds, "equal_weight(linear Base discount -50%..50%, policy multiple / trailing PE -60%..60%, analyst coverage 0..25)", [row.price, row.forwardEps, row.trailingPe].map((x, i) => x == null ? valuationIds[i] : null).filter(Boolean), "VALUATION");
  const relativeReturn = row.oneYearChange == null || row.benchmarkChange == null ? null : row.oneYearChange - row.benchmarkChange;
  const industry01 = average([linear(relativeReturn, -0.30, 0.30), linear(revenueGrowth, -0.10, 0.30)]);
  const industryScore = stance(industry01);
  const industryIds = ["price-change-1y", "benchmark-price-change-1y", metricId("REVENUE_GROWTH_YOY_QUARTERLY"), "company-detail"];
  const industry = makeRole("INDUSTRY_CYCLE", industryScore, confidenceFor([relativeReturn, revenueGrowth], 0.65), roleVerdict(industryScore, "CYCLE_SUPPORT", "CYCLE_MIXED", "CYCLE_HEADWIND"), row.company.industry + "：近一年相对 " + row.benchmark + " 的表现差为 " + pctText(relativeReturn) + "，公司营收同比 " + pctText(revenueGrowth) + "。", industryIds, "equal_weight(linear company minus sector-ETF 1Y return -30%..30%, revenue growth -10%..30%); proxy, not peer-industry research", [relativeReturn, revenueGrowth].map((x, i) => x == null ? industryIds[i] : null).filter(Boolean), "CYCLE_PROXY");
  const thesis01 = average([linear(revenueGrowth, -0.10, 0.30), linear(roic, 0, 0.30), linear(fcfMargin, -0.05, 0.30), linear(baseDiscount, -0.50, 0.50), reverse(debtEquity, 0, 3)]);
  const thesisScore = stance(thesis01);
  const thesisIds = [metricId("REVENUE_GROWTH_YOY_QUARTERLY"), metricId("ROIC_TTM"), metricId("FCF_MARGIN_MRQ"), "intraday-price", "eps-estimate", metricId("DEBT_TO_EQUITY_MRQ")];
  const thesis = makeRole("THESIS", thesisScore, confidenceFor([revenueGrowth, roic, fcfMargin, baseDiscount, debtEquity], 0.8), roleVerdict(thesisScore, "THESIS_SUPPORTED", "THESIS_MIXED", "THESIS_AT_RISK"), "增长、资本回报、现金流、估值和杠杆共同给出逻辑分数；当前最弱项不会被其他角色投票覆盖。", thesisIds, "equal_weight(revenue growth, ROIC, FCF margin, Base discount, inverse debt/equity)", thesisIds.filter((id, i) => [revenueGrowth, roic, fcfMargin, baseDiscount, debtEquity][i] == null), "THESIS");
  const bull01 = average([linear(values.bull && row.price ? values.bull / row.price - 1 : null, -0.20, 0.80), linear(revenueGrowth, -0.10, 0.30), linear(roic, 0, 0.30)]);
  const bullScore = stance(bull01);
  const bullIds = ["intraday-price", "eps-estimate", "valuation-policy", metricId("REVENUE_GROWTH_YOY_QUARTERLY"), metricId("ROIC_TTM")];
  const bull = makeRole("BULL", bullScore, confidenceFor([values.bull, row.price, revenueGrowth, roic], 0.8), roleVerdict(bullScore, "UPSIDE_CASE_STRONG", "UPSIDE_CASE_MIXED", "UPSIDE_CASE_WEAK"), "Bull 情景相对当前价的空间为 " + pctText(values.bull && row.price ? values.bull / row.price - 1 : null) + "；增长 " + pctText(revenueGrowth) + "，ROIC " + pctText(roic) + "。", bullIds, "equal_weight(linear Bull upside -20%..80%, revenue growth -10%..30%, ROIC 0%..30%)", [], "UPSIDE");
  const downsideGap = values.bear && row.price ? row.price / values.bear - 1 : null;
  const debtRisk = debtEquity == null ? null : 1 - reverse(debtEquity, 0, 3);
  const growthRisk = revenueGrowth == null ? null : 1 - linear(revenueGrowth, -0.10, 0.30);
  const bearRisk01 = average([linear(downsideGap, -0.20, 1.00), debtRisk, growthRisk]);
  const bearScore = bearRisk01 == null ? 0 : safeRound(-bearRisk01 * 100, 1);
  const bearIds = ["intraday-price", "eps-estimate", "valuation-policy", metricId("DEBT_TO_EQUITY_MRQ"), metricId("REVENUE_GROWTH_YOY_QUARTERLY")];
  const bear = makeRole("BEAR", bearScore, confidenceFor([downsideGap, debtEquity, revenueGrowth], 0.8), bearScore <= -60 ? "DOWNSIDE_CASE_STRONG" : bearScore <= -30 ? "DOWNSIDE_CASE_MATERIAL" : "DOWNSIDE_CASE_LIMITED", "当前价高于 Bear 值 " + pctText(downsideGap) + "；负债权益比 " + (debtEquity == null ? "n/a" : safeRound(debtEquity, 2)) + "，营收同比 " + pctText(revenueGrowth) + "。", bearIds, "negative mean(linear price/Bear gap -20%..100%, debt risk 0..3x, inverse revenue growth -10%..30%)", [], "DOWNSIDE_RISK");
  const safety01 = average([reverse(debtEquity, 0, 3), linear(fcfMargin, -0.05, 0.30), linear(currentRatio, 0.7, 2.0)]);
  const thesisRiskScore = stance(safety01);
  const riskIds = [metricId("DEBT_TO_EQUITY_MRQ"), metricId("FCF_MARGIN_MRQ"), metricId("CURRENT_RATIO_MRQ")];
  const thesisRisk = makeRole("THESIS_RISK", thesisRiskScore, confidenceFor([debtEquity, fcfMargin, currentRatio], 0.85), thesisRiskScore <= -40 ? "RISK_VETO_REVIEW" : thesisRiskScore >= 30 ? "NO_HARD_VETO" : "RISK_WATCH", "偿债与现金流检查：负债权益比 " + (debtEquity == null ? "n/a" : safeRound(debtEquity, 2)) + "，自由现金流率 " + pctText(fcfMargin) + "，流动比率 " + (currentRatio == null ? "n/a" : safeRound(currentRatio, 2)) + "。", riskIds, "equal_weight(inverse debt/equity 0..3x, FCF margin -5%..30%, current ratio 0.7..2.0)", riskIds.filter((id, i) => [debtEquity, fcfMargin, currentRatio][i] == null), "SAFETY");
  const portfolioRisk = makeRole("PORTFOLIO_RISK", 0, 0.35, "PORTFOLIO_DATA_MISSING", "未连接真实持仓、现金、成本和相关性；只能检查单标的 10% 模型上限，不能证明组合风险合格。", ["portfolio-policy"], "no portfolio score without holdings; neutral stance with confidence cap", ["actual-holdings", "cash", "cost-basis", "portfolio-correlation"], "PORTFOLIO_LIMIT");
  const position = makeRole("POSITION", 0, 0.40, "MODEL_CAPACITY_ONLY", "仓位结果只表示观察清单模型：单标的上限 10%，分 4 批；没有真实账户权重时不生成个人下单金额。", ["position-policy"], "model-only policy; no personal position score", ["actual-holdings", "cash"], "POSITION_POLICY");
  return [business, fundamental, valuation, industry, thesis, bull, bear, thesisRisk, portfolioRisk, position];
}
function confidenceBundle(row, roles, now) {
  const required = [row.price, row.marketCap, row.trailingPe, row.forwardEps].concat(METRICS.map((name) => metricValue(row, name)));
  const coverage = required.filter((x) => x != null).length / required.length;
  const freshness = evidenceFreshness(row, now);
  const critical = roles.filter((role) => ["BUSINESS", "FUNDAMENTAL", "VALUATION", "THESIS", "THESIS_RISK"].indexOf(role.role) >= 0);
  const roleEvidence = critical.length ? Math.min.apply(null, critical.map((role) => role.confidence)) : 0;
  const stanceValues = critical.map((role) => Number(role.score || 0));
  const avgStance = average(stanceValues) || 0;
  const dispersion = Math.sqrt(average(stanceValues.map((value) => Math.pow(value - avgStance, 2))) || 0);
  const agreement = clamp(1 - dispersion / 100, 0, 1);
  const raw = 0.35 * coverage + 0.20 * freshness + 0.25 * roleEvidence + 0.20 * agreement;
  const estimateCap = row.forwardEpsMethod === "EPS_TTM_FALLBACK" ? 0.55 : row.estimateCoverage < 4 ? 0.65 : 0.85;
  const finalCap = Math.min(0.85, roleEvidence, estimateCap, 0.70);
  return {
    data_coverage: safeRound(coverage, 2),
    freshness: safeRound(freshness, 2),
    critical_role_evidence: safeRound(roleEvidence, 2),
    role_agreement: safeRound(agreement, 2),
    raw_weighted_score: safeRound(raw, 2),
    final_cap: safeRound(finalCap, 2),
    final_confidence: safeRound(Math.min(raw, finalCap), 2),
    formula: "min(35% coverage + 20% freshness + 25% weakest critical-role evidence + 20% role agreement, weakest critical role, estimate-method cap, 70% portfolio-data cap)",
    meaning: "Evidence quality for this decision, not the probability of making money.",
  };
}
function strongest(roles, direction) {
  const usable = roles.filter((role) => ["BULL", "BEAR", "PORTFOLIO_RISK", "POSITION"].indexOf(role.role) < 0);
  usable.sort((a, b) => direction > 0 ? b.score - a.score : a.score - b.score);
  return usable[0];
}

(async () => {
  const jwt = secret.loadPlaintext("ARRAYS_JWT");
  if (!jwt) throw new Error("ARRAYS_JWT is missing");
  const now = Math.floor(Date.now() / 1000);
  const today = new Date().toISOString().slice(0, 10);
  const fetched = [];
  for (const symbol of ALL) fetched.push(await fetchSymbol(symbol, jwt, now, today));
  if (fetched.filter((x) => x.price == null || x.company == null).length > 2) throw new Error("More than 20% of tracked symbols lack price or company evidence");

  await feed.run(async (ctx) => {
    const runDate = Date.now();
    const previous = await ctx.self.ts("decisions", "daily").last(ALL.length * 3);
    const priorBySymbol = {};
    previous.forEach((record) => { if (record.symbol) priorBySymbol[record.symbol] = record; });
    const decisionRecords = [];
    const evidenceRecords = [];
    const roleRecords = [];
    const alertRecords = [];

    fetched.forEach((row) => {
      const circle = CORE.indexOf(row.symbol) >= 0 ? "CORE" : "LEARNING";
      const policy = policyFor(row.symbol);
      const values = {
        bear: row.forwardEps == null ? null : row.forwardEps * policy.bear,
        base: row.forwardEps == null ? null : row.forwardEps * policy.base,
        bull: row.forwardEps == null ? null : row.forwardEps * policy.bull,
      };
      const buyZoneHigh = values.base == null ? null : values.base * (1 - MOS);
      const trimZone = values.bull == null ? null : values.bull * 0.90;
      const exitReviewZone = values.bull == null ? null : values.bull * 1.05;
      const roles = makeRoles(row, policy, values, now);
      const confidence = confidenceBundle(row, roles, now);
      const thesisRisk = roles.find((role) => role.role === "THESIS_RISK");
      const fundamental = roles.find((role) => role.role === "FUNDAMENTAL");
      const bull = roles.find((role) => role.role === "BULL");
      const bear = roles.find((role) => role.role === "BEAR");
      const complete = row.price != null && values.base != null && row.marketCap != null;
      const hardRiskReview = thesisRisk.score <= -40 || fundamental.score <= -50;
      let action = "DATA_INSUFFICIENT";
      let state = "DATA_INSUFFICIENT";
      let targetWeight = 0;
      let trancheIndex = 0;
      let riskStatus = hardRiskReview ? "RISK_VETO_REVIEW" : "WITHIN_MODEL_LIMITS";
      if (circle === "LEARNING") {
        action = "RESEARCH_ONLY"; state = "RESEARCH"; riskStatus = "NO_POSITION_ALLOWED";
      } else if (complete) {
        if (row.price >= exitReviewZone) {
          action = "EXIT_REVIEW"; state = "TRIM";
        } else if (row.price >= trimZone) {
          action = "TRIM_REVIEW"; state = "TRIM"; targetWeight = 0.04;
        } else if (row.price <= buyZoneHigh && confidence.final_confidence >= 0.60 && !hardRiskReview) {
          action = "ADD"; state = "ACCUMULATE"; targetWeight = 0.08; trancheIndex = 1;
        } else {
          action = "HOLD"; state = hardRiskReview ? "RESEARCH" : "HOLD"; targetWeight = hardRiskReview ? 0 : 0.08;
        }
      }
      const support = strongest(roles, 1);
      const contrary = strongest(roles, -1);
      let reason = "关键价格、估值或市值证据缺失，不能形成动作。";
      if (circle === "LEARNING") reason = "标的位于 Learning Circle，只输出研究结论，不生成买入或目标仓位。";
      else if (action === "ADD") reason = "价格进入安全边际买入区，关键风险未触发否决，证据置信度达到加仓复核门槛；只建议第 1/4 批模型仓位。";
      else if (action === "EXIT_REVIEW") reason = "价格高于 Bull 估值区间，估值风险主导本次退出复核；仍需结合真实成本和税务后人工确认。";
      else if (action === "TRIM_REVIEW") reason = "价格接近 Bull 估值区间，风险收益比收窄，进入分批减仓复核。";
      else if (hardRiskReview) reason = "价格没有触发卖出线，但基本面或逻辑风险触发否决；暂停加仓并要求补充研究。";
      else if (complete) reason = "价格位于买入与减仓复核线之间，当前证据不足以改变模型仓位，继续持有观察。";
      const conflict = bull.score >= 30 && bear.score <= -30;
      const conflicts = conflict ? [{ conflict_id: "bull-bear-001", status: "UNRESOLVED", summary: "真实证据同时支持上行情景与下行风险；最终动作由估值区间、硬风险和置信度闸门裁决。", bull_score: bull.score, bear_score: bear.score }] : [];
      const bullBear = {
        bull: { score: bull.score, verdict: bull.verdict, rationale: bull.rationale, evidence_ids: bull.evidence_ids },
        bear: { score: bear.score, verdict: bear.verdict, rationale: bear.rationale, evidence_ids: bear.evidence_ids },
        bull_challenge: "Bear 必须解释为何增长、ROIC 或 Bull 估值空间不能抵消下行风险。",
        bear_challenge: "Bull 必须解释为何价格相对 Bear 值的缺口、杠杆或增长放缓不会形成价值陷阱。",
        conflict_status: conflict ? "UNRESOLVED" : "NO_MATERIAL_TWO_SIDED_CONFLICT",
      };
      const missing = [];
      METRICS.forEach((name) => { if (metricValue(row, name) == null) missing.push("metric-" + name.toLowerCase().replace(/_/g, "-")); });
      if (!row.earningsDate) missing.push("next-earnings-date");
      missing.push("actual-holdings", "cash", "cost-basis", "portfolio-correlation", "qualitative-primary-source-review");
      const evidenceIds = ["company-detail", "intraday-price", "market-cap", "pe-ratio", "price-change-1y", "benchmark-price-change-1y", "eps-estimate", "earnings-calendar", "valuation-policy"].concat(METRICS.map((name) => "metric-" + name.toLowerCase().replace(/_/g, "-")));
      const reportJson = JSON.stringify(roles);
      const prior = priorBySymbol[row.symbol];
      const alertWorthy = !prior || prior.action !== action || prior.state !== state || Math.abs(Number(prior.confidence || 0) - confidence.final_confidence) >= 0.10;
      const date = runDate;
      decisionRecords.push({
        date, symbol: row.symbol, circle, state, action, position_mode: "WATCHLIST_MODEL_ONLY",
        current_weight: 0, target_weight: safeRound(targetWeight, 4), remaining_capacity: safeRound(Math.max(0, MAX_POSITION - targetWeight), 4),
        tranche_index: trancheIndex, tranche_total: TRANCHES, tranche_weight: safeRound(targetWeight / TRANCHES, 4), proposed_change_weight: safeRound(action === "ADD" ? targetWeight / TRANCHES : 0, 4),
        current_price: safeRound(row.price, 4), market_cap: safeRound(row.marketCap, 2), trailing_pe: safeRound(row.trailingPe, 2),
        forward_eps: safeRound(row.forwardEps, 4), forward_eps_method: row.forwardEpsMethod, estimate_coverage: safeRound(row.estimateCoverage, 1),
        bear_value: safeRound(values.bear, 2), base_value: safeRound(values.base, 2), bull_value: safeRound(values.bull, 2),
        buy_zone_high: safeRound(buyZoneHigh, 2), trim_zone: safeRound(trimZone, 2), exit_review_zone: safeRound(exitReviewZone, 2),
        margin_of_safety: MOS, confidence: confidence.final_confidence, confidence_breakdown: JSON.stringify(confidence),
        valuation_method: policy.method, thesis_status: hardRiskReview ? "RISK_REVIEW" : "PROVISIONAL_INTACT", risk_status: riskStatus,
        earnings_date: row.earningsDate, reason, decisive_evidence: support.role + " " + support.score + ": " + support.rationale,
        contrary_evidence: contrary.role + " " + contrary.score + ": " + contrary.rationale,
        evidence_ids: evidenceIds.join(","), role_reports: reportJson,
        data_classification: JSON.stringify({ facts: "Arrays", calculations: "deterministic formulas", role_scores: "rule-derived analysis", policy: "user strategy assumptions" }),
        alert_worthy: alertWorthy, as_of: row.asOf,
      });
      evidenceRecords.push({
        date, symbol: row.symbol, circle, as_of: row.asOf, company_name: row.company.name,
        sector: row.company.sector, industry: row.company.industry, exchange: row.company.exchange_short_name || row.company.exchange,
        fact_source: "Arrays company detail, intraday kline, market metrics, financial metrics, consensus estimates and earnings calendar",
        facts: JSON.stringify({ metrics: row.metrics, benchmark: row.benchmark, company_one_year_change_raw: row.rawOneYearChange, benchmark_one_year_change_raw: row.rawBenchmarkChange, return_unit_normalization: "Arrays PRICE_CHANGE_1y points > 3 are divided by 100 for calculations", company_one_year_change: row.oneYearChange, benchmark_one_year_change: row.benchmarkChange, estimate_periods: row.estimatePeriods, estimate_dispersion: row.estimateDispersion }),
        computed_values: JSON.stringify({ current_price: row.price, market_cap: row.marketCap, trailing_pe: row.trailingPe, forward_eps: row.forwardEps, forward_eps_method: row.forwardEpsMethod, estimate_coverage: row.estimateCoverage, bear_value: values.bear, base_value: values.base, bull_value: values.bull }),
        missing_evidence: JSON.stringify(missing),
        policy_assumptions: JSON.stringify({ horizon_days: HORIZON_DAYS, minimum_margin_of_safety: MOS, bear_multiple: policy.bear, base_multiple: policy.base, bull_multiple: policy.bull, max_model_position: MAX_POSITION, tranches: TRANCHES, sector_benchmark: row.benchmark }),
        source_lineage: JSON.stringify({ fact_ids: evidenceIds.filter((id) => id !== "valuation-policy"), computed_ids: ["forward-eps", "bear-value", "base-value", "bull-value", "role-scores", "confidence"], policy_ids: ["valuation-policy", "position-policy", "portfolio-policy"] }),
      });
      roleRecords.push({
        date, symbol: row.symbol, as_of: row.asOf, cross_validation_mode: "INDEPENDENT_RULE_BASED_PASSES",
        reports: reportJson, supported_claim_ids: roles.map((role) => role.claims[0].claim_id).join(","), rejected_claim_ids: "",
        conflicts: JSON.stringify(conflicts), bull_bear_review: JSON.stringify(bullBear), confidence_method: JSON.stringify(confidence),
        decision_trace: JSON.stringify({ action, state, reason, decisive_role: support.role, contrary_role: contrary.role, hard_risk_review: hardRiskReview, valuation_zone: action }),
        implementation_boundary: "Each role is an isolated deterministic pass over one shared Arrays evidence packet. Scores are computed analysis, not market facts or profit probabilities. Open-ended LLM debate is unavailable because the current Alva Agent runtime has no registered model provider.",
      });
      if (alertWorthy && circle === "CORE") alertRecords.push({ date, title: row.symbol + " " + action, body: reason + " 买入线 " + moneyText(buyZoneHigh) + "；减仓复核线 " + moneyText(trimZone) + "。", symbol: row.symbol, action, decision_path: "decisions/daily" });
    });
    await ctx.self.ts("decisions", "daily").append(decisionRecords);
    await ctx.self.ts("research", "evidence").append(evidenceRecords);
    await ctx.self.ts("research", "role_reports").append(roleRecords);
    if (alertRecords.length) await ctx.self.ts("alerts", "material_change").append(alertRecords);
  });
})();
