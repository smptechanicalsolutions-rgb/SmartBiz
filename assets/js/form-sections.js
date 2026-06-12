/**
 * Form Section Toggle & Management Functions
 * Handles show/hide sections and save/manage/clear operations
 */

// ========== SECTION TOGGLE FUNCTIONS ==========
function toggleCompanySection() {
  const container = document.getElementById('companyContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleClientSection() {
  const container = document.getElementById('clientContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleInvoiceInfoSection() {
  const container = document.getElementById('invoiceInfoContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleCertificationsSection() {
  const container = document.getElementById('certContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleTaxesSection() {
  const container = document.getElementById('taxContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleProductSection() {
  const container = document.getElementById('itemsContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleStampSection() {
  const container = document.getElementById('stampContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function togglePaymentSection() {
  const container = document.getElementById('paymentContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleShippingSection() {
  const container = document.getElementById('shippingContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleWatermarkSection() {
  const container = document.getElementById('watermarkContainer');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

// ========== INVOICE INFO FUNCTIONS ==========
function saveInvoiceInfo() {
  const invoiceInfo = {
    invoiceNo: document.getElementById('invoiceNo')?.value || '',
    invoiceDate: document.getElementById('invoiceDate')?.value || '',
    dueDate: document.getElementById('dueDate')?.value || '',
    poNumber: document.getElementById('poNumber')?.value || '',
    poDate: document.getElementById('poDate')?.value || '',
    placeSupply: document.getElementById('placeSupply')?.value || ''
  };
  localStorage.setItem('invoiceInfo', JSON.stringify(invoiceInfo));
  alert('Invoice information saved successfully!');
}

function manageInvoiceInfo() {
  const info = JSON.parse(localStorage.getItem('invoiceInfo') || '{}');
  if (Object.keys(info).length === 0) {
    alert('No saved invoice information found.');
    return;
  }
  
  const details = Object.entries(info)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  alert('Saved Invoice Info:\n' + details);
}

function clearInvoiceInfoData() {
  if (confirm('Clear all saved invoice information?')) {
    localStorage.removeItem('invoiceInfo');
    document.getElementById('invoiceNo').value = '';
    document.getElementById('invoiceDate').value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('poNumber').value = '';
    document.getElementById('poDate').value = '';
    document.getElementById('placeSupply').value = '';
    alert('Invoice information cleared!');
  }
}

// ========== CERTIFICATION FUNCTIONS ==========
function addCertification() {
  const certDiv = document.getElementById('certContainer');
  if (!certDiv) return;

  const count = certDiv.querySelectorAll('.cert-row').length + 1;
  const html = `
    <div class="cert-row input-group mb-2" style="display: flex; gap: 10px; align-items: center;">
      <input type="text" class="form-control cert-name" placeholder="Certificate Name" />
      <input type="text" class="form-control cert-number" placeholder="Certificate Number" style="flex: 0.8;" />
      <input type="date" class="form-control cert-date" style="flex: 0.7;" />
      <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  certDiv.insertAdjacentHTML('beforeend', html);
}

function clearCertifications() {
  if (confirm('Clear all certifications?')) {
    const certDiv = document.getElementById('certContainer');
    const rows = certDiv?.querySelectorAll('.cert-row');
    rows?.forEach(row => row.remove());
    alert('Certifications cleared!');
  }
}

// ========== TAX TEMPLATE FUNCTIONS ==========
function saveTaxTemplate() {
  const rows = document.querySelectorAll('#taxContainer .tax-row');
  const taxes = [];
  rows.forEach(r => {
    const type = r.querySelector('.tax-type')?.value || '';
    const percent = r.querySelector('.tax-percent')?.value || '';
    const desc = r.querySelector('.tax-desc')?.value || '';
    if (type || percent) {
      taxes.push({ type, percent, desc });
    }
  });

  if (taxes.length === 0) {
    alert('No taxes to save!');
    return;
  }

  const name = prompt('Enter template name:', 'Tax Template ' + new Date().toLocaleDateString());
  if (!name) return;

  let templates = JSON.parse(localStorage.getItem('taxTemplates') || '[]');
  templates.push({ name, taxes, createdAt: new Date().toISOString() });
  localStorage.setItem('taxTemplates', JSON.stringify(templates));
  alert('Tax template saved: ' + name);
}

function manageTaxTemplates() {
  let templates = JSON.parse(localStorage.getItem('taxTemplates') || '[]');
  
  if (templates.length === 0) {
    alert('No saved tax templates.');
    return;
  }

  let list = templates.map((t, i) => `${i + 1}. ${t.name} (${t.taxes.length} taxes)`).join('\n');
  const idx = prompt('Select template to load (enter number):\n' + list);
  
  if (idx && templates[parseInt(idx) - 1]) {
    loadTaxTemplate(parseInt(idx) - 1);
  }
}

function loadTaxTemplate(index) {
  let templates = JSON.parse(localStorage.getItem('taxTemplates') || '[]');
  const template = templates[index];
  
  if (!template) return;

  const taxContainer = document.getElementById('taxContainer');
  taxContainer.innerHTML = '';
  
  template.taxes.forEach(tax => {
    addTaxRow(tax.type, tax.percent, tax.desc);
  });
  
  alert('Tax template loaded: ' + template.name);
}

function addTaxRow(type = '', percent = '', desc = '') {
  const container = document.getElementById('taxContainer');
  const html = `
    <div class="tax-row input-group mb-2" style="display: flex; gap: 10px;">
      <input type="text" class="form-control tax-type" placeholder="Tax Type" value="${type}" />
      <input type="number" class="form-control tax-percent" placeholder="Percentage" step="0.01" value="${percent}" style="flex: 0.7;" />
      <input type="text" class="form-control tax-desc" placeholder="Description" value="${desc}" style="flex: 0.8;" />
      <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

function clearTaxData() {
  if (confirm('Clear all taxes?')) {
    const container = document.getElementById('taxContainer');
    container.innerHTML = '';
    alert('Taxes cleared!');
  }
}

// ========== PRODUCT TEMPLATE FUNCTIONS ==========
function saveProductTemplate() {
  const rows = document.querySelectorAll('#itemsContainer .item-row');
  const items = [];
  rows.forEach(r => {
    const name = r.querySelector('.item-name')?.value || '';
    const qty = r.querySelector('.item-qty')?.value || '';
    const rate = r.querySelector('.item-rate')?.value || '';
    const hsn = r.querySelector('.item-hsn')?.value || '';
    const tax = r.querySelector('.item-tax')?.value || '';
    const per = r.querySelector('.item-per')?.value || 'Nos';
    const desc = r.querySelector('.item-desc')?.value || '';
    if (name || qty || rate) {
      items.push({ name, qty, rate, hsn, tax, per, desc });
    }
  });

  if (items.length === 0) {
    alert('No items to save!');
    return;
  }

  const name = prompt('Enter template name:', 'Product Template ' + new Date().toLocaleDateString());
  if (!name) return;

  let templates = JSON.parse(localStorage.getItem('productTemplates') || '[]');
  templates.push({ name, items, createdAt: new Date().toISOString() });
  localStorage.setItem('productTemplates', JSON.stringify(templates));
  alert('Product template saved: ' + name);
}

function manageProductTemplates() {
  let templates = JSON.parse(localStorage.getItem('productTemplates') || '[]');
  
  if (templates.length === 0) {
    alert('No saved product templates.');
    return;
  }

  let list = templates.map((t, i) => `${i + 1}. ${t.name} (${t.items.length} items)`).join('\n');
  const idx = prompt('Select template to load (enter number):\n' + list);
  
  if (idx && templates[parseInt(idx) - 1]) {
    loadProductTemplate(parseInt(idx) - 1);
  }
}

function loadProductTemplate(index) {
  let templates = JSON.parse(localStorage.getItem('productTemplates') || '[]');
  const template = templates[index];
  
  if (!template) return;

  const itemContainer = document.getElementById('itemsContainer');
  itemContainer.innerHTML = '';
  
  template.items.forEach(item => {
    addProductRow(item.name, item.qty, item.rate, item.hsn, item.tax, item.per, item.desc);
  });
  
  alert('Product template loaded: ' + template.name);
}

function addProductRow(name = '', qty = '', rate = '', hsn = '', tax = '', per = 'Nos', desc = '') {
  const container = document.getElementById('itemsContainer');
  const html = `
    <div class="item-row" style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
      <input type="text" class="form-control item-name" placeholder="Item Name" value="${name}" />
      <input type="number" class="form-control item-qty" placeholder="Qty" value="${qty}" style="flex: 0.5;" />
      <input type="number" class="form-control item-rate" placeholder="Rate" step="0.01" value="${rate}" style="flex: 0.6;" />
      <input type="text" class="form-control item-hsn" placeholder="HSN" value="${hsn}" style="flex: 0.5;" />
      <input type="text" class="form-control item-tax" placeholder="Tax %" value="${tax}" style="flex: 0.5;" />
      <select class="form-control item-per" style="flex: 0.5;">
        <option value="Nos" ${per === 'Nos' ? 'selected' : ''}>Nos</option>
        <option value="Kg" ${per === 'Kg' ? 'selected' : ''}>Kg</option>
        <option value="L" ${per === 'L' ? 'selected' : ''}>L</option>
        <option value="Meter" ${per === 'Meter' ? 'selected' : ''}>Meter</option>
      </select>
      <input type="text" class="form-control item-desc" placeholder="Description" value="${desc}" />
      <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

// ========== STAMP FUNCTIONS ==========
function applyStamp() {
  const topText = document.getElementById('stampTopText')?.value || '';
  const bottomText = document.getElementById('stampBottomText')?.value || 'OFFICIAL';
  const centerText = document.getElementById('stampCompanyName')?.value || '';
  const color = document.querySelector('.stamp-color-swatch.selected')?.dataset?.color || '#000000';
  
  if (typeof StampTool !== 'undefined' && StampTool.saveStamp) {
    StampTool.saveStamp(topText, bottomText, centerText, 140, color);
  }
  alert('Stamp saved successfully! Open Preview Document to see it.');
}

function testNewStamp() {
  applyStamp();
}

// ========== PAYMENT FUNCTIONS ==========
function savePayment() {
  const note = document.getElementById('paymentNoteSingle')?.value || '';
  if (!note) {
    alert('Enter payment instructions first!');
    return;
  }
  
  let payments = JSON.parse(localStorage.getItem('savedPayments') || '[]');
  const name = prompt('Enter payment template name:', 'Payment ' + new Date().toLocaleDateString());
  if (!name) return;
  
  payments.push({ name, note, createdAt: new Date().toISOString() });
  localStorage.setItem('savedPayments', JSON.stringify(payments));
  alert('Payment template saved: ' + name);
}

function loadSavedPayment() {
  let payments = JSON.parse(localStorage.getItem('savedPayments') || '[]');
  if (payments.length === 0) {
    alert('No saved payment templates.');
    return;
  }
  
  let list = payments.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
  const idx = prompt('Select payment template:\n' + list);
  
  if (idx && payments[parseInt(idx) - 1]) {
    document.getElementById('paymentNoteSingle').value = payments[parseInt(idx) - 1].note;
    alert('Payment template loaded!');
  }
}

function removeSavedPayment() {
  let payments = JSON.parse(localStorage.getItem('savedPayments') || '[]');
  if (payments.length === 0) {
    alert('No saved payment templates.');
    return;
  }
  
  let list = payments.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
  const idx = prompt('Select payment template to delete:\n' + list);
  
  if (idx && payments[parseInt(idx) - 1]) {
    payments.splice(parseInt(idx) - 1, 1);
    localStorage.setItem('savedPayments', JSON.stringify(payments));
    alert('Payment template deleted!');
  }
}

function managePayments() {
  let payments = JSON.parse(localStorage.getItem('savedPayments') || '[]');
  if (payments.length === 0) {
    alert('No saved payment templates.');
    return;
  }
  
  let details = payments.map((p, i) => `${i + 1}. ${p.name}\n   ${p.note}`).join('\n\n');
  alert('Saved Payment Templates:\n\n' + details);
}

// ========== SHIPPING FUNCTIONS ==========
function saveShipping() {
  const rows = document.querySelectorAll('#shippingContainer .shipping-row');
  let total = 0;
  const items = [];
  rows.forEach(r => {
    const desc = r.querySelector('.shipping-desc')?.value || '';
    const amt = parseFloat(r.querySelector('.shipping-amount')?.value || 0);
    if (desc || amt) {
      items.push({ desc, amount: amt });
      total += amt;
    }
  });
  
  if (items.length === 0) {
    alert('No shipping charges to save!');
    return;
  }
  
  let shippingTemplates = JSON.parse(localStorage.getItem('shippingTemplates') || '[]');
  const name = prompt('Enter shipping template name:', 'Shipping ' + new Date().toLocaleDateString());
  if (!name) return;
  
  shippingTemplates.push({ name, items, total, createdAt: new Date().toISOString() });
  localStorage.setItem('shippingTemplates', JSON.stringify(shippingTemplates));
  alert('Shipping template saved: ' + name);
}

function loadSavedShipping() {
  let templates = JSON.parse(localStorage.getItem('shippingTemplates') || '[]');
  if (templates.length === 0) {
    alert('No saved shipping templates.');
    return;
  }
  
  let list = templates.map((t, i) => `${i + 1}. ${t.name} (₹${t.total})`).join('\n');
  const idx = prompt('Select shipping template:\n' + list);
  
  if (idx && templates[parseInt(idx) - 1]) {
    loadShippingTemplate(parseInt(idx) - 1);
  }
}

function loadShippingTemplate(index) {
  let templates = JSON.parse(localStorage.getItem('shippingTemplates') || '[]');
  const template = templates[index];
  
  if (!template) return;

  const shippingContainer = document.getElementById('shippingContainer');
  shippingContainer.innerHTML = '';
  
  template.items.forEach(item => {
    addShippingRow(item.desc, item.amount);
  });
  
  alert('Shipping template loaded: ' + template.name);
}

function addShippingRow(desc = '', amount = '') {
  const container = document.getElementById('shippingContainer');
  const html = `
    <div class="shipping-row input-group mb-2" style="display: flex; gap: 10px; align-items: center;">
      <input type="text" class="form-control shipping-desc" placeholder="Description" value="${desc}" />
      <input type="number" class="form-control shipping-amount" placeholder="Amount" step="0.01" value="${amount}" style="flex: 0.6;" />
      <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

function removeSavedShipping() {
  let templates = JSON.parse(localStorage.getItem('shippingTemplates') || '[]');
  if (templates.length === 0) {
    alert('No saved shipping templates.');
    return;
  }
  
  let list = templates.map((t, i) => `${i + 1}. ${t.name}`).join('\n');
  const idx = prompt('Select shipping template to delete:\n' + list);
  
  if (idx && templates[parseInt(idx) - 1]) {
    templates.splice(parseInt(idx) - 1, 1);
    localStorage.setItem('shippingTemplates', JSON.stringify(templates));
    alert('Shipping template deleted!');
  }
}

function manageShipping() {
  let templates = JSON.parse(localStorage.getItem('shippingTemplates') || '[]');
  if (templates.length === 0) {
    alert('No saved shipping templates.');
    return;
  }
  
  let details = templates.map((t, i) => {
    let items = t.items.map(item => `  - ${item.desc}: ₹${item.amount}`).join('\n');
    return `${i + 1}. ${t.name} (Total: ₹${t.total})\n${items}`;
  }).join('\n\n');
  
  alert('Saved Shipping Templates:\n\n' + details);
}
