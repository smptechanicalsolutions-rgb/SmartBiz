/**
 * Single canonical app sidebar — same markup on every page.
 * Each page: <aside class="sidebar" id="sidebar" data-active="home"></aside>
 * Loads after inline navigateTo() so clicks use the page's routing.
 */
(function () {
  var ITEMS = [
    { key: 'home', icon: 'fa-home', label: 'Home' },
    { key: 'dashboard', icon: 'fa-chart-bar', label: 'Dashboard' },
    { key: 'products', icon: 'fa-box', label: 'Inventory' },
    { key: 'menu', icon: 'fa-bars', label: 'Menu' },
    { key: 'transactions', icon: 'fa-history', label: 'Stock History' },
    { key: 'business-card', icon: 'fa-id-card', label: 'Business Card' },
    { key: 'settings', icon: 'fa-cog', label: 'Settings' }
  ];

  function render(sidebar) {
    var raw = (sidebar.getAttribute('data-active') || 'home').trim();
    var active = raw === 'none' || raw === '-' ? '__none__' : raw;
    var navHtml = ITEMS.map(function (it) {
      if (it.type === 'divider') {
        return '<div style="height: 1px; background: rgba(255, 255, 255, 0.1); margin: 10px 0;"></div>';
      }
      
      var cls = active !== '__none__' && it.key === active ? 'sidebar-nav-item active' : 'sidebar-nav-item';
      var onclick = '';
      
      if (it.action) {
        onclick = ' onclick="' + it.action + '"';
      } else if (it.link) {
        return (
          '<a href="' + it.link + '" class="' + cls + '" style="text-decoration: none; color: white;">' +
          '<i class="fas ' + it.icon + '"></i>' +
          '<span>' + it.label + '</span>' +
          '</a>'
        );
      } else {
        onclick = ' onclick="navigateTo(\'' + it.key + '\')"';
      }
      
      return (
        '<div class="' + cls + '"' + onclick + '>' +
        '<i class="fas ' + it.icon + '"></i>' +
        '<span>' + it.label + '</span>' +
        '</div>'
      );
    }).join('');

    sidebar.innerHTML =
      '<div class="sidebar-header">' +
      '<div class="company-logo"><i class="fas fa-warehouse"></i></div>' +
      '<div class="company-name">SmartBiz Inventory</div>' +
      '<div class="company-tagline">Modern Stock Control</div>' +
      '</div>' +
      '<div class="sidebar-menu">' + navHtml + '</div>';
  }

  function mount() {
    var el = document.getElementById('sidebar');
    if (!el || el.getAttribute('data-sidebar-mounted') === '1') return;
    render(el);
    el.setAttribute('data-sidebar-mounted', '1');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
