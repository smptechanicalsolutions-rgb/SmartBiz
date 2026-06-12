(function () {
  "use strict";

  function editorHomeUrl() {
    return /\/documents\/formats\//i.test(window.location.pathname)
      ? "../../index.html"
      : "../index.html";
  }

  function currentFormat() {
    try {
      var data = JSON.parse(localStorage.getItem("invoiceData") || "null");
      return window.location.pathname.split("/").pop() || (data && data.format) || "format1.html";
    } catch (e) {
      return window.location.pathname.split("/").pop() || "format1.html";
    }
  }

  function editorUrlWithFormat() {
    return editorHomeUrl() + "?format=" + encodeURIComponent(currentFormat());
  }

  function goBack() {
    try {
      var data = JSON.parse(localStorage.getItem("invoiceData") || "null");
      if (data) {
        data.format = currentFormat();
        localStorage.setItem("invoiceData", JSON.stringify(data));
      }
    } catch (e) {
      /* ignore */
    }
    window.location.href = editorUrlWithFormat();
  }

  function editDocument() {
    if (typeof editRenderedDocument === "function") {
      editRenderedDocument();
      return;
    }
    try {
      var data = JSON.parse(localStorage.getItem("invoiceData") || "null");
      var format = currentFormat();
      if (data) {
        data.format = format;
        localStorage.setItem("invoiceData", JSON.stringify(data));
      }
      window.location.href = editorHomeUrl() + "?format=" + encodeURIComponent(format);
      return;
    } catch (e) { /* ignore */ }
    window.location.href = editorHomeUrl();
  }

  function cancelDocument() {
    if (typeof cancelInvoice === "function") {
      cancelInvoice();
      return;
    }
    if (!window.confirm("Cancel and clear saved document data?")) return;
    localStorage.removeItem("invoiceData");
    window.location.href = editorHomeUrl();
  }

  function printDocument() {
    if (typeof printVectorPDF === "function") {
      printVectorPDF();
      return;
    }
    window.print();
  }

  function deleteDocument() {
    if (typeof deleteCurrentDocument === "function") {
      deleteCurrentDocument();
      return;
    }
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    localStorage.removeItem("invoiceData");
    window.location.href = editorHomeUrl();
  }

  function shareDocument() {
    if (typeof showDownloadOptions === "function") {
      showDownloadOptions();
      return;
    }

    var title = "Document Preview";
    try {
      var data = JSON.parse(localStorage.getItem("invoiceData") || "null");
      if (data && data.docType) title = data.docType;
    } catch (e) { /* ignore */ }

    if (navigator.share) {
      navigator.share({
        title: title,
        text: "Please review this document.",
        url: window.location.href
      }).catch(function () {
        if (typeof shareToWhatsApp === "function") shareToWhatsApp();
      });
      return;
    }

    if (typeof shareToWhatsApp === "function") {
      shareToWhatsApp();
    }
  }

  function normalizeInvoiceTaxes(taxes) {
    if (!Array.isArray(taxes)) return [];
    const normalized = [];
    let hasSplitGst = false;

    taxes.forEach((tax) => {
      if (!tax || !tax.type) return;
      const type = String(tax.type || "").trim().toUpperCase();
      const percent = Number(tax.percent) || 0;
      if (!type || !percent) return;
      if (type === "CGST" || type === "SGST") {
        hasSplitGst = true;
      }
      normalized.push({ type, percent, desc: String(tax.desc || "") });
    });

    if (hasSplitGst) {
      return normalized.filter((tax) => tax.type !== "GST");
    }

    const seen = new Set();
    return normalized.filter((tax) => {
      const key = `${tax.type}|${tax.percent}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  window.SBMobileActions = {
    back: goBack,
    edit: editDocument,
    cancel: cancelDocument,
    print: printDocument,
    delete: deleteDocument,
    share: shareDocument
  };
})();
