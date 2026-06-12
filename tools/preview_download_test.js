const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

(async () => {
  const base = 'http://localhost:3000';
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Prepare sample invoice data
  const sample = {
    companyName: 'Test Co',
    companyGST: '22AAAAA0000A1Z5',
    companyAddress: '1 Test Street',
    clientName: 'Client One',
    clientAddress: 'Client Address',
    invoiceNo: 'AUTO-TEST-' + Date.now(),
    invoiceDate: new Date().toISOString(),
    items: [ { name: 'Widget', qty: 1, rate: 100 } ]
  };

  // Visit root to set localStorage on same origin
  await page.goto(base, { waitUntil: 'networkidle2' });
  await page.evaluate((data) => {
    localStorage.setItem('invoiceData', JSON.stringify(data));
  }, sample);

  // Open format page which loads pdf.js
  const fmt = '/documents/formats/format1.html';
  await page.goto(base + fmt, { waitUntil: 'networkidle2' });

  // Call downloadPDFDirect() which will generate PDF and trigger saveInvoiceToHistory POST
  try {
    await page.evaluate(() => {
      if (typeof downloadPDFDirect === 'function') {
        downloadPDFDirect();
      } else if (typeof downloadPDF === 'function') {
        downloadPDF();
      } else {
        throw new Error('No download function available');
      }
    });
  } catch (e) {
    console.error('Error invoking download:', e.message);
  }

  // Wait briefly for POST to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Fetch history from server and look for our invoiceNo
  try {
    const res = await fetch(base + '/api/history');
    const json = await res.json();
    const found = json.history && json.history.find(h => h.invoiceNo === sample.invoiceNo);
    if (found) {
      console.log('TEST-PASS: history entry saved (id=' + found.id + ')');
    } else {
      console.error('TEST-FAIL: history entry not found');
      if (json.history && json.history.length) {
        console.log('Latest history item:', json.history[0].invoiceNo);
      }
    }
  } catch (e) {
    console.error('TEST-ERROR: could not fetch /api/history', e.message);
  }

  await browser.close();
  process.exit(0);
})();
