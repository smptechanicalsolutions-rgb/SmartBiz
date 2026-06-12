// Recurring invoices helper (client-side localStorage-based scheduler)
(function(){
  const VALID_SCHEDULES = new Set(['daily', 'weekly', 'monthly', 'yearly']);

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem('recurringInvoices')||'[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function write(list){
    localStorage.setItem('recurringInvoices', JSON.stringify(list));
  }

  function uid(){ return Date.now() + Math.floor(Math.random()*1000); }

  function parseDate(value, fallback){
    const date = value ? new Date(value) : null;
    if (date && !Number.isNaN(date.getTime())) return date;
    return fallback ? new Date(fallback) : new Date();
  }

  function addMonthsClamped(date, months){
    const d = new Date(date);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return d;
  }

  function addInterval(date, schedule, interval){
    const d = new Date(date);
    const safeInterval = Math.max(1, Number(interval||1));
    if (schedule==='daily') d.setDate(d.getDate()+safeInterval);
    else if (schedule==='weekly') d.setDate(d.getDate()+7*safeInterval);
    else if (schedule==='monthly') return addMonthsClamped(d, safeInterval);
    else if (schedule==='yearly') {
      const month = d.getMonth();
      d.setFullYear(d.getFullYear()+safeInterval);
      if (d.getMonth() !== month) d.setDate(0);
    } else d.setDate(d.getDate()+safeInterval);
    return d;
  }

  function computeNextRun(entry, fromDate){
    try{
      const interval = Math.max(1, Number(entry.interval||1));
      const sched = VALID_SCHEDULES.has(entry.schedule) ? entry.schedule : 'monthly';
      const base = parseDate(fromDate || entry.nextRun || entry.startDate, new Date());
      const d = addInterval(base, sched, interval);
      return d.toISOString();
    }catch(e){
      return new Date().toISOString();
    }
  }

  function normalizeEntry(entry){
    const schedule = VALID_SCHEDULES.has(entry.schedule) ? entry.schedule : 'monthly';
    const interval = Math.max(1, Number(entry.interval||1));
    const startDate = parseDate(entry.startDate, new Date()).toISOString();
    const nextRun = parseDate(entry.nextRun || startDate, startDate).toISOString();
    return Object.assign({}, entry, {
      name: entry.name || 'Recurring',
      clientName: entry.clientName || '',
      amount: Math.max(0, Number(entry.amount||0)),
      schedule,
      interval,
      startDate,
      reminderDays: Math.max(0, Number(entry.reminderDays||0)),
      recipient: entry.recipient || '',
      format: entry.format || 'format1.html',
      active: entry.active !== false,
      nextRun
    });
  }

  function create(entry){
    const list = read();
    const raw = Object.assign({
      id: uid(),
      active: true
    }, entry);
    if (raw.id == null || raw.id === '') raw.id = uid();
    const e = normalizeEntry(raw);
    list.push(e);
    write(list);
    console.log('RecurringInvoices: created', e);
    return e;
  }

  function update(id, updates){
    const list = read();
    const idx = list.findIndex(x=>String(x.id)===String(id));
    if (idx===-1) return null;
    const next = Object.assign({}, list[idx], updates);
    if (updates.startDate && !updates.nextRun) next.nextRun = parseDate(updates.startDate, new Date()).toISOString();
    list[idx] = normalizeEntry(next);
    write(list); return list[idx];
  }

  function cancel(id){
    return update(id, {active:false});
  }

  function remove(id){
    const list = read().filter(x=>String(x.id)!==String(id)); write(list); return true;
  }

  function checkAndRun(onCreated){
    const now = new Date();
    console.log('RecurringInvoices: checkAndRun at', now.toISOString());
    const list = read();
    const changed = [];
    list.forEach(entry=>{
      if (!entry.active) return;
      let next = parseDate(entry.nextRun||entry.startDate, new Date());
      let runs = 0;
      while (next <= now && runs < 24){
        // generate invoice (basic template)
        const history = JSON.parse(localStorage.getItem('invoiceHistory')||'[]');
        const runDate = next.toISOString();
        const invoice = {
          id: Math.floor(Date.now()/1000) + runs,
          invoiceNo: `REC-${entry.id}-${runDate.slice(0,10).replace(/-/g,'')}`,
          clientName: entry.clientName,
          grandTotal: (entry.amount||0),
          createdAt: new Date().toISOString(),
          invoiceDate: runDate,
          format: entry.format||'format1.html',
          fullData: {
            invoiceNo: `REC-${entry.id}-${runDate.slice(0,10).replace(/-/g,'')}`,
            companyName: (JSON.parse(localStorage.getItem('appSettings')||'{}').companyName) || 'Company',
            clientName: entry.clientName,
            items: [{name: entry.name || 'Recurring Item', qty:1, rate: entry.amount||0}],
            invoiceDate: runDate,
            shipping: { total: 0 },
            taxes: [],
            signature: null
          }
        };
        history.unshift(invoice);
        localStorage.setItem('invoiceHistory', JSON.stringify(history));
        // advance nextRun
        entry.nextRun = computeNextRun(entry, next);
        next = parseDate(entry.nextRun, now);
        changed.push(entry.id);
        runs += 1;
        console.log('RecurringInvoices: generated invoice', invoice.invoiceNo, 'for recurring id', entry.id, 'nextRun->', entry.nextRun);
        // invoke callback
        if (typeof onCreated === 'function') onCreated(invoice, entry);
      }
    });
    if (changed.length) write(list);
    return changed;
  }

  function upcomingWithin(days){
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() + Math.max(0, Number(days||0)));
    return read().filter(e=>e.active && parseDate(e.nextRun, new Date(8640000000000000)) <= cutoff);
  }

  // expose
  window.RecurringInvoices = {
    list: read,
    create: create,
    update: update,
    cancel: cancel,
    remove: remove,
    checkAndRun: checkAndRun,
    upcomingWithin: upcomingWithin,
    computeNextRun: computeNextRun
  };

  // run check on load to create due invoices (best-effort when user opens app)
  document.addEventListener('DOMContentLoaded', function(){
    try{ RecurringInvoices.checkAndRun(function(inv, entry){
        if (window.notificationService) notificationService.show(`Generated recurring invoice: ${entry.name}`, 'success', 5000);
      });
    }catch(e){}
  });

})();
