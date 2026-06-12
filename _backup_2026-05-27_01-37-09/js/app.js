function previewInvoice() {

  const invoiceData = {
    companyName: companyName.value,
    companyGST: companyGST.value,
    companyAddress: companyAddress.value,
    companyPAN: document.getElementById("companyPAN") ? document.getElementById("companyPAN").value : "",

    clientName: clientName.value,
    clientGST: clientGST.value,
    clientAddress: clientAddress.value,
    clientPAN: document.getElementById("clientPAN") ? document.getElementById("clientPAN").value : "",
    
    invoiceNo: invoiceNo.value,
    invoiceDate: invoiceDate.value,
    dueDate: document.getElementById("dueDate") ? document.getElementById("dueDate").value : "",
    placeSupply: placeSupply.value,
    poNumber: document.getElementById("poNumber") ? document.getElementById("poNumber").value : "",
    poDate: document.getElementById("poDate") ? document.getElementById("poDate").value : "",

    companyMobile: document.getElementById("companyMobile").value,
    companyEmail: document.getElementById("companyEmail") ? document.getElementById("companyEmail").value : "",
    companyLogo: localStorage.getItem("companyLogo") || null,
    clientMobile: document.getElementById("clientMobile").value,

    // collect all item rows
    items: (function() {
      const rows = document.querySelectorAll('#itemsContainer .item-row');
      const list = [];
      rows.forEach(r => {
        const nameEl = r.querySelector('.item-name');
        const descEl = r.querySelector('.item-desc');
        const qtyEl = r.querySelector('.item-qty');
        const rateEl = r.querySelector('.item-rate');
        const hsnEl = r.querySelector('.item-hsn');
        const taxEl = r.querySelector('.item-tax');
        const perEl = r.querySelector('.item-per');
        if (!nameEl) return;
        const name = nameEl.value.trim();
        const desc = descEl ? descEl.value.trim() : '';
        const qty = Number(qtyEl ? qtyEl.value : 0) || 0;
        const rate = Number(rateEl ? rateEl.value : 0) || 0;
        const hsn = hsnEl ? hsnEl.value.trim() : '';
        const tax = taxEl ? taxEl.value.trim() : '';
        const per = perEl ? perEl.value.trim() : 'Nos';
        if (name || qty || rate || desc) {
          list.push({ name, desc, qty, rate, hsn, tax, per });
        }
      });
      return list;
    })(),

    paymentNote: (function(){
      const noteEl = document.getElementById('paymentNoteSingle');
      if (noteEl && noteEl.value.trim()) {
        return noteEl.value.trim();
      }
      return '';
    })(),
    shipping: (function(){
      const rows = document.querySelectorAll('#shippingContainer .shipping-row');
      const list = [];
      let total = 0;
      rows.forEach(r => {
        const desc = (r.querySelector('.shipping-desc') || {value: ''}).value.trim();
        const amt = Number((r.querySelector('.shipping-amount') || {value: 0}).value) || 0;
        if (desc || amt) list.push({ desc, amount: amt });
        total += amt;
      });
      return { items: list, total };
    })()
    ,
    taxes: (function(){
      const rows = document.querySelectorAll('#taxContainer .tax-row');
      const list = [];
      rows.forEach(r => {
        const type = (r.querySelector('.tax-type')||{}).value || '';
        const percent = Number((r.querySelector('.tax-percent')||{}).value) || 0;
        const desc = (r.querySelector('.tax-desc')||{}).value.trim() || '';
        if (type && percent) list.push({ type, percent, desc });
      });
      return list;
    })(),
    
    signature: (function(){
      const canvas = document.getElementById('signature-pad');
      if (canvas && window.signaturePad && !window.signaturePad.isEmpty()) {
        return window.signaturePad.toDataURL('image/png');
      }
      return null;
    })(),

    watermark: (function () {
      let settings = {};
      try {
        settings = JSON.parse(localStorage.getItem("appSettings") || "{}");
      } catch (e) {
        settings = {};
      }
      const wmEnableEl = document.getElementById("watermarkEnable");
      const wmTextEl = document.getElementById("watermarkText");
      const enabled =
        !!(wmEnableEl && wmEnableEl.checked) || !!settings.watermarkEnable;
      const text = (
        (wmTextEl && wmTextEl.value) ||
        settings.watermarkText ||
        ""
      )
        .toString()
        .trim();
      return { enabled, text: text || (enabled ? "OFFICIAL" : "") };
    })()
  };

  localStorage.setItem("invoiceData", JSON.stringify(invoiceData));

  // Automatically save to history
  saveInvoiceToHistory(invoiceData);

  const formatSelect = document.getElementById("format");
  const selectedFormat = formatSelect ? formatSelect.value : "format1.html";
  
  // Pass data as URL parameter to format
  const dataParam = encodeURIComponent(JSON.stringify(invoiceData));
  window.open(`formats/${selectedFormat}?data=${dataParam}`, "_blank");
}

// Save invoice to history (called automatically on preview)
function saveInvoiceToHistory(invoiceData) {
  try {
    if (!invoiceData) {
      invoiceData = JSON.parse(localStorage.getItem("invoiceData"));
    }
    
    if (!invoiceData) {
      return;
    }

    // Determine document type based on format
    const formatSelect = document.getElementById("format");
    const selectedFormat = formatSelect ? formatSelect.value : "format1.html";
    let docType = "Invoice";
    if (
      selectedFormat === "format3.html" ||
      selectedFormat === "format4.html" ||
      selectedFormat === "format11.html" ||
      selectedFormat === "format15.html" ||
      selectedFormat === "format16.html"
    ) {
      docType = "Delivery Challan";
    } else if (
      selectedFormat === "format5.html" ||
      selectedFormat === "format6.html" ||
      selectedFormat === "format12.html" ||
      selectedFormat === "format17.html" ||
      selectedFormat === "format18.html"
    ) {
      docType = "Quotation";
    } else if (
      selectedFormat === "format7.html" ||
      selectedFormat === "format8.html" ||
      selectedFormat === "format9.html" ||
      selectedFormat === "format19.html" ||
      selectedFormat === "format20.html"
    ) {
      docType = "Proforma";
    }

    // Calculate grand total
    let taxable = 0;
    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach(item => {
        const amount = (item.qty || 0) * (item.rate || 0);
        taxable += amount;
      });
    }

    // Calculate shipping total (used for tax calc)
    const shippingTotal = (invoiceData.shipping && invoiceData.shipping.total)
      ? Number(invoiceData.shipping.total)
      : 0;

    // Calculate tax
    let totalTax = 0;
    if (invoiceData.taxes && invoiceData.taxes.length > 0) {
      invoiceData.taxes.forEach(t => {
        let percent = Number(t.percent) || 0;
        // For GST (CGST + SGST), the rate represents each component, so total GST = 2 × percent
        if (t.type === 'GST') {
          percent = percent * 2; // Double the rate for combined CGST + SGST
        }
        // Apply tax to both products and shipping
        const productTax = taxable * (percent / 100);
        const shippingTax = shippingTotal * (percent / 100);
        totalTax += productTax + shippingTax;
      });
    }

    // Calculate grand total (for quotations, only product total)
    const isQuotation = docType === "Quotation";
    const grandTotal = isQuotation ? taxable : (taxable + totalTax + shippingTotal);

    // Reuse existing id (keeps server/file history and delete consistent)
    let historyId = Date.now();
    try {
      const existingHistory = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
      const existing = existingHistory.find(
        (h) =>
          (h.invoiceNo || "") === (invoiceData.invoiceNo || "") &&
          (h.docType || "") === docType &&
          (h.format || selectedFormat) === selectedFormat &&
          (invoiceData.invoiceNo || "").trim() !== ""
      );
      if (existing && existing.id) historyId = existing.id;
    } catch (e) {
      // ignore
    }

    // Create history entry
    const historyEntry = {
      id: historyId,
      invoiceNo: invoiceData.invoiceNo || '',
      invoiceDate: invoiceData.invoiceDate || '',
      dueDate: invoiceData.dueDate || '',
      clientName: invoiceData.clientName || '',
      grandTotal: grandTotal.toFixed(2),
      docType: docType,
      format: selectedFormat,
      createdAt: new Date().toISOString(),
      // Store full invoice data for viewing later
      fullData: invoiceData
    };

    // Attach history id to invoiceData so templates can delete current document
    try {
      invoiceData.__historyId = historyEntry.id;
      localStorage.setItem("invoiceData", JSON.stringify(invoiceData));
    } catch (e) {
      // ignore
    }

    // Save to file via API (primary storage)
    saveHistoryToFile(historyEntry).then(() => {
      // Also update localStorage as backup
      let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
      
      // Check if invoice already exists (by invoice number and type)
      const existingIndex = history.findIndex(
        (inv) =>
          (inv.invoiceNo || "") === (invoiceData.invoiceNo || "") &&
          (inv.docType || "") === docType &&
          (inv.format || selectedFormat) === selectedFormat &&
          (invoiceData.invoiceNo || "").trim() !== ""
      );

      if (existingIndex !== -1) {
        history[existingIndex] = historyEntry;
      } else {
        history.push(historyEntry);
      }

      history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      localStorage.setItem("invoiceHistory", JSON.stringify(history));
      console.log(`${docType} saved to history file`);
    }).catch(error => {
      let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];

      const existingIndex = history.findIndex(
        (inv) =>
          (inv.invoiceNo || "") === (invoiceData.invoiceNo || "") &&
          (inv.docType || "") === docType &&
          (inv.format || selectedFormat) === selectedFormat &&
          (invoiceData.invoiceNo || "").trim() !== ""
      );
      
      if (existingIndex !== -1) {
        history[existingIndex] = historyEntry;
      } else {
        history.push(historyEntry);
      }
      
      history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      localStorage.setItem("invoiceHistory", JSON.stringify(history));
      console.warn("Failed to save to file, saved to localStorage only:", error);
    });
  } catch (error) {
    console.error("Error saving to history:", error);
  }
}

// Save history entry to file via API
async function saveHistoryToFile(historyEntry) {
  try {
    // Try to save via API
    const response = await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyEntry)
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

function addPaymentRow() {
  const container = document.getElementById('paymentContainer');
  const row = document.createElement('div');
  row.className = 'mb-2 payment-row';
  row.innerHTML = `
    <textarea class="form-control payment-note mb-2" placeholder="Bank / UPI / Payment Terms"></textarea>
    <button type="button" class="btn btn-danger" onclick="removePaymentRow(this)">-</button>
  `;
  container.appendChild(row);
}

function removePaymentRow(btn) {
  const row = btn && btn.closest('.payment-row');
  const container = document.getElementById('paymentContainer');
  if (!row || !container) return;
  // if last row, clear instead of removing
  if (container.querySelectorAll('.payment-row').length <= 1) {
    row.querySelectorAll('textarea').forEach(t => t.value = '');
    return;
  }
  row.remove();
}

function addShippingRow() {
  const container = document.getElementById('shippingContainer');
  const row = document.createElement('div');
  row.className = 'row shipping-row mb-2';
  row.innerHTML = `
    <div class="col-10 col-md-8 mb-2 mb-md-0">
      <input class="form-control shipping-desc" placeholder="Shipping description (optional)">
    </div>
    <div class="col-10 col-md-3 mb-2 mb-md-0">
      <input type="number" class="form-control shipping-amount" placeholder="Amount">
    </div>
    <div class="col-2 col-md-1 d-flex align-items-center justify-content-center">
      <button type="button" class="btn btn-danger" onclick="removeShippingRow(this)">-</button>
    </div>
  `;
  container.appendChild(row);
}

function removeShippingRow(btn) {
  const row = btn && btn.closest('.shipping-row');
  const container = document.getElementById('shippingContainer');
  if (!row || !container) return;
  // if last row, clear instead of removing
  if (container.querySelectorAll('.shipping-row').length <= 1) {
    row.querySelectorAll('input').forEach(i => i.value = '');
    return;
  }
  row.remove();
}

function saveShippingCharge() {
  try {
    const descEl = document.querySelector('#shippingContainer .shipping-desc');
    const amtEl = document.querySelector('#shippingContainer .shipping-amount');
    const desc = descEl ? descEl.value.trim() : '';
    const total = amtEl ? (Number(amtEl.value) || 0) : 0;
    const obj = { desc, total };
    localStorage.setItem('savedShipping', JSON.stringify(obj));
    alert('Shipping charge saved.');
  } catch (e) { console.error(e); alert('Failed to save shipping'); }
}

function loadSavedShippingCharge() {
  try {
    const saved = JSON.parse(localStorage.getItem('savedShipping') || 'null');
    if (!saved) { alert('No saved shipping charge found'); return; }
    const descEl = document.querySelector('#shippingContainer .shipping-desc');
    const amtEl = document.querySelector('#shippingContainer .shipping-amount');
    if (descEl) descEl.value = saved.desc || '';
    if (amtEl) amtEl.value = saved.total != null ? saved.total : '';
    alert('Saved shipping loaded into form');
  } catch (e) { console.error(e); alert('Failed to load saved shipping'); }
}

function removeSavedShippingCharge() {
  try {
    localStorage.removeItem('savedShipping');
    const descEl = document.querySelector('#shippingContainer .shipping-desc');
    const amtEl = document.querySelector('#shippingContainer .shipping-amount');
    if (descEl) descEl.value = '';
    if (amtEl) amtEl.value = '';
    alert('Saved shipping removed');
  } catch (e) { console.error(e); alert('Failed to remove saved shipping'); }
}

function savePaymentInstruction() {
  try {
    const noteEl = document.getElementById('paymentNoteSingle');
    const text = noteEl ? (noteEl.value || '').trim() : '';
    localStorage.setItem('savedPayment', JSON.stringify({ text }));
    alert('Payment instruction saved.');
  } catch (e) { console.error(e); alert('Failed to save payment'); }
}

function loadSavedPaymentInstruction() {
  try {
    const saved = JSON.parse(localStorage.getItem('savedPayment') || 'null');
    if (!saved) { alert('No saved payment instruction found'); return; }
    const noteEl = document.getElementById('paymentNoteSingle');
    if (noteEl) noteEl.value = saved.text || '';
    alert('Saved payment instruction loaded');
  } catch (e) { console.error(e); alert('Failed to load saved payment'); }
}

function removeSavedPaymentInstruction() {
  try {
    localStorage.removeItem('savedPayment');
    const noteEl = document.getElementById('paymentNoteSingle');
    if (noteEl) noteEl.value = '';
    alert('Saved payment instruction removed');
  } catch (e) { console.error(e); alert('Failed to remove saved payment'); }
}

// Open the manage modal to edit/delete saved payment text
function manageSavedPaymentInstruction() {
  const modal = document.getElementById('managePaymentModal');
  const ta = document.getElementById('managePaymentTextarea');
  const noteEl = document.getElementById('paymentNoteSingle');
  let existing = '';
  try {
    const saved = JSON.parse(localStorage.getItem('savedPayment') || 'null');
    if (saved && saved.text) existing = saved.text;
  } catch (e) {
    existing = localStorage.getItem('savedPayment') || '';
  }
  // if no saved, fallback to current field
  if (!existing && noteEl) existing = noteEl.value || '';
  if (ta) ta.value = existing;
  if (modal) modal.style.display = 'block';
}

function closeManagePaymentModal() {
  const modal = document.getElementById('managePaymentModal');
  if (modal) modal.style.display = 'none';
}

function savePaymentFromModal() {
  const ta = document.getElementById('managePaymentTextarea');
  const noteEl = document.getElementById('paymentNoteSingle');
  const val = ta ? ta.value.trim() : '';
  try {
    localStorage.setItem('savedPayment', JSON.stringify({ text: val }));
    if (noteEl) noteEl.value = val;
    alert('Saved payment instruction updated.');
  } catch (e) {
    console.error(e);
    alert('Failed to save payment.');
  }
  closeManagePaymentModal();
}

function deleteSavedPaymentFromModal() {
  if (!confirm('Delete saved payment instruction?')) return;
  try {
    localStorage.removeItem('savedPayment');
    const noteEl = document.getElementById('paymentNoteSingle');
    if (noteEl) noteEl.value = '';
    alert('Saved payment instruction deleted.');
  } catch (e) { console.error(e); alert('Failed to delete saved payment.'); }
  closeManagePaymentModal();
}

// Load invoiceData from localStorage into form for editing
function loadInvoiceData(){
  const data = JSON.parse(localStorage.getItem('invoiceData'));
  if(!data) return;

  // Check if company data exists and expand section
  const hasCompanyData = data.companyName || data.companyGST || data.companyAddress || data.companyMobile || data.companyEmail;
  if (hasCompanyData) {
    const companySection = document.getElementById('companyFormSection');
    const companyBtn = document.getElementById('toggleCompanyBtn');
    if (companySection && companyBtn) {
      companySection.style.display = 'block';
      companyBtn.textContent = 'Hide Company';
      companyBtn.classList.remove('btn-primary');
      companyBtn.classList.add('btn-secondary');
    }
  }

  // basic fields
  if(window.companyName) companyName.value = data.companyName || '';
  if(window.companyGST) companyGST.value = data.companyGST || '';
  if(window.companyAddress) companyAddress.value = data.companyAddress || '';
  if(document.getElementById('companyMobile')) document.getElementById('companyMobile').value = data.companyMobile || '';
  if(document.getElementById('companyEmail')) document.getElementById('companyEmail').value = data.companyEmail || '';
  
  // Load logo if exists
  if(data.companyLogo && document.getElementById('logoPreviewImg')) {
    document.getElementById('logoPreviewImg').src = data.companyLogo;
    document.getElementById('logoPreview').style.display = 'block';
  } else if(localStorage.getItem('companyLogo') && document.getElementById('logoPreviewImg')) {
    document.getElementById('logoPreviewImg').src = localStorage.getItem('companyLogo');
    document.getElementById('logoPreview').style.display = 'block';
  }

  // Check if client data exists and expand section
  const hasClientData = data.clientName || data.clientGST || data.clientAddress || data.clientMobile;
  if (hasClientData) {
    const clientSection = document.getElementById('clientFormSection');
    const clientBtn = document.getElementById('toggleClientBtn');
    if (clientSection && clientBtn) {
      clientSection.style.display = 'block';
      clientBtn.textContent = 'Hide Client';
      clientBtn.classList.remove('btn-primary');
      clientBtn.classList.add('btn-secondary');
    }
  }

  if(window.clientName) clientName.value = data.clientName || '';
  if(window.clientGST) clientGST.value = data.clientGST || '';
  if(window.clientAddress) clientAddress.value = data.clientAddress || '';
  if(document.getElementById('clientMobile')) document.getElementById('clientMobile').value = data.clientMobile || '';

  // Check if invoice info data exists and expand section
  const hasInvoiceInfoData = data.invoiceNo || data.invoiceDate || data.dueDate || data.placeSupply || data.poNumber || data.poDate;
  if (hasInvoiceInfoData) {
    const invoiceInfoSection = document.getElementById('invoiceInfoFormSection');
    const invoiceInfoBtn = document.getElementById('toggleInvoiceInfoBtn');
    if (invoiceInfoSection && invoiceInfoBtn) {
      invoiceInfoSection.style.display = 'block';
      invoiceInfoBtn.textContent = 'Hide Invoice Info';
      invoiceInfoBtn.classList.remove('btn-primary');
      invoiceInfoBtn.classList.add('btn-secondary');
    }
  }

  if(window.invoiceNo) invoiceNo.value = data.invoiceNo || '';
  if(window.invoiceDate) invoiceDate.value = data.invoiceDate || '';
  // Prefill shipping: prefer invoice data, otherwise use saved shipping
  try {
    const descEl = document.querySelector('#shippingContainer .shipping-desc');
    const amtEl = document.querySelector('#shippingContainer .shipping-amount');
    if (data.shipping && data.shipping.items && data.shipping.items.length > 0) {
      const first = data.shipping.items[0];
      if (descEl) descEl.value = first.desc || '';
      if (amtEl) amtEl.value = first.amount != null ? first.amount : (data.shipping.total || '');
    } else {
      const saved = JSON.parse(localStorage.getItem('savedShipping') || 'null');
      if (saved) {
        if (descEl) descEl.value = saved.desc || '';
        if (amtEl) amtEl.value = saved.total != null ? saved.total : '';
      }
    }
  } catch (e) { /* ignore */ }
  if(document.getElementById('dueDate')) {
    const dueDateEl = document.getElementById('dueDate');
    const formatSelect = document.getElementById('format');
    const selectedFormat = formatSelect ? formatSelect.value : '';
    const isQuotation = selectedFormat === 'format5.html' || selectedFormat === 'format6.html' || selectedFormat === 'format12.html' || selectedFormat === 'format17.html' || selectedFormat === 'format18.html';
    
    if (data.dueDate) {
      dueDateEl.value = data.dueDate;
    } else {
      // Leave due date empty by default (optional). Do not auto-fill.
      // If the input already has a value (user typed), keep it.
    }
  }
  if(window.placeSupply) placeSupply.value = data.placeSupply || '';
  if(document.getElementById('poNumber')) document.getElementById('poNumber').value = data.poNumber || '';
  if(document.getElementById('poDate')) document.getElementById('poDate').value = data.poDate || '';

  // Check if product data exists and expand section
  const hasProductData = Array.isArray(data.items) && data.items.length > 0;
  if (hasProductData) {
    const productSection = document.getElementById('productFormSection');
    const productBtn = document.getElementById('toggleProductBtn');
    if (productSection && productBtn) {
      productSection.style.display = 'block';
      productBtn.textContent = 'Hide Product';
      productBtn.classList.remove('btn-primary');
      productBtn.classList.add('btn-secondary');
    }
  }

  // items
  const itemsContainer = document.getElementById('itemsContainer');
  if(itemsContainer){
    itemsContainer.innerHTML = '';
    if(Array.isArray(data.items) && data.items.length){
      data.items.forEach(it => {
        const row = document.createElement('div');
        row.className = 'row item-row mb-2';
        row.innerHTML = `
          <div class="col-12 col-md-4 mb-2 mb-md-0">
            <input class="form-control item-name" placeholder="Product Name" value="${(it.name||'').replace(/"/g,'&quot;')}">
          </div>
          <div class="col-12 col-md-8 mb-2 mb-md-0">
            <input class="form-control item-desc" placeholder="Product Description (Optional)" value="${((it.desc||'').replace(/"/g,'&quot;'))}">
          </div>
          <div class="col-6 col-md-4 mb-2 mb-md-0">
            <input type="number" class="form-control item-qty" placeholder="Qty" value="${it.qty||0}">
          </div>
          <div class="col-4 col-md-4 mb-2 mb-md-0">
            <input type="number" class="form-control item-rate" placeholder="Rate" value="${it.rate||0}">
          </div>
          <div class="col-2 col-md-4 d-flex align-items-center justify-content-center">
            <button type="button" class="btn btn-danger" onclick="removeItemRow(this)">-</button>
          </div>
        `;
        itemsContainer.appendChild(row);
      });
    } else {
      addItemRow();
    }
  }

  // payment notes
  const paymentContainer = document.getElementById('paymentContainer');
  if(paymentContainer){
    paymentContainer.innerHTML = '';
    // single payment instructions textarea (preserve newlines)
    const row = document.createElement('div');
    row.className = 'mb-2 payment-row';
    row.innerHTML = `<textarea class="form-control payment-note mb-2" placeholder="Bank / UPI / Payment Terms">${(data.paymentNote||'').replace(/</g,'&lt;')}</textarea><button type="button" class="btn btn-danger" onclick="removePaymentRow(this)">-</button>`;
    paymentContainer.appendChild(row);
  }

  // shipping
  const shippingContainer = document.getElementById('shippingContainer');
  if(shippingContainer){
    shippingContainer.innerHTML = '';
    if(data.shipping && Array.isArray(data.shipping.items) && data.shipping.items.length){
      data.shipping.items.forEach(s => {
        const row = document.createElement('div');
        row.className = 'row shipping-row mb-2';
        row.innerHTML = `
          <div class="col-10 col-md-8 mb-2 mb-md-0"><input class="form-control shipping-desc" value="${(s.desc||'').replace(/"/g,'&quot;')}"></div>
          <div class="col-10 col-md-3 mb-2 mb-md-0"><input type="number" class="form-control shipping-amount" value="${s.amount||0}"></div>
          <div class="col-2 col-md-1 d-flex align-items-center justify-content-center"><button type="button" class="btn btn-danger" onclick="removeShippingRow(this)">-</button></div>
        `;
        shippingContainer.appendChild(row);
      });
    } else {
      addShippingRow();
    }
  }

  // Check if tax data exists and expand section
  const hasTaxData = Array.isArray(data.taxes) && data.taxes.length > 0;
  if (hasTaxData) {
    const taxesSection = document.getElementById('taxesFormSection');
    const taxesBtn = document.getElementById('toggleTaxesBtn');
    if (taxesSection && taxesBtn) {
      taxesSection.style.display = 'block';
      taxesBtn.textContent = 'Hide Taxes';
      taxesBtn.classList.remove('btn-primary');
      taxesBtn.classList.add('btn-secondary');
    }
  }

  // taxes
  const taxContainer = document.getElementById('taxContainer');
  if(taxContainer){
    taxContainer.innerHTML = '';
    if(Array.isArray(data.taxes) && data.taxes.length){
      data.taxes.forEach(t => {
        const row = document.createElement('div');
        row.className = 'row tax-row mb-2';
        row.innerHTML = `
          <div class="col-12 col-md-4 mb-2 mb-md-0">
            <select class="form-select tax-type">
              <option value="GST" ${t.type==='GST'?'selected':''}>GST (CGST + SGST)</option>
              <option value="GST" ${t.type==='CGST'?'selected':''}>GST (CGST + SGST)</option>
              <option value="GST" ${t.type==='SGST'?'selected':''}>GST (CGST + SGST)</option>
              <option value="IGST" ${t.type==='IGST'?'selected':''}>IGST</option>
            </select>
          </div>
          <div class="col-12 col-md-4 mb-2 mb-md-0">
            <input type="number" class="form-control tax-percent" value="${t.percent||0}">
          </div>
          <div class="col-10 col-md-3 mb-2 mb-md-0">
            <input class="form-control tax-desc" value="${(t.desc||'').replace(/"/g,'&quot;')}">
          </div>
          <div class="col-2 col-md-1 d-flex align-items-center justify-content-center"><button type="button" class="btn btn-danger" onclick="removeTaxRow(this)">-</button></div>
        `;
        taxContainer.appendChild(row);
      });
    } else {
      addTaxRow();
    }
  }

  // signature - load after a short delay to ensure signature pad is initialized
  if (data.signature) {
    setTimeout(function() {
      if (window.signaturePad) {
        window.signaturePad.fromDataURL(data.signature);
      }
    }, 100);
  }

  // Watermark
  try {
    const wmEnableEl = document.getElementById('watermarkEnable');
    const wmTextEl = document.getElementById('watermarkText');
    const wmSection = document.getElementById('watermarkFormSection');
    const wmBtn = document.getElementById('toggleWatermarkBtn');
    if (wmEnableEl && wmTextEl) {
      let settings = {};
      try {
        settings = JSON.parse(localStorage.getItem("appSettings") || "{}");
      } catch (e) {
        settings = {};
      }
      const wm = data.watermark || {};
      const enabled = !!wm.enabled || !!settings.watermarkEnable;
      const text = (wm.text || settings.watermarkText || "").toString().trim();
      wmEnableEl.checked = enabled;
      wmTextEl.value = text || (enabled ? "OFFICIAL" : "");
      const hasWm = !!wmEnableEl.checked || (wmTextEl.value || '').trim();
      if (hasWm && wmSection && wmBtn) {
        wmSection.style.display = 'block';
        wmBtn.textContent = 'Hide Watermark';
        wmBtn.classList.remove('btn-primary');
        wmBtn.classList.add('btn-secondary');
      }
    }
  } catch (e) {
    // ignore watermark load errors
  }
}

function toggleWatermarkSection() {
  const section = document.getElementById('watermarkFormSection');
  const btn = document.getElementById('toggleWatermarkBtn');
  if (!section || !btn) return;
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    btn.textContent = 'Hide Watermark';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    section.style.display = 'none';
    btn.textContent = 'Add Watermark';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

// Initialize signature pad
function initSignaturePad() {
  const canvas = document.getElementById('signature-pad');
  if (canvas) {
    // Set canvas size based on container
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 500;
    const height = 200;
    
    // Set actual canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Initialize SignaturePad
    window.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3
    });
    
    // Make canvas responsive
    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = rect.width || 500;
      const height = 200;
      
      // Save current signature data
      const data = window.signaturePad ? window.signaturePad.toData() : null;
      
      // Resize canvas
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      
      // Reinitialize signature pad
      window.signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3
      });
      
      // Restore signature if it existed
      if (data && data.length > 0) {
        window.signaturePad.fromData(data);
      }
    }
    
    // Resize on window resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 250);
    });
  }
}

// Clear signature function
function clearSignature() {
  if (window.signaturePad) {
    window.signaturePad.clear();
  }
}

// Load saved company data on page load (if only company is saved, not full invoice)
function loadSavedCompanyOnStart() {
  // Only load company if there's no invoice data to avoid overwriting
  const invoiceData = localStorage.getItem('invoiceData');
  if (!invoiceData) {
    // Check if there's a default company saved
    const companies = JSON.parse(localStorage.getItem('companies')) || {};
    const defaultCompany = localStorage.getItem('defaultCompany');
    if (defaultCompany && companies[defaultCompany]) {
      loadCompanyFromManagement(defaultCompany);
    }
  }
}

// Auto-populate dates
function setDefaultDates() {
  const invoiceDateEl = document.getElementById('invoiceDate');
  const dueDateEl = document.getElementById('dueDate');
  const formatSelect = document.getElementById('format');
  const selectedFormat = formatSelect ? formatSelect.value : '';
  
  if (invoiceDateEl && !invoiceDateEl.value) {
    // Set current date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    invoiceDateEl.value = todayStr;
  }
  // Do not auto-fill due date by default; leave it optional for the user.
}

// Update due date when format changes
function updateDueDateOnFormatChange() {
  const formatSelect = document.getElementById('format');
  const dueDateEl = document.getElementById('dueDate');
  
  if (formatSelect && dueDateEl) {
    formatSelect.addEventListener('change', function() {
      const selectedFormat = this.value;
      const isQuotation = selectedFormat === 'format5.html' || selectedFormat === 'format6.html' || selectedFormat === 'format12.html' || selectedFormat === 'format17.html' || selectedFormat === 'format18.html';
      const invoiceDateEl = document.getElementById('invoiceDate');
      
      // Only auto-calculate due date on format change if due date is currently blank
      if (!dueDateEl.value) {
        if (invoiceDateEl && invoiceDateEl.value) {
          const invoiceDate = new Date(invoiceDateEl.value);
          const dueDate = new Date(invoiceDate);
          const daysToAdd = isQuotation ? 2 : 30;
          dueDate.setDate(invoiceDate.getDate() + daysToAdd);
          dueDateEl.value = dueDate.toISOString().split('T')[0];
        } else {
          // If no invoice date, do not auto-fill due date here; leave blank
        }
      }
    });
  }
}

function applyFormatFromQuery() {
  const formatSelect = document.getElementById("format");
  if (!formatSelect) return;

  const params = new URLSearchParams(window.location.search);
  const requestedFormat = params.get("format");
  const requestedType = (params.get("type") || "").toLowerCase();
  const hasOption = (value) =>
    Array.from(formatSelect.options).some((option) => option.value === value);

  if (requestedFormat && hasOption(requestedFormat)) {
    formatSelect.value = requestedFormat;
    return;
  }

  const defaultByType = {
    invoice: "format1.html",
    "delivery-challan": "format3.html",
    quotation: "format5.html",
    proforma: "format8.html",
    "proforma-invoice": "format8.html",
  };
  const fallbackFormat = defaultByType[requestedType];
  if (fallbackFormat && hasOption(fallbackFormat)) {
    formatSelect.value = fallbackFormat;
  }
}

function initInvoiceEditorTabs() {
  const tabButtons = document.querySelectorAll(".invoice-tabs .tab-button[data-invoice-tab]");
  const partyPanel = document.getElementById("partyTabPanel");
  const transactionPanel = document.getElementById("transactionTabPanel");
  if (!tabButtons.length || !partyPanel || !transactionPanel) return;

  function activateTab(name) {
    const isParty = name === "party";
    partyPanel.hidden = !isParty;
    transactionPanel.hidden = isParty;
    tabButtons.forEach((btn) => {
      const active = btn.dataset.invoiceTab === name;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.invoiceTab));
  });

  activateTab("transaction");
}

// populate on page load if data exists
if(document.readyState === 'loading'){
  window.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    applyFormatFromQuery();
    updateDueDateOnFormatChange();
    loadInvoiceData();
    loadSavedCompanyOnStart();
    initSignaturePad();
    initInvoiceEditorTabs();
  });
} else {
  setDefaultDates();
  applyFormatFromQuery();
  updateDueDateOnFormatChange();
  loadInvoiceData();
  loadSavedCompanyOnStart();
  initSignaturePad();
  initInvoiceEditorTabs();
}

function addItemRow() {
  const container = document.getElementById('itemsContainer');
  const row = document.createElement('div');
  row.className = 'row item-row mb-2';
        row.innerHTML = `
    <div class="col-12 col-md-4 mb-2 mb-md-0">
      <input class="form-control item-name" placeholder="Product Name">
    </div>
    <div class="col-12 col-md-8 mb-2 mb-md-0">
      <input class="form-control item-desc" placeholder="Product Description (Optional)">
    </div>
    <div class="col-6 col-md-4 mb-2 mb-md-0">
      <input type="number" class="form-control item-qty" placeholder="Qty">
    </div>
    <div class="col-4 col-md-4 mb-2 mb-md-0">
      <input type="number" class="form-control item-rate" placeholder="Rate">
    </div>
    <div class="col-2 col-md-4 d-flex align-items-center justify-content-center">
      <button type="button" class="btn btn-danger" onclick="removeItemRow(this)">-</button>
    </div>
  `;
  container.appendChild(row);
}

function removeItemRow(btn) {
  const row = btn && btn.closest('.item-row');
  const container = document.getElementById('itemsContainer');
  if (!row || !container) return;
  // prevent removing last row
  if (container.querySelectorAll('.item-row').length <= 1) {
    // clear fields instead
    row.querySelectorAll('input').forEach(i => i.value = '');
    return;
  }
  row.remove();
}

/* Tax row helpers */
function addTaxRow() {
  const container = document.getElementById('taxContainer');
  const row = document.createElement('div');
  row.className = 'row tax-row mb-2';
  row.innerHTML = `
    <div class="col-12 col-md-4 mb-2 mb-md-0">
      <select class="form-select tax-type">
        <option value="GST">GST (CGST + SGST)</option>
        <option value="IGST">IGST</option>
      </select>
    </div>
    <div class="col-12 col-md-4 mb-2 mb-md-0">
      <input
        type="number"
        class="form-control tax-percent"
        placeholder="Percent"
        value="9"
      />
    </div>
    <div class="col-10 col-md-3 mb-2 mb-md-0">
      <input
        type="text"
        class="form-control tax-desc"
        placeholder="Description (optional)"
      />
    </div>
    <div class="col-2 col-md-1 d-flex align-items-center justify-content-center">
      <button type="button" class="btn btn-danger" onclick="removeTaxRow(this)">-</button>
    </div>
  `;
  container.appendChild(row);
}

function removeTaxRow(btn) {
  const row = btn && btn.closest('.tax-row');
  const container = document.getElementById('taxContainer');
  if (!row || !container) return;
  if (container.querySelectorAll('.tax-row').length <= 1) {
    // last row - clear
    row.querySelectorAll('input,select').forEach(i=>{ if(i.tagName==='INPUT') i.value=''; else i.selectedIndex=0; });
    return;
  }
  row.remove();
}

// Logo upload handler
function handleLogoUpload(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const logoDataUrl = e.target.result;
      localStorage.setItem("companyLogo", logoDataUrl);
      
      // Show preview
      const previewImg = document.getElementById('logoPreviewImg');
      const previewDiv = document.getElementById('logoPreview');
      if (previewImg && previewDiv) {
        previewImg.src = logoDataUrl;
        previewDiv.style.display = 'block';
      }
    };
    
    if (file.type === 'application/pdf') {
      // For PDF, we'll convert first page to image (simplified - just show message)
      alert('PDF logos are supported. Please convert to image (PNG/JPG) for best results.');
      input.value = '';
    } else {
      reader.readAsDataURL(file);
    }
  }
}

function removeLogo() {
  localStorage.removeItem("companyLogo");
  const logoInput = document.getElementById('companyLogo');
  const previewDiv = document.getElementById('logoPreview');
  if (logoInput) logoInput.value = '';
  if (previewDiv) previewDiv.style.display = 'none';
}

// ========================================
// Client Management Functions
// ========================================

/**
 * Save client data to localStorage
 */
function saveClient() {
  const clientNameEl = document.getElementById('clientName');
  const clientName = clientNameEl ? clientNameEl.value.trim() : '';
  
  if (!clientName) {
    alert('Please enter a client name');
    return;
  }
  
  // Get all clients from localStorage
  let clients = JSON.parse(localStorage.getItem('clients')) || {};
  
  // Save current client data
  clients[clientName] = {
    name: clientName,
    gst: document.getElementById('clientGST') ? document.getElementById('clientGST').value.trim() : '',
    address: document.getElementById('clientAddress') ? document.getElementById('clientAddress').value.trim() : '',
    mobile: document.getElementById('clientMobile') ? document.getElementById('clientMobile').value.trim() : ''
  };
  
  // Save to localStorage
  localStorage.setItem('clients', JSON.stringify(clients));
  
  // Reload clients dropdown
  loadClientsDropdown();
  
  // Select the newly saved client
  const clientSelect = document.getElementById('clientSelect');
  if (clientSelect) {
    clientSelect.value = clientName;
  }
  
  alert('Client saved successfully!');
}

/**
 * Load clients into the dropdown
 */
function loadClientsDropdown() {
  const clientSelect = document.getElementById('clientSelect');
  if (!clientSelect) return;
  
  const clients = JSON.parse(localStorage.getItem('clients')) || {};
  
  // Clear existing options except the first one
  clientSelect.innerHTML = '<option value="">-- Select a saved client or add new --</option>';
  
  // Add each client as an option
  Object.keys(clients).sort().forEach(clientName => {
    const option = document.createElement('option');
    option.value = clientName;
    option.textContent = clientName;
    clientSelect.appendChild(option);
  });
}

/**
 * Load client data into form when selected from dropdown
 */
function loadSavedClient(clientName) {
  if (!clientName) return;
  
  const clients = JSON.parse(localStorage.getItem('clients')) || {};
  const client = clients[clientName];
  
  if (client) {
    // Expand client section if it's hidden
    const section = document.getElementById('clientFormSection');
    const btn = document.getElementById('toggleClientBtn');
    if (section && (section.style.display === 'none' || section.style.display === '')) {
      section.style.display = 'block';
      if (btn) {
        btn.textContent = 'Hide Client';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    }
    
    if (document.getElementById('clientName')) {
    }
    if (document.getElementById('clientGST')) {
      document.getElementById('clientGST').value = client.gst || '';
    }
    if (document.getElementById('clientAddress')) {
      document.getElementById('clientAddress').value = client.address || '';
    }
    if (document.getElementById('clientMobile')) {
      document.getElementById('clientMobile').value = client.mobile || '';
    }
  }
}

/**
 * Show client management modal with all saved clients
 */
function manageClients() {
  const clients = JSON.parse(localStorage.getItem('clients')) || {};
  const clientsList = document.getElementById('clientsList');
  const clientsModal = document.getElementById('clientsModal');
  
  if (!clientsList || !clientsModal) return;
  
  if (Object.keys(clients).length === 0) {
    clientsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No clients saved yet. Save a client to manage them here.</p>';
  } else {
    let clientsHTML = '<div class="row g-3">';
    
    // Sort clients alphabetically by name
    const sortedClients = Object.keys(clients).sort();
    
    sortedClients.forEach(clientName => {
      const client = clients[clientName];
      clientsHTML += `
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">${escapeHtml(clientName)}</h6>
              <button type="button" class="btn btn-sm btn-danger" onclick="deleteClient('${escapeHtml(clientName)}')">
                Delete
              </button>
            </div>
            <div class="card-body">
              ${client.gst ? `<p class="mb-1"><strong>GSTIN:</strong> ${escapeHtml(client.gst)}</p>` : ''}
              ${client.address ? `<p class="mb-1"><strong>Address:</strong> ${escapeHtml(client.address)}</p>` : ''}
              ${client.mobile ? `<p class="mb-1"><strong>Mobile:</strong> ${escapeHtml(client.mobile)}</p>` : ''}
              <button type="button" class="btn btn-sm btn-primary mt-2" onclick="loadClientFromManagement('${escapeHtml(clientName)}')">
                Load to Form
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    clientsHTML += '</div>';
    clientsList.innerHTML = clientsHTML;
  }
  
  // Show modal
  clientsModal.style.display = 'block';
}

/**
 * Close clients management modal
 */
function closeClientsModal() {
  const clientsModal = document.getElementById('clientsModal');
  if (clientsModal) {
    clientsModal.style.display = 'none';
  }
}

/**
 * Delete a specific client
 */
function deleteClient(clientName) {
  if (!confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
    return;
  }
  
  // Get all clients
  let clients = JSON.parse(localStorage.getItem('clients')) || {};
  
  // Delete the client
  if (clients[clientName]) {
    delete clients[clientName];
    localStorage.setItem('clients', JSON.stringify(clients));
    
    // Reload clients dropdown
    loadClientsDropdown();
    
    // Refresh the clients modal
    manageClients();
    
    // If the deleted client was selected, clear the form
    const clientSelect = document.getElementById('clientSelect');
    if (clientSelect && clientSelect.value === clientName) {
      clearClientData();
    }
    
    alert(`Client "${clientName}" deleted successfully!`);
  }
}

/**
 * Load client data from management modal
 */
function loadClientFromManagement(clientName) {
  // Select client in dropdown
  const clientSelect = document.getElementById('clientSelect');
  if (clientSelect) {
    clientSelect.value = clientName;
  }
  
  // Load client data
  loadSavedClient(clientName);
  
  // Close modal
  closeClientsModal();
}

/**
 * Clear current client data from form
 */
function clearClientData() {
  if (!confirm('Clear all client data from the form?')) {
    return;
  }
  
  if (document.getElementById('clientName')) {
    document.getElementById('clientName').value = '';
  }
  if (document.getElementById('clientGST')) {
    document.getElementById('clientGST').value = '';
  }
  if (document.getElementById('clientAddress')) {
    document.getElementById('clientAddress').value = '';
  }
  if (document.getElementById('clientMobile')) {
    document.getElementById('clientMobile').value = '';
  }
  const clientSelect = document.getElementById('clientSelect');
  if (clientSelect) {
    clientSelect.value = '';
  }
  
  alert('Client data cleared from form.');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Open invoice history page
function openHistory() {
  const modal = document.getElementById("historyModal");
  if (modal) {
    modal.style.display = "block";
    loadHistoryList();
  }
}

function closeHistoryModal() {
  const modal = document.getElementById("historyModal");
  if (modal) {
    modal.style.display = "none";
  }
}

async function loadHistoryList() {
  const historyList = document.getElementById("historyList");
  
  if (!historyList) return;
  
  // Try to load from file via API first
  let history = [];
  try {
    const response = await fetch('/api/history');
    if (response.ok) {
      const data = await response.json();
      history = data.history || [];
      // Always sync localStorage from server (canonical test documents)
      localStorage.setItem("invoiceHistory", JSON.stringify(history));
    } else {
      throw new Error('API request failed');
    }
  } catch (error) {
    // Fallback to localStorage if API fails
    console.warn("Failed to load from file, using localStorage:", error);
    history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
  }
  
  if (history.length === 0) {
    historyList.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No saved documents yet. Your invoices, delivery challans, and quotations will appear here after previewing.</div>';
    return;
  }
  
  historyList.innerHTML = history.map(inv => {
    // Format invoice date
    let formattedDate = 'N/A';
    if (inv.invoiceDate) {
      try {
        const date = new Date(inv.invoiceDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch (e) {
        formattedDate = inv.invoiceDate;
      }
    }
    
    // Format created date
    let formattedCreated = 'N/A';
    if (inv.createdAt) {
      try {
        const createdDate = new Date(inv.createdAt);
        if (!isNaN(createdDate.getTime())) {
          formattedCreated = createdDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
      } catch (e) {
        formattedCreated = inv.createdAt;
      }
    }
    
    let typeBadge = '';
    if (inv.docType === 'Quotation') {
      typeBadge = '<span style="background: #17a2b8; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">QUOTATION</span>';
    } else if (inv.docType === 'Delivery Challan') {
      typeBadge = '<span style="background: #ffc107; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">CHALLAN</span>';
    } else if (inv.docType === 'Proforma') {
      typeBadge = '<span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">PROFORMA</span>';
    } else {
      typeBadge = '<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">INVOICE</span>';
    }
    
    return `
      <div style="border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 12px; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 16px; color: #333; margin-bottom: 5px;">
              ${inv.invoiceNo || 'N/A'} ${typeBadge}
            </div>
            <div style="color: #666; font-size: 13px; margin-bottom: 3px;">
              <strong>Client:</strong> ${inv.clientName || 'N/A'}
            </div>
            <div style="color: #666; font-size: 13px; margin-bottom: 3px;">
              <strong>Date:</strong> ${formattedDate}
            </div>
            ${inv.dueDate ? (() => {
              try {
                const dueDate = new Date(inv.dueDate);
                if (!isNaN(dueDate.getTime())) {
                  return `<div style="color: #666; font-size: 13px; margin-bottom: 3px;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>`;
                }
              } catch (e) {}
              return '';
            })() : ''}
            <div style="color: #666; font-size: 13px; margin-bottom: 3px;">
              <strong>Total:</strong> ${window.SmarbizCurrency ? SmarbizCurrency.format(inv.grandTotal || 0) : '₹' + (inv.grandTotal || '0.00')}
            </div>
            <div style="color: #999; font-size: 11px; margin-top: 5px;">
              Saved: ${formattedCreated}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
          <button onclick="viewHistoryItem(${inv.id})" style="flex: 1; min-width: 80px; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
            View
          </button>
          <button onclick="loadHistoryItem(${inv.id})" style="flex: 1; min-width: 80px; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
            Load
          </button>
          <button onclick="deleteHistoryItem(${inv.id})" style="flex: 1; min-width: 80px; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
            Delete
          </button>
        </div>
        ${getConversionButtons(inv)}
      </div>
    `;
  }).join('');
}

async function viewHistoryItem(id) {
  let history = [];
  let historyEntry = null;
  
  // Try to load from API first
  try {
    const response = await fetch('/api/history');
    if (response.ok) {
      const data = await response.json();
      history = data.history || [];
      historyEntry = history.find(i => i.id === id);
    }
  } catch (error) {
    console.warn("Failed to load from API, using localStorage:", error);
  }
  
  // Fallback to localStorage if not found
  if (!historyEntry) {
    history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
    historyEntry = history.find(i => i.id === id);
  }
  
  if (!historyEntry) {
    alert("Document not found");
    return;
  }
  
  // Load the data and open in preview
  const invoiceData = historyEntry.fullData || historyEntry;
  localStorage.setItem("invoiceData", JSON.stringify(invoiceData));
  
  // Set the format selector to match the saved format
  const formatSelect = document.getElementById("format");
  if (formatSelect && historyEntry.format) {
    formatSelect.value = historyEntry.format;
    // Prevent dropdown from opening
    setTimeout(() => formatSelect.blur(), 0);
  }
  
  // Open preview
  window.open("formats/" + (historyEntry.format || "format1.html"), "_blank");
  closeHistoryModal();
}

async function loadHistoryItem(id) {
  let history = [];
  let historyEntry = null;
  
  // Try to load from API first
  try {
    const response = await fetch('/api/history');
    if (response.ok) {
      const data = await response.json();
      history = data.history || [];
      historyEntry = history.find(i => i.id === id);
    }
  } catch (error) {
    console.warn("Failed to load from API, using localStorage:", error);
  }
  
  // Fallback to localStorage if not found
  if (!historyEntry) {
    history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
    historyEntry = history.find(i => i.id === id);
  }
  
  if (!historyEntry) {
    alert("Document not found");
    return;
  }
  
  // Load the data into the form
  const invoiceData = historyEntry.fullData || historyEntry;
  loadInvoiceDataFromHistory(invoiceData);
  
  // Set the format selector
  const formatSelect = document.getElementById("format");
  if (formatSelect && historyEntry.format) {
    formatSelect.value = historyEntry.format;
    // Prevent dropdown from opening
    setTimeout(() => formatSelect.blur(), 0);
  }
  
  closeHistoryModal();
  alert(`${historyEntry.docType} loaded successfully!`);
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadInvoiceDataFromHistory(data) {
  // Load all form fields from history data
  if (data.companyName && window.companyName) companyName.value = data.companyName;
  if (data.companyGST && window.companyGST) companyGST.value = data.companyGST;
  if (data.companyAddress && window.companyAddress) companyAddress.value = data.companyAddress;
  if (data.companyMobile && document.getElementById('companyMobile')) {
    document.getElementById('companyMobile').value = data.companyMobile;
  }
  if (data.companyEmail && document.getElementById('companyEmail')) {
    document.getElementById('companyEmail').value = data.companyEmail;
  }
  
  if (data.clientName && window.clientName) clientName.value = data.clientName;
  if (data.clientGST && window.clientGST) clientGST.value = data.clientGST;
  if (data.clientAddress && window.clientAddress) clientAddress.value = data.clientAddress;
  if (data.clientMobile && document.getElementById('clientMobile')) {
    document.getElementById('clientMobile').value = data.clientMobile;
  }
  
  if (data.invoiceNo && window.invoiceNo) invoiceNo.value = data.invoiceNo;
  if (data.invoiceDate && window.invoiceDate) invoiceDate.value = data.invoiceDate;
  if (data.dueDate && document.getElementById('dueDate')) {
    document.getElementById('dueDate').value = data.dueDate;
  }
  if (data.placeSupply && window.placeSupply) placeSupply.value = data.placeSupply;
  if (data.poNumber && document.getElementById('poNumber')) {
    document.getElementById('poNumber').value = data.poNumber;
  }
  if (data.poDate && document.getElementById('poDate')) {
    document.getElementById('poDate').value = data.poDate;
  }
  
  // Load items
  if (data.items && data.items.length > 0) {
    const itemsContainer = document.getElementById('itemsContainer');
    if (itemsContainer) {
      itemsContainer.innerHTML = '';
      data.items.forEach(item => {
        addItemRow();
        const lastRow = document.querySelector('.item-row:last-child');
        if (lastRow) {
          const nameInput = lastRow.querySelector('.item-name');
          const descInput = lastRow.querySelector('.item-desc');
          const qtyInput = lastRow.querySelector('.item-qty');
          const rateInput = lastRow.querySelector('.item-rate');
          if (nameInput) nameInput.value = item.name || '';
          if (descInput) descInput.value = item.desc || '';
          if (qtyInput) qtyInput.value = item.qty || '';
          if (rateInput) rateInput.value = item.rate || '';
        }
      });
    }
  }
  
  // Load taxes
  if (data.taxes && data.taxes.length > 0) {
    const taxContainer = document.getElementById('taxContainer');
    if (taxContainer) {
      taxContainer.innerHTML = '';
      data.taxes.forEach(tax => {
        addTaxRow();
        const lastRow = document.querySelector('.tax-row:last-child');
        if (lastRow) {
          const typeSelect = lastRow.querySelector('.tax-type');
          const percentInput = lastRow.querySelector('.tax-percent');
          const descInput = lastRow.querySelector('.tax-desc');
          if (typeSelect) typeSelect.value = tax.type || 'CGST';
          if (percentInput) percentInput.value = tax.percent || '';
          if (descInput) descInput.value = tax.desc || '';
        }
      });
    }
  }
  
  // Load shipping
  if (data.shipping && data.shipping.items && data.shipping.items.length > 0) {
    const shippingContainer = document.getElementById('shippingContainer');
    if (shippingContainer) {
      shippingContainer.innerHTML = '';
      data.shipping.items.forEach(shipping => {
        addShippingRow();
        const lastRow = document.querySelector('.shipping-row:last-child');
        if (lastRow) {
          const descInput = lastRow.querySelector('.shipping-desc');
          const amountInput = lastRow.querySelector('.shipping-amount');
          if (descInput) descInput.value = shipping.desc || '';
          if (amountInput) amountInput.value = shipping.amount || '';
        }
      });
    }
  }
  
  // Load payment note (single) - prefer invoice data, otherwise load savedPayment
  try {
    const noteEl = document.getElementById('paymentNoteSingle') || document.querySelector('#paymentContainer .payment-note');
    if (noteEl) {
      if (data.paymentNote) {
        noteEl.value = data.paymentNote;
      } else {
        const saved = JSON.parse(localStorage.getItem('savedPayment') || 'null');
        if (saved && saved.text) noteEl.value = saved.text;
      }
    }
  } catch (e) { /* ignore */ }
  
  // Load signature
  if (data.signature && window.signaturePad) {
    setTimeout(() => {
      if (window.signaturePad) {
        window.signaturePad.fromDataURL(data.signature);
      }
    }, 100);
  }
  
  // Expand sections if they have data
  if (data.companyName || data.companyGST) {
    const companySection = document.getElementById('companyFormSection');
    const companyBtn = document.getElementById('toggleCompanyBtn');
    if (companySection && companyBtn && (companySection.style.display === 'none' || companySection.style.display === '')) {
      companySection.style.display = 'block';
      companyBtn.textContent = 'Hide Company';
      companyBtn.classList.remove('btn-primary');
      companyBtn.classList.add('btn-secondary');
    }
  }
  
  if (data.clientName || data.clientGST) {
    const clientSection = document.getElementById('clientFormSection');
    const clientBtn = document.getElementById('toggleClientBtn');
    if (clientSection && clientBtn && (clientSection.style.display === 'none' || clientSection.style.display === '')) {
      clientSection.style.display = 'block';
      clientBtn.textContent = 'Hide Client';
      clientBtn.classList.remove('btn-primary');
      clientBtn.classList.add('btn-secondary');
    }
  }
  
  if (data.items && data.items.length > 0) {
    const productSection = document.getElementById('productFormSection');
    const productBtn = document.getElementById('toggleProductBtn');
    if (productSection && productBtn && (productSection.style.display === 'none' || productSection.style.display === '')) {
      productSection.style.display = 'block';
      productBtn.textContent = 'Hide Product';
      productBtn.classList.remove('btn-primary');
      productBtn.classList.add('btn-secondary');
    }
  }
}

async function deleteHistoryItem(id) {
  if (!confirm("Are you sure you want to delete this document from history?")) {
    return;
  }
  
  // Try to delete from file via API first
  try {
    const response = await fetch(`/api/history/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      // Also update localStorage
      let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
      history = history.filter(i => i.id !== id);
      localStorage.setItem("invoiceHistory", JSON.stringify(history));
      loadHistoryList();
      return;
    }
  } catch (error) {
    console.warn("Failed to delete from file, using localStorage:", error);
  }
  
  // Fallback to localStorage only
  let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
  history = history.filter(i => i.id !== id);
  localStorage.setItem("invoiceHistory", JSON.stringify(history));
  loadHistoryList();
}

// Get conversion buttons based on document type
function getDocumentButtons(inv) {
  const docType = inv.docType || 'Invoice';
  let convertButtons = '';
  
  if (docType === 'Invoice') {
    // Invoice can convert to Delivery Challan, Quotation, or Proforma
    convertButtons = `
      <button onclick="convertDocument(${inv.id}, 'Delivery Challan')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Delivery Challan
      </button>
      <button onclick="convertDocument(${inv.id}, 'Quotation')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Quotation
      </button>
      <button onclick="convertDocument(${inv.id}, 'Proforma')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Proforma
      </button>
    `;
  } else if (docType === 'Delivery Challan') {
    // Delivery Challan can convert to Invoice, Quotation, or Proforma
    convertButtons = `
      <button onclick="convertDocument(${inv.id}, 'Invoice')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Invoice
      </button>
      <button onclick="convertDocument(${inv.id}, 'Quotation')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Quotation
      </button>
      <button onclick="convertDocument(${inv.id}, 'Proforma')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Proforma
      </button>
    `;
  } else if (docType === 'Quotation') {
    // Quotation can convert to Invoice, Delivery Challan, or Proforma
    convertButtons = `
      <button onclick="convertDocument(${inv.id}, 'Invoice')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Invoice
      </button>
      <button onclick="convertDocument(${inv.id}, 'Delivery Challan')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Delivery Challan
      </button>
      <button onclick="convertDocument(${inv.id}, 'Proforma')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Proforma
      </button>
    `;
  } else if (docType === 'Proforma') {
    // Proforma can convert to Invoice, Delivery Challan, or Quotation
    convertButtons = `
      <button onclick="convertDocument(${inv.id}, 'Invoice')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Invoice
      </button>
      <button onclick="convertDocument(${inv.id}, 'Delivery Challan')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Delivery Challan
      </button>
      <button onclick="convertDocument(${inv.id}, 'Quotation')" style="flex: 1; min-width: 100px; padding: 6px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
        → Quotation
      </button>
    `;
  }
  
  // Combine all buttons with view, download, delete actions
  const buttons = `
    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
      <!-- Action Buttons -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button onclick="viewDocument(${inv.id})" style="flex: 1; min-width: 80px; padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">
          <i class="fas fa-eye"></i> View
        </button>
        <button onclick="downloadDocument(${inv.id})" style="flex: 1; min-width: 80px; padding: 8px 12px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">
          <i class="fas fa-download"></i> Download
        </button>
        <button onclick="deleteDocument(${inv.id})" style="flex: 1; min-width: 80px; padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
      
      <!-- Convert Buttons -->
      ${convertButtons ? `
      <div style="border-top: 1px solid #eee; padding-top: 8px;">
        <div style="font-size: 11px; color: #666; margin-bottom: 4px; font-weight: 600;">CONVERT TO:</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${convertButtons}
        </div>
      </div>
      ` : ''}
    </div>
  `;
  
  return buttons;
}

// Convert document to different type
function convertDocument(id, targetType) {
  try {
    const history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
    const historyEntry = history.find(i => String(i.id) === String(id));
    
    if (!historyEntry) {
      alert("Document not found");
      return;
    }
    
    // Get the original document data
    const originalData = historyEntry.fullData || historyEntry;
    
    // Determine target format based on target type
    let targetFormat = '';
    if (targetType === 'Invoice') {
      targetFormat = 'format1.html';
    } else if (targetType === 'Delivery Challan') {
      targetFormat = 'format3.html';
    } else if (targetType === 'Quotation') {
      targetFormat = 'format5.html';
    } else if (targetType === 'Proforma') {
      targetFormat = 'format8.html';
    }
    
    // Prepare converted data (copy all data, format files will handle display differences)
    const convertedData = JSON.parse(JSON.stringify(originalData));
    
    // Update document type
    convertedData.docType = targetType;
    
    // For Quotation: Adjust due date to 2 days from invoice date
    if (targetType === 'Quotation' && convertedData.invoiceDate) {
      const invoiceDate = new Date(convertedData.invoiceDate);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(invoiceDate.getDate() + 2);
      convertedData.dueDate = dueDate.toISOString().split('T')[0];
    }
    
    // For Invoice: Adjust due date to 30 days from invoice date if not set
    if (targetType === 'Invoice' && convertedData.invoiceDate && !convertedData.dueDate) {
      const invoiceDate = new Date(convertedData.invoiceDate);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(invoiceDate.getDate() + 30);
      convertedData.dueDate = dueDate.toISOString().split('T')[0];
    }
    
    // Save converted data for preview
    localStorage.setItem("invoiceData", JSON.stringify(convertedData));
    
    // Open preview with new format
    const previewWindow = window.open("formats/" + targetFormat, "_blank");
    
    // Automatically save the converted document
    setTimeout(() => {
      saveConvertedDocument(convertedData, targetType, targetFormat);
      // Refresh history to show new document
      setTimeout(() => {
        loadHistory();
      }, 1000);
    }, 500);
    
    closeHistoryModal();
    
  } catch (error) {
    console.error('Error converting document:', error);
    alert('Error converting document. Please try again.');
  }
}

// View document
function viewDocument(id) {
  try {
    const history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
    const historyEntry = history.find(i => String(i.id) === String(id));
    
    if (!historyEntry) {
      alert("Document not found");
      return;
    }
    
    // Get the document data
    const documentData = historyEntry.fullData || historyEntry;
    
    // Save document data for preview
    localStorage.setItem("invoiceData", JSON.stringify(documentData));
    
    // Determine format based on document type
    let targetFormat = 'format1.html'; // default
    if (documentData.docType === 'Delivery Challan') {
      targetFormat = 'format3.html';
    } else if (documentData.docType === 'Quotation') {
      targetFormat = 'format5.html';
    } else if (documentData.docType === 'Proforma') {
      targetFormat = 'format8.html';
    }
    
    // Open preview
    window.open("formats/" + targetFormat, "_blank");
    
  } catch (error) {
    console.error('Error viewing document:', error);
    alert('Error viewing document. Please try again.');
  }
}

// Delete document
function deleteDocument(id) {
  try {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    const history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
    const updatedHistory = history.filter(i => i.id !== id);
    
    localStorage.setItem("invoiceHistory", JSON.stringify(updatedHistory));
    
    // Refresh the history display
    loadHistory();
    
    alert('Document deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting document:', error);
    alert('Error deleting document. Please try again.');
  }
}

// Save converted document to history
function saveConvertedDocument(invoiceData, docType, format) {
  try {
    if (!invoiceData) {
      return;
    }

    // Calculate grand total
    let taxable = 0;
    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach(item => {
        const amount = (item.qty || 0) * (item.rate || 0);
        taxable += amount;
      });
    }

    // Calculate shipping total (only for invoices)
    const shippingTotal = (docType === 'Invoice' && invoiceData.shipping && invoiceData.shipping.total) 
      ? Number(invoiceData.shipping.total) 
      : 0;

    // Calculate tax (only for invoices, not for quotations or challans)
    let totalTax = 0;
    if (docType === 'Invoice' && invoiceData.taxes && invoiceData.taxes.length > 0) {
      invoiceData.taxes.forEach(t => {
        let percent = Number(t.percent) || 0;
        // For GST (CGST + SGST), the rate represents each component, so total GST = 2 × percent
        if (t.type === 'GST') {
          percent = percent * 2; // Double the rate for combined CGST + SGST
        }
        // Apply tax to both products and shipping
        const productTax = taxable * (percent / 100);
        const shippingTax = shippingTotal * (percent / 100);
        totalTax += productTax + shippingTax;
      });
    }

    // Calculate grand total
    const isQuotation = docType === "Quotation";
    const isChallan = docType === "Delivery Challan";
    const grandTotal = isQuotation || isChallan ? taxable : (taxable + totalTax + shippingTotal);

    // Get existing history
    let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];

    // Create new history entry for converted document
    const historyEntry = {
      id: Date.now(),
      invoiceNo: invoiceData.invoiceNo || '',
      invoiceDate: invoiceData.invoiceDate || '',
      dueDate: invoiceData.dueDate || '',
      clientName: invoiceData.clientName || '',
      grandTotal: grandTotal.toFixed(2),
      docType: docType,
      format: format,
      createdAt: new Date().toISOString(),
      // Store full invoice data for viewing later
      fullData: invoiceData
    };

    // Add new entry
    history.push(historyEntry);

    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Keep only last 100 entries
    if (history.length > 100) {
      history = history.slice(0, 100);
    }

    // Save to localStorage
    localStorage.setItem("invoiceHistory", JSON.stringify(history));
    
    console.log(`Converted ${docType} saved to history`);
  } catch (error) {
    console.error("Error saving converted document to history:", error);
  }
}

// Load clients dropdown on page load
if(document.readyState === 'loading'){
  window.addEventListener('DOMContentLoaded', function() {
    loadClientsDropdown();
    loadInvoiceInfoDropdown();
    loadTaxTemplatesDropdown();
  });
} else {
  loadClientsDropdown();
  loadInvoiceInfoDropdown();
  loadTaxTemplatesDropdown();
}

// Close modal when clicking outside
window.onclick = function(event) {
  const clientsModal = document.getElementById('clientsModal');
  const companiesModal = document.getElementById('companiesModal');
  const productsModal = document.getElementById('productsModal');
  const productTemplateSelectModal = document.getElementById('productTemplateSelectModal');
  const historyModal = document.getElementById('historyModal');
  const invoiceInfoModal = document.getElementById('invoiceInfoModal');
  const taxTemplatesModal = document.getElementById('taxTemplatesModal');
  
  if (event.target === clientsModal) {
    closeClientsModal();
  }
  if (event.target === companiesModal) {
    closeCompaniesModal();
  }
  if (event.target === productsModal) {
    closeProductsModal();
  }
  if (event.target === productTemplateSelectModal) {
    closeProductTemplateSelectModal();
  }
  if (event.target === historyModal) {
    closeHistoryModal();
  }
  if (event.target === invoiceInfoModal) {
    closeInvoiceInfoModal();
  }
  if (event.target === taxTemplatesModal) {
    closeTaxTemplatesModal();
  }
}

// ========================================
// Company Management Functions
// ========================================

/**
 * Save company data to localStorage
 */
function saveCompany() {
  const companyNameEl = document.getElementById('companyName');
  const companyName = companyNameEl ? companyNameEl.value.trim() : '';
  
  if (!companyName) {
    alert('Please enter a company name');
    return;
  }
  
  // Get all companies from localStorage
  let companies = JSON.parse(localStorage.getItem('companies')) || {};
  
  // Save current company data
  companies[companyName] = {
    name: companyName,
    gst: document.getElementById('companyGST') ? document.getElementById('companyGST').value.trim() : '',
    address: document.getElementById('companyAddress') ? document.getElementById('companyAddress').value.trim() : '',
    mobile: document.getElementById('companyMobile') ? document.getElementById('companyMobile').value.trim() : '',
    email: document.getElementById('companyEmail') ? document.getElementById('companyEmail').value.trim() : '',
    logo: localStorage.getItem('companyLogo') || null
  };
  
  // Save to localStorage
  localStorage.setItem('companies', JSON.stringify(companies));
  
  alert('Company details saved successfully!');
}

/**
 * Show company management modal with all saved companies
 */
function manageCompanies() {
  const companies = JSON.parse(localStorage.getItem('companies')) || {};
  const companiesList = document.getElementById('companiesList');
  const companiesModal = document.getElementById('companiesModal');
  
  if (!companiesList || !companiesModal) return;
  
  if (Object.keys(companies).length === 0) {
    companiesList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No companies saved yet. Save a company to manage them here.</p>';
  } else {
    let companiesHTML = '<div class="row g-3">';
    
    // Sort companies alphabetically by name
    const sortedCompanies = Object.keys(companies).sort();
    
    sortedCompanies.forEach(companyName => {
      const company = companies[companyName];
      companiesHTML += `
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">${escapeHtml(companyName)}</h6>
              <button type="button" class="btn btn-sm btn-danger" onclick="deleteCompany('${escapeHtml(companyName)}')">
                Delete
              </button>
            </div>
            <div class="card-body">
              ${company.gst ? `<p class="mb-1"><strong>GSTIN:</strong> ${escapeHtml(company.gst)}</p>` : ''}
              ${company.address ? `<p class="mb-1"><strong>Address:</strong> ${escapeHtml(company.address)}</p>` : ''}
              ${company.mobile ? `<p class="mb-1"><strong>Mobile:</strong> ${escapeHtml(company.mobile)}</p>` : ''}
              ${company.email ? `<p class="mb-1"><strong>Email:</strong> ${escapeHtml(company.email)}</p>` : ''}
              ${company.logo ? `<p class="mb-1"><strong>Logo:</strong> <span class="text-success">Saved</span></p>` : ''}
              <button type="button" class="btn btn-sm btn-primary mt-2" onclick="loadCompanyFromManagement('${escapeHtml(companyName)}')">
                Load to Form
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    companiesHTML += '</div>';
    companiesList.innerHTML = companiesHTML;
  }
  
  // Show modal
  companiesModal.style.display = 'block';
}

/**
 * Close companies management modal
 */
function closeCompaniesModal() {
  const companiesModal = document.getElementById('companiesModal');
  if (companiesModal) {
    companiesModal.style.display = 'none';
  }
}

/**
 * Delete a specific company
 */
function deleteCompany(companyName) {
  if (!confirm(`Are you sure you want to delete company "${companyName}"? This action cannot be undone.`)) {
    return;
  }
  
  // Get all companies
  let companies = JSON.parse(localStorage.getItem('companies')) || {};
  
  // Delete the company
  if (companies[companyName]) {
    delete companies[companyName];
    localStorage.setItem('companies', JSON.stringify(companies));
    
    // Refresh the companies modal
    manageCompanies();
    
    alert(`Company "${companyName}" deleted successfully!`);
  }
}

/**
 * Load company data from management modal
 */
function loadCompanyFromManagement(companyName) {
  const companies = JSON.parse(localStorage.getItem('companies')) || {};
  const company = companies[companyName];
  
  if (!company) return;
  
  // Expand company section if it's hidden
  const section = document.getElementById('companyFormSection');
  const btn = document.getElementById('toggleCompanyBtn');
  if (section && (section.style.display === 'none' || section.style.display === '')) {
    section.style.display = 'block';
    if (btn) {
      btn.textContent = 'Hide Company';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
    }
  }
  
  // Load company data into form
  if (document.getElementById('companyName')) {
    document.getElementById('companyName').value = company.name || '';
  }
  if (document.getElementById('companyGST')) {
    document.getElementById('companyGST').value = company.gst || '';
  }
  if (document.getElementById('companyAddress')) {
    document.getElementById('companyAddress').value = company.address || '';
  }
  if (document.getElementById('companyMobile')) {
    document.getElementById('companyMobile').value = company.mobile || '';
  }
  if (document.getElementById('companyEmail')) {
    document.getElementById('companyEmail').value = company.email || '';
  }
  
  // Load logo if exists
  if (company.logo) {
    localStorage.setItem('companyLogo', company.logo);
    const previewImg = document.getElementById('logoPreviewImg');
    const previewDiv = document.getElementById('logoPreview');
    if (previewImg && previewDiv) {
      previewImg.src = company.logo;
      previewDiv.style.display = 'block';
    }
  }
  
  // Close modal
  closeCompaniesModal();
}

/**
 * Clear current company data from form
 */
function clearCompanyData() {
  if (!confirm('Clear all company data from the form?')) {
    return;
  }
  
  if (document.getElementById('companyName')) {
    document.getElementById('companyName').value = '';
  }
  if (document.getElementById('companyGST')) {
    document.getElementById('companyGST').value = '';
  }
  if (document.getElementById('companyAddress')) {
    document.getElementById('companyAddress').value = '';
  }
  if (document.getElementById('companyMobile')) {
    document.getElementById('companyMobile').value = '';
  }
  if (document.getElementById('companyEmail')) {
    document.getElementById('companyEmail').value = '';
  }
  
  // Clear logo
  removeLogo();
  
  alert('Company data cleared from form.');
}

// ========================================
// Product Template Management Functions
// ========================================

/**
 * Save current product items as a template
 */
function saveProductTemplate() {
  const items = getCurrentProductItems();
  
  if (items.length === 0) {
    alert('Please add at least one product before saving as template.');
    return;
  }
  
  const templateName = prompt('Enter a name for this product template:');
  
  if (!templateName || !templateName.trim()) {
    return;
  }
  
  // Get all product templates from localStorage
  let templates = JSON.parse(localStorage.getItem('productTemplates')) || {};
  
  // Save current product items as template
  templates[templateName.trim()] = {
    name: templateName.trim(),
    items: items,
    createdAt: new Date().toISOString()
  };
  
  // Save to localStorage
  localStorage.setItem('productTemplates', JSON.stringify(templates));
  
  alert('Product template saved successfully!');
}

/**
 * Get current product items from form
 */
function getCurrentProductItems() {
  const rows = document.querySelectorAll('#itemsContainer .item-row');
  const items = [];
  
  rows.forEach(row => {
    const nameEl = row.querySelector('.item-name');
    const descEl = row.querySelector('.item-desc');
    const qtyEl = row.querySelector('.item-qty');
    const rateEl = row.querySelector('.item-rate');
    
    if (!nameEl) return;
    
    const name = nameEl.value.trim();
    const desc = descEl ? descEl.value.trim() : '';
    const qty = parseFloat(qtyEl ? qtyEl.value : 0) || 0;
    const rate = parseFloat(rateEl ? rateEl.value : 0) || 0;
    
    if (name || desc || qty || rate) {
      items.push({ name, desc, qty, rate });
    }
  });
  
  return items;
}

/**
 * Show product templates management modal
 */
function manageProductTemplates() {
  const templates = JSON.parse(localStorage.getItem('productTemplates')) || {};
  const productsList = document.getElementById('productsList');
  const productsModal = document.getElementById('productsModal');
  
  if (!productsList || !productsModal) return;
  
  if (Object.keys(templates).length === 0) {
    productsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No product templates saved yet. Save a product template to manage them here.</p>';
  } else {
    let templatesHTML = '<div class="row g-3">';
    
    // Sort templates alphabetically by name
    const sortedTemplates = Object.keys(templates).sort();
    
    sortedTemplates.forEach(templateName => {
      const template = templates[templateName];
      const date = new Date(template.createdAt).toLocaleDateString();
      const itemCount = template.items ? template.items.length : 0;
      
      templatesHTML += `
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">${escapeHtml(templateName)} <span class="badge bg-secondary">${itemCount} items</span></h6>
              <button type="button" class="btn btn-sm btn-danger" onclick="deleteProductTemplate('${escapeHtml(templateName)}')">
                Delete
              </button>
            </div>
            <div class="card-body">
              <p class="mb-2"><strong>Created:</strong> ${date}</p>
              <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
                <table class="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
      `;
      
      if (template.items && template.items.length > 0) {
        template.items.forEach(item => {
          templatesHTML += `
            <tr>
              <td>${escapeHtml(item.name || '-')}</td>
              <td>${escapeHtml(item.desc || '-')}</td>
              <td>${item.qty || 0}</td>
              <td>${item.rate || 0}</td>
            </tr>
          `;
        });
      }
      
      templatesHTML += `
                  </tbody>
                </table>
              </div>
              <button type="button" class="btn btn-sm btn-primary mt-2" onclick="loadProductTemplateFromManagement('${escapeHtml(templateName)}')">
                Load to Form
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    templatesHTML += '</div>';
    productsList.innerHTML = templatesHTML;
  }
  
  // Show modal
  productsModal.style.display = 'block';
}

/**
 * Close products management modal
 */
function closeProductsModal() {
  const productsModal = document.getElementById('productsModal');
  if (productsModal) {
    productsModal.style.display = 'none';
  }
}

/**
 * Delete a specific product template
 */
function deleteProductTemplate(templateName) {
  if (!confirm(`Are you sure you want to delete product template "${templateName}"? This action cannot be undone.`)) {
    return;
  }
  
  // Get all templates
  let templates = JSON.parse(localStorage.getItem('productTemplates')) || {};
  
  // Delete the template
  if (templates[templateName]) {
    delete templates[templateName];
    localStorage.setItem('productTemplates', JSON.stringify(templates));
    
    // Refresh the templates modal
    manageProductTemplates();
    
    alert(`Product template "${templateName}" deleted successfully!`);
  }
}

/**
 * Show product template selection modal
 */
function loadProductTemplate() {
  const templates = JSON.parse(localStorage.getItem('productTemplates')) || {};
  const productTemplateSelectList = document.getElementById('productTemplateSelectList');
  const productTemplateSelectModal = document.getElementById('productTemplateSelectModal');
  
  if (!productTemplateSelectList || !productTemplateSelectModal) return;
  
  if (Object.keys(templates).length === 0) {
    productTemplateSelectList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No product templates saved yet. Save a product template first.</p>';
  } else {
    let templatesHTML = '<div class="list-group">';
    
    // Sort templates alphabetically by name
    const sortedTemplates = Object.keys(templates).sort();
    
    sortedTemplates.forEach(templateName => {
      const template = templates[templateName];
      const itemCount = template.items ? template.items.length : 0;
      const date = new Date(template.createdAt).toLocaleDateString();
      
      templatesHTML += `
        <a href="#" class="list-group-item list-group-item-action" onclick="loadProductTemplateFromManagement('${escapeHtml(templateName)}'); return false;">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">${escapeHtml(templateName)}</h6>
            <small>${itemCount} items</small>
          </div>
          <p class="mb-1 text-muted">Created: ${date}</p>
        </a>
      `;
    });
    
    templatesHTML += '</div>';
    productTemplateSelectList.innerHTML = templatesHTML;
  }
  
  // Show modal
  productTemplateSelectModal.style.display = 'block';
}

/**
 * Close product template selection modal
 */
function closeProductTemplateSelectModal() {
  const productTemplateSelectModal = document.getElementById('productTemplateSelectModal');
  if (productTemplateSelectModal) {
    productTemplateSelectModal.style.display = 'none';
  }
}

/**
 * Load product template from management or selection modal
 */
function loadProductTemplateFromManagement(templateName) {
  const templates = JSON.parse(localStorage.getItem('productTemplates')) || {};
  const template = templates[templateName];
  
  if (!template || !template.items) {
    alert('Template not found');
    return;
  }
  
  // Confirm if there are existing items
  const currentItems = getCurrentProductItems();
  if (currentItems.length > 0) {
    if (!confirm('This will replace current product items. Do you want to continue?')) {
      return;
    }
  }
  
  // Clear existing items
  const itemsContainer = document.getElementById('itemsContainer');
  if (itemsContainer) {
    itemsContainer.innerHTML = '';
  }
  
  // Load template items
  template.items.forEach(item => {
    addItemRow();
    const lastRow = document.querySelector('.item-row:last-child');
    if (lastRow) {
      const nameInput = lastRow.querySelector('.item-name');
      const descInput = lastRow.querySelector('.item-desc');
      const qtyInput = lastRow.querySelector('.item-qty');
      const rateInput = lastRow.querySelector('.item-rate');
      
      if (nameInput) nameInput.value = item.name || '';
      if (descInput) descInput.value = item.desc || '';
      if (qtyInput) qtyInput.value = item.qty || '';
      if (rateInput) rateInput.value = item.rate || '';
    }
  });
  
  // Close modals
  closeProductsModal();
  closeProductTemplateSelectModal();
  
  alert(`Product template "${templateName}" loaded successfully!`);
}

// Toggle functions for collapsible sections
function toggleCompanySection() {
  const section = document.getElementById('companyFormSection');
  const btn = document.getElementById('toggleCompanyBtn');
  
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    btn.textContent = 'Hide Company';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    section.style.display = 'none';
    btn.textContent = 'Add Company';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

function toggleClientSection() {
  const section = document.getElementById('clientFormSection');
  const btn = document.getElementById('toggleClientBtn');
  
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    btn.textContent = 'Hide Client';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    section.style.display = 'none';
    btn.textContent = 'Add Client';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

function toggleStampSection() {
  const section = document.getElementById('stampFormSection');
  const btn = document.getElementById('toggleStampBtn');
  if (!section || !btn) return;
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    btn.textContent = 'Hide Stamp';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    try { if (window.refreshStampPresetOptions) window.refreshStampPresetOptions(); } catch (e) {}
  } else {
    section.style.display = 'none';
    btn.textContent = 'Add Stamp';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

function toggleProductSection() {
  const section = document.getElementById('productFormSection');
  const btn = document.getElementById('toggleProductBtn');
  
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    btn.textContent = 'Hide Product';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    section.style.display = 'none';
    btn.textContent = 'Add Product';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

function toggleInvoiceInfoSection() {
  const section = document.getElementById('invoiceInfoFormSection');
  const btn = document.getElementById('toggleInvoiceInfoBtn');
  
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    btn.textContent = 'Hide Invoice Info';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    section.style.display = 'none';
    btn.textContent = 'Add Invoice Info';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

function toggleTaxesSection() {
  const section = document.getElementById('taxesFormSection');
  const btn = document.getElementById('toggleTaxesBtn');
  
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    btn.textContent = 'Hide Taxes';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    section.style.display = 'none';
    btn.textContent = 'Add Tax';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

// ========================================
// Invoice Info Management Functions
// ========================================

/**
 * Save invoice info data to localStorage
 */
function saveInvoiceInfo() {
  const invoiceNoEl = document.getElementById('invoiceNo');
  const invoiceNo = invoiceNoEl ? invoiceNoEl.value.trim() : '';
  
  if (!invoiceNo) {
    alert('Please enter an invoice number to save as template');
    return;
  }
  
  // Get all invoice info templates from localStorage
  let invoiceInfoTemplates = JSON.parse(localStorage.getItem('invoiceInfoTemplates')) || {};
  
  // Save current invoice info data
  invoiceInfoTemplates[invoiceNo] = {
    invoiceNo: invoiceNo,
    invoiceDate: document.getElementById('invoiceDate') ? document.getElementById('invoiceDate').value : '',
    dueDate: document.getElementById('dueDate') ? document.getElementById('dueDate').value : '',
    placeSupply: document.getElementById('placeSupply') ? document.getElementById('placeSupply').value.trim() : '',
    poNumber: document.getElementById('poNumber') ? document.getElementById('poNumber').value.trim() : '',
    poDate: document.getElementById('poDate') ? document.getElementById('poDate').value : ''
  };
  
  // Save to localStorage
  localStorage.setItem('invoiceInfoTemplates', JSON.stringify(invoiceInfoTemplates));
  
  // Reload invoice info dropdown
  loadInvoiceInfoDropdown();
  
  // Select the newly saved template
  const invoiceInfoSelect = document.getElementById('invoiceInfoSelect');
  if (invoiceInfoSelect) {
    invoiceInfoSelect.value = invoiceNo;
    // Prevent dropdown from opening
    setTimeout(() => invoiceInfoSelect.blur(), 0);
  }
  
  alert('Invoice info saved successfully!');
}

/**
 * Load invoice info templates into the dropdown
 */
function loadInvoiceInfoDropdown() {
  const invoiceInfoSelect = document.getElementById('invoiceInfoSelect');
  if (!invoiceInfoSelect) return;
  
  const templates = JSON.parse(localStorage.getItem('invoiceInfoTemplates')) || {};
  
  // Clear existing options except the first one
  invoiceInfoSelect.innerHTML = '<option value="">-- Select saved invoice info or add new --</option>';
  
  // Add each template as an option
  Object.keys(templates).sort().forEach(templateName => {
    const option = document.createElement('option');
    option.value = templateName;
    option.textContent = templateName;
    invoiceInfoSelect.appendChild(option);
  });
  
  // Prevent dropdown from opening
  invoiceInfoSelect.blur();
  setTimeout(() => invoiceInfoSelect.blur(), 10);
}

/**
 * Load invoice info data into form when selected from dropdown
 */
function loadSavedInvoiceInfo(templateName) {
  if (!templateName) return;
  
  const templates = JSON.parse(localStorage.getItem('invoiceInfoTemplates')) || {};
  const template = templates[templateName];
  
  if (template) {
    // Expand invoice info section if it's hidden
    const section = document.getElementById('invoiceInfoFormSection');
    const btn = document.getElementById('toggleInvoiceInfoBtn');
    if (section && (section.style.display === 'none' || section.style.display === '')) {
      section.style.display = 'block';
      if (btn) {
        btn.textContent = 'Hide Invoice Info';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    }
    
    if (document.getElementById('invoiceNo')) {
      document.getElementById('invoiceNo').value = template.invoiceNo || '';
    }
    if (document.getElementById('invoiceDate')) {
      document.getElementById('invoiceDate').value = template.invoiceDate || '';
    }
    if (document.getElementById('dueDate')) {
      document.getElementById('dueDate').value = template.dueDate || '';
    }
    if (document.getElementById('placeSupply')) {
      document.getElementById('placeSupply').value = template.placeSupply || '';
    }
    if (document.getElementById('poNumber')) {
      document.getElementById('poNumber').value = template.poNumber || '';
    }
    if (document.getElementById('poDate')) {
      document.getElementById('poDate').value = template.poDate || '';
    }
  }
}

/**
 * Show invoice info management modal with all saved templates
 */
function manageInvoiceInfo() {
  const templates = JSON.parse(localStorage.getItem('invoiceInfoTemplates')) || {};
  const invoiceInfoList = document.getElementById('invoiceInfoList');
  const invoiceInfoModal = document.getElementById('invoiceInfoModal');
  
  if (!invoiceInfoList || !invoiceInfoModal) return;
  
  if (Object.keys(templates).length === 0) {
    invoiceInfoList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No invoice info templates saved yet. Save invoice info to manage them here.</p>';
  } else {
    let templatesHTML = '<div class="row g-3">';
    
    // Sort templates alphabetically by invoice number
    const sortedTemplates = Object.keys(templates).sort();
    
    sortedTemplates.forEach(templateName => {
      const template = templates[templateName];
      templatesHTML += `
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">Invoice: ${escapeHtml(templateName)}</h6>
              <button type="button" class="btn btn-sm btn-danger" onclick="deleteInvoiceInfo('${escapeHtml(templateName)}')">
                Delete
              </button>
            </div>
            <div class="card-body">
              ${template.invoiceDate ? `<p class="mb-1"><strong>Date:</strong> ${escapeHtml(template.invoiceDate)}</p>` : ''}
              ${template.dueDate ? `<p class="mb-1"><strong>Due Date:</strong> ${escapeHtml(template.dueDate)}</p>` : ''}
              ${template.placeSupply ? `<p class="mb-1"><strong>Place of Supply:</strong> ${escapeHtml(template.placeSupply)}</p>` : ''}
              ${template.poNumber ? `<p class="mb-1"><strong>PO Number:</strong> ${escapeHtml(template.poNumber)}</p>` : ''}
              <button type="button" class="btn btn-sm btn-primary mt-2" onclick="loadInvoiceInfoFromManagement('${escapeHtml(templateName)}')">
                Load to Form
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    templatesHTML += '</div>';
    invoiceInfoList.innerHTML = templatesHTML;
  }
  
  // Show modal
  invoiceInfoModal.style.display = 'block';
}

/**
 * Close invoice info management modal
 */
function closeInvoiceInfoModal() {
  const invoiceInfoModal = document.getElementById('invoiceInfoModal');
  if (invoiceInfoModal) {
    invoiceInfoModal.style.display = 'none';
  }
}

/**
 * Delete a specific invoice info template
 */
function deleteInvoiceInfo(templateName) {
  if (!confirm(`Are you sure you want to delete invoice info template "${templateName}"? This action cannot be undone.`)) {
    return;
  }
  
  // Get all templates
  let templates = JSON.parse(localStorage.getItem('invoiceInfoTemplates')) || {};
  
  // Delete the template
  if (templates[templateName]) {
    delete templates[templateName];
    localStorage.setItem('invoiceInfoTemplates', JSON.stringify(templates));
    
    // Reload invoice info dropdown
    loadInvoiceInfoDropdown();
    
    // Refresh the modal
    manageInvoiceInfo();
    
    // If the deleted template was selected, clear the form
    const invoiceInfoSelect = document.getElementById('invoiceInfoSelect');
    if (invoiceInfoSelect && invoiceInfoSelect.value === templateName) {
      clearInvoiceInfoData();
    }
    
    alert(`Invoice info template "${templateName}" deleted successfully!`);
  }
}

/**
 * Load invoice info data from management modal
 */
function loadInvoiceInfoFromManagement(templateName) {
  // Select template in dropdown
  const invoiceInfoSelect = document.getElementById('invoiceInfoSelect');
  if (invoiceInfoSelect) {
    invoiceInfoSelect.value = templateName;
  }
  
  // Load the data
  loadSavedInvoiceInfo(templateName);
  
  // Close modal
  closeInvoiceInfoModal();
}

/**
 * Clear invoice info data
 */
function clearInvoiceInfoData() {
  if (document.getElementById('invoiceNo')) {
    document.getElementById('invoiceNo').value = '';
  }
  if (document.getElementById('invoiceDate')) {
    document.getElementById('invoiceDate').value = '';
  }
  if (document.getElementById('dueDate')) {
    document.getElementById('dueDate').value = '';
  }
  if (document.getElementById('placeSupply')) {
    document.getElementById('placeSupply').value = '';
  }
  if (document.getElementById('poNumber')) {
    document.getElementById('poNumber').value = '';
  }
  if (document.getElementById('poDate')) {
    document.getElementById('poDate').value = '';
  }
  
  // Clear dropdown selection
  const invoiceInfoSelect = document.getElementById('invoiceInfoSelect');
  if (invoiceInfoSelect) {
    invoiceInfoSelect.value = '';
  }
}

// ========================================
// Tax Template Management Functions
// ========================================

/**
 * Save tax template data to localStorage
 */
function saveTaxTemplate() {
  const taxRows = document.querySelectorAll('#taxContainer .tax-row');
  
  if (taxRows.length === 0) {
    alert('Please add at least one tax row to save as template');
    return;
  }
  
  // Collect all tax data
  const taxes = [];
  taxRows.forEach(row => {
    const type = (row.querySelector('.tax-type') || {}).value || '';
    const percent = Number((row.querySelector('.tax-percent') || {}).value) || 0;
    const desc = (row.querySelector('.tax-desc') || {}).value.trim() || '';
    if (type && percent) {
      taxes.push({ type, percent, desc });
    }
  });
  
  if (taxes.length === 0) {
    alert('Please fill in at least one complete tax entry (type and percent)');
    return;
  }
  
  // Generate template name from tax types
  const templateName = taxes.map(t => `${t.type}-${t.percent}%`).join(', ');
  
  // Get all tax templates from localStorage
  let taxTemplates = JSON.parse(localStorage.getItem('taxTemplates')) || {};
  
  // Save current tax data
  taxTemplates[templateName] = {
    name: templateName,
    taxes: taxes
  };
  
  // Save to localStorage
  localStorage.setItem('taxTemplates', JSON.stringify(taxTemplates));
  
  // Reload tax templates dropdown
  loadTaxTemplatesDropdown();
  
  // Select the newly saved template
  const taxTemplateSelect = document.getElementById('taxTemplateSelect');
  if (taxTemplateSelect) {
    taxTemplateSelect.value = templateName;
    // Prevent dropdown from opening
    setTimeout(() => taxTemplateSelect.blur(), 0);
  }
  
  alert('Tax template saved successfully!');
}

/**
 * Load tax templates into the dropdown
 */
function loadTaxTemplatesDropdown() {
  const taxTemplateSelect = document.getElementById('taxTemplateSelect');
  if (!taxTemplateSelect) return;
  
  const templates = JSON.parse(localStorage.getItem('taxTemplates')) || {};
  
  // Clear existing options except the first one
  taxTemplateSelect.innerHTML = '<option value="">-- Select saved tax template or add new --</option>';
  
  // Add each template as an option
  Object.keys(templates).sort().forEach(templateName => {
    const option = document.createElement('option');
    option.value = templateName;
    option.textContent = templateName;
    taxTemplateSelect.appendChild(option);
  });
  
  // Prevent dropdown from opening
  taxTemplateSelect.blur();
  setTimeout(() => taxTemplateSelect.blur(), 10);
}

/**
 * Load tax template data into form when selected from dropdown
 */
function loadSavedTaxTemplate(templateName) {
  if (!templateName) return;
  
  const templates = JSON.parse(localStorage.getItem('taxTemplates')) || {};
  const template = templates[templateName];
  
  if (template && template.taxes && template.taxes.length > 0) {
    // Expand taxes section if it's hidden
    const section = document.getElementById('taxesFormSection');
    const btn = document.getElementById('toggleTaxesBtn');
    if (section && (section.style.display === 'none' || section.style.display === '')) {
      section.style.display = 'block';
      if (btn) {
        btn.textContent = 'Hide Taxes';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    }
    
    // Clear existing tax rows
    const taxContainer = document.getElementById('taxContainer');
    if (taxContainer) {
      taxContainer.innerHTML = '';
    }
    
    // Add tax rows from template
    template.taxes.forEach(tax => {
      addTaxRow();
      const rows = document.querySelectorAll('#taxContainer .tax-row');
      const lastRow = rows[rows.length - 1];
      
      if (lastRow) {
        const typeSelect = lastRow.querySelector('.tax-type');
        const percentInput = lastRow.querySelector('.tax-percent');
        const descInput = lastRow.querySelector('.tax-desc');
        
        if (typeSelect) typeSelect.value = tax.type || 'CGST';
        if (percentInput) percentInput.value = tax.percent || 0;
        if (descInput) descInput.value = tax.desc || '';
      }
    });
  }
}

/**
 * Show tax templates management modal with all saved templates
 */
function manageTaxTemplates() {
  const templates = JSON.parse(localStorage.getItem('taxTemplates')) || {};
  const taxTemplatesList = document.getElementById('taxTemplatesList');
  const taxTemplatesModal = document.getElementById('taxTemplatesModal');
  
  if (!taxTemplatesList || !taxTemplatesModal) return;
  
  if (Object.keys(templates).length === 0) {
    taxTemplatesList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No tax templates saved yet. Save tax template to manage them here.</p>';
  } else {
    let templatesHTML = '<div class="row g-3">';
    
    // Sort templates alphabetically by name
    const sortedTemplates = Object.keys(templates).sort();
    
    sortedTemplates.forEach(templateName => {
      const template = templates[templateName];
      let taxesHTML = '';
      if (template.taxes && template.taxes.length > 0) {
        template.taxes.forEach(tax => {
          taxesHTML += `<p class="mb-1"><strong>${tax.type}:</strong> ${tax.percent}%${tax.desc ? ` - ${escapeHtml(tax.desc)}` : ''}</p>`;
        });
      }
      
      templatesHTML += `
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">${escapeHtml(templateName)}</h6>
              <button type="button" class="btn btn-sm btn-danger" onclick="deleteTaxTemplate('${escapeHtml(templateName)}')">
                Delete
              </button>
            </div>
            <div class="card-body">
              ${taxesHTML}
              <button type="button" class="btn btn-sm btn-primary mt-2" onclick="loadTaxTemplateFromManagement('${escapeHtml(templateName)}')">
                Load to Form
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    templatesHTML += '</div>';
    taxTemplatesList.innerHTML = templatesHTML;
  }
  
  // Show modal
  taxTemplatesModal.style.display = 'block';
}

/**
 * Close tax templates management modal
 */
function closeTaxTemplatesModal() {
  const taxTemplatesModal = document.getElementById('taxTemplatesModal');
  if (taxTemplatesModal) {
    taxTemplatesModal.style.display = 'none';
  }
}

/**
 * Delete a specific tax template
 */
function deleteTaxTemplate(templateName) {
  if (!confirm(`Are you sure you want to delete tax template "${templateName}"? This action cannot be undone.`)) {
    return;
  }
  
  // Get all templates
  let templates = JSON.parse(localStorage.getItem('taxTemplates')) || {};
  
  // Delete the template
  if (templates[templateName]) {
    delete templates[templateName];
    localStorage.setItem('taxTemplates', JSON.stringify(templates));
    
    // Reload tax templates dropdown
    loadTaxTemplatesDropdown();
    
    // Refresh the modal
    manageTaxTemplates();
    
    // If the deleted template was selected, clear the dropdown
    const taxTemplateSelect = document.getElementById('taxTemplateSelect');
    if (taxTemplateSelect && taxTemplateSelect.value === templateName) {
      taxTemplateSelect.value = '';
    }
    
    alert(`Tax template "${templateName}" deleted successfully!`);
  }
}

/**
 * Load tax template data from management modal
 */
function loadTaxTemplateFromManagement(templateName) {
  // Select template in dropdown
  const taxTemplateSelect = document.getElementById('taxTemplateSelect');
  if (taxTemplateSelect) {
    taxTemplateSelect.value = templateName;
  }
  
  // Load the data
  loadSavedTaxTemplate(templateName);
  
  // Close modal
  closeTaxTemplatesModal();
}

/**
 * Clear tax data
 */
function clearTaxData() {
  const taxContainer = document.getElementById('taxContainer');
  if (taxContainer) {
    taxContainer.innerHTML = '';
    // Add one empty row
    addTaxRow();
  }
  
  // Clear dropdown selection
  const taxTemplateSelect = document.getElementById('taxTemplateSelect');
  if (taxTemplateSelect) {
    taxTemplateSelect.value = '';
  }
}

/* ========== CERTIFICATIONS SECTION ========== */

/**
 * Toggle certifications form section
 */
function toggleCertificationsSection() {
  const section = document.getElementById('certificationsFormSection');
  const btn = document.getElementById('toggleCertificationsBtn');
  if (!section || !btn) return;

  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    btn.innerText = 'Hide Certificate';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    section.style.display = 'none';
    btn.innerText = 'Add Certificate';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }

  displayStoredCertifications();
}

/**
 * Add a new certification
 */
function addCertification() {
  const certType = document.getElementById('certificationType').value.trim();
  const certDesc = document.getElementById('certDescription').value.trim();
  const certFileInput = document.getElementById('certFile');
  
  if (!certType) {
    alert('Please select or enter a certificate type.');
    return;
  }
  
  // Get stored certifications
  let certifications = JSON.parse(localStorage.getItem('companyCertifications')) || [];
  
  // If file is selected, convert to base64 and store
  let certData = {
    id: Date.now(),
    type: certType,
    description: certDesc,
    fileName: certFileInput.files.length > 0 ? certFileInput.files[0].name : '',
    fileData: ''
  };
  
  if (certFileInput.files.length > 0) {
    const file = certFileInput.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (file.size > maxSize) {
      alert('File size exceeds 5MB. Please upload a smaller file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      certData.fileData = e.target.result;
      certifications.push(certData);
      localStorage.setItem('companyCertifications', JSON.stringify(certifications));
      
      // Reset form
      document.getElementById('certificationType').value = '';
      document.getElementById('certDescription').value = '';
      document.getElementById('certFile').value = '';
      
      displayStoredCertifications();
      alert('Certificate added successfully!');
    };
    reader.readAsDataURL(file);
  } else {
    // No file, just store text
    certifications.push(certData);
    localStorage.setItem('companyCertifications', JSON.stringify(certifications));
    
    // Reset form
    document.getElementById('certificationType').value = '';
    document.getElementById('certDescription').value = '';
    
    displayStoredCertifications();
    alert('Certificate added successfully!');
  }
}

/**
 * Display stored certifications
 */
function displayStoredCertifications() {
  const container = document.getElementById('certificationsContainer');
  const certifications = JSON.parse(localStorage.getItem('companyCertifications')) || [];
  
  if (certifications.length === 0) {
    container.innerHTML = '<p class="text-muted">No certifications added yet.</p>';
    return;
  }
  
  let html = '<div class="alert alert-info" role="alert"><strong>Stored Certifications:</strong><ul class="mb-0">';
  certifications.forEach(cert => {
    html += `<li>
      <strong>${cert.type}</strong>`;
    if (cert.description) html += ` - ${cert.description}`;
    if (cert.fileName) html += ` <a href="#" onclick="viewCertification(${cert.id}); return false;" class="ms-2">📄 View</a>`;
    html += ` <button class="btn btn-sm btn-danger ms-2" onclick="deleteCertification(${cert.id})">Delete</button>`;
    html += `</li>`;
  });
  html += '</ul></div>';
  container.innerHTML = html;
}

/**
 */
function viewCertification(certId) {
  const certifications = JSON.parse(localStorage.getItem('companyCertifications')) || [];
  const cert = certifications.find(c => c.id === certId);
  
  if (!cert || !cert.fileData) {
    alert('Certificate file not found.');
    return;
  }
  
  // Open file in new tab
  window.open(cert.fileData, '_blank');
}

/**
 * Delete a certification
 */
function deleteCertification(certId) {
  if (!confirm('Are you sure you want to delete this certificate?')) return;
  
  let certifications = JSON.parse(localStorage.getItem('companyCertifications')) || [];
  certifications = certifications.filter(c => c.id !== certId);
  localStorage.setItem('companyCertifications', JSON.stringify(certifications));
  
  displayStoredCertifications();
  alert('Certificate deleted successfully!');
}

/**
 * Clear all certifications
 */
function clearCertifications() {
  if (!confirm('Are you sure you want to delete all certificates?')) return;
  localStorage.removeItem('companyCertifications');
  displayStoredCertifications();
  alert('All certificates cleared!');
}

/**
 * Get certifications for invoice display
 */
function getCertificationsForInvoice() {
  return JSON.parse(localStorage.getItem('companyCertifications')) || [];
}

