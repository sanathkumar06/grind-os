/**
 * ==============================================================================
 * GRIND OS - GERMAN LEARNING TAB MODULE
 * ==============================================================================
 */

window.GrindOS = window.GrindOS || window.ProgressOS || {};

(function(app) {
  const { state, escapeHtml, getFormattedDate, getTodayDateStr, isDateToday, openModal, closeModal, saveRecord, requestDelete } = app;

  function renderGermanTab() {
    const container = document.getElementById('germanHistoryContainer');
    if (!container) return;

    const countEl = document.getElementById('statGermanTotal');
    const streakEl = document.getElementById('statGermanStreak');
    if (countEl) countEl.textContent = state.data.german.length;

    // Compute Streak
    if (streakEl) {
      let streak = 0;
      const sorted = [...state.data.german].sort((a, b) => new Date(b.date) - new Date(a.date));
      let checkDate = new Date();
      let todayLogged = sorted.some(g => isDateToday(g.date));
      if (!todayLogged) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      for (let i = 0; i < sorted.length; i++) {
        const targetStr = checkDate.toISOString().split('T')[0];
        if (sorted.some(g => g.date === targetStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      streakEl.textContent = `${streak} Days 🔥`;
    }

    if (state.data.german.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 2.5rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">No German study logs yet. Click "+ Log Today's German Session" above.</div>`;
      return;
    }

    container.innerHTML = state.data.german.map(log => `
      <div class="history-card">
        <div class="history-card-header">
          <div class="history-date">
            <span>📅 ${getFormattedDate(log.date)}</span>
            ${isDateToday(log.date) ? '<span class="status-badge badge-done" style="font-size:0.7rem; padding:0.15rem 0.5rem;"><span class="status-dot"></span> TODAY</span>' : ''}
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:0.85rem; color:var(--text-dim);">${log.duration_mins || 30} mins</span>
            <button type="button" class="btn btn-secondary" style="padding:0.25rem 0.6rem; font-size:0.75rem;" onclick="openGermanModal('${log.id}')">Edit</button>
            <button type="button" class="btn btn-danger" data-action="delete" data-table="german_logs" data-id="${log.id}" data-title="German Session (${getFormattedDate(log.date)})" onclick="requestDelete('german_logs', '${log.id}', 'German Session (${getFormattedDate(log.date)})');" style="padding:0.25rem 0.65rem; font-size:0.75rem; color:#dc2626; border-color:#dc2626; cursor:pointer;">Delete</button>
          </div>
        </div>
        <div style="margin-bottom:0.75rem;">
          <div style="font-size:0.75rem; font-weight:700; color:var(--text-main); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:0.25rem; font-family:'JetBrains Mono';">What I Learned Today:</div>
          <p style="color:var(--text-body); font-size:0.95rem; white-space:pre-wrap;">${escapeHtml(log.learned_today)}</p>
        </div>
        ${log.next_session_plan ? `
          <div style="background:var(--bg-card-inner); border:1.5px solid var(--border-strong); padding:0.6rem 0.85rem; border-radius:4px; font-size:0.88rem;">
            <div style="font-size:0.72rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.2rem; font-family:'JetBrains Mono';">Next Session Goal:</div>
            <p style="color:var(--text-body);">${escapeHtml(log.next_session_plan)}</p>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  function openGermanModal(logId = null) {
    state.selectedGermanId = logId;
    const title = document.getElementById('germanModalTitle');
    const form = document.getElementById('formGerman');
    if (form) form.reset();

    if (logId) {
      const log = state.data.german.find(g => String(g.id) === String(logId));
      if (log) {
        if (title) title.textContent = 'Edit German Session';
        document.getElementById('germanDate').value = log.date;
        document.getElementById('germanLearned').value = log.learned_today || '';
        document.getElementById('germanNext').value = log.next_session_plan || '';
        document.getElementById('germanDuration').value = log.duration_mins || 30;
      }
    } else {
      if (title) title.textContent = "Log Today's German Session";
      document.getElementById('germanDate').value = getTodayDateStr();
      document.getElementById('germanDuration').value = 30;
    }

    const btnDel = document.getElementById('btnDeleteGermanModal');
    if (btnDel) btnDel.style.display = logId ? 'inline-flex' : 'none';
    openModal('modalGerman');
  }

  function initGermanEvents() {
    const form = document.getElementById('formGerman');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = state.selectedGermanId || ('ger-' + Date.now());
        const item = {
          id,
          date: document.getElementById('germanDate').value,
          learned_today: document.getElementById('germanLearned').value.trim(),
          next_session_plan: document.getElementById('germanNext').value.trim(),
          duration_mins: parseInt(document.getElementById('germanDuration').value) || 30
        };
        await saveRecord('german_logs', item);
        closeModal('modalGerman');
      });
    }
  }

  function handleDeleteGerman(id) {
    requestDelete('german_logs', id, 'German Study Log');
  }

  // Register in module namespace
  app.renderGermanTab = renderGermanTab;
  app.openGermanModal = openGermanModal;
  app.initGermanEvents = initGermanEvents;
  app.handleDeleteGerman = handleDeleteGerman;

  // Global window bindings for inline HTML
  window.openGermanModal = openGermanModal;
  window.handleDeleteGerman = handleDeleteGerman;
})(window.GrindOS || window.ProgressOS);
