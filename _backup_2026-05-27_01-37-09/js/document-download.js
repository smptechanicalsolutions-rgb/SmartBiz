function defaultFormatForDocType(docType) {
  if (docType === "Delivery Challan") return "format3.html";
  if (docType === "Quotation") return "format5.html";
  if (docType === "Proforma") return "format8.html";
  return "format1.html";
}

function downloadDocument(id) {
  try {
    const history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
    const historyEntry = history.find((i) => i.id === id);

    if (!historyEntry) {
      alert("Document not found");
      return;
    }

    const documentData = historyEntry.fullData || historyEntry;
    const targetFormat =
      historyEntry.format || defaultFormatForDocType(documentData.docType || historyEntry.docType);

    localStorage.setItem("invoiceData", JSON.stringify(documentData));
    window.open(`formats/${targetFormat}?autoDownload=1`, "_blank");
  } catch (error) {
    console.error("Error downloading document:", error);
    alert("Error downloading document. Please try again.");
  }
}
