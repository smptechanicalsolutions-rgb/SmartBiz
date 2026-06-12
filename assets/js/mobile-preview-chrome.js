(function () {
  "use strict";

  var MOBILE_MAX = 793;
  var A4_WIDTH = 794;

  function isMobilePreview() {
    return window.matchMedia("(max-width: " + MOBILE_MAX + "px)").matches;
  }

  function isFormatPage() {
    return /\/(?:documents\/)?formats\//i.test(window.location.pathname) &&
      !!document.getElementById("invoice");
  }

  function fixViewportMeta() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
      );
    }
  }

  function ensureLockStylesheet() {
    if (document.getElementById("mobile-a4-lock-css")) return;
    var link = document.createElement("link");
    link.id = "mobile-a4-lock-css";
    link.rel = "stylesheet";
    link.href = "../format-css/mobile-a4-lock.css";
    document.head.appendChild(link);
  }

  function injectCriticalStyles() {
    if (document.getElementById("mobile-preview-critical-css")) return;

    var style = document.createElement("style");
    style.id = "mobile-preview-critical-css";
    style.textContent =
      "@media (max-width:" + MOBILE_MAX + "px){" +
      "html,body.mobile-a4-active{min-width:0!important;max-width:100vw!important;width:100%!important;overflow-x:hidden!important;}" +
      "body.mobile-a4-active{padding:56px 0 16px 0!important;background:#eef1f5!important;}" +
      "body.mobile-a4-active .sb-document-back,body.mobile-a4-active .action-buttons,body.mobile-a4-active .mobile-preview-toolbar{display:none!important;}" +
      ".mobile-preview-header{display:flex!important;position:fixed;top:0;left:0;right:0;z-index:10001;height:56px;padding:0 10px 0 8px;background:#fff;border-bottom:1px solid rgba(15,23,42,.08);align-items:center;gap:8px;box-shadow:0 2px 12px rgba(15,23,42,.06);}" +
      ".mobile-preview-back,.mobile-preview-share,.mobile-preview-menu-toggle{width:40px;height:40px;border:none;background:transparent;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#0f172a;flex-shrink:0;touch-action:manipulation;}" +
      ".mobile-preview-title{flex:1;min-width:0;text-align:center;font:600 16px/1.2 system-ui,sans-serif;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
      ".mobile-preview-actions{display:inline-flex;align-items:center;gap:2px;flex-shrink:0;}" +
      ".mobile-preview-share{color:#0a4b78;}" +
      ".mobile-preview-menu{position:relative;}" +
      ".mobile-preview-menu-list{position:absolute;top:calc(100% + 10px);right:0;min-width:220px;border-radius:14px;background:#fff;border:1px solid rgba(15,23,42,.08);box-shadow:0 18px 40px rgba(15,23,42,.16);display:none;flex-direction:column;overflow:hidden;z-index:10002;}" +
      ".mobile-preview-menu.open .mobile-preview-menu-list{display:flex;}" +
      ".mobile-preview-menu-item{width:100%;padding:14px 16px;border:none;background:#fff;text-align:left;font:15px system-ui,sans-serif;color:#0f172a;cursor:pointer;touch-action:manipulation;}" +
      ".mobile-preview-menu-item--danger{color:#dc2626;}" +
      ".mobile-preview-menu-item+.mobile-preview-menu-item{border-top:1px solid rgba(15,23,42,.06);}" +
      ".mobile-preview-viewport{width:100%;max-width:100vw;overflow:hidden;display:flex;justify-content:center;align-items:flex-start;}" +
      ".mobile-preview-shell{overflow:hidden;flex-shrink:0;}" +
      ".mobile-preview-stage{width:" + A4_WIDTH + "px;transform-origin:0 0;will-change:transform;}" +
      "@media print{.mobile-preview-header,.mobile-preview-menu-list{display:none!important;}.mobile-preview-stage{transform:none!important;}}" +
      "}";

    document.head.appendChild(style);
  }

  function getMobilePreviewTitle() {
    try {
      var data = JSON.parse(localStorage.getItem("invoiceData") || "null");
      if (data && data.docType) return data.docType;
    } catch (e) { /* ignore */ }

    var heading = document.querySelector(
      "#invoice h1, #invoice h2, #invoice .invoice-title, #invoice .doc-title, #invoice .invoice-info h2, #invoice .proforma3-header-title .title"
    );
    if (heading && heading.textContent.trim()) {
      return heading.textContent.trim();
    }
    return "Document Preview";
  }

  function hideLegacyControls() {
    document.querySelectorAll(".action-buttons").forEach(function (el) {
      el.style.setProperty("display", "none", "important");
    });
    document.querySelectorAll(".mobile-preview-toolbar").forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll(".mobile-preview-feature-strip").forEach(function (el) {
      el.remove();
    });
    var legacyBack = document.getElementById("sbDocumentBack");
    if (legacyBack) legacyBack.style.setProperty("display", "none", "important");
  }

  function ensureViewport() {
    var invoice = document.getElementById("invoice");
    if (!invoice) return null;

    if (document.querySelector(".mobile-preview-viewport")) {
      return document.querySelector(".mobile-preview-viewport");
    }

    var viewport = document.createElement("div");
    viewport.className = "mobile-preview-viewport";
    var shell = document.createElement("div");
    shell.className = "mobile-preview-shell";
    var stage = document.createElement("div");
    stage.className = "mobile-preview-stage";

    var parent = invoice.parentElement;
    parent.insertBefore(viewport, invoice);
    stage.appendChild(invoice);
    shell.appendChild(stage);
    viewport.appendChild(shell);

    return viewport;
  }

  function applyMobileScale() {
    if (!isMobilePreview()) return;

    var invoice = document.getElementById("invoice");
    if (!invoice) return;

    ensureViewport();

    var stage = invoice.parentElement;
    var shell = stage && stage.parentElement;
    if (!stage || !shell || !stage.classList.contains("mobile-preview-stage")) return;

    invoice.classList.add("a4-preview-lock");
    invoice.style.removeProperty("transform");
    invoice.style.removeProperty("margin-bottom");

    var naturalHeight = Math.max(invoice.offsetHeight, invoice.scrollHeight, invoice.getBoundingClientRect().height);
    var pad = 16;
    var available = Math.max(window.innerWidth - pad * 2, 280);
    var scale = Math.min(1, available / A4_WIDTH);

    stage.style.width = A4_WIDTH + "px";
    stage.style.height = Math.ceil(naturalHeight) + "px";
    stage.style.transform = "scale(" + scale + ")";
    stage.style.transformOrigin = "0 0";

    shell.style.width = Math.ceil(A4_WIDTH * scale) + "px";
    shell.style.height = Math.ceil(naturalHeight * scale) + "px";
    shell.style.overflow = "hidden";
  }

  function buildChrome() {
    injectCriticalStyles();
    ensureLockStylesheet();
    hideLegacyControls();
    document.body.classList.add("mobile-a4-active");

    var header = document.querySelector(".mobile-preview-header");
    if (!header) {
      header = document.createElement("header");
      header.className = "mobile-preview-header";
      header.innerHTML =
        '<button type="button" class="mobile-preview-back" aria-label="Go back" onclick="SBMobileActions.back()">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</button>" +
        '<div class="mobile-preview-title"></div>' +
        '<div class="mobile-preview-actions">' +
        '<button type="button" class="mobile-preview-share" aria-label="Share document" onclick="SBMobileActions.share()">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 3V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 8L12 3L17 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</button>" +
        '<div class="mobile-preview-menu">' +
        '<button type="button" class="mobile-preview-menu-toggle" aria-label="More options">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>' +
        "</button>" +
        '<div class="mobile-preview-menu-list">' +
        '<button type="button" class="mobile-preview-menu-item" onclick="SBMobileActions.cancel();document.querySelector(\'.mobile-preview-menu\').classList.remove(\'open\')">Cancel Invoice</button>' +
        '<button type="button" class="mobile-preview-menu-item" onclick="SBMobileActions.edit();document.querySelector(\'.mobile-preview-menu\').classList.remove(\'open\')">Edit Invoice</button>' +
        '<button type="button" class="mobile-preview-menu-item" onclick="SBMobileActions.print();document.querySelector(\'.mobile-preview-menu\').classList.remove(\'open\')">Print</button>' +
        '<button type="button" class="mobile-preview-menu-item" onclick="SBMobileActions.share();document.querySelector(\'.mobile-preview-menu\').classList.remove(\'open\')">Download / Share</button>' +
        '<button type="button" class="mobile-preview-menu-item mobile-preview-menu-item--danger" onclick="SBMobileActions.delete();document.querySelector(\'.mobile-preview-menu\').classList.remove(\'open\')">Delete</button>' +
        "</div></div></div>";
      document.body.insertBefore(header, document.body.firstChild);

    }

    header.style.setProperty("display", "flex", "important");
    var titleEl = header.querySelector(".mobile-preview-title");
    if (titleEl) titleEl.textContent = getMobilePreviewTitle();

    var menu = header.querySelector(".mobile-preview-menu");
    var menuToggle = header.querySelector(".mobile-preview-menu-toggle");
    if (menuToggle && menu && !menuToggle.dataset.bound) {
      menuToggle.dataset.bound = "1";
      menuToggle.addEventListener("click", function (event) {
        event.stopPropagation();
        menu.classList.toggle("open");
      });
      document.addEventListener("click", function (event) {
        if (!header.contains(event.target)) menu.classList.remove("open");
      });
    }
  }

  function setupMobilePreview() {
    if (!isMobilePreview() || !isFormatPage()) {
      document.body.classList.remove("mobile-a4-active");
      return;
    }
    fixViewportMeta();
    buildChrome();
    applyMobileScale();
    setTimeout(applyMobileScale, 300);
    setTimeout(applyMobileScale, 1000);
    setTimeout(applyMobileScale, 2000);
  }

  window.setupMobilePreview = setupMobilePreview;
  window.applyMobileInvoiceScale = applyMobileScale;

  window.addEventListener("load", setupMobilePreview);
  window.addEventListener("DOMContentLoaded", setupMobilePreview);
  window.addEventListener("resize", setupMobilePreview);
})();
