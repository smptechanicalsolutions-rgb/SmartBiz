/**
 * Business catalog builder — categories & items for any trade (not food-specific).
 * Stored in localStorage key: smarbizBusinessMenu
 */
(function () {
  const STORAGE_KEY = "smarbizBusinessMenu";

  const ICONS = [
    "fa-utensils",
    "fa-mug-hot",
    "fa-cookie-bite",
    "fa-box",
    "fa-briefcase",
    "fa-tools",
    "fa-laptop",
    "fa-shirt",
    "fa-pills",
    "fa-wrench",
    "fa-truck",
    "fa-file-invoice",
    "fa-handshake",
  ];

  const DEFAULT_MENU = {
    title: "Product & Service Catalog",
    subtitle: "Build your price list for quotes, sales, and client sharing",
    isDemoMenu: false,
    categories: [
      {
        id: "cat-default",
        name: "Products",
        icon: "fa-box",
        items: [],
      },
      {
        id: "cat-services",
        name: "Services",
        icon: "fa-briefcase",
        items: [],
      },
    ],
  };

  /** Sample restaurant menu — loaded first when catalog is empty (like TEST-* documents). */
  const DEMO_FOOD_MENU = {
    title: "Spice Garden — Food Menu (Demo)",
    subtitle: "Sample restaurant catalog · safe to edit, export, or reset",
    isDemoMenu: true,
    categories: [
      {
        id: "cat-demo-starters",
        name: "Starters",
        icon: "fa-utensils",
        items: [
          {
            id: "demo-st-01",
            name: "Paneer Tikka",
            description: "Char-grilled cottage cheese, mint chutney",
            sku: "ST-01",
            price: 220,
          },
          {
            id: "demo-st-02",
            name: "Veg Spring Rolls",
            description: "Crispy rolls, sweet chilli dip (6 pcs)",
            sku: "ST-02",
            price: 160,
          },
          {
            id: "demo-st-03",
            name: "Chicken Lollipop",
            description: "Spicy drumettes, Schezwan sauce",
            sku: "ST-03",
            price: 280,
          },
        ],
      },
      {
        id: "cat-demo-mains",
        name: "Main course",
        icon: "fa-utensils",
        items: [
          {
            id: "demo-mn-01",
            name: "Dal Makhani",
            description: "Slow-cooked black lentils, cream, butter",
            sku: "MN-01",
            price: 240,
          },
          {
            id: "demo-mn-02",
            name: "Butter Chicken",
            description: "Tomato-cashew gravy, naan recommended",
            sku: "MN-02",
            price: 320,
          },
          {
            id: "demo-mn-03",
            name: "Veg Hakka Noodles",
            description: "Wok-tossed noodles, mixed vegetables",
            sku: "MN-03",
            price: 210,
          },
        ],
      },
      {
        id: "cat-demo-breads",
        name: "Rice & breads",
        icon: "fa-cookie-bite",
        items: [
          {
            id: "demo-br-01",
            name: "Jeera Rice",
            description: "Basmati rice, cumin tempering",
            sku: "BR-01",
            price: 140,
          },
          {
            id: "demo-br-02",
            name: "Butter Naan",
            description: "Tandoor-baked flatbread (2 pcs)",
            sku: "BR-02",
            price: 70,
          },
          {
            id: "demo-br-03",
            name: "Garlic Naan",
            description: "Tandoor naan with garlic butter",
            sku: "BR-03",
            price: 90,
          },
        ],
      },
      {
        id: "cat-demo-beverages",
        name: "Beverages",
        icon: "fa-mug-hot",
        items: [
          {
            id: "demo-bv-01",
            name: "Masala Chai",
            description: "Indian spiced tea (1 cup)",
            sku: "BV-01",
            price: 40,
          },
          {
            id: "demo-bv-02",
            name: "Fresh Lime Soda",
            description: "Sweet or salted",
            sku: "BV-02",
            price: 60,
          },
          {
            id: "demo-bv-03",
            name: "Cold Coffee",
            description: "Blended coffee, ice cream scoop",
            sku: "BV-03",
            price: 120,
          },
        ],
      },
      {
        id: "cat-demo-desserts",
        name: "Desserts",
        icon: "fa-cookie-bite",
        items: [
          {
            id: "demo-ds-01",
            name: "Gulab Jamun",
            description: "Warm milk dumplings, rose syrup (2 pcs)",
            sku: "DS-01",
            price: 90,
          },
          {
            id: "demo-ds-02",
            name: "Ice Cream Scoop",
            description: "Vanilla / chocolate / butterscotch",
            sku: "DS-02",
            price: 80,
          },
        ],
      },
    ],
  };

  function uid(prefix) {
    return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
  }

  function isEmptyCatalog(data) {
    if (!data || !Array.isArray(data.categories) || data.categories.length === 0) return true;
    return !data.categories.some((c) => c.items && c.items.length > 0);
  }

  function loadMenu() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEMO_FOOD_MENU));
      const data = JSON.parse(raw);
      if (!data.categories || !Array.isArray(data.categories)) {
        return JSON.parse(JSON.stringify(DEMO_FOOD_MENU));
      }
      return data;
    } catch (e) {
      return JSON.parse(JSON.stringify(DEMO_FOOD_MENU));
    }
  }

  /** First visit: save demo food menu (same pattern as inventory / test documents). */
  function seedDemoMenuIfNeeded() {
    if (localStorage.getItem(STORAGE_KEY)) return false;
    const demo = JSON.parse(JSON.stringify(DEMO_FOOD_MENU));
    saveMenu(demo);
    return true;
  }

  function loadDemoMenu() {
    if (
      !isEmptyCatalog(menuData) &&
      !confirm("Replace your current catalog with the demo food menu? Unsaved layout will be lost.")
    ) {
      return;
    }
    menuData = JSON.parse(JSON.stringify(DEMO_FOOD_MENU));
    saveMenu(menuData);
    bindHeaderFields();
    renderEditor();
    renderPreview();
    toast("Demo food menu loaded");
  }

  function saveMenu(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPrice(amount) {
    const n = Number(amount) || 0;
    if (window.SmarbizCurrency) return SmarbizCurrency.format(n);
    return "\u20B9" + n.toLocaleString("en-IN");
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "mb-toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  let menuData = loadMenu();

  function renderEditor() {
    const root = document.getElementById("menuEditorBody");
    if (!root) return;

    if (menuData.categories.length === 0) {
      root.innerHTML =
        '<div class="mb-empty"><i class="fas fa-folder-open"></i><p>No categories yet.<br>Tap <strong>Add category</strong> in Actions above, or <strong>Demo food menu</strong> for a sample.</p></div>';
      return;
    }

    root.innerHTML = menuData.categories
      .map((cat, catIndex) => {
        const itemsHtml =
          cat.items.length === 0
            ? '<p class="mb-items-empty">No items in this category — click <strong>Add item</strong> on the right.</p>'
            : cat.items
                .map(
                  (item, itemIndex) => `
          <div class="mb-item-row" data-cat="${catIndex}" data-item="${itemIndex}">
            <div class="mb-item-fields">
              <div class="mb-field mb-field-full">
                <label>Item name</label>
                <input type="text" placeholder="e.g. Butter Chicken" value="${escapeHtml(item.name)}" data-field="name" />
              </div>
              <div class="mb-field mb-field-full">
                <label>Description <span style="font-weight:400;color:#94a3b8">(optional)</span></label>
                <input type="text" placeholder="Short line for customers" value="${escapeHtml(item.description || "")}" data-field="description" />
              </div>
              <div class="mb-field">
                <label>SKU / code</label>
                <input type="text" placeholder="MN-02" value="${escapeHtml(item.sku || "")}" data-field="sku" />
              </div>
            </div>
            <div class="mb-item-side">
              <div class="mb-field mb-item-price-wrap">
                <label>Price (₹)</label>
                <input type="number" min="0" step="0.01" value="${Number(item.price) || 0}" data-field="price" />
              </div>
              <button type="button" class="mb-icon-btn" data-action="delete-item" title="Remove this item"><i class="fas fa-trash"></i></button>
            </div>
          </div>`
                )
                .join("");

        return `
        <div class="mb-category" data-cat-index="${catIndex}">
          <div class="mb-category-head">
            <div class="mb-icon-pick"><i class="fas ${escapeHtml(cat.icon || "fa-box")}"></i></div>
            <div class="mb-field mb-field-cat-name">
              <label>Category name</label>
              <input type="text" value="${escapeHtml(cat.name)}" data-field="cat-name" placeholder="e.g. Main course" />
            </div>
            <div class="mb-field mb-field-icon">
              <label>Icon</label>
              <select data-field="cat-icon" title="Category icon">
                ${ICONS.map((ic) => `<option value="${ic}" ${cat.icon === ic ? "selected" : ""}>${ic.replace("fa-", "")}</option>`).join("")}
              </select>
            </div>
            <div class="mb-category-actions">
              <button type="button" class="mb-btn-add-item" data-action="add-item"><i class="fas fa-plus"></i> Add item</button>
              <button type="button" class="mb-icon-btn" data-action="delete-cat" title="Delete whole category"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div class="mb-items">${itemsHtml}</div>
        </div>`;
      })
      .join("");

    root.querySelectorAll("[data-field]").forEach((el) => {
      el.addEventListener("change", onFieldChange);
      el.addEventListener("input", onFieldChange);
    });
    root.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", onAction);
    });
  }

  function onFieldChange(e) {
    const el = e.target;
    const field = el.getAttribute("data-field");
    const row = el.closest(".mb-item-row");
    const catBlock = el.closest(".mb-category");

    if (field === "cat-name" && catBlock) {
      const i = Number(catBlock.getAttribute("data-cat-index"));
      menuData.categories[i].name = el.value;
    } else if (field === "cat-icon" && catBlock) {
      const i = Number(catBlock.getAttribute("data-cat-index"));
      menuData.categories[i].icon = el.value;
      catBlock.querySelector(".mb-icon-pick i").className = "fas " + el.value;
    } else if (row) {
      const ci = Number(row.getAttribute("data-cat"));
      const ii = Number(row.getAttribute("data-item"));
      const item = menuData.categories[ci].items[ii];
      if (field === "name") item.name = el.value;
      if (field === "description") item.description = el.value;
      if (field === "sku") item.sku = el.value;
      if (field === "price") item.price = Number(el.value) || 0;
    }

    saveMenu(menuData);
    renderPreview();
  }

  function onAction(e) {
    const btn = e.currentTarget;
    const action = btn.getAttribute("data-action");
    const catBlock = btn.closest(".mb-category");
    const catIndex = catBlock ? Number(catBlock.getAttribute("data-cat-index")) : -1;

    if (action === "add-item" && catIndex >= 0) {
      menuData.categories[catIndex].items.push({
        id: uid("item"),
        name: "New item",
        description: "",
        sku: "",
        price: 0,
      });
      saveMenu(menuData);
      renderEditor();
      renderPreview();
      toast("Item added");
    } else if (action === "delete-item") {
      const row = btn.closest(".mb-item-row");
      const ci = Number(row.getAttribute("data-cat"));
      const ii = Number(row.getAttribute("data-item"));
      menuData.categories[ci].items.splice(ii, 1);
      saveMenu(menuData);
      renderEditor();
      renderPreview();
    } else if (action === "delete-cat" && catIndex >= 0) {
      if (!confirm("Delete this category and all its items?")) return;
      menuData.categories.splice(catIndex, 1);
      saveMenu(menuData);
      renderEditor();
      renderPreview();
    }
  }

  function renderPreview() {
    const titleEl = document.getElementById("previewTitle");
    const subEl = document.getElementById("previewSubtitle");
    const body = document.getElementById("menuPreviewBody");
    if (titleEl) titleEl.textContent = menuData.title || "Catalog";
    if (subEl) subEl.textContent = menuData.subtitle || "";

    if (!body) return;

    const hasItems = menuData.categories.some((c) => c.items && c.items.length > 0);
    if (!hasItems) {
      body.innerHTML =
        '<div class="mb-empty"><i class="fas fa-eye"></i><p>Add categories and items on the <strong>left</strong> — this preview updates instantly.<br><br>Or tap <strong>Demo food menu</strong> above for a sample.</p></div>';
      return;
    }

    body.innerHTML = menuData.categories
      .map((cat) => {
        if (!cat.items || cat.items.length === 0) return "";
        const items = cat.items
          .map(
            (item) => `
        <div class="mb-preview-item">
          <div>
            <div class="mb-preview-name">${escapeHtml(item.name || "Unnamed")}</div>
            ${item.description ? `<div class="mb-preview-desc">${escapeHtml(item.description)}</div>` : ""}
            ${item.sku ? `<div class="mb-preview-desc">SKU: ${escapeHtml(item.sku)}</div>` : ""}
          </div>
          <div class="mb-preview-price" data-amount="${Number(item.price) || 0}">${formatPrice(item.price)}</div>
        </div>`
          )
          .join("");
        return `
        <div class="mb-category mb-preview">
          <div class="mb-category-head">
            <div class="mb-icon-pick"><i class="fas ${escapeHtml(cat.icon || "fa-box")}"></i></div>
            <strong>${escapeHtml(cat.name)}</strong>
          </div>
          <div class="mb-items" style="padding:0;">${items}</div>
        </div>`;
      })
      .join("");

    if (window.SmarbizCurrency) {
      SmarbizCurrency.applyAll(body);
    }
  }

  function bindHeaderFields() {
    const titleInput = document.getElementById("menuTitleInput");
    const subInput = document.getElementById("menuSubtitleInput");
    if (titleInput) {
      titleInput.value = menuData.title || "";
      titleInput.addEventListener("input", () => {
        menuData.title = titleInput.value;
        saveMenu(menuData);
        renderPreview();
      });
    }
    if (subInput) {
      subInput.value = menuData.subtitle || "";
      subInput.addEventListener("input", () => {
        menuData.subtitle = subInput.value;
        saveMenu(menuData);
        renderPreview();
      });
    }
  }

  function importFromInventory() {
    let products = [];
    try {
      products = JSON.parse(localStorage.getItem("products") || "[]");
    } catch (e) {
      products = [];
    }
    if (!products.length) {
      alert("No inventory products found. Add products in Inventory first, or add items manually here.");
      return;
    }
    let cat = menuData.categories.find((c) => c.name === "From Inventory");
    if (!cat) {
      cat = { id: uid("cat"), name: "From Inventory", icon: "fa-box", items: [] };
      menuData.categories.push(cat);
    }
    products.forEach((p) => {
      const exists = cat.items.some((i) => i.sku && i.sku === p.sku);
      if (exists) return;
      cat.items.push({
        id: uid("item"),
        name: p.name || "Product",
        description: p.description || p.category || "",
        sku: p.sku || "",
        price: Number(p.price) || 0,
      });
    });
    saveMenu(menuData);
    renderEditor();
    renderPreview();
    toast("Imported " + products.length + " product(s) from inventory");
  }

  function resetMenu() {
    if (!confirm("Reset catalog to empty template? This cannot be undone.")) return;
    menuData = JSON.parse(JSON.stringify(DEFAULT_MENU));
    saveMenu(menuData);
    bindHeaderFields();
    renderEditor();
    renderPreview();
    toast("Catalog reset to empty template");
  }

  function initHowtoToggle() {
    const howto = document.getElementById("mbHowto");
    const btn = document.getElementById("btnToggleHowto");
    if (!howto || !btn) return;

    const collapsed = localStorage.getItem("mbHowtoCollapsed") === "1";
    if (collapsed) {
      howto.classList.add("is-collapsed");
      btn.textContent = "Show steps";
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", () => {
      const isCollapsed = howto.classList.toggle("is-collapsed");
      localStorage.setItem("mbHowtoCollapsed", isCollapsed ? "1" : "0");
      btn.textContent = isCollapsed ? "Show steps" : "Hide steps";
      btn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    });
  }

  function init() {
    const seeded = seedDemoMenuIfNeeded();
    if (seeded) menuData = loadMenu();

    initHowtoToggle();
    bindHeaderFields();
    renderEditor();
    renderPreview();

    if (seeded) {
      toast("Demo food menu loaded — follow the 4 steps above");
    }

    document.getElementById("btnAddCategory")?.addEventListener("click", () => {
      menuData.categories.push({
        id: uid("cat"),
        name: "New category",
        icon: "fa-box",
        items: [],
      });
      saveMenu(menuData);
      renderEditor();
      renderPreview();
      toast("Category added");
    });

    document.getElementById("btnImportInventory")?.addEventListener("click", importFromInventory);
    document.getElementById("btnLoadDemoMenu")?.addEventListener("click", loadDemoMenu);
    document.getElementById("btnResetMenu")?.addEventListener("click", resetMenu);

    window.addEventListener("smarbiz-currency-change", () => renderPreview());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.SmarbizMenuBuilder = {
    loadMenu,
    saveMenu,
    resetMenu,
    loadDemoMenu,
    DEMO_FOOD_MENU,
    DEFAULT_MENU,
  };
})();
