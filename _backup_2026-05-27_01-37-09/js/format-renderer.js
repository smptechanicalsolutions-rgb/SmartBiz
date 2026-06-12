(function () {
  const config = window.SMARBIZ_FORMAT_CONFIG || {};
  const docType = config.docType || "Invoice";
  const formatTitle = config.title || docType.toUpperCase();
  const numberLabel = config.numberLabel || "Invoice #";
  const dueLabel = config.dueLabel || "Due Date";
  const termsLabel = config.termsLabel || "Payment Instructions";
  const totalLabel = config.totalLabel || "Total";
  const styleName = config.styleName || "accent";

  function readInvoiceData() {
    try {
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get("data");
      if (dataParam) return JSON.parse(decodeURIComponent(dataParam));
    } catch (e) {
      console.error("Error parsing invoice URL data:", e);
    }

    try {
      return JSON.parse(localStorage.getItem("invoiceData") || "null");
    } catch (e) {
      console.error("Error parsing invoice storage data:", e);
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value, fallbackDays) {
    let date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      date = new Date();
      if (fallbackDays) date.setDate(date.getDate() + fallbackDays);
    }
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function money(value) {
    const amount = Number(value) || 0;
    if (window.SmarbizCurrency && typeof window.SmarbizCurrency.format === "function") {
      return window.SmarbizCurrency.format(amount);
    }
    return "Rs. " + amount.toFixed(2);
  }

  function numberToWords(n) {
    n = Math.floor(Number(n) || 0);
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    function two(num) {
      if (num < 20) return ones[num];
      const ten = Math.floor(num / 10);
      const rest = num % 10;
      return tens[ten] + (rest ? " " + ones[rest] : "");
    }
    function three(num) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      let out = "";
      if (hundred) out = ones[hundred] + " Hundred";
      if (rest) out += (out ? " " : "") + two(rest);
      return out;
    }
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    let out = "";
    if (crore) out += three(crore) + " Crore";
    if (lakh) out += (out ? " " : "") + three(lakh) + " Lakh";
    if (thousand) out += (out ? " " : "") + three(thousand) + " Thousand";
    if (n) out += (out ? " " : "") + three(n);
    return out || "Zero";
  }

  function amountInWords(value) {
    const amount = Number(value) || 0;
    const rupees = Math.floor(amount + 0.0001);
    const paise = Math.round((amount - rupees) * 100);
    let out = "Rupees " + numberToWords(rupees);
    if (paise) out += " and " + numberToWords(paise) + " Paise";
    return out + " Only";
  }

  function calculate(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const taxable = items.reduce((sum, item) => {
      return sum + (Number(item.qty) || 0) * (Number(item.rate) || 0);
    }, 0);
    const shippingTotal = data.shipping && data.shipping.total ? Number(data.shipping.total) || 0 : 0;
    const includeCharges = docType !== "Delivery Challan";
    let taxTotal = 0;
    const taxLines = [];

    if (includeCharges && Array.isArray(data.taxes)) {
      data.taxes.forEach((tax) => {
        const basePercent = Number(tax.percent) || 0;
        const percent = tax.type === "GST" ? basePercent * 2 : basePercent;
        const amount = (taxable + shippingTotal) * (percent / 100);
        taxTotal += amount;
        taxLines.push({
          label: (tax.type || "Tax") + (percent ? " " + percent + "%" : ""),
          amount,
        });
      });
    }

    const grandTotal = includeCharges ? taxable + shippingTotal + taxTotal : taxable;
    return { items, taxable, shippingTotal, taxTotal, taxLines, grandTotal };
  }

  function partyHtml(label, name, gst, address, mobile) {
    return `
      <div class="party-box">
        <div class="box-label">${label}</div>
        <div class="party-name">${escapeHtml(name || "-")}</div>
        <div>GSTIN: ${escapeHtml(gst || "-")}</div>
        <div>${escapeHtml(address || "-")}</div>
        <div>Mobile: ${escapeHtml(mobile || "-")}</div>
      </div>
    `;
  }

  function renderAccent(data, totals) {
    return `
      <div class="watermark"><div class="wm">OFFICIAL</div></div>
      <div class="doc-accent"></div>
      <header class="doc-header">
        <section>
          <h1 class="company-name">${escapeHtml(data.companyName || "Company Name")}</h1>
          <div class="muted-lines">
GSTIN: ${escapeHtml(data.companyGST || "-")}
Mobile: ${escapeHtml(data.companyMobile || "-")}${data.companyEmail ? "\nEmail: " + escapeHtml(data.companyEmail) : ""}
${escapeHtml(data.companyAddress || "")}
          </div>
        </section>
        <section class="doc-meta">
          <h2 class="doc-title">${escapeHtml(formatTitle)}</h2>
          ${metaRow(numberLabel, data.invoiceNo || "-")}
          ${metaRow("Date", formatDate(data.invoiceDate))}
          ${metaRow(dueLabel, formatDate(data.dueDate, docType === "Quotation" || docType === "Proforma" ? 2 : 30))}
          ${data.poNumber ? metaRow("PO No.", data.poNumber) : ""}
          ${data.poDate ? metaRow("PO Date", data.poDate) : ""}
        </section>
      </header>
      ${commonBody(data, totals)}
    `;
  }

  function renderPanel(data, totals) {
    return `
      <div class="watermark"><div class="wm">OFFICIAL</div></div>
      <div class="doc-shell">
        <header class="doc-header">
          <section class="doc-title-panel">
            <h2 class="doc-title">${escapeHtml(formatTitle)}</h2>
            <div class="doc-subtitle">${escapeHtml(docType)} prepared with complete buyer, seller, item, tax, and authorization details.</div>
          </section>
          <section class="company-panel">
            <h1 class="company-name">${escapeHtml(data.companyName || "Company Name")}</h1>
            <div class="muted-lines">
GSTIN: ${escapeHtml(data.companyGST || "-")}
Mobile: ${escapeHtml(data.companyMobile || "-")}${data.companyEmail ? "\nEmail: " + escapeHtml(data.companyEmail) : ""}
${escapeHtml(data.companyAddress || "")}
            </div>
          </section>
        </header>
        <section class="meta-strip">
          ${metaItem(numberLabel, data.invoiceNo || "-")}
          ${metaItem("Date", formatDate(data.invoiceDate))}
          ${metaItem(dueLabel, formatDate(data.dueDate, docType === "Quotation" || docType === "Proforma" ? 2 : 30))}
          ${metaItem(data.poNumber ? "PO No." : "Document", data.poNumber || docType)}
        </section>
        <div class="content-pad">
          ${commonBody(data, totals)}
        </div>
      </div>
    `;
  }

  function metaRow(label, value) {
    return `<div class="meta-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
  }

  function metaItem(label, value) {
    return `<div class="meta-item"><div class="meta-label">${escapeHtml(label)}</div><div class="meta-value">${escapeHtml(value)}</div></div>`;
  }

  function commonBody(data, totals) {
    const showFinancials = docType !== "Delivery Challan";
    return `
      <section class="party-grid">
        ${partyHtml("From", data.companyName, data.companyGST, data.companyAddress, data.companyMobile)}
        ${partyHtml(docType === "Delivery Challan" ? "Deliver To" : "Bill To", data.clientName, data.clientGST, data.clientAddress, data.clientMobile)}
      </section>

      <table class="items-table">
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Product / Service</th>
            <th class="rate">Rate</th>
            <th class="qty">Qty</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${totals.items.map((item, index) => itemRow(item, index)).join("")}
        </tbody>
      </table>

      <section class="bottom-grid">
        <div>
          <div class="summary-note">
            <div class="amount-words">Amount in words: ${escapeHtml(amountInWords(totals.grandTotal))}</div>
            <div><strong>${escapeHtml(termsLabel)}:</strong></div>
            <div>${escapeHtml(data.paymentNote || "Thank you for your business.")}</div>
          </div>
        </div>
        <div class="total-box">
          <div class="total-line"><span>${showFinancials ? "Taxable Amount" : "Goods Value"}</span><span>${money(totals.taxable)}</span></div>
          ${showFinancials ? totals.taxLines.map((line) => `<div class="total-line"><span>${escapeHtml(line.label)}</span><span>${money(line.amount)}</span></div>`).join("") : ""}
          ${showFinancials ? `<div class="total-line"><span>Shipping</span><span>${money(totals.shippingTotal)}</span></div>` : ""}
          <div class="total-line grand"><span>${escapeHtml(totalLabel)}</span><span>${money(totals.grandTotal)}</span></div>
        </div>
      </section>

      <section class="signature-section">
        <div class="signature-right">
          <img id="signature-image" src="" alt="Signature" style="max-width: 200px; max-height: 80px; display: none; margin: 0 auto 10px auto; object-fit: contain;" />
          <img id="invoiceStampImage" src="" alt="Stamp" style="position: absolute; display: none; opacity: 0.95" />
          <div class="signature-line"></div>
          <p class="sign-text">Authorized Signature</p>
        </div>
      </section>
    `;
  }

  function itemRow(item, index) {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const amount = qty * rate;
    const desc = item.desc ? `<span class="item-desc">${escapeHtml(item.desc)}</span>` : "";
    return `
      <tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(item.name || "Item")}${desc}</td>
        <td class="rate">${money(rate)}</td>
        <td class="qty">${qty}</td>
        <td class="amount">${money(amount)}</td>
      </tr>
    `;
  }

  function renderActions() {
    return `
      <div class="action-buttons">
        <button class="pdf-btn" onclick="downloadPDFDirect()">Download PDF</button>
        <button class="pdf-btn" onclick="shareViaOtherApps()" style="background:#2563eb">Share</button>
        <button class="pdf-btn" onclick="window.print()" style="background:#475569">Print</button>
        <button class="pdf-btn" onclick="window.open('../index.html', '_self')" style="background:#334155">Edit</button>
        <button class="pdf-btn" onclick="deleteCurrentDocument()" style="background:#111827">Delete</button>
      </div>
    `;
  }

  function deleteCurrentDocument() {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    localStorage.removeItem("invoiceData");
    alert("Document deleted successfully.");
    try {
      window.close();
    } catch (e) {
      window.location.href = "../index.html";
    }
  }

  window.deleteCurrentDocument = deleteCurrentDocument;

  document.addEventListener("DOMContentLoaded", function () {
    const data = readInvoiceData();
    if (!data) return;
    const invoice = document.getElementById("invoice");
    if (!invoice) return;

    data.docType = docType;
    const totals = calculate(data);
    invoice.innerHTML = styleName === "panel" ? renderPanel(data, totals) : renderAccent(data, totals);

    if (data.signature) {
      const signatureImg = document.getElementById("signature-image");
      if (signatureImg) {
        signatureImg.src = data.signature;
        signatureImg.style.display = "block";
      }
    }

    window.invoicePreviewData = data;
    if (window.SmarbizCurrency) window.SmarbizCurrency.applyAll(invoice);
    if (typeof applyInvoiceWatermark === "function") applyInvoiceWatermark(data);
    if (typeof initDocumentChrome === "function") initDocumentChrome();

    document.body.insertAdjacentHTML("beforeend", renderActions());
  });
})();
