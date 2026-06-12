// Show download/share options modal

function showDownloadOptions() {

  const modal = document.getElementById("downloadModal");

  if (modal) {

    modal.style.display = "block";

  }

}



// Close download modal

function closeDownloadModal() {

  const modal = document.getElementById("downloadModal");

  if (modal) {

    modal.style.display = "none";

  }

}



// Close modal when clicking outside

window.onclick = function (event) {

  const modal = document.getElementById("downloadModal");

  if (event.target == modal) {

    modal.style.display = "none";

  }

};



function ensurePdfLibraries() {

  if (typeof html2canvas !== "function") {

    throw new Error(

      "PDF library (html2canvas) is not loaded. Check your internet connection and refresh the page."

    );

  }

  if (!window.jspdf || !window.jspdf.jsPDF) {

    throw new Error(

      "PDF library (jsPDF) is not loaded. Check your internet connection and refresh the page."

    );

  }

}



function showAppNotification(message, type = 'success') {
  if (window.authGuard && typeof window.authGuard.showNotification === 'function') {
    window.authGuard.showNotification(message, type);
    return;
  }

  const existing = document.getElementById('smartsbiz-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'smartsbiz-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 320px;
    z-index: 99999;
    padding: 14px 18px;
    border-radius: 14px;
    font-family: Inter, Arial, sans-serif;
    font-size: 0.95rem;
    color: #fff;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.18);
    opacity: 0;
    transform: translateY(-10px);
    transition: opacity 220ms ease, transform 220ms ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3200);
}

function getDocumentMetaFromPath() {

  const currentPath = window.location.pathname.toLowerCase();

  let docType = "Invoice";

  let fileName = "GST_Invoice.pdf";


  if (
    currentPath.includes("format3") ||

    currentPath.includes("format4") ||

    currentPath.includes("format11") ||

    currentPath.includes("format15") ||

    currentPath.includes("format16") ||

    currentPath.includes("format23") ||

    currentPath.includes("format24")

  ) {

    docType = "Delivery Challan";

    fileName = "Delivery_Challan.pdf";

  } else if (

    currentPath.includes("format5") ||

    currentPath.includes("format6") ||

    currentPath.includes("format12") ||

    currentPath.includes("format17") ||

    currentPath.includes("format18") ||

    currentPath.includes("format25") ||

    currentPath.includes("format26")

  ) {

    docType = "Quotation";

    fileName = "Quotation.pdf";

  } else if (

    currentPath.includes("format7") ||

    currentPath.includes("format8") ||

    currentPath.includes("format9") ||

    currentPath.includes("format19") ||

    currentPath.includes("format20") ||

    currentPath.includes("format27") ||

    currentPath.includes("format28")

  ) {

    docType = "Proforma";

    fileName = "Proforma_Invoice.pdf";

  } else if (currentPath.includes("address")) {

    docType = "Address";

    fileName = "Address.pdf";

  }



  try {

    const invoiceData = JSON.parse(localStorage.getItem("invoiceData") || "null");

    if (invoiceData && invoiceData.invoiceNo) {

      const safeNo = String(invoiceData.invoiceNo).replace(/[^\w.-]+/g, "_");

      fileName = fileName.replace(".pdf", `_${safeNo}.pdf`);

    }

  } catch (e) {

    // keep default filename

  }



  return { docType, fileName };

}



function getInvoiceElement() {

  const invoice = document.getElementById("invoice");

  if (!invoice) {

    throw new Error("Invoice content not found on this page.");

  }

  return invoice;

}

function getEditorHomeUrl() {

  return /\/documents\/formats\//i.test(window.location.pathname)

    ? "../../index.html"

    : "../index.html";

}



async function renderInvoiceToPdf() {

  ensurePdfLibraries();

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF("p", "mm", "a4");

  const invoice = getInvoiceElement();

  await new Promise((resolve) => setTimeout(resolve, 50));



  const canvas = await html2canvas(invoice, {

    scale: 2,

    useCORS: true,

    logging: false,

    backgroundColor: "#ffffff",

    windowWidth: 1200,

    windowHeight: Math.max(invoice.scrollHeight || 1123, 1400),

    scrollX: 0,

    scrollY: 0,

    onclone: (clonedDocument) => {

      clonedDocument.documentElement.style.setProperty("width", "1200px", "important");

      clonedDocument.documentElement.style.setProperty("max-width", "none", "important");

      clonedDocument.body.classList.remove("mobile-a4-active");

      clonedDocument.body.style.setProperty("width", "1200px", "important");

      clonedDocument.body.style.setProperty("max-width", "none", "important");

      clonedDocument.body.style.setProperty("min-width", "1200px", "important");

      clonedDocument.body.style.setProperty("overflow", "visible", "important");

      clonedDocument.querySelectorAll(".mobile-preview-header, .mobile-preview-menu-list").forEach((el) => {

        el.style.setProperty("display", "none", "important");

      });

      clonedDocument.querySelectorAll(".mobile-preview-stage, .mobile-preview-shell, .mobile-preview-viewport").forEach((el) => {

        el.style.setProperty("transform", "none", "important");

        el.style.setProperty("width", "auto", "important");

        el.style.setProperty("height", "auto", "important");

        el.style.setProperty("overflow", "visible", "important");

        el.style.setProperty("max-width", "none", "important");

      });

      const clonedInvoice = clonedDocument.getElementById("invoice");

      if (clonedInvoice) {

        clonedInvoice.classList.remove("a4-preview-lock", "scaling");

        clonedInvoice.style.setProperty("transform", "none", "important");

        clonedInvoice.style.setProperty("width", "794px", "important");

        clonedInvoice.style.setProperty("min-width", "794px", "important");

        clonedInvoice.style.setProperty("max-width", "794px", "important");

        clonedInvoice.style.setProperty("margin", "0 auto", "important");

        clonedInvoice.style.setProperty("box-sizing", "border-box", "important");

        clonedInvoice.style.setProperty("overflow", "hidden", "important");

      }

    },

  });



  const imgData = canvas.toDataURL("image/png");

  const pageWidth = 210;

  const pageHeight = 297;

  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;

  let position = 0;



  pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);

  heightLeft -= pageHeight;



  while (heightLeft > 0) {

    position = heightLeft - imgHeight;

    pdf.addPage();

    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);

    heightLeft -= pageHeight;

  }



  return pdf;

}



// Direct PDF download

async function downloadPDFDirect() {

  closeDownloadModal();

  try {

    await downloadPDF();

  } catch (error) {

    console.error("PDF download failed:", error);

    alert(error.message || "Could not generate PDF. Please try again.");

  }

}



// Vector PDF export (browser Print to PDF)

function printVectorPDF() {

  try {

    closeDownloadModal();

  } catch (e) {}

  window.print();

}



// Original downloadPDF function

async function downloadPDF() {

  const pdf = await renderInvoiceToPdf();

  const { fileName } = getDocumentMetaFromPath();



  try {

    if (typeof saveInvoiceToHistory === "function") {
      saveInvoiceToHistory();
    }

  } catch (e) {

    console.warn("Could not save invoice to history:", e);

  }



  pdf.save(fileName);

}



/**

 * When opened from history with ?autoDownload=1, generate PDF after the page renders.

 */

function scheduleAutoPdfDownload() {

  const params = new URLSearchParams(window.location.search);

  if (params.get("autoDownload") !== "1") return;



  const run = () => {

    downloadPDFDirect().catch((error) => {

      console.error("Auto PDF download failed:", error);

    });

  };



  if (document.readyState === "complete") {

    setTimeout(run, 1200);

  } else {

    window.addEventListener("load", () => setTimeout(run, 1200));

  }

}



scheduleAutoPdfDownload();

if (typeof window.setupMobilePreview === "function") {
  window.addEventListener("load", window.setupMobilePreview);
}



/**

 * Delete current document from history.

 * Works when invoiceData.__historyId exists (set by history view).

 * Falls back to deleting by invoiceNo+docType if id not available.

 */

async function deleteCurrentDocument() {

  const data = JSON.parse(localStorage.getItem("invoiceData") || "null");

  if (!data) {

    alert("No document data found to delete.");

    return;

  }



  if (!confirm("Delete this document from history?")) return;



  const id = data.__historyId;

  const { docType } = getDocumentMetaFromPath();



  if (id) {

    try {

      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });

      if (res.ok) {

        try {

          let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];

          history = history.filter((h) => h.id !== id);

          localStorage.setItem("invoiceHistory", JSON.stringify(history));

        } catch (e) {}

        alert("Deleted from history.");

        window.location.href = getEditorHomeUrl();

        return;

      }

    } catch (e) {

      // ignore and fallback

    }

  }



  try {

    let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];

    const formatFile = window.location.pathname.split("/").pop() || "";

    history = history.filter(

      (h) =>

        !(

          (h.invoiceNo || "") === (data.invoiceNo || "") &&

          (h.docType || "") === docType &&

          (!h.format || h.format === formatFile)

        )

    );

    localStorage.setItem("invoiceHistory", JSON.stringify(history));

    alert("Deleted from local history.");

    window.location.href = getEditorHomeUrl();

  } catch (e) {

    alert("Failed to delete document.");

  }

}

window.SBDeleteCurrentDocument = deleteCurrentDocument;



// Generate PDF as blob for sharing

async function generatePDFBlob() {

  const pdf = await renderInvoiceToPdf();

  return pdf.output("blob");

}



// Share to WhatsApp

async function shareToWhatsApp() {

  closeDownloadModal();



  try {

    const pdfBlob = await generatePDFBlob();

    const { fileName } = getDocumentMetaFromPath();

    const file = new File([pdfBlob], fileName, { type: "application/pdf" });



    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {

      await navigator.share({

        title: "Document",

        text: "Please find the attached document",

        files: [file],

      });

    } else {

      const invoiceData = JSON.parse(localStorage.getItem("invoiceData") || "{}");

      const message = encodeURIComponent(

        `Document #${invoiceData.invoiceNo || "N/A"}\nDate: ${invoiceData.invoiceDate || "N/A"}\nPlease find the document attached.`

      );

      window.open(`https://wa.me/?text=${message}`, "_blank");

      await downloadPDF();

      alert("PDF downloaded. You can now attach it to WhatsApp manually.");

    }

  } catch (error) {

    console.error("Error sharing to WhatsApp:", error);

    try {

      await downloadPDF();

    } catch (e) {}

    alert("Please download the PDF and share it manually via WhatsApp.");

  }

}



// Alias used on some format pages

function shareViaWhatsApp() {

  return shareToWhatsApp();

}



// Save to Google Drive

async function saveToGoogleDrive() {

  closeDownloadModal();



  try {

    const pdfBlob = await generatePDFBlob();

    const { fileName } = getDocumentMetaFromPath();



    if (navigator.share) {

      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {

        await navigator.share({

          title: "Document",

          text: "Document PDF",

          files: [file],

        });

        return;

      }

    }



    await downloadPDF();

    setTimeout(() => {

      window.open("https://drive.google.com/drive/my-drive", "_blank");

      alert("PDF downloaded. Please upload it to Google Drive using the opened tab.");

    }, 500);

  } catch (error) {

    console.error("Error saving to Google Drive:", error);

    try {

      await downloadPDF();

    } catch (e) {}

    alert("PDF downloaded. Please upload it to Google Drive manually.");

  }

}



// Share via other apps (using Web Share API)

async function shareViaOtherApps() {

  closeDownloadModal();



  try {

    const pdfBlob = await generatePDFBlob();

    const { fileName } = getDocumentMetaFromPath();

    const file = new File([pdfBlob], fileName, { type: "application/pdf" });



    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {

      await navigator.share({

        title: "Document",

        text: "Please find the attached document",

        files: [file],

      });

    } else {

      await downloadPDF();

      alert("Web Share API not available. PDF downloaded. You can share it manually from your device.");

    }

  } catch (error) {

    console.error("Error sharing:", error);

    if (error.name !== "AbortError") {

      try {

        await downloadPDF();

      } catch (e) {}

      alert("PDF downloaded. You can share it manually from your device.");

    }

  }

}



/**

 * Save current invoice to history

 */

function saveInvoiceToHistory() {

  try {

    let invoiceData = JSON.parse(localStorage.getItem("invoiceData"));

    if (!invoiceData) {

      const pInvoiceNo = document.getElementById("pInvoiceNo");

      const pInvoiceDate = document.getElementById("pInvoiceDate");

      const pClient = document.getElementById("pClient");

      const pTotalEl = document.getElementById("pTotal");

      invoiceData = {

        invoiceNo: pInvoiceNo ? pInvoiceNo.innerText : "",

        invoiceDate: pInvoiceDate ? pInvoiceDate.innerText : "",

        clientName: pClient ? pClient.innerText : "",

        items: [],

        __previewTotal: pTotalEl ? pTotalEl.innerText : "",

      };

    }



    let taxable = 0;

    if (invoiceData.items && invoiceData.items.length > 0) {

      invoiceData.items.forEach((item) => {

        const amount = (item.qty || 0) * (item.rate || 0);

        taxable += amount;

      });

    }



    let totalTax = 0;

    function roundTo2(value) {
      return Math.round((Number(value) || 0) * 100) / 100;
    }

    const shippingTotal =
      invoiceData.shipping && invoiceData.shipping.total ? roundTo2(Number(invoiceData.shipping.total)) : 0;

    if (invoiceData.taxes && invoiceData.taxes.length > 0) {

      invoiceData.taxes.forEach((t) => {

        let percent = Number(t.percent) || 0;
        if (t.type === 'GST') percent *= 2;

        const productTax = roundTo2(taxable * (percent / 100));
        const shippingTax = roundTo2(shippingTotal * (percent / 100));

        totalTax = roundTo2(totalTax + productTax + shippingTax);

      });

    }



    let grandTotal = taxable + totalTax + shippingTotal;



    if (invoiceData.__previewTotal) {

      const parsed = Number(invoiceData.__previewTotal.replace(/[^0-9.-]+/g, ""));

      if (!isNaN(parsed)) grandTotal = parsed;

    }



    let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];

    const { docType } = getDocumentMetaFromPath();

    const formatFile = window.location.pathname.split("/").pop() || "format1.html";



    const existingIndex = history.findIndex(

      (inv) =>

        (inv.invoiceNo || "") === (invoiceData.invoiceNo || "") &&

        (inv.docType || "") === docType &&

        (invoiceData.invoiceNo || "").trim() !== ""

    );



    const historyEntry = {

      id: existingIndex !== -1 ? history[existingIndex].id : Date.now(),

      invoiceNo: invoiceData.invoiceNo || "",

      invoiceDate: invoiceData.invoiceDate || "",

      clientName: invoiceData.clientName || "",

      grandTotal: grandTotal.toFixed(2),

      docType,

      format: existingIndex !== -1 ? history[existingIndex].format : formatFile,

      createdAt: new Date().toISOString(),

      fullData: invoiceData,

    };



    if (existingIndex !== -1) {

      history[existingIndex] = historyEntry;

    } else {

      history.push(historyEntry);

    }



    localStorage.setItem("invoiceHistory", JSON.stringify(history));
    showAppNotification("Saved to history", "success");

    void (async () => {
      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(historyEntry),
        });

        if (res.ok) {
          const result = await res.json();
          if (result && result.id) {
            historyEntry.id = result.id;
            if (existingIndex === -1) {
              const persisted = JSON.parse(localStorage.getItem("invoiceHistory") || "[]");
              const updated = persisted.map((item) =>
                item.invoiceNo === historyEntry.invoiceNo && item.docType === historyEntry.docType
                  ? historyEntry
                  : item
              );
              localStorage.setItem("invoiceHistory", JSON.stringify(updated));
            }
          }
        }
      } catch (e) {
        // ignore network errors
      }
    })();

  } catch (error) {

    console.error("Error saving invoice to history:", error);

  }

}
