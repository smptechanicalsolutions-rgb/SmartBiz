const params = new URLSearchParams(window.location.search);
const isHistory = params.get("history");

if (isHistory) {
  showHistory();
}

function showHistory() {
  document.getElementById("history-container").style.display = "block";

  const history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
  const body = document.getElementById("historyBody");

  body.innerHTML = "";

  history.forEach(inv => {
    body.innerHTML += `
      <tr>
        <td>${inv.invoiceNo || '-'}</td>
        <td>${inv.invoiceDate || '-'}</td>
        <td>${inv.clientName || '-'}</td>
        <td>₹${inv.grandTotal || '0.00'}</td>
        <td>
          <div class="action-buttons">
            <button onclick="viewInvoice(${inv.id})">View</button>
            <button onclick="deleteInvoice(${inv.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function viewInvoice(id) {
  const history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
  const historyEntry = history.find(i => i.id === id);

  if (!historyEntry) {
    alert("Invoice not found");
    return;
  }

  // Use fullData if available, otherwise use the entry itself
  const invoiceData = historyEntry.fullData || historyEntry;
  // attach history id so templates can delete current document
  invoiceData.__historyId = historyEntry.id;
  localStorage.setItem("invoiceData", JSON.stringify(invoiceData));

  const fmt = historyEntry.format || "format1.html";
  window.location.href = "documents/formats/" + fmt;
}

async function deleteInvoice(id) {
  if (!confirm('Delete this document from history?')) return;

  // Try API delete first
  try {
    const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
    if (res.ok) {
      let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
      history = history.filter(i => i.id !== id);
      localStorage.setItem("invoiceHistory", JSON.stringify(history));
      showHistory();
      return;
    }
  } catch (e) {
    // ignore and fallback
  }

  // Fallback: localStorage only
  let history = JSON.parse(localStorage.getItem("invoiceHistory")) || [];
  history = history.filter(i => i.id !== id);
  localStorage.setItem("invoiceHistory", JSON.stringify(history));
  showHistory();
}
