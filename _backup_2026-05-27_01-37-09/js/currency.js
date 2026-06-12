/**
 * Currency display: amounts are stored in INR (₹). When you switch to $ or €,
 * values convert using today's exchange rate (refreshed hourly).
 */
(function () {
  const CURRENCY_MAP = {
    "₹": { code: "INR", symbol: "₹", locale: "en-IN" },
    INR: { code: "INR", symbol: "₹", locale: "en-IN" },
    $: { code: "USD", symbol: "$", locale: "en-US" },
    USD: { code: "USD", symbol: "$", locale: "en-US" },
    "€": { code: "EUR", symbol: "€", locale: "de-DE" },
    EUR: { code: "EUR", symbol: "€", locale: "de-DE" },
  };

  const BASE_CODE = "INR";
  const RATES_CACHE_KEY = "smarbizExchangeRates";
  const RATES_TTL_MS = 60 * 60 * 1000;

  const PRICE_SELECTORS = [
    "[data-amount]",
    ".money",
    ".product-price",
    ".item-price",
    ".menu-item-price",
    ".recent-item-amount",
    ".sale-amount",
    ".amount",
    ".summary-value",
    ".stat-amount",
    ".price-value",
    ".invoice-amount",
    ".transaction-amount",
    ".cart-item-price",
    ".total-amount",
  ];

  let ratesPromise = null;

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem("appSettings") || "{}");
    } catch (e) {
      return {};
    }
  }

  function getMeta() {
    const key = getSettings().currency || "₹";
    return CURRENCY_MAP[key] || CURRENCY_MAP["₹"];
  }

  function getSymbol() {
    return getMeta().symbol;
  }

  function getCachedRates() {
    try {
      const raw = localStorage.getItem(RATES_CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.rates || !data.fetchedAt) return null;
      if (Date.now() - data.fetchedAt > RATES_TTL_MS) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveRatesCache(rates, source) {
    const payload = {
      base: BASE_CODE,
      rates,
      fetchedAt: Date.now(),
      source: source || "api",
    };
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(payload));
    return payload;
  }

  function fallbackRates() {
    return saveRatesCache(
      {
        INR: 1,
        USD: 0.0119,
        EUR: 0.011,
      },
      "fallback"
    );
  }

  async function fetchRatesFromNetwork() {
    try {
      const res = await fetch("/api/exchange-rates");
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          return saveRatesCache(data.rates, "server");
        }
      }
    } catch (e) {
      /* try public API */
    }

    try {
      const res = await fetch("https://open.er-api.com/v6/latest/INR");
      const data = await res.json();
      if (data && data.result === "success" && data.rates) {
        return saveRatesCache(data.rates, "open.er-api");
      }
    } catch (e) {
      /* offline */
    }

    return getCachedRates() || fallbackRates();
  }

  function ensureRates() {
    const cached = getCachedRates();
    if (cached) return Promise.resolve(cached);
    if (!ratesPromise) {
      ratesPromise = fetchRatesFromNetwork().finally(() => {
        ratesPromise = null;
      });
    }
    return ratesPromise;
  }

  function convertFromInr(amountInr, targetCode) {
    const n = Number(amountInr);
    if (!Number.isFinite(n)) return 0;
    if (targetCode === BASE_CODE) return n;

    const cached = getCachedRates();
    const rate = cached && cached.rates && cached.rates[targetCode];
    if (!rate || !Number.isFinite(rate)) return n;

    return n * rate;
  }

  function parseAmount(text) {
    if (text == null || text === "") return null;
    const cleaned = String(text)
      .replace(/[₹$€]/g, "")
      .replace(/\bRs\.?\s*/gi, "")
      .replace(/,/g, "")
      .trim();
    if (!cleaned || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function format(amountInInr, options) {
    const meta = getMeta();
    const num = Number(amountInInr);
    const inrValue = Number.isFinite(num) ? num : 0;
    const value = convertFromInr(inrValue, meta.code);
    const opts = options || {};
    const min = opts.minimumFractionDigits ?? (opts.decimals != null ? opts.decimals : 0);
    const max = opts.maximumFractionDigits ?? (opts.decimals != null ? opts.decimals : 2);

    if (opts.rawNumber) {
      return value.toLocaleString(meta.locale, {
        minimumFractionDigits: min,
        maximumFractionDigits: max,
      });
    }

    try {
      return new Intl.NumberFormat(meta.locale, {
        style: "currency",
        currency: meta.code,
        minimumFractionDigits: min,
        maximumFractionDigits: max,
      }).format(value);
    } catch (e) {
      return meta.symbol + value.toFixed(max);
    }
  }

  function applyElement(el) {
    if (!el || el.closest("[data-currency-skip]")) return;

    let raw = el.getAttribute("data-amount");
    if (raw == null || raw === "") {
      const parsed = parseAmount(el.textContent);
      if (parsed == null) return;
      raw = String(parsed);
      el.setAttribute("data-amount", raw);
      el.setAttribute("data-currency-base", BASE_CODE);
    }

    const decimals = el.getAttribute("data-currency-decimals");
    const options = decimals != null ? { decimals: Number(decimals) } : {};
    el.textContent = format(Number(raw), options);
  }

  function updateCurrencyLabels() {
    const sym = getSymbol();
    document.querySelectorAll("[data-currency-label]").forEach((el) => {
      el.textContent = sym;
    });

    document.querySelectorAll("label, .form-label, .setting-label").forEach((el) => {
      if (!el.textContent) return;
      el.textContent = el.textContent.replace(/Amount\s*\([₹$€]\)/gi, `Amount (${sym})`);
      el.textContent = el.textContent.replace(/Price\s*\([₹$€]\)/gi, `Price (${sym})`);
    });
  }

  function updateFormatCurrencyPrefixes() {
    const sym = getSymbol();
    const roots = document.querySelectorAll("#invoice, .invoice, [data-invoice-root]");
    const targets = roots.length ? roots : [document.body];

    targets.forEach((root) => {
      root.querySelectorAll("p, span, th, td, h3, h4, label, strong").forEach((el) => {
        el.childNodes.forEach((node) => {
          if (node.nodeType !== 3) return;
          const text = node.textContent;
          if (/[₹$€]/.test(text)) {
            node.textContent = text.replace(/₹|\$|€/g, sym);
          }
        });
      });
    });
  }

  function scanSymbolPrices(scope) {
    const root = scope || document;
    root.querySelectorAll("td, th, span, p, h3, h4, strong, label, div.item-price, div.menu-item-price").forEach((el) => {
      if (el.closest("[data-currency-skip]")) return;
      if (el.children.length > 0) return;
      const text = (el.textContent || "").trim();
      if (!/[₹$€]/.test(text)) return;
      const parsed = parseAmount(text);
      if (parsed == null) return;
      el.setAttribute("data-amount", String(parsed));
      el.setAttribute("data-currency-base", BASE_CODE);
      el.textContent = format(parsed);
    });
  }

  function applyAll(root) {
    const scope = root || document;
    PRICE_SELECTORS.forEach((sel) => {
      scope.querySelectorAll(sel).forEach(applyElement);
    });
    scanSymbolPrices(scope);
    updateCurrencyLabels();
    updateFormatCurrencyPrefixes();
  }

  async function refreshAndApply(root) {
    await ensureRates();
    applyAll(root);
    const meta = getMeta();
    const cached = getCachedRates();
    if (cached && meta.code !== BASE_CODE && cached.rates && cached.rates[meta.code]) {
      const rate = cached.rates[meta.code];
      window.dispatchEvent(
        new CustomEvent("smarbiz-exchange-rates-ready", {
          detail: { base: BASE_CODE, target: meta.code, rate, fetchedAt: cached.fetchedAt },
        })
      );
    }
  }

  async function setCurrency(symbol) {
    const settings = getSettings();
    settings.currency = symbol;
    localStorage.setItem("appSettings", JSON.stringify(settings));
    await refreshAndApply();
    window.dispatchEvent(
      new CustomEvent("smarbiz-currency-change", { detail: { currency: symbol } })
    );
  }

  const api = {
    getSymbol,
    getMeta,
    format,
    parseAmount,
    applyAll,
    setCurrency,
    ensureRates,
    refreshAndApply,
    convertFromInr,
    getCachedRates,
    BASE_CODE,
  };

  window.SmarbizCurrency = api;
  window.money = function (n, decimals) {
    return api.format(n, decimals != null ? { decimals } : {});
  };

  function init() {
    refreshAndApply().catch(() => applyAll());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("storage", (e) => {
    if (e.key === "appSettings") refreshAndApply();
  });

  window.addEventListener("smarbiz-currency-change", () => refreshAndApply());
})();
