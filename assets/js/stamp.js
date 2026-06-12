/**
 * Professional SVG Stamp Generator.
 * Keeps inline SVG for previews and exposes a browser-safe image source for invoice layouts.
 */

(function ensureMobilePreviewChromeScript() {
  if (!/\/(?:documents\/)?formats\//i.test(window.location.pathname)) return;

  function loadScript(src, done) {
    if (document.querySelector('script[src="' + src + '"]')) {
      if (done) done();
      return;
    }
    var script = document.createElement("script");
    script.src = src;
    script.onload = function () {
      if (done) done();
    };
    document.head.appendChild(script);
  }

  loadScript("../../assets/js/document-actions.js", function () {
    loadScript("../../assets/js/mobile-preview-chrome.js?v=20260602-preview-clean", function () {
      if (typeof window.setupMobilePreview === "function") {
        window.setupMobilePreview();
      }
    });
  });
})();

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function normaliseStamp(stamp) {
  if (!stamp || !stamp.svg) return null;

  const normalised = { ...stamp };
  const isDataUrl = /^data:image\//i.test(normalised.svg);

  normalised.inlineSvg = normalised.inlineSvg || (isDataUrl ? "" : normalised.svg);
  normalised.imageSrc = normalised.imageSrc || (isDataUrl ? normalised.svg : svgToDataUrl(normalised.svg));
  normalised.src = normalised.imageSrc;
  normalised.size = Number(normalised.size) || 120;
  normalised.offsetX = Number(normalised.offsetX || 0);
  normalised.offsetY = Number(normalised.offsetY || 0);
  normalised.rotation = Number(normalised.rotation || 0);

  return normalised;
}

function escapeStampText(value, fallback) {
  const text = (value || fallback || "").toString().toUpperCase();
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createStamp(topText, bottomText, centerText, size = 140, color = "#000000") {
  const safeColor = /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#000000";
  const outerR = 132;
  const innerR = 110;
  const outerStroke = 5;
  const innerStroke = 4;
  const textOuterR = outerR - outerStroke / 2;
  const textInnerR = innerR + innerStroke / 2;
  const ringMidR = (textOuterR + textInnerR) / 2;
  const ringBand = textOuterR - textInnerR;
  const arcStartX = 150 - ringMidR;
  const arcEndX = 150 + ringMidR;
  const arcPath = `M${arcStartX},150 A${ringMidR},${ringMidR} 0 0,1 ${arcEndX},150`;
  const arcPathBottom = `M${arcStartX},150 A${ringMidR},${ringMidR} 0 0,0 ${arcEndX},150`;
  const svg = `
  <svg viewBox="0 0 300 300" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <path id="topArc" d="${arcPath}"/>
      <path id="bottomArc" d="${arcPathBottom}"/>
    </defs>

    <circle cx="150" cy="150" r="${outerR}" fill="none" stroke="${safeColor}" stroke-width="${outerStroke}"/>
    <circle cx="150" cy="150" r="${innerR}" fill="none" stroke="${safeColor}" stroke-width="${innerStroke}"/>

    <text font-family="Georgia, 'Times New Roman', serif" font-size="${ringBand}" font-weight="bold" letter-spacing="1.2" fill="${safeColor}" dominant-baseline="central">
      <textPath href="#topArc" startOffset="50%" text-anchor="middle">
        ${escapeStampText(topText, "COMPANY NAME")}
      </textPath>
    </text>

    <text font-family="Georgia, 'Times New Roman', serif" font-size="${ringBand}" font-weight="bold" letter-spacing="1.2" fill="${safeColor}" dominant-baseline="central">
      <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">
        * ${escapeStampText(bottomText, "OFFICIAL")} *
      </textPath>
    </text>

    <text x="${150 - ringMidR}" y="150" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(ringBand * 0.75)}" font-weight="bold" fill="${safeColor}">✳</text>
    <text x="${150 + ringMidR}" y="150" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(ringBand * 0.75)}" font-weight="bold" fill="${safeColor}">✳</text>

    <text x="150" y="162" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="bold" fill="${safeColor}">
      ${escapeStampText(centerText, "CITY")}
    </text>
  </svg>`;

  return normaliseStamp({
    svg,
    inlineSvg: svg,
    size,
    color: safeColor,
    topText: topText || "COMPANY NAME",
    bottomText: bottomText || "OFFICIAL",
    centerText: centerText || "CITY",
    svgVersion: 3,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    createdAt: Date.now()
  });
}

function upgradeStampVisual(stamp) {
  if (!stamp) return null;
  const svgSource = stamp.inlineSvg || stamp.svg || "";
  if (svgSource.includes('r="132"') && Number(stamp.svgVersion) >= 3) return stamp;
  if (!stamp.topText && !stamp.bottomText && !stamp.centerText) return stamp;
  return createStamp(
    stamp.topText || "COMPANY NAME",
    stamp.bottomText || "OFFICIAL",
    stamp.centerText || "CITY",
    Number(stamp.size) || 140,
    stamp.color || "#000000"
  );
}

function saveStamp(top, bottom, center, size = 140, color = "#000") {
  const stamp = createStamp(top, bottom, center, size, color);
  localStorage.setItem("invoiceStamp", JSON.stringify(stamp));
  localStorage.setItem("stampConfig", JSON.stringify(stamp));
  return stamp;
}

function loadStamp() {
  try {
    const saved = JSON.parse(localStorage.getItem("invoiceStamp") || localStorage.getItem("stampConfig") || "null");
    let stamp = normaliseStamp(saved);
    if (stamp) {
      const upgraded = upgradeStampVisual(stamp);
      if (upgraded) {
        stamp = upgraded;
        if (!saved || Number(saved.svgVersion) < 3) {
          const payload = JSON.stringify(stamp);
          localStorage.setItem("invoiceStamp", payload);
          localStorage.setItem("stampConfig", payload);
        }
      }
      stamp.rawSvg = stamp.inlineSvg;
      stamp.svg = stamp.imageSrc;
    }
    return stamp;
  } catch {
    return null;
  }
}

function loadSavedStamp() {
  return loadStamp();
}

function deleteStamp() {
  localStorage.removeItem("invoiceStamp");
  localStorage.removeItem("stampConfig");
}

function getStampImage(stamp, callback) {
  const safeStamp = normaliseStamp(stamp);
  if (!safeStamp) return callback(null);

  const img = new Image();
  img.onload = () => callback(img);
  img.src = safeStamp.imageSrc;
}

window.StampTool = {
  createStamp,
  saveStamp,
  loadStamp,
  loadSavedStamp,
  deleteStamp,
  getStampImage,
  normaliseStamp,
  svgToDataUrl
};
window.loadSavedStamp = loadSavedStamp;

window.addEventListener("DOMContentLoaded", () => {
  const previewDiv = document.getElementById("preview");
  if (previewDiv) {
    const stamp = StampTool.createStamp(
      "SMP TECHNICAL SOLUTIONS",
      "OFFICIAL",
      "MUMBAI",
      100,
      "#000"
    );
    previewDiv.innerHTML = stamp.inlineSvg;
  }
});

// Helper: apply saved stamp to invoice preview/format pages
function applySavedStampToInvoice() {
  try {
    const stamp = loadSavedStamp();
    if (!stamp) return;
    const stampImg = document.getElementById("invoiceStampImage");
    if (!stampImg) return;

    const src = stamp.imageSrc || stamp.svg || stamp.inlineSvg || stamp.rawSvg || stamp.svg;
    stampImg.src = src;
    stampImg.style.display = "block";
    stampImg.style.opacity = "0.95";
    stampImg.style.position = "absolute";

    const offX = Number(stamp.offsetX || 0);
    const offY = Number(stamp.offsetY || 0);
    const rotation = Number(stamp.rotation || 0) || 0;

    const stampSlot = stampImg.closest(".sig-stamp-slot");
    if (stampSlot) {
      const slotW = stampSlot.clientWidth || 160;
      const slotH = stampSlot.clientHeight || 110;
      const targetWidth = Math.min(
        Number(stamp.size || 140),
        Math.floor(slotW * 0.92),
        Math.floor(slotH * 0.92)
      );

      stampImg.style.width = targetWidth + "px";
      stampImg.style.maxWidth = "92%";
      stampImg.style.maxHeight = "92%";
      stampImg.style.height = "auto";
      stampImg.style.left = "50%";
      stampImg.style.top = "50%";
      stampImg.style.right = "";
      stampImg.style.bottom = "";
      stampImg.style.transform = `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) rotate(${rotation}deg)`;
      // Ensure stamp element is the last child of the slot so it stacks above other elements
      try {
        if (stampImg.parentNode !== stampSlot) stampSlot.appendChild(stampImg);
      } catch (e) {}
      stampImg.style.zIndex = "10000";
      stampImg.style.pointerEvents = "none";
      return;
    }

    const container =
      stampImg.closest(".signature-right") || document.querySelector(".signature-right");
    const signatureImg = container ? container.querySelector("#signature-image") : null;

    if (container) {
      const cs = window.getComputedStyle(container);
      if (cs.position === "static" || !cs.position) container.style.position = "relative";
      try {
        if (stampImg.parentNode !== container) container.appendChild(stampImg);
      } catch (e) {}
    }

    const targetWidth = Math.min(
      Number(stamp.size || 140),
      container ? Math.floor(container.clientWidth * 0.95) : Number(stamp.size || 140)
    );
    stampImg.style.maxWidth = targetWidth + "px";
    stampImg.style.width = targetWidth + "px";

    function place() {
      const imgW = stampImg.offsetWidth || targetWidth;
      const imgH = stampImg.offsetHeight || imgW;

      if (container) {
        const left = Math.round((container.clientWidth - imgW) / 2 + offX);
        stampImg.style.left = left + "px";
        stampImg.style.transform = `rotate(${rotation}deg)`;
      } else {
        stampImg.style.left = "50%";
        stampImg.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
      }

      if (signatureImg && signatureImg.offsetHeight) {
        const sigTop = signatureImg.offsetTop;
        const sigCenter = sigTop + signatureImg.offsetHeight / 2;
        const top = Math.round(sigCenter - imgH / 2 - offY);
        stampImg.style.top = top + "px";
        stampImg.style.bottom = "";
      } else if (container) {
        const isFormat2 = /\/format2\.html$/i.test(window.location.pathname);
        const sigLine = container.querySelector(".signature-line");
        if (isFormat2 && sigLine) {
          const lineTop = sigLine.offsetTop;
          const gap = 10;
          stampImg.style.top = Math.max(0, lineTop - imgH - gap - offY) + "px";
          stampImg.style.bottom = "";
        } else {
          const isGeneratedFormat = container.classList.contains("generated-signature");
          const bottomBase = isGeneratedFormat ? 22 : 36;
          stampImg.style.bottom = bottomBase - offY + "px";
          stampImg.style.top = "";
          stampImg.style.left = "50%";
          stampImg.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
        }
      }

      stampImg.style.zIndex = 10000;
      stampImg.style.pointerEvents = "none";
    }

    if (stampImg.complete) place();
    else stampImg.onload = place;
  } catch (e) {
    console.warn("applySavedStampToInvoice failed", e);
  }
}

function isDocumentFormatPage() {
  return /\/(?:documents\/)?formats\//i.test(window.location.pathname) && !!document.getElementById("invoice");
}

function goDocumentBack() {
  const fallback = /\/documents\/formats\//i.test(window.location.pathname)
    ? "../../index.html"
    : "../index.html";
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = fallback;
}

function removeLegacyBackToHomeButtons() {
  document.querySelectorAll("body > button").forEach((btn) => {
    if (btn.id === "sbDocumentBack") return;
    const text = (btn.textContent || "").replace(/\s+/g, " ").trim();
    if (/back to home/i.test(text)) btn.remove();
  });
}

function ensureDocumentBackButton() {
  if (!isDocumentFormatPage()) return;
  if (window.innerWidth <= 793) return;

  removeLegacyBackToHomeButtons();

  let btn = document.getElementById("sbDocumentBack");
  if (btn) return;

  btn = document.createElement("button");
  btn.id = "sbDocumentBack";
  btn.type = "button";
  btn.className = "sb-document-back";
  btn.setAttribute("aria-label", "Go back");
  btn.innerHTML = '<span class="sb-document-back__icon" aria-hidden="true">←</span><span>Back</span>';
  btn.addEventListener("click", goDocumentBack);
  document.body.appendChild(btn);
}

function ensureDocumentFooter() {
  const invoice = document.getElementById("invoice");
  if (!invoice || invoice.querySelector(".invoice-footer")) return;

  const footer = document.createElement("div");
  footer.className = "invoice-footer";
  footer.innerHTML =
    '<div class="powered-by">Powered By smartbiz</div>' +
    '<div class="digitally-signed">This is a digitally signed document</div>';
  invoice.appendChild(footer);
}

function initDocumentChrome() {
  ensureDocumentBackButton();
  ensureDocumentFooter();
  applySavedStampToInvoice();
  function runMobilePreview() {
    if (typeof window.setupMobilePreview === "function") {
      window.setupMobilePreview();
    }
  }
  runMobilePreview();
  setTimeout(runMobilePreview, 200);
  setTimeout(runMobilePreview, 800);
}

window.initDocumentChrome = initDocumentChrome;
window.goDocumentBack = goDocumentBack;
window.applySavedStampToInvoice = applySavedStampToInvoice;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDocumentChrome);
} else {
  initDocumentChrome();
}
window.addEventListener("load", initDocumentChrome);
window.addEventListener("resize", applySavedStampToInvoice);
