/**
 * ==============================================================================
 * GRIND OS - APPLICATION ORCHESTRATOR & BOOTSTRAPPER (PHASE 2)
 * ==============================================================================
 */

window.GrindOS = window.GrindOS || window.ProgressOS || {};

(function(app) {
  const { 
    state, 
    evaluateStatus, 
    renderDashboard, 
    renderJobsTab, 
    renderGermanTab, 
    renderCodingTab, 
    initSupabase, 
    loadAllData, 
    requestDelete, 
    isTrackActive, 
    setTrackActive, 
    updateUserDisplay, 
    loginUser, 
    logoutUser, 
    openModal, 
    closeModal,
    showToast,
    escapeHtml 
  } = app;

  // Master Render Coordinator
  function renderApp() {
    // 1. Update navigation tab visibility based on activeTracks
    updateNavTabsVisibility();

    // 2. Render customize track modal switches
    renderTrackTogglesModal();

    // 3. Render user profile button
    updateUserDisplay();

    // 4. Render individual tabs
    const status = evaluateStatus ? evaluateStatus() : null;
    if (renderDashboard) renderDashboard(status);
    if (renderJobsTab && isTrackActive('jobs')) renderJobsTab();
    if (renderGermanTab && isTrackActive('german')) renderGermanTab();
    if (renderCodingTab && isTrackActive('coding')) renderCodingTab();
  }

  // Update top navigation buttons depending on which tracks are turned on
  function updateNavTabsVisibility() {
    const navButtons = document.querySelectorAll('.nav-tab-btn[data-tab]');
    navButtons.forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      if (tab === 'dashboard') {
        btn.style.display = 'inline-flex';
      } else {
        btn.style.display = isTrackActive(tab) ? 'inline-flex' : 'none';
      }
    });

    // If currently active tab was hidden by user preference, auto-fallback to dashboard
    if (state.currentTab !== 'dashboard' && !isTrackActive(state.currentTab)) {
      switchTab('dashboard');
    }
  }

  // Render Track Customizer Modal
  function renderTrackTogglesModal() {
    const container = document.getElementById('trackTogglesList');
    if (!container) return;

    container.innerHTML = state.allTracks.map(t => {
      const checked = isTrackActive(t.id);
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:0.85rem 1rem; border:1.5px solid var(--border-strong); border-radius:var(--radius-sm); margin-bottom:0.75rem; background:var(--bg-card); box-shadow:var(--shadow-hard-sm);">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="font-size:1.35rem;">${t.icon}</span>
            <div>
              <div style="font-weight:700; font-size:0.95rem; color:var(--text-main);">${escapeHtml(t.name)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:'JetBrains Mono';">${t.cadence} Track</div>
            </div>
          </div>
          <label style="display:inline-flex; align-items:center; gap:0.5rem; cursor:pointer; font-family:'JetBrains Mono'; font-weight:700; font-size:0.85rem; color:var(--text-main);">
            <input type="checkbox" onchange="(window.GrindOS.handleTrackToggle || window.ProgressOS.handleTrackToggle)('${t.id}', this.checked)" ${checked ? 'checked' : ''} style="width:1.25rem; height:1.25rem; accent-color:var(--text-main); cursor:pointer;" />
            <span>${checked ? 'Active' : 'Hidden'}</span>
          </label>
        </div>
      `;
    }).join('');
  }

  function handleTrackToggle(trackId, isChecked) {
    setTrackActive(trackId, isChecked);
    renderApp();
    showToast(`${isChecked ? 'Added' : 'Removed'} ${trackId} to tabs & home screen`, 'info');
  }

  // Navigation Tab Switching
  function switchTab(tabName) {
    state.currentTab = tabName;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-tab-btn').forEach(el => el.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabName}"]`);
    if (targetTab) targetTab.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');


    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Orchestrator Initialization
  function initOrchestrator() {
    // 1. Navigation tab clicks
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // 2. Initialize Tab Form & Input Listeners
    if (app.initJobEvents) app.initJobEvents();
    if (app.initGermanEvents) app.initGermanEvents();
    if (app.initCodingEvents) app.initCodingEvents();

    // 3. User Login Form Submission
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        loginUser(username, password);
      });
    }

    // 4. Supabase Cloud Sync Form
    const formSync = document.getElementById('formSync');
    if (formSync) {
      formSync.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('syncUrl').value.trim();
        const key = document.getElementById('syncKey').value.trim();

        state.config.supabaseUrl = url;
        state.config.supabaseKey = key;
        localStorage.setItem('ppt_supabase_url', url);
        localStorage.setItem('ppt_supabase_key', key);

        if (url && key) {
          const success = initSupabase();
          if (success) {
            await loadAllData();
            app.showToast('Connected to Supabase! Cloud sync active.', 'success');
            app.closeModal('modalSync');
          } else {
            app.showToast('Could not initialize Supabase. Check your URL & Key.', 'error');
          }
        } else {
          state.supabase = null;
          const btn = document.getElementById('btnOpenSync');
          if (btn) {
            btn.className = 'btn btn-cloud-sync not-connected';
            btn.innerHTML = '⚡ Local Mode (Connect Cloud)';
          }
          app.showToast('Switched to LocalStorage mode', 'info');
          app.closeModal('modalSync');
        }
      });
    }

    // 5. Modal Overlay Click Outside To Close
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // 6. Global Delegated Click Handler for Cancel & Close Buttons
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close-modal], .btn-close') || 
                       (e.target.tagName === 'BUTTON' && e.target.textContent.trim().toLowerCase() === 'cancel' ? e.target : null);
      if (closeBtn) {
        const modal = closeBtn.closest('.modal-overlay');
        if (modal) {
          e.preventDefault();
          modal.classList.remove('active');
        }
      }
    });

    // 7. Global Delegated Click Handler for Delete Buttons
    document.addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-action="delete"]');
      if (delBtn) {
        e.preventDefault();
        e.stopPropagation();
        const table = delBtn.getAttribute('data-table');
        const id = delBtn.getAttribute('data-id');
        const title = delBtn.getAttribute('data-title') || 'this entry';
        requestDelete(table, id, title);
      }
    });

    // 8. Keyboard Shortcuts: 1-4 for quick tab switching
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '1') switchTab('dashboard');
      if (e.key === '2' && isTrackActive('jobs')) switchTab('jobs');
      if (e.key === '3' && isTrackActive('german')) switchTab('german');
      if (e.key === '4' && isTrackActive('coding')) switchTab('coding');
    });

    // 9. Connect Cloud Sync & Load Initial State
    initSupabase();
    loadAllData();
    updateUserDisplay();
    if (app.updateThemeToggleUI) {
      app.updateThemeToggleUI();
    }
  }

  // Register in app namespace
  app.renderApp = renderApp;
  app.switchTab = switchTab;
  app.handleTrackToggle = handleTrackToggle;
  app.initOrchestrator = initOrchestrator;

  // Window globals
  window.renderApp = renderApp;
  window.switchTab = switchTab;
  window.handleTrackToggle = handleTrackToggle;

  // Auto-boot on DOM ready
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initOrchestrator);
  } else {
    initOrchestrator();
  }
})(window.GrindOS || window.ProgressOS);
