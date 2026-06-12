/**
 * Apply centered watermark on all invoice preview templates.
 */
(function () {
  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem("appSettings") || "{}");
    } catch {
      return {};
    }
  }

  function getInvoiceData() {
    if (typeof window.invoicePreviewData !== "undefined" && window.invoicePreviewData) {
      return window.invoicePreviewData;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get("data");
      if (dataParam) {
        return JSON.parse(decodeURIComponent(dataParam));
      }
      return JSON.parse(localStorage.getItem("invoiceData") || "null");
    } catch {
      try {
        return JSON.parse(localStorage.getItem("invoiceData") || "null");
      } catch {
        return null;
      }
    }
  }

  function resolveWatermarkConfig(data) {
    const settings = getSettings();
    const fromInvoice = (data && data.watermark) || {};
    let enabled = !!fromInvoice.enabled;
    let text = (fromInvoice.text || "").toString().trim();

    if (!text && settings.watermarkText) {
      text = String(settings.watermarkText).trim();
    }
    if (!enabled && settings.watermarkEnable) {
      enabled = true;
    }
    if (enabled && !text) {
      text = "OFFICIAL";
    }

    return { enabled, text };
  }

  const MIN_PAGE_HEIGHT = 1122;

  function ensureInvoicePageHeight(invoice) {
    if (!invoice) return;
    let spacer = invoice.querySelector(":scope > .invoice-page-spacer");
    if (!spacer) {
      spacer = document.createElement("div");
      spacer.className = "invoice-page-spacer";
      spacer.setAttribute("aria-hidden", "true");
      invoice.appendChild(spacer);
    }
    invoice.style.minHeight = MIN_PAGE_HEIGHT + "px";
    void invoice.offsetHeight;
    if (invoice.scrollHeight < MIN_PAGE_HEIGHT) {
      invoice.style.height = MIN_PAGE_HEIGHT + "px";
    } else {
      invoice.style.removeProperty("height");
    }
  }

  function centerWatermarkText(invoice, box, wmText) {
    if (!invoice || !box || !wmText) return;
    const w = invoice.clientWidth;
    const h = invoice.clientHeight;
    box.style.top = "0";
    box.style.left = "0";
    box.style.width = w + "px";
    box.style.height = h + "px";
    box.style.right = "auto";
    box.style.bottom = "auto";
    wmText.style.position = "absolute";
    wmText.style.setProperty("top", h / 2 + "px", "important");
    wmText.style.setProperty("left", w / 2 + "px", "important");
    wmText.style.right = "auto";
    wmText.style.bottom = "auto";
    wmText.style.margin = "0";
    wmText.style.width = "max-content";
    wmText.style.height = "max-content";
    wmText.style.maxWidth = "90%";
    wmText.style.setProperty(
      "transform",
      "translate(-50%, -50%) rotate(-35deg)",
      "important"
    );

    // Allow wrapping and dynamic sizing if text overflows the invoice area
    try {
      wmText.style.whiteSpace = 'pre-wrap';
      wmText.style.textAlign = 'center';

      // Measure and adjust: prefer a simple wrap before reducing font-size
      const adjust = function () {
        // reset possible manual changes
        wmText.style.fontSize = '';
        wmText.innerHTML = (wmText._rawText || wmText.textContent).toString().toUpperCase();

        const bbox = wmText.getBoundingClientRect();
        const fitsHoriz = bbox.width <= w * 0.92;
        const fitsVert = bbox.height <= h * 0.92;

        if (!fitsHoriz || !fitsVert) {
          // Try wrapping: if there are 3+ words, put last word on a new line
          const words = (wmText._rawText || wmText.textContent).toString().trim().split(/\s+/);
          if (words.length >= 3) {
            wmText.innerHTML = words.slice(0, words.length - 1).join(' ') + '<br/>' + words[words.length - 1];
            // Slightly lift center so bottom line appears below middle
            wmText.style.setProperty('transform', 'translate(-50%, -42%) rotate(-35deg)', 'important');
          }

          // If still too big, scale down font-size progressively
          let computed = window.getComputedStyle(wmText).fontSize;
          let fs = parseInt(computed, 10) || 88;
          while ((wmText.getBoundingClientRect().width > w * 0.96 || wmText.getBoundingClientRect().height > h * 0.96) && fs > 24) {
            fs = Math.floor(fs * 0.92);
            wmText.style.fontSize = fs + 'px';
          }
        }
      };

      // Preserve raw text for future adjustments
      if (!wmText._rawText) wmText._rawText = wmText.textContent;
      adjust();
    } catch (e) {
      /* ignore measurement errors */
    }
  }

  function applyInvoiceWatermark(data) {
    const payload = data !== undefined ? data : getInvoiceData();
    const { enabled, text } = resolveWatermarkConfig(payload);

    const invoice = document.getElementById("invoice");
    if (enabled && text && invoice) {
      ensureInvoicePageHeight(invoice);
    }

    const boxes = [];
    document
      .querySelectorAll(
        "#invoice > .watermark, #invoice > .proforma3-watermark, #invoice > #proformaWatermark"
      )
      .forEach((el) => {
        if (!boxes.includes(el)) boxes.push(el);
      });

    boxes.forEach((box) => {
      const wmText = box.querySelector(".wm") || box.querySelector("#pWatermarkText");
      if (enabled && text && wmText) {
        wmText.textContent = text;
        box.classList.add("watermark-visible");
        box.setAttribute("data-watermark-active", "true");
        box.style.removeProperty("display");
        if (invoice) {
          centerWatermarkText(invoice, box, wmText);
        }
      } else {
        box.classList.remove("watermark-visible");
        box.removeAttribute("data-watermark-active");
        box.style.display = "none";
      }
    });

    if (enabled && text && invoice) {
      requestAnimationFrame(function () {
        ensureInvoicePageHeight(invoice);
        boxes.forEach(function (box) {
          if (box.getAttribute("data-watermark-active") === "true") {
            const wmText = box.querySelector(".wm") || box.querySelector("#pWatermarkText");
            centerWatermarkText(invoice, box, wmText);
          }
        });
      });
    }
  }

  window.applyInvoiceWatermark = applyInvoiceWatermark;

  function initWatermark() {
    applyInvoiceWatermark(getInvoiceData());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWatermark);
  } else {
    initWatermark();
  }

  window.addEventListener("load", function () {
    initWatermark();
    setTimeout(initWatermark, 100);
    setTimeout(initWatermark, 400);
  });
  window.addEventListener("resize", function () {
    ensureInvoicePageHeight(document.getElementById("invoice"));
    applyInvoiceWatermark(getInvoiceData());
  });
})();
