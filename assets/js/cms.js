(function(){
  let allPages = [];
  let currentPageId = null;
  let editorDirty = false;

  async function api(path, opts){
    const res = await fetch(path, Object.assign({credentials:'include', headers:{'Content-Type':'application/json'}}, opts));
    if (!res.ok) {
      const json = await res.json().catch(()=>null);
      throw new Error((json && json.error) || res.statusText || 'API error');
    }
    return res.json();
  }

  function compare(a,b, key){
    if (!a[key] && !b[key]) return 0;
    if (!a[key]) return 1;
    if (!b[key]) return -1;
    if (key === 'updatedAt' || key === 'createdAt') return new Date(b[key]) - new Date(a[key]);
    return String(a[key]).localeCompare(String(b[key]));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function updateStats(items){
    const now = new Date();
    const published = items.filter(p => p.published && (!p.scheduledAt || new Date(p.scheduledAt) <= now) && (!p.unpublishAt || new Date(p.unpublishAt) > now)).length;
    const draft = items.filter(p => !p.published && !p.scheduledAt).length;
    const scheduled = items.filter(p => p.scheduledAt && new Date(p.scheduledAt) > now).length;
    const last = items.slice().sort((a,b)=>new Date(b.updatedAt||b.createdAt) - new Date(a.updatedAt||a.createdAt))[0];
    document.getElementById('totalPages').innerText = items.length;
    document.getElementById('publishedPages').innerText = published;
    document.getElementById('draftPages').innerText = draft;
    document.getElementById('scheduledPages').innerText = scheduled;
    document.getElementById('lastUpdated').innerText = last ? new Date(last.updatedAt||last.createdAt).toLocaleDateString() : '—';
  }

  function formatDate(value){ return value ? new Date(value).toLocaleString() : 'Unknown'; }

  function renderSearchList(){
    const listEl = document.getElementById('cmsList'); if(!listEl) return;
    const query = document.getElementById('cmsSearch')?.value.toLowerCase().trim() || '';
    const sortBy = document.getElementById('cmsSort')?.value || 'updatedAt';
    const type = document.getElementById('cmsType')?.value || 'all';
    const status = document.getElementById('cmsStatus')?.value || 'all';
    const now = new Date();
    const filtered = allPages.filter(p => {
      const combined = `${p.title || ''} ${p.slug || ''} ${p.description || ''} ${p.type || ''}`.toLowerCase();
      if (type !== 'all' && String(p.type || 'custom') !== type) return false;
      if (status === 'published' && (!p.published || (p.scheduledAt && new Date(p.scheduledAt) > now))) return false;
      if (status === 'draft' && (p.published || p.scheduledAt)) return false;
      if (status === 'scheduled' && !(p.scheduledAt && new Date(p.scheduledAt) > now)) return false;
      return combined.includes(query);
    }).sort((a,b)=>compare(a,b, sortBy));
    if (!filtered.length) {
      listEl.innerHTML = '<div style="padding:18px;color:#475569;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;">No pages matched your search.</div>';
      return;
    }
    listEl.innerHTML = filtered.map(p => {
      const safeSlug = escapeHtml(p.slug);
      const safeTitle = escapeHtml(p.title || p.slug || 'Untitled page');
      const safeDescription = escapeHtml(p.description || 'No description');
      const statusClass = p.published ? 'status' : 'status inactive';
      const statusText = p.published ? 'Published' : 'Draft';
      const pageType = escapeHtml(p.type || 'custom');
      const scheduledLabel = p.scheduledAt ? ` <span class="status ${new Date(p.scheduledAt) > new Date() ? '' : 'inactive'}" style="background:#fef3c7;color:#92400e;">Scheduled ${new Date(p.scheduledAt).toLocaleDateString()}</span>` : '';
      const statusLabel = `<span class="${statusClass}">${statusText}</span>`;
      return `
        <div class="cms-list-item">
          <div class="info">
            <h2>${safeTitle}</h2>
            <div class="subtext">/${safeSlug}.html - ${safeDescription}<br/>Type: ${pageType}${scheduledLabel}<br/>Updated ${formatDate(p.updatedAt)} - Created ${formatDate(p.createdAt)}</div>
            <div style="margin-top:12px;">${statusLabel}</div>
          </div>
          <div class="cms-actions">
            <button class="secondary" onclick="editPage('${p.id}')">Edit</button>
            <button class="secondary" onclick="duplicatePage('${p.id}')">Duplicate</button>
            <button class="secondary" onclick="togglePublished('${p.id}', ${!p.published})">${p.published ? 'Unpublish' : 'Publish'}</button>
            <button class="secondary" onclick="copyPageLink('${safeSlug}')">Copy Link</button>
            <button class="secondary" onclick="window.open('/${safeSlug}.html', '_blank')">Open</button>
            <button class="danger" onclick="deletePage('${p.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }
  window.renderSearchList = renderSearchList;

  async function copyPageLink(slug) {
    const url = `${location.origin}/${slug}.html`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Page link copied.');
    } catch (e) {
      prompt('Copy page link', url);
    }
  }
  window.copyPageLink = copyPageLink;

  async function loadList(){
    const el = document.getElementById('cmsList'); if(!el) return;
    el.innerText = 'Loading...';
    try{
      const data = await api('/api/cms/pages');
      allPages = data.pages || [];
      updateStats(allPages);
      renderSearchList();
    }catch(e){
      el.innerHTML = `<div style="padding:18px;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:18px;">${e.message}</div>`;
    }
  }

  async function editPage(id){ location.href = '/cms/editor.html?id='+encodeURIComponent(id); }
  window.editPage = editPage;

  async function deletePage(id){ if(!confirm('Delete page?')) return; await api('/api/cms/pages/'+encodeURIComponent(id), { method:'DELETE' }); await loadList(); }
  window.deletePage = deletePage;

  async function togglePublished(id, publish){
    await api('/api/cms/pages/'+encodeURIComponent(id), { method:'PUT', body: JSON.stringify({ published: publish }) });
    await loadList();
  }
  window.togglePublished = togglePublished;

  async function duplicatePage(id){
    const data = await api('/api/cms/pages/'+encodeURIComponent(id));
    if (!data.success) return alert('Failed to load page');
    const source = data.page;
    const newSlug = `${source.slug || 'page'}-copy-${Date.now()}`;
    const payload = {
      slug: newSlug,
      title: `Copy of ${source.title||source.slug}`,
      content: source.content || '',
      description: source.description || '',
      metaTitle: source.metaTitle || '',
      metaKeywords: source.metaKeywords || '',
      canonical: source.canonical || '',
      type: source.type || 'custom',
      scheduledAt: null,
      unpublishAt: null,
      published: false
    };
    const created = await api('/api/cms/pages', { method:'POST', body: JSON.stringify(payload) });
    if (created.success) {
      alert('Page duplicated: ' + created.page.slug);
      loadList();
      return;
    }
    alert('Unable to duplicate page');
  }
  window.duplicatePage = duplicatePage;

  async function exportPages(){
    const pages = allPages.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      metaTitle: p.metaTitle,
      metaKeywords: p.metaKeywords,
      canonical: p.canonical,
      type: p.type,
      content: p.content,
      published: p.published,
      scheduledAt: p.scheduledAt,
      unpublishAt: p.unpublishAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
    const blob = new Blob([JSON.stringify(pages, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cms-pages-export.json'; document.body.appendChild(a); a.click(); a.remove();
  }
  window.exportPages = exportPages;

  async function importPages(event){
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const text = await file.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (err) { alert('Invalid JSON file'); return; }
    if (!Array.isArray(parsed)) parsed = [parsed];
    const results = [];
    for (const item of parsed) {
      const slug = slugify(item.slug || item.title || `imported-${Date.now()}`);
      if (!slug) continue;
      const payload = {
        slug,
        title: item.title || '',
        description: item.description || '',
        metaTitle: item.metaTitle || '',
        metaKeywords: item.metaKeywords || '',
        canonical: item.canonical || '',
        type: item.type || 'custom',
        content: item.content || '',
        published: !!item.published,
        scheduledAt: item.scheduledAt || null,
        unpublishAt: item.unpublishAt || null
      };
      try { results.push(await api('/api/cms/pages', { method: 'POST', body: JSON.stringify(payload) })); } catch (err) { console.warn('Import failed', err); }
    }
    alert(`Imported ${results.filter(r=>r && r.success).length} pages.`);
    event.target.value = '';
    loadList();
  }
  window.importPages = importPages;

  function getQuery(){ const q = new URLSearchParams(location.search); return q.get('id'); }

  async function loadEditor(){
    const id = getQuery();
    currentPageId = id;
    const titleEl = document.getElementById('editorTitle');
    if (!id) {
      titleEl && (titleEl.innerText = 'New Page');
      renderLivePreview();
      if (typeof toggleScheduleControls === 'function') toggleScheduleControls();
      return;
    }
    try{
      const data = await api('/api/cms/pages/'+encodeURIComponent(id));
      const p = data.page;
      document.getElementById('pageSlug').value = p.slug || '';
      document.getElementById('pageTitle').value = p.title || '';
      document.getElementById('pageDescription').value = p.description || '';
      document.getElementById('pageMetaTitle').value = p.metaTitle || '';
      document.getElementById('pageKeywords').value = p.metaKeywords || '';
      document.getElementById('pageCanonical').value = p.canonical || '';
      document.getElementById('pageType').value = p.type || 'custom';
      document.getElementById('pageContent').value = p.content || '';
      document.getElementById('pagePublished').checked = !!p.published;
      document.getElementById('pageScheduled').checked = !!p.scheduledAt;
      document.getElementById('pageScheduleAt').value = p.scheduledAt ? p.scheduledAt.slice(0,16) : '';
      document.getElementById('pageUnpublishAt').value = p.unpublishAt ? p.unpublishAt.slice(0,16) : '';
      if (typeof toggleScheduleControls === 'function') toggleScheduleControls();
      titleEl && (titleEl.innerText = 'Edit: ' + (p.title || p.slug));
      renderLivePreview();
      updateEditorMetrics();
      editorDirty = false;
      updateDirtyState();
      const v = await api('/api/cms/pages/'+encodeURIComponent(id)+'/versions');
      if (v.success) renderVersions(v.versions || []);
    } catch (e) {
      document.getElementById('status').innerText = 'Unable to load page: ' + e.message;
    }
  }

  function renderVersions(list){
    const el = document.getElementById('versions'); if(!el) return;
    if (!list.length) { el.innerHTML = '<div style="padding:12px;color:#475569;background:#f8fafc;border-radius:14px;">No versions yet</div>'; return; }
    el.innerHTML = '<h3 style="margin-top:0;color:#111827;">Page versions</h3>' + list.slice().sort((a,b)=>new Date(b.ts)-new Date(a.ts)).map(v=>`
      <div class="version-item">
        <div>
          <div style="font-weight:600;color:#0f172a;">${new Date(v.ts).toLocaleString()}</div>
          <div style="color:#475569;font-size:0.92rem;">by ${v.author||'unknown'}</div>
        </div>
        <button onclick="revertVersion('${v.ts}')">Revert</button>
      </div>
    `).join('');
  }
  window.revertVersion = async function(ts){ const id = getQuery(); if(!id) return; if(!confirm('Revert to selected version?')) return; const res = await api('/api/cms/pages/'+encodeURIComponent(id)+'/revert',{method:'POST',body:JSON.stringify({ts})}); if(res.success){ alert('Reverted'); loadEditor(); } };

  async function savePage(){
    const id = getQuery();
    const slug = slugify(document.getElementById('pageSlug').value.trim());
    const title = document.getElementById('pageTitle').value.trim();
    const description = document.getElementById('pageDescription').value.trim();
    const metaTitle = document.getElementById('pageMetaTitle').value.trim();
    const metaKeywords = document.getElementById('pageKeywords').value.trim();
    const canonical = document.getElementById('pageCanonical').value.trim();
    const type = document.getElementById('pageType').value || 'custom';
    const content = document.getElementById('pageContent').value;
    const published = document.getElementById('pagePublished').checked;
    const scheduled = document.getElementById('pageScheduled').checked;
    const scheduleAt = scheduled ? document.getElementById('pageScheduleAt').value : '';
    const unpublishAt = document.getElementById('pageUnpublishAt').value || '';
    const status = document.getElementById('status');
    if (!slug) { alert('Slug required'); return; }
    document.getElementById('pageSlug').value = slug;
    status.innerText = 'Saving...';
    try{
      const payload = { slug, title, description, metaTitle, metaKeywords, canonical, type, content, published, scheduledAt: scheduleAt || null, unpublishAt: unpublishAt || null };
      let res;
      if (id) {
        res = await api('/api/cms/pages/'+encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        res = await api('/api/cms/pages', { method: 'POST', body: JSON.stringify(payload) });
      }
      if (res.success) {
        editorDirty = false;
        updateDirtyState();
        status.innerText = 'Saved successfully.';
        setTimeout(() => window.location.href = '/cms/', 700);
      } else {
        status.innerText = 'Error saving page';
      }
    } catch (e) {
      status.innerText = 'Save failed: ' + e.message;
    }
  }
  window.savePage = savePage;

  async function autoSaveDraft(){
    const id = getQuery();
    if (!id || !editorDirty) return;
    const status = document.getElementById('status');
    if (status) status.innerText = 'Auto-saving draft...';
    try{
      const slug = slugify(document.getElementById('pageSlug').value.trim());
      const title = document.getElementById('pageTitle').value.trim();
      const description = document.getElementById('pageDescription').value.trim();
      const metaTitle = document.getElementById('pageMetaTitle').value.trim();
      const metaKeywords = document.getElementById('pageKeywords').value.trim();
      const canonical = document.getElementById('pageCanonical').value.trim();
      const type = document.getElementById('pageType').value || 'custom';
      const content = document.getElementById('pageContent').value;
      const published = document.getElementById('pagePublished').checked;
      const scheduled = document.getElementById('pageScheduled').checked;
      const scheduleAt = scheduled ? document.getElementById('pageScheduleAt').value : '';
      const unpublishAt = document.getElementById('pageUnpublishAt').value || '';
      const payload = { slug, title, description, metaTitle, metaKeywords, canonical, type, content, published, scheduledAt: scheduleAt || null, unpublishAt: unpublishAt || null };
      const res = await api('/api/cms/pages/'+encodeURIComponent(id), { method:'PUT', body: JSON.stringify(payload) });
      if (res.success) {
        editorDirty = false;
        updateDirtyState();
        if (status) status.innerText = 'Draft auto-saved.';
        setTimeout(() => { if (status && status.innerText === 'Draft auto-saved.') status.innerText = ''; }, 1800);
      }
    } catch (e) {
      console.warn('Auto-save failed', e);
    }
  }

  function renderLivePreview(){
    const title = escapeHtml(document.getElementById('pageMetaTitle')?.value || document.getElementById('pageTitle')?.value || document.getElementById('pageSlug')?.value || 'Preview');
    const description = escapeHtml(document.getElementById('pageDescription')?.value || '');
    const keywords = escapeHtml(document.getElementById('pageKeywords')?.value || '');
    const canonical = escapeHtml(document.getElementById('pageCanonical')?.value || '');
    const content = document.getElementById('pageContent').value;
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${description ? `<meta name="description" content="${description}">` : ''}${keywords ? `<meta name="keywords" content="${keywords}">` : ''}${canonical ? `<link rel="canonical" href="${canonical}">` : ''}<style>body{font-family:system-ui,Arial,sans-serif;padding:24px;color:#111827;background:#ffffff;}img{max-width:100%;height:auto;} .btn-primary{display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;}</style></head><body>${content}</body></html>`;
    const frame = document.getElementById('livePreviewFrame');
    if (frame) frame.srcdoc = html;
    return html;
  }
  window.renderLivePreview = renderLivePreview;

  function updateEditorMetrics(){
    const contentEl = document.getElementById('pageContent');
    const metricsEl = document.getElementById('editorMetrics');
    if (!contentEl || !metricsEl) return;
    const text = contentEl.value.replace(/<[^>]*>/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = contentEl.value.length;
    metricsEl.innerText = `${words} words - ${chars} characters`;
  }

  function updateDirtyState(){
    const dirtyEl = document.getElementById('dirtyState');
    if (dirtyEl) dirtyEl.innerText = editorDirty ? 'Unsaved changes' : 'Saved';
  }

  function markDirty(){
    editorDirty = true;
    updateDirtyState();
    updateEditorMetrics();
  }

  function insertSnippet(type){
    const content = document.getElementById('pageContent');
    if (!content) return;
    const snippets = {
      section: '<section class="cms-section">\\n  <h2>Section title</h2>\\n  <p>Write your content here.</p>\\n</section>',
      button: '<a class="btn-primary" href="contact.html">Contact us</a>',
      image: '<img src="assets/images/example.jpg" alt="Describe this image" />'
    };
    const text = snippets[type] || '';
    const start = content.selectionStart || content.value.length;
    const end = content.selectionEnd || content.value.length;
    content.value = content.value.slice(0, start) + text + content.value.slice(end);
    content.focus();
    content.selectionStart = content.selectionEnd = start + text.length;
    markDirty();
    renderLivePreview();
  }
  window.insertSnippet = insertSnippet;

  function toggleScheduleControls(){
    const scheduleCheckbox = document.getElementById('pageScheduled');
    const scheduleControls = document.getElementById('scheduleControls');
    if (!scheduleCheckbox || !scheduleControls) return;
    scheduleControls.style.display = scheduleCheckbox.checked ? 'grid' : 'none';
  }

  window.toggleScheduleControls = toggleScheduleControls;

  function syncSlugFromTitle(){
    const slugEl = document.getElementById('pageSlug');
    const titleEl = document.getElementById('pageTitle');
    if (!slugEl || !titleEl || slugEl.value.trim()) return;
    slugEl.value = slugify(titleEl.value);
  }
  window.syncSlugFromTitle = syncSlugFromTitle;

  function previewPage(){
    const html = renderLivePreview();
    const w = window.open('about:blank', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }
  window.previewPage = previewPage;

  async function duplicateCurrentPage(){
    if (!currentPageId) { alert('Save the page first to duplicate it.'); return; }
    await duplicatePage(currentPageId);
  }
  window.duplicateCurrentPage = duplicateCurrentPage;

  document.addEventListener('DOMContentLoaded', function(){
    loadList();
    loadEditor();
    ['pageSlug','pageTitle','pageDescription','pageMetaTitle','pageKeywords','pageCanonical','pageType','pageContent','pagePublished','pageScheduleAt','pageUnpublishAt'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', markDirty);
      el.addEventListener('change', markDirty);
    });
    const scheduleCheckbox = document.getElementById('pageScheduled');
    if (scheduleCheckbox) {
      scheduleCheckbox.addEventListener('change', function(){ toggleScheduleControls(); markDirty(); });
    }
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.addEventListener('blur', syncSlugFromTitle);
    const contentEl = document.getElementById('pageContent');
    if (contentEl) contentEl.addEventListener('input', renderLivePreview);
    updateEditorMetrics();
    updateDirtyState();
    setInterval(autoSaveDraft, 20000);
    window.addEventListener('beforeunload', function(e){
      if (!editorDirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  });
})();
