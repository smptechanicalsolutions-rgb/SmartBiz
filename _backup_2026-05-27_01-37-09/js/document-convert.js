/**
 * Document conversion & history actions for Home quick actions and history UIs.
 */
(function () {
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem("invoiceHistory") || "[]");
    } catch {
      return [];
    }
  }

  function setHistory(history) {
    localStorage.setItem("invoiceHistory", JSON.stringify(history));
  }

  function findHistoryEntry(id) {
    const key = String(id);
    return getHistory().find((h) => String(h.id) === key) || null;
  }

  function formatForDocType(docType) {
    const map = {
      Invoice: "format1.html",
      "Delivery Challan": "format3.html",
      Quotation: "format5.html",
      Proforma: "format8.html",
    };
    return map[docType] || "format1.html";
  }

  function inferDocType(entry) {
    if (entry.docType) return entry.docType;
    const f = (entry.format || "").toLowerCase();
    if (f.includes("format3") || f.includes("format4") || f.includes("format11") || f.includes("format15") || f.includes("format16")) {
      return "Delivery Challan";
    }
    if (f.includes("format5") || f.includes("format6") || f.includes("format12") || f.includes("format17") || f.includes("format18")) {
      return "Quotation";
    }
    if (f.includes("format7") || f.includes("format8") || f.includes("format9") || f.includes("format19") || f.includes("format20")) {
      return "Proforma";
    }
    return "Invoice";
  }

  function getEntryData(entry) {
    const data = entry.fullData || entry;
    return typeof data === "object" ? data : entry;
  }

  function calculateGrandTotal(invoiceData, docType) {
    let taxable = 0;
    (invoiceData.items || []).forEach((item) => {
      taxable += (Number(item.qty) || 0) * (Number(item.rate) || 0);
    });

    const shippingTotal =
      docType === "Invoice" && invoiceData.shipping && invoiceData.shipping.total
        ? Number(invoiceData.shipping.total)
        : 0;

    let totalTax = 0;
    if (docType === "Invoice" && invoiceData.taxes && invoiceData.taxes.length > 0) {
      invoiceData.taxes.forEach((t) => {
        let percent = Number(t.percent) || 0;
        if (t.type === "GST") percent *= 2;
        totalTax += taxable * (percent / 100) + shippingTotal * (percent / 100);
      });
    }

    if (docType === "Quotation" || docType === "Delivery Challan") return taxable;
    return taxable + totalTax + shippingTotal;
  }

  function saveConvertedDocument(invoiceData, docType, format) {
    const grandTotal = calculateGrandTotal(invoiceData, docType);
    const historyEntry = {
      id: Date.now(),
      invoiceNo: invoiceData.invoiceNo || "",
      invoiceDate: invoiceData.invoiceDate || "",
      dueDate: invoiceData.dueDate || "",
      clientName: invoiceData.clientName || "",
      grandTotal: grandTotal.toFixed(2),
      totalAmount: grandTotal.toFixed(2),
      docType,
      format,
      createdAt: new Date().toISOString(),
      fullData: invoiceData,
    };

    let history = getHistory();
    history.push(historyEntry);
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (history.length > 100) history = history.slice(0, 100);
    setHistory(history);
    return historyEntry;
  }

  function openDocumentPreview(entry) {
    const data = getEntryData(entry);
    const docType = inferDocType(entry);
    const targetFormat = entry.format || formatForDocType(docType);
    data.docType = docType;
    data.format = targetFormat;
    localStorage.setItem("invoiceData", JSON.stringify(data));
    window.open("formats/" + targetFormat, "_blank");
  }

  function applyDueDates(convertedData, targetType) {
    if (targetType === "Quotation" && convertedData.invoiceDate) {
      const invoiceDate = new Date(convertedData.invoiceDate);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(invoiceDate.getDate() + 2);
      convertedData.dueDate = dueDate.toISOString().split("T")[0];
    }
    if (targetType === "Invoice" && convertedData.invoiceDate && !convertedData.dueDate) {
      const invoiceDate = new Date(convertedData.invoiceDate);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(invoiceDate.getDate() + 30);
      convertedData.dueDate = dueDate.toISOString().split("T")[0];
    }
  }

  window.inferDocType = inferDocType;

  window.convertDocument = function (id, targetType) {
    try {
      const entry = findHistoryEntry(id);
      if (!entry) {
        alert("Document not found.");
        return;
      }

      const originalData = JSON.parse(JSON.stringify(getEntryData(entry)));
      const targetFormat = formatForDocType(targetType);
      const convertedData = originalData;

      convertedData.docType = targetType;
      convertedData.format = targetFormat;
      applyDueDates(convertedData, targetType);

      localStorage.setItem("invoiceData", JSON.stringify(convertedData));
      window.open("formats/" + targetFormat, "_blank");
      saveConvertedDocument(convertedData, targetType, targetFormat);

      if (typeof window.closeConversionModal === "function") {
        window.closeConversionModal();
      }

      alert("Document converted to " + targetType + ". Preview opened in a new tab.");
    } catch (error) {
      console.error("convertDocument failed:", error);
      alert("Could not convert document. Please try again.");
    }
  };

  window.viewHistoryDocument = function (id) {
    try {
      const entry = findHistoryEntry(id);
      if (!entry) {
        alert("Document not found.");
        return;
      }
      openDocumentPreview(entry);
    } catch (error) {
      console.error("viewHistoryDocument failed:", error);
      alert("Could not open document.");
    }
  };

  window.downloadHistoryDocument = function (id) {
    window.viewHistoryDocument(id);
  };

  window.deleteHistoryDocument = function (id) {
    try {
      if (!confirm("Delete this document from history? This cannot be undone.")) return;
      const key = String(id);
      const history = getHistory().filter((h) => String(h.id) !== key);
      setHistory(history);
      if (typeof window.closeConversionModal === "function") {
        window.closeConversionModal();
        if (typeof window.openConversionModal === "function") {
          window.openConversionModal();
        }
      }
    } catch (error) {
      console.error("deleteHistoryDocument failed:", error);
      alert("Could not delete document.");
    }
  };
})();
