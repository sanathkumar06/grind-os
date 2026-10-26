/**
 * ==============================================================================
 * GRIND OS - CODING UPSKILL TAB MODULE
 * ==============================================================================
 */

window.GrindOS = window.GrindOS || window.ProgressOS || {};

(function(app) {
  const { state, escapeHtml, getFormattedDate, getTodayDateStr, isDateToday, openModal, closeModal, saveRecord, requestDelete } = app;

  function renderCodingTab() {
    const container = document.getElementById('codingHistoryContainer');
    if (!container) return;

    const totalLogsEl = document.getElementById('statCodingLogs');
    const totalHoursEl = document.getElementById('statCodingHours');
    if (totalLogsEl) totalLogsEl.textContent = state.data.coding.length;
    if (totalHoursEl) {
      const total = state.data.coding.reduce((a, b) => a + (parseFloat(b.hours_spent) || 0), 0);
      totalHoursEl.textContent = `${total.toFixed(1)} hrs`;
    }

    if (state.data.coding.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 2.5rem; color: var(--text-muted); background: var(--bg-card); border: 1.5px solid var(--border-strong); border-radius: var(--radius-md);">No coding upskill sessions logged yet. Click "+ Log Today's Coding Progress" above.</div>`;
      return;
    }

    container.innerHTML = state.data.coding.map(log => `
      <div class="history-card">
        <div class="history-card-header">
          <div class="history-date">
            <span>⚡ ${getFormattedDate(log.date)}</span>
            ${isDateToday(log.date) ? '<span class="status-badge badge-done" style="font-size:0.7rem; padding:0.15rem 0.5rem;"><span class="status-dot"></span> TODAY</span>' : ''}
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-family:'JetBrains Mono'; font-weight:800; color:var(--text-main);">${log.hours_spent || 1} hrs</span>
            <button type="button" class="btn btn-secondary" style="padding:0.25rem 0.6rem; font-size:0.75rem;" onclick="openCodingModal('${log.id}')">Edit</button>
            <button type="button" class="btn btn-danger" data-action="delete" data-table="coding_logs" data-id="${log.id}" data-title="Coding Session (${getFormattedDate(log.date)})" onclick="requestDelete('coding_logs', '${log.id}', 'Coding Session (${getFormattedDate(log.date)})');" style="padding:0.25rem 0.65rem; font-size:0.75rem; color:#dc2626; border-color:#dc2626; cursor:pointer;">Delete</button>
          </div>
        </div>
        <p style="font-size:0.95rem; color:var(--text-body); margin-bottom:0.75rem; white-space:pre-wrap;">${escapeHtml(log.summary)}</p>
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.5rem;">
          <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
            ${(log.topics || '').split(',').filter(Boolean).map(tag => `
              <span style="background:var(--bg-card-inner); color:var(--text-main); border:1px solid var(--border-strong); padding:0.2rem 0.5rem; border-radius:var(--radius-sm); font-size:0.75rem; font-weight:700; font-family:'JetBrains Mono';">
                #${escapeHtml(tag.trim())}
              </span>
            `).join('')}
          </div>
          ${log.link ? `
            <a href="${escapeHtml(log.link)}" target="_blank" rel="noopener" style="color:var(--text-main); font-size:0.8rem; font-weight:700; text-decoration:underline; display:flex; align-items:center; gap:0.3rem;">
              🔗 View Project / Solution
            </a>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  function openCodingModal(codingId = null) {
    state.selectedCodingId = codingId;
    const title = document.getElementById('codingModalTitle');
    const form = document.getElementById('formCoding');
    if (form) form.reset();

    if (codingId) {
      const log = state.data.coding.find(c => String(c.id) === String(codingId));
      if (log) {
        if (title) title.textContent = 'Edit Coding Upskill';
        document.getElementById('codingDate').value = log.date;
        document.getElementById('codingSummary').value = log.summary || '';
        document.getElementById('codingTopics').value = log.topics || '';
        document.getElementById('codingHours').value = log.hours_spent || 1.0;
        document.getElementById('codingLink').value = log.link || '';
      }
    } else {
      if (title) title.textContent = "Log Today's Coding Progress";
      document.getElementById('codingDate').value = getTodayDateStr();
      document.getElementById('codingHours').value = 1.0;
    }

    const btnDel = document.getElementById('btnDeleteCodingModal');
    if (btnDel) btnDel.style.display = codingId ? 'inline-flex' : 'none';
    openModal('modalCoding');
  }

  function initCodingEvents() {
    const form = document.getElementById('formCoding');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = state.selectedCodingId || ('cod-' + Date.now());
        const item = {
          id,
          date: document.getElementById('codingDate').value,
          summary: document.getElementById('codingSummary').value.trim(),
          topics: document.getElementById('codingTopics').value.trim(),
          hours_spent: parseFloat(document.getElementById('codingHours').value) || 1.0,
          link: document.getElementById('codingLink').value.trim()
        };
        await saveRecord('coding_logs', item);
        closeModal('modalCoding');
      });
    }
  }

  function handleDeleteCoding(id) {
    requestDelete('coding_logs', id, 'Coding Progress Log');
  }

  // Register in module namespace
  app.renderCodingTab = renderCodingTab;
  app.openCodingModal = openCodingModal;
  app.initCodingEvents = initCodingEvents;
  app.handleDeleteCoding = handleDeleteCoding;

  // Global window bindings for inline HTML
  window.openCodingModal = openCodingModal;
  window.handleDeleteCoding = handleDeleteCoding;
})(window.GrindOS || window.ProgressOS);
