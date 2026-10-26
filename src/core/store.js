/**
 * ==============================================================================
 * GRIND OS - CORE STORE & MULTI-USER STATE ENGINE
 * ==============================================================================
 */

window.GrindOS = window.GrindOS || window.ProgressOS || {};
window.ProgressOS = window.GrindOS;

// Available modular tracks in the system
const ALL_TRACKS = [
  { id: 'jobs', name: 'Job Applications', icon: '💼', cadence: 'Daily' },
  { id: 'german', name: 'German Learning', icon: '🇩🇪', cadence: 'Daily' },
  { id: 'coding', name: 'Coding Upskill', icon: '💻', cadence: 'Daily' },
];

// Current active session profile: Default is Guest user
function getInitialUser() {
  const saved = localStorage.getItem('ppt_current_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return {
    id: 'user_guest',
    username: 'Guest',
    email: 'guest@grindos.local',
    isGuest: true
  };
}

const currentUser = getInitialUser();

// Storage key prefix per user so each friend has their own data isolated
function getUserDataKey(userId) {
  return `ppt_data_${userId || currentUser.id}`;
}

function getUserPreferencesKey(userId) {
  return `ppt_prefs_${userId || currentUser.id}`;
}

// Default track visibility preference
function getInitialActiveTracks() {
  const key = getUserPreferencesKey(currentUser.id);
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return ['jobs', 'german', 'coding'];
}

window.GrindOS.state = {
  supabase: null,
  config: {
    supabaseUrl: localStorage.getItem('ppt_supabase_url') || '',
    supabaseKey: localStorage.getItem('ppt_supabase_key') || ''
  },
  currentUser: currentUser,
  activeTracks: getInitialActiveTracks(),
  allTracks: ALL_TRACKS,
  data: {
    jobs: [],
    german: [],
    coding: [],
  },
  currentTab: 'dashboard',
  selectedJobId: null,
  selectedGermanId: null,
  selectedCodingId: null
};

window.ProgressOS.state = window.GrindOS.state;

// Aliased shorthand
const state = window.GrindOS.state;
window.state = state;

// ==============================================================================
// DATE & STRING HELPERS
// ==============================================================================

function getTodayDateStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFormattedDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCurrentWeekId() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNo = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function isDateToday(dateStr) {
  if (!dateStr) return false;
  return dateStr.startsWith(getTodayDateStr());
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Toast notification engine
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// Modal open/close helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// ==============================================================================
// USER AUTHENTICATION & MULTI-USER PROFILES
// ==============================================================================

function getRegisteredUsers() {
  const saved = localStorage.getItem('ppt_registered_users');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return [
    { id: 'user_default', username: 'Demo User', email: 'demo@grindos.local', password: '123' }
  ];
}

function saveRegisteredUsers(users) {
  localStorage.setItem('ppt_registered_users', JSON.stringify(users));
}

function loginUser(usernameOrEmail, password) {
  const cleanName = (usernameOrEmail || '').trim();
  if (!cleanName) {
    showToast('Please enter a username or email', 'error');
    return false;
  }

  const users = getRegisteredUsers();
  let user = users.find(u => u.username.toLowerCase() === cleanName.toLowerCase() || u.email.toLowerCase() === cleanName.toLowerCase());

  // If user doesn't exist yet, automatically create their personal account profile!
  if (!user) {
    user = {
      id: 'usr_' + Date.now().toString(36),
      username: cleanName,
      email: cleanName.includes('@') ? cleanName : `${cleanName}@grindos.local`,
      password: password || '123'
    };
    users.push(user);
    saveRegisteredUsers(users);
    showToast(`Welcome ${user.username}! Your personal profile has been created.`, 'success');
  } else {
    showToast(`Welcome back, ${user.username}!`, 'success');
  }

  state.currentUser = user;
  localStorage.setItem('ppt_current_user', JSON.stringify(user));
  
  // Reload tracks preferences and data for this specific user
  state.activeTracks = getInitialActiveTracks();
  loadAllData();
  updateUserDisplay();
  closeModal('modalLogin');
  if (window.GrindOS.renderApp) window.GrindOS.renderApp();
  return true;
}

function logoutUser() {
  const guestUser = {
    id: 'user_guest_' + Date.now().toString(36),
    username: 'Guest',
    email: 'guest@grindos.local',
    isGuest: true
  };
  state.currentUser = guestUser;
  localStorage.setItem('ppt_current_user', JSON.stringify(guestUser));
  state.activeTracks = getInitialActiveTracks();
  loadAllData();
  updateUserDisplay();
  if (window.GrindOS.renderApp) window.GrindOS.renderApp();
}

function updateUserDisplay() {
  const userBtn = document.getElementById('btnUserProfile');
  if (userBtn) {
    userBtn.textContent = `👤 ${state.currentUser.username || 'User'}`;
  }
}

// Track Preferences (Add / Remove Tabs from Header & Home Screen)
function setTrackActive(trackId, isActive) {
  if (isActive) {
    if (!state.activeTracks.includes(trackId)) {
      state.activeTracks.push(trackId);
    }
  } else {
    state.activeTracks = state.activeTracks.filter(t => t !== trackId);
  }
  // Persist preference for current user
  localStorage.setItem(getUserPreferencesKey(state.currentUser.id), JSON.stringify(state.activeTracks));
  
  if (window.GrindOS.renderApp) {
    window.GrindOS.renderApp();
  }
}

function isTrackActive(trackId) {
  return state.activeTracks.includes(trackId);
}

// ==============================================================================
// SUPABASE CLIENT & DATA PERSISTENCE
// ==============================================================================

function initSupabase() {
  if (window.supabase && state.config.supabaseUrl && state.config.supabaseKey) {
    try {
      state.supabase = window.supabase.createClient(state.config.supabaseUrl, state.config.supabaseKey);
      updateCloudSyncBadge(true);
      return true;
    } catch (err) {
      console.warn('Supabase initialization failed, falling back to LocalStorage:', err);
      updateCloudSyncBadge(false);
      return false;
    }
  } else {
    updateCloudSyncBadge(false);
    return false;
  }
}

function updateCloudSyncBadge(isConnected) {
  const btn = document.getElementById('btnOpenSync');
  if (!btn) return;
  if (isConnected) {
    btn.className = 'btn btn-cloud-sync';
    btn.innerHTML = '🟢 Cloud Synced';
  } else {
    btn.className = 'btn btn-cloud-sync not-connected';
    btn.innerHTML = '⚡ Local Mode (Connect Cloud)';
  }
}

// Initial Sample Data (used only on fresh setup)
const defaultData = {
  jobs: [
    {
      id: 'job-1',
      applied_date: getTodayDateStr(),
      company: 'Celonis',
      role: 'Full Stack Engineer',
      status: 'Interviewing',
      chance: 75,
      notes: 'Second round technical interview scheduled.',
      link: 'https://celonis.com'
    },
    {
      id: 'job-2',
      applied_date: '2026-10-10',
      company: 'SAP',
      role: 'Cloud Developer',
      status: 'Applied',
      chance: 50,
      notes: 'Applied via referral on LinkedIn.',
      link: 'https://sap.com'
    }
  ],
  german: [
    {
      id: 'ger-1',
      date: getTodayDateStr(),
      learned_today: 'Practiced B1 Konjunktiv II with "würde" + Infinitiv, and learned 15 new work-related nouns (die Bewerbung, das Vorstellungsgespräch).',
      next_session_plan: 'Review modal verbs in past tense (Präteritum) and complete Kapitel 4 listening exercises.',
      duration_mins: 45
    }
  ],
  coding: [
    {
      id: 'cod-1',
      date: getTodayDateStr(),
      summary: 'Solved 2 LeetCode graph problems (BFS / Number of Islands). Built dynamic color badges and persistent state logic.',
      topics: 'Algorithms, JavaScript, System Design',
      hours_spent: 2.5,
      link: 'https://leetcode.com'
    }
  ],
};

async function loadAllData() {
  if (state.supabase) {
    try {
      showToast('Syncing with Supabase cloud...', 'info');
      const [jobsRes, germanRes, codingRes] = await Promise.all([
        state.supabase.from('job_applications').select('*').order('applied_date', { ascending: false }),
        state.supabase.from('german_logs').select('*').order('date', { ascending: false }),
        state.supabase.from('coding_logs').select('*').order('date', { ascending: false })
      ]);

      state.data.jobs = jobsRes.data || [];
      state.data.german = germanRes.data || [];
      state.data.coding = codingRes.data || [];

      showToast('Cloud data loaded successfully', 'success');
    } catch (err) {
      console.error('Supabase fetch failed, falling back to LocalStorage', err);
      loadFromLocalStorage();
    }
  } else {
    loadFromLocalStorage();
  }

  saveToLocalStorage();
  if (window.GrindOS.renderApp) {
    window.GrindOS.renderApp();
  }
}

function loadFromLocalStorage() {
  const key = getUserDataKey(state.currentUser.id);
  const local = localStorage.getItem(key);
  if (local) {
    try {
      state.data = JSON.parse(local);
    } catch (e) {
      state.data = JSON.parse(JSON.stringify(defaultData));
    }
  } else {
    // If legacy data exists from earlier sessions, migrate it to the current user
    const legacy = localStorage.getItem('ppt_data');
    if (legacy && state.currentUser.id === 'user_default') {
      try {
        state.data = JSON.parse(legacy);
      } catch(e) {
        state.data = JSON.parse(JSON.stringify(defaultData));
      }
    } else {
      state.data = JSON.parse(JSON.stringify(defaultData));
    }
  }
}

function saveToLocalStorage() {
  const key = getUserDataKey(state.currentUser.id);
  localStorage.setItem(key, JSON.stringify(state.data));
}

// Generic Add / Update / Delete with Cloud + Local sync
async function saveRecord(table, item) {
  const localKey = table === 'job_applications' ? 'jobs'
                 : table === 'german_logs' ? 'german'
                 : 'coding';

  const existingIdx = state.data[localKey].findIndex(x => String(x.id) === String(item.id));
  if (existingIdx >= 0) {
    state.data[localKey][existingIdx] = item;
  } else {
    state.data[localKey].unshift(item);
  }
  saveToLocalStorage();
  if (window.GrindOS.renderApp) {
    window.GrindOS.renderApp();
  }

  if (state.supabase) {
    try {
      const { error } = await state.supabase.from(table).upsert(item);
      if (error) throw error;
      showToast('Cloud updated seamlessly', 'success');
    } catch (err) {
      console.error(`Failed to sync ${table} to Supabase:`, err);
      showToast('Saved locally (Cloud sync failed: ' + err.message + ')', 'error');
    }
  } else {
    showToast('Saved to local storage', 'success');
  }
}

// In-app Delete Confirmation Engine
let pendingDelete = null;

function requestDelete(table, id, title = '') {
  pendingDelete = { table, id };
  closeModal('modalJob');
  closeModal('modalGerman');
  closeModal('modalCoding');

  const promptEl = document.getElementById('deleteConfirmPrompt');
  if (promptEl) {
    promptEl.textContent = title 
      ? `Are you sure you want to delete "${title}"? This cannot be undone.`
      : `Are you sure you want to delete this entry? This action cannot be undone.`;
  }
  openModal('modalDeleteConfirm');
}

function executePendingDelete() {
  if (pendingDelete) {
    const { table, id } = pendingDelete;
    pendingDelete = null;
    closeModal('modalDeleteConfirm');
    deleteRecord(table, id);
  }
}

async function deleteRecord(table, id) {
  const localKey = table === 'job_applications' ? 'jobs'
                 : table === 'german_logs' ? 'german'
                 : 'coding';

  state.data[localKey] = state.data[localKey].filter(x => String(x.id).trim() !== String(id).trim());
  saveToLocalStorage();
  if (window.GrindOS.renderApp) {
    window.GrindOS.renderApp();
  }

  if (state.supabase ) {
    try {
      const { error } = await state.supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      showToast('Deleted successfully', 'success');
    } catch (err) {
      showToast('Deleted locally (cloud error: ' + err.message + ')', 'info');
    }
  } else {
    showToast('Deleted successfully', 'success');
  }
}

// Cloud Sync Modal & Import/Export
function openSyncModal() {
  document.getElementById('syncUrl').value = state.config.supabaseUrl;
  document.getElementById('syncKey').value = state.config.supabaseKey;
  openModal('modalSync');
}

function exportDataAsJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `grind_os_${state.currentUser.username}_${getTodayDateStr()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('JSON backup downloaded', 'success');
}

function importDataFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.jobs && parsed.german && parsed.coding) {
        state.data = parsed;
        saveToLocalStorage();
        if (window.ProgressOS.renderApp) {
          window.ProgressOS.renderApp();
        }
        showToast('Backup restored successfully!', 'success');
      } else {
        showToast('Invalid backup file structure', 'error');
      }
    } catch (err) {
      showToast('Failed to parse JSON file', 'error');
    }
  };
  reader.readAsText(file);
}

// ==============================================================================
// THEME MANAGEMENT (LIGHT & DARK MODE)
// ==============================================================================

function getActiveTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  if (current) return current;
  const saved = localStorage.getItem('ppt_theme');
  if (saved) return saved;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function setTheme(theme) {
  const targetTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', targetTheme);
  localStorage.setItem('ppt_theme', targetTheme);
  updateThemeToggleUI(targetTheme);
}

function toggleTheme() {
  const current = getActiveTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
}

function updateThemeToggleUI(theme) {
  const currentTheme = theme || getActiveTheme();
  const icon = document.getElementById('themeToggleIcon');
  const label = document.getElementById('themeToggleText');
  if (icon && label) {
    if (currentTheme === 'dark') {
      icon.textContent = '☀️';
      label.textContent = 'Light';
    } else {
      icon.textContent = '🌙';
      label.textContent = 'Dark';
    }
  }
}

// Export to namespace and global scope
Object.assign(window.GrindOS, {
  getTodayDateStr,
  getFormattedDate,
  getCurrentWeekId,
  isDateToday,
  escapeHtml,
  showToast,
  openModal,
  closeModal,
  initSupabase,
  loadAllData,
  saveRecord,
  deleteRecord,
  requestDelete,
  executePendingDelete,
  openSyncModal,
  exportDataAsJson,
  importDataFromJson,
  loginUser,
  logoutUser,
  updateUserDisplay,
  setTrackActive,
  isTrackActive,
  getActiveTheme,
  setTheme,
  toggleTheme,
  updateThemeToggleUI
});
window.ProgressOS = window.GrindOS;

// Window globals for inline onclicks
window.openModal = openModal;
window.closeModal = closeModal;
window.escapeHtml = escapeHtml;
window.showToast = showToast;
window.requestDelete = requestDelete;
window.executePendingDelete = executePendingDelete;
window.openSyncModal = openSyncModal;
window.exportDataAsJson = exportDataAsJson;
window.importDataFromJson = importDataFromJson;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.setTrackActive = setTrackActive;
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;

