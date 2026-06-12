const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const list = [
  ['home.html', 'js/app-sidebar.js'],
  ['dashboard.html', 'js/app-sidebar.js'],
  ['product.html', 'js/app-sidebar.js'],
  ['menu.html', 'js/app-sidebar.js'],
  ['settings.html', 'js/app-sidebar.js'],
  ['invoice.html', 'js/app-sidebar.js'],
  ['propharma-invoice.html', 'js/app-sidebar.js'],
  ['personal-info.html', 'js/app-sidebar.js'],
  ['invoice-layouts.html', 'js/app-sidebar.js'],
  ['payment-receipt-history.html', 'js/app-sidebar.js'],
  ['company-card-generator.html', 'js/app-sidebar.js'],
  ['quotation-history.html', 'js/app-sidebar.js'],
  ['delivery-challan-history.html', 'js/app-sidebar.js'],
  ['dual-layout-template.html', 'js/app-sidebar.js'],
  ['formats/address.html', '../js/app-sidebar.js']
];

function tag(src) {
  return '    <script src="' + src + '"></script>';
}

for (const [rel, src] of list) {
  const fp = path.join(root, rel);
  let h = fs.readFileSync(fp, 'utf8');
  if (h.includes('<script src="' + src + '"></script>')) {
    console.log('skip', rel);
    continue;
  }
  if (!h.includes('</body>')) {
    console.error('no body', rel);
    continue;
  }
  h = h.replace('</body>', tag(src) + '\n</body>');
  fs.writeFileSync(fp, h, 'utf8');
  console.log('added', rel);
}
