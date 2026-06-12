/**
 * Canonical test documents for SmartBiz (4 sample documents).
 * Same product line, qty, HSN, delivery charges, and GST on all TEST-* samples.
 */
(function (global) {
  const TEST_INVOICE_NO = "TEST-INV-001";
  const TEST_ALL_NO = "TEST-ALL-001";
  const TEST_DC_NO = "TEST-DC-001";
  const TEST_PRO_NO = "TEST-PRO-001";
  const TEST_DOCUMENT_NOS = [TEST_INVOICE_NO, TEST_ALL_NO, TEST_DC_NO, TEST_PRO_NO];

  /** Shared line on every test document (2 × ₹350 = ₹700 taxable). */
  const TEST_LINE_ITEMS = [
    {
      name: "SmartBiz Demo Widget",
      desc: "Canonical test product — same name, qty, rate, and HSN on all TEST-* documents",
      qty: 2,
      rate: 350,
      hsn: "8471",
      tax: "18",
      per: "Nos",
    },
  ];

  const TEST_SHIPPING = {
    items: [{ desc: "Delivery charges", amount: 10 }],
    total: 10,
  };

  /** CGST 9% + SGST 9% = 18% on (taxable + delivery). Matches editor save logic. */
  const TEST_GST_TAXES = [{ type: "GST", percent: 9, desc: "CGST 9% + SGST 9%" }];

  const companyBase = {
    companyName: "SmartBiz Demo Company",
    companyGST: "24AAAAA0000A1Z5",
    companyAddress: "123 Demo Street, Ahmedabad, Gujarat 380001",
    companyPAN: "AAAAA0000A",
    companyMobile: "+91 9876543210",
    companyEmail: "demo@smartbiz.test",
    companyLogo: null,
    placeSupply: "Gujarat",
  };

  /** Matches js/app.js history grand-total calculation. */
  function computeGrandTotal(fullData, docType) {
    let taxable = 0;
    (fullData.items || []).forEach((item) => {
      taxable += (Number(item.qty) || 0) * (Number(item.rate) || 0);
    });
    const shippingTotal =
      fullData.shipping && fullData.shipping.total ? Number(fullData.shipping.total) : 0;

    let totalTax = 0;
    if (docType !== "Quotation" && fullData.taxes && fullData.taxes.length > 0) {
      fullData.taxes.forEach((t) => {
        let percent = Number(t.percent) || 0;
        if (t.type === "GST") percent *= 2;
        totalTax += taxable * (percent / 100) + shippingTotal * (percent / 100);
      });
    }

    if (docType === "Quotation") return taxable;
    return taxable + totalTax + shippingTotal;
  }

  function cloneItems() {
    return TEST_LINE_ITEMS.map((row) => ({ ...row }));
  }

  function buildTestDoc(overrides) {
    const docType = overrides.docType;
    const fullData = {
      ...companyBase,
      items: cloneItems(),
      shipping: {
        items: TEST_SHIPPING.items.map((r) => ({ ...r })),
        total: TEST_SHIPPING.total,
      },
      taxes: overrides.includeGst ? TEST_GST_TAXES.map((t) => ({ ...t })) : [],
      signature: null,
      watermark: { enabled: true, text: "TEST" },
      isTestDocument: true,
      ...overrides.fullData,
    };
    const grandTotal = computeGrandTotal(fullData, docType).toFixed(2);
    return {
      id: overrides.id,
      invoiceNo: fullData.invoiceNo,
      invoiceDate: fullData.invoiceDate,
      dueDate: fullData.dueDate || "",
      clientName: fullData.clientName,
      grandTotal,
      docType,
      format: overrides.format,
      createdAt: overrides.createdAt,
      isTestDocument: true,
      fullData,
    };
  }

  const TEST_DOCUMENTS = [
    buildTestDoc({
      id: 100001,
      docType: "Invoice",
      format: "format1.html",
      createdAt: "2026-05-24T10:00:00.000Z",
      includeGst: true,
      fullData: {
        clientName: "Test Client – Sample Invoice",
        clientGST: "24BBBBB0000B1Z5",
        clientAddress: "456 Test Road, Surat, Gujarat 395001",
        clientPAN: "",
        clientMobile: "+91 9876543211",
        invoiceNo: TEST_INVOICE_NO,
        invoiceDate: "2026-05-24",
        dueDate: "2026-06-23",
        poNumber: "PO-TEST-001",
        poDate: "2026-05-20",
        paymentNote:
          "TEST DOCUMENT — Tax invoice with GST + delivery. Grand total ₹837.80 (≈ $10.00 in Settings → $). Safe to edit or delete.",
      },
    }),
    buildTestDoc({
      id: 100002,
      docType: "Quotation",
      format: "format2.html",
      createdAt: "2026-05-24T11:00:00.000Z",
      includeGst: true,
      fullData: {
        clientName: "Test Client – All Functions",
        clientGST: "24CCCCC0000C1Z5",
        clientAddress: "789 Practice Lane, Vadodara, Gujarat 390001",
        clientPAN: "",
        clientMobile: "+91 9876543212",
        invoiceNo: TEST_ALL_NO,
        invoiceDate: "2026-05-24",
        dueDate: "2026-06-24",
        poNumber: "PO-TEST-ALL",
        poDate: "2026-05-22",
        paymentNote:
          "TEST DOCUMENT — Quotation (same lines as invoice). History total is taxable ₹700 before GST. Use Convert Document to invoice.",
      },
    }),
    buildTestDoc({
      id: 100003,
      docType: "Delivery Challan",
      format: "format3.html",
      createdAt: "2026-05-24T12:00:00.000Z",
      includeGst: false,
      fullData: {
        clientName: "Test Client – Delivery Challan",
        clientGST: "24DDDDD0000D1Z5",
        clientAddress: "12 Warehouse Road, Rajkot, Gujarat 360001",
        clientPAN: "",
        clientMobile: "+91 9876543213",
        invoiceNo: TEST_DC_NO,
        invoiceDate: "2026-05-24",
        dueDate: "",
        poNumber: "",
        poDate: "",
        paymentNote:
          "TEST DOCUMENT — Delivery challan (no GST). Same product qty; includes ₹10 delivery in total.",
      },
    }),
    buildTestDoc({
      id: 100004,
      docType: "Proforma",
      format: "format7.html",
      createdAt: "2026-05-24T13:00:00.000Z",
      includeGst: true,
      fullData: {
        clientName: "Test Client – Proforma / Propharma",
        clientGST: "24EEEEE0000E1Z5",
        clientAddress: "88 Clinic Street, Ahmedabad, Gujarat 380015",
        clientPAN: "",
        clientMobile: "+91 9876543214",
        invoiceNo: TEST_PRO_NO,
        invoiceDate: "2026-05-24",
        dueDate: "2026-06-10",
        poNumber: "PO-PHARMA-TEST",
        poDate: "2026-05-20",
        paymentNote:
          "TEST DOCUMENT — Proforma with same GST + delivery as TEST-INV-001 (₹837.80 ≈ $10).",
      },
    }),
  ];

  function amountAttr(amountInInr) {
    const n = Number(amountInInr) || 0;
    return `data-amount="${n}" data-currency-base="INR"`;
  }

  function applyCurrency(root) {
    if (!global.SmarbizCurrency) return Promise.resolve();
    if (typeof global.SmarbizCurrency.refreshAndApply === "function") {
      return global.SmarbizCurrency.refreshAndApply(root || document);
    }
    global.SmarbizCurrency.applyAll(root || document);
    return Promise.resolve();
  }

  function isCanonicalTestHistory(history) {
    if (!Array.isArray(history) || history.length !== TEST_DOCUMENT_NOS.length) return false;
    const nos = history.map((h) => h.invoiceNo).sort();
    const expected = TEST_DOCUMENT_NOS.slice().sort();
    if (!nos.every((n, i) => n === expected[i])) return false;
    if (!history.every((h) => h.isTestDocument === true)) return false;
    const inv = history.find((h) => h.invoiceNo === TEST_INVOICE_NO);
    return !!(inv && inv.grandTotal === computeGrandTotal(inv.fullData || inv, "Invoice").toFixed(2));
  }

  /** Drop old documents; keep only the four canonical test documents. */
  function normalizeTestOnlyHistory(history) {
    const map = {};
    TEST_DOCUMENTS.forEach((t) => {
      map[t.invoiceNo] = t;
    });
    return TEST_DOCUMENT_NOS.map((no) => map[no]).filter(Boolean);
  }

  function formatDocDate(dateStr) {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function fetchServerHistory() {
    try {
      const res = await fetch("/api/history");
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data.history) ? data.history : [];
    } catch (e) {
      return null;
    }
  }

  async function pushTestDocumentsToServer() {
    try {
      const res = await fetch("/api/history/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: TEST_DOCUMENTS }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  /** Sync invoiceHistory: only the four canonical test documents (removes old junk). */
  async function syncInvoiceHistory() {
    let history = await fetchServerHistory();
    if (history === null) {
      history = JSON.parse(localStorage.getItem("invoiceHistory") || "[]");
    }
    history = normalizeTestOnlyHistory(history);
    if (!isCanonicalTestHistory(history)) {
      history = TEST_DOCUMENTS.slice();
    }
    await pushTestDocumentsToServer();
    const fromServer = await fetchServerHistory();
    if (fromServer && isCanonicalTestHistory(fromServer)) {
      history = fromServer;
    }
    localStorage.setItem("invoiceHistory", JSON.stringify(history));
    return history;
  }

  function openHistoryDocument(id) {
    const history = JSON.parse(localStorage.getItem("invoiceHistory") || "[]");
    const normalizedId = id != null ? id.toString() : "";
    const entry = history.find((h) => (h.id != null ? h.id.toString() : "") === normalizedId);
    if (!entry) {
      alert("Document not found. Try refreshing the page.");
      return;
    }
    const invoiceData = entry.fullData || entry;
    invoiceData.__historyId = entry.id;
    localStorage.setItem("invoiceData", JSON.stringify(invoiceData));
    window.location.href = "documents/formats/" + (entry.format || "format1.html");
  }

  function deleteHistoryDocument(id, onDone) {
    if (!confirm("Delete this document from history?")) return;
    const normalizedId = id != null ? id.toString() : "";
    fetch("/api/history/" + normalizedId, { method: "DELETE" })
      .catch(() => null)
      .finally(() => {
        let history = JSON.parse(localStorage.getItem("invoiceHistory") || "[]");
        history = history.filter((h) => (h.id != null ? h.id.toString() : "") !== normalizedId);
        localStorage.setItem("invoiceHistory", JSON.stringify(history));
        if (typeof onDone === "function") onDone();
      });
  }

  function renderHomeDashboard(history) {
    const counts = { Invoice: 0, Quotation: 0, "Delivery Challan": 0, Proforma: 0 };
    history.forEach((h) => {
      const t = h.docType || "Invoice";
      if (counts[t] !== undefined) counts[t]++;
      else counts.Invoice++;
    });

    const cardConfig = [
      { key: "Invoice", label: "Invoices", icon: "invoice", navigate: "invoice" },
      { key: "Quotation", label: "Quotations", icon: "quotation", navigate: "quotation" },
      { key: "Delivery Challan", label: "Delivery", icon: "receipt", navigate: "delivery" },
      { key: "Proforma", label: "Propharma", icon: "company", navigate: "propharma" },
    ];

    const grid = document.querySelector(".dashboard-grid");
    if (!grid) return;

    grid.innerHTML = cardConfig
      .map((card) => {
        const recent = history
          .filter((h) => (h.docType || "Invoice") === card.key || (card.key === "Proforma" && h.docType === "Proforma"))
          .slice(0, 3);
        const recentHtml =
          recent.length === 0
            ? '<div class="recent-item"><span class="recent-item-name" style="color:#888;">No documents yet</span></div>'
            : recent
                .map(
                  (h) =>
                    `<div class="recent-item"><span class="recent-item-name">${escapeHtml(h.clientName || h.invoiceNo)}</span><span class="recent-item-amount" ${amountAttr(h.grandTotal)}>0</span></div>`
                )
                .join("");
        const cardClasses = ['dashboard-card'];
        if (window.currentHomeHistoryFilter === card.key) {
          cardClasses.push('active');
        }
        return `
        <div class="${cardClasses.join(' ')}" data-card-type="${card.key}" onclick="window.filterHomeHistory('${card.key}')">
          <div class="card-header">
            <div class="card-icon ${card.icon}"><i class="fas fa-file-invoice"></i></div>
            <div class="card-stats">
              <div class="card-number">${counts[card.key] || 0}</div>
              <div class="card-label">${card.label}</div>
            </div>
          </div>
          <div class="card-content"><div class="recent-items">${recentHtml}</div></div>
        </div>`;
      })
      .join("");
    applyCurrency(grid);
  }

  function renderTransactionsList(history) {
    const container = document.getElementById("homeTransactionsList");
    if (!container) return;

    const filteredHistory = window.currentHomeHistoryFilter
      ? history.filter((h) => (h.docType || "Invoice") === window.currentHomeHistoryFilter)
      : history;

    if (filteredHistory.length === 0) {
      const message = window.currentHomeHistoryFilter
        ? `No ${window.currentHomeHistoryFilter.toLowerCase()} documents found.`
        : 'No saved documents yet. Use the test documents from the User Guide or create a new invoice.';
      container.innerHTML =
        `<p style="padding:24px;text-align:center;color:#666;">${escapeHtml(message)}</p>`;
      return;
    }

    container.innerHTML = filteredHistory
      .map((h) => {
        const label = `${h.clientName || "Document"} - ${h.docType || "Invoice"}`;
        const testBadge = h.isTestDocument
          ? ' <span style="font-size:0.7rem;background:#fff3cd;color:#856404;padding:2px 6px;border-radius:4px;margin-left:6px;">TEST</span>'
          : "";
        return `
        <div class="transaction-item" data-id="${h.id}">
          <span class="transaction-name">${escapeHtml(label)}${testBadge}</span>
          <div class="transaction-right">
            <span class="transaction-amount" ${amountAttr(h.grandTotal)}>0</span>
            <button class="view-btn" type="button" data-view-id="${h.id}">View</button>
            <button class="delete-btn" type="button" data-delete-id="${h.id}" aria-label="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`;
      })
      .join("");

    container.querySelectorAll("[data-view-id]").forEach((btn) => {
      btn.addEventListener("click", () => openHistoryDocument(Number(btn.getAttribute("data-view-id"))));
    });
    container.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", () =>
        deleteHistoryDocument(Number(btn.getAttribute("data-delete-id")), async () => {
          const h = await syncInvoiceHistory();
          renderTransactionsList(h);
          renderHomeDashboard(h);
          applyCurrency(document);
        })
      );
    });
    applyCurrency(container);
  }

  /**
   * Render a typed history list (sales, challans, quotations, receipts).
   * @param {Object} opts
   * @param {string[]} opts.docTypes - docType values to include
   * @param {string} opts.listId - container element id
   * @param {string} opts.itemClass - CSS class for each item
   * @param {string} opts.numberPrefix - label prefix (Invoice, Challan, etc.)
   */
  function renderTypedHistoryList(opts) {
    const list = document.getElementById(opts.listId);
    if (!list) return;

    const history = JSON.parse(localStorage.getItem("invoiceHistory") || "[]");
    const filtered = history.filter((h) => opts.docTypes.includes(h.docType || "Invoice"));

    if (filtered.length === 0) {
      list.innerHTML = `<p style="padding:24px;text-align:center;color:#666;">No ${opts.emptyLabel || "documents"} yet. Open the <a href="user-guide.html#test-documents">User Guide</a> for test document numbers.</p>`;
      if (typeof opts.onUpdate === "function") opts.onUpdate([]);
      return;
    }

    list.innerHTML = filtered
      .map((h) => {
        const fd = h.fullData || {};
        const phone = fd.clientMobile || "";
        const itemCount = (fd.items && fd.items.length) || 0;
        const testTag = h.isTestDocument
          ? '<span style="font-size:0.75rem;color:#856404;"> (Test document)</span>'
          : "";
        return `
        <div class="${opts.itemClass}" data-id="${h.id}">
          <div class="${opts.itemClass}-header">
            <div class="${opts.itemClass}-info">
              <h3>${opts.numberPrefix} #${escapeHtml(h.invoiceNo || "—")}${testTag}</h3>
              <p class="${opts.itemClass}-date">${formatDocDate(h.invoiceDate)}</p>
            </div>
            <div class="${opts.itemClass}-amount">
              <span class="amount" ${amountAttr(h.grandTotal)}>0</span>
            </div>
          </div>
          <div class="${opts.itemClass}-details">
            <p><strong>Customer:</strong> ${escapeHtml(h.clientName || "—")}</p>
            <p><strong>Items:</strong> ${itemCount} line(s)</p>
            ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
          </div>
          <div class="${opts.itemClass}-actions">
            <button class="view-btn" type="button" data-view-id="${h.id}"><i class="fas fa-eye"></i> View</button>
            <button class="download-btn" type="button" data-view-id="${h.id}"><i class="fas fa-download"></i> Download</button>
          </div>
        </div>`;
      })
      .join("");

    list.querySelectorAll("[data-view-id]").forEach((btn) => {
      btn.addEventListener("click", () => openHistoryDocument(Number(btn.getAttribute("data-view-id"))));
    });

    if (typeof opts.onUpdate === "function") opts.onUpdate(filtered);
    applyCurrency(list);
  }

  let currentHomeHistoryFilter = null;

  function updateHomeTransactionsHeader(type) {
    const header = document.getElementById('homeTransactionsHeader');
    if (!header) return;
    const label = type ? `${type} Documents` : 'All Transactions';
    header.innerHTML = `<i class="fas fa-history"></i> ${escapeHtml(label)}`;
  }

  global.filterHomeHistory = async function filterHomeHistory(type) {
    if (window.currentHomeHistoryFilter === type) {
      type = null;
    }
    window.currentHomeHistoryFilter = type;
    const history = await syncInvoiceHistory();
    renderHomeDashboard(history);
    renderTransactionsList(history);
    updateHomeTransactionsHeader(type);
    await applyCurrency(document);
  }

  async function initHomePage() {
    const history = await syncInvoiceHistory();
      window.currentHomeHistoryFilter = null; // Reset home history filter
    renderHomeDashboard(history);
    renderTransactionsList(history);
    updateHomeTransactionsHeader(null);
    await applyCurrency(document);
  }

  async function initTypedHistoryPage(opts) {
    await syncInvoiceHistory();
    renderTypedHistoryList(opts);
    await applyCurrency(document);
  }

  global.SmarbizTestDocuments = {
    TEST_DOCUMENTS,
    TEST_LINE_ITEMS,
    TEST_SHIPPING,
    TEST_GST_TAXES,
    TEST_INVOICE_NO,
    TEST_ALL_NO,
    TEST_DC_NO,
    TEST_PRO_NO,
    TEST_DOCUMENT_NOS,
    computeGrandTotal,
    syncInvoiceHistory,
    openHistoryDocument,
    renderHomeDashboard,
    renderTransactionsList,
    renderTypedHistoryList,
    initHomePage,
    initTypedHistoryPage,
  };
})(typeof window !== "undefined" ? window : global);
