/**
 * ==============================================================================
 * GRIND OS - JOB APPLICATIONS TAB MODULE
 * ==============================================================================
 */

window.GrindOS = window.GrindOS || window.ProgressOS || {};

(function(app) {
  const { state, escapeHtml, getFormattedDate, getTodayDateStr, openModal, closeModal, saveRecord, requestDelete } = app;

  function renderJobsTab() {
    const tbody = document.getElementById('jobsTableBody');
    if (!tbody) return;

    const totalEl = document.getElementById('statJobsTotal');
    const interviewEl = document.getElementById('statJobsInterview');
    const avgChanceEl = document.getElementById('statJobsAvgChance');

    const jobs = state.data.jobs;
    if (totalEl) totalEl.textContent = jobs.length;
    if (interviewEl) interviewEl.textContent = jobs.filter(j => j.status === 'Interviewing').length;
    
    if (avgChanceEl) {
      const avg = jobs.length > 0 ? Math.round(jobs.reduce((a, b) => a + (parseInt(b.chance) || 0), 0) / jobs.length) : 0;
      avgChanceEl.textContent = `${avg}%`;
    }

    if (jobs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No job applications added yet. Click "+ Add Job Application" above.</td></tr>`;
      return;
    }

    tbody.innerHTML = jobs.map(job => {
      const chance = parseInt(job.chance) || 0;
      let chanceColor = chance >= 70 ? '#10b981' : chance >= 40 ? '#f59e0b' : '#f43f5e';
      return `
        <tr>
          <td style="font-weight:600;">${escapeHtml(job.company)}</td>
          <td>${escapeHtml(job.role)}</td>
          <td><span class="status-pill status-${job.status}">${job.status}</span></td>
          <td>
            <div class="chance-bar-wrap">
              <span style="font-family:'JetBrains Mono'; font-weight:700; color:${chanceColor}; width:38px;">${chance}%</span>
              <div class="chance-bar"><div class="chance-bar-fill" style="width:${chance}%; background:${chanceColor};"></div></div>
            </div>
          </td>
          <td style="color:var(--text-muted); font-size:0.85rem;">${getFormattedDate(job.applied_date)}</td>
          <td style="max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-muted);" title="${escapeHtml(job.notes || '')}">
            ${job.notes ? escapeHtml(job.notes) : '<span style="color:var(--text-dim)">—</span>'}
          </td>
          <td style="text-align:right;">
            <button type="button" class="btn btn-secondary" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="openJobModal('${job.id}')">Edit</button>
            <button type="button" class="btn btn-danger" data-action="delete" data-table="job_applications" data-id="${job.id}" data-title="${escapeHtml(job.company)} - ${escapeHtml(job.role)}" onclick="requestDelete('job_applications', '${job.id}', '${escapeHtml(job.company)} - ${escapeHtml(job.role)}');" style="padding:0.3rem 0.65rem; font-size:0.75rem; color:#dc2626; border-color:#dc2626; cursor:pointer;">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openJobModal(jobId = null) {
    state.selectedJobId = jobId;
    const title = document.getElementById('jobModalTitle');
    const form = document.getElementById('formJob');
    if (form) form.reset();

    if (jobId) {
      const job = state.data.jobs.find(j => String(j.id) === String(jobId));
      if (job) {
        if (title) title.textContent = 'Edit Job Application';
        document.getElementById('jobCompany').value = job.company;
        document.getElementById('jobRole').value = job.role;
        document.getElementById('jobDate').value = job.applied_date;
        document.getElementById('jobStatus').value = job.status;
        document.getElementById('jobChance').value = job.chance;
        document.getElementById('jobChanceVal').textContent = `${job.chance}%`;
        document.getElementById('jobNotes').value = job.notes || '';
        document.getElementById('jobLink').value = job.link || '';
      }
    } else {
      if (title) title.textContent = 'Add Job Application';
      document.getElementById('jobDate').value = getTodayDateStr();
      document.getElementById('jobChance').value = 50;
      document.getElementById('jobChanceVal').textContent = '50%';
    }

    const btnDel = document.getElementById('btnDeleteJobModal');
    if (btnDel) btnDel.style.display = jobId ? 'inline-flex' : 'none';
    openModal('modalJob');
  }

  function initJobEvents() {
    const form = document.getElementById('formJob');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = state.selectedJobId || ('job-' + Date.now());
        const item = {
          id,
          company: document.getElementById('jobCompany').value.trim(),
          role: document.getElementById('jobRole').value.trim(),
          applied_date: document.getElementById('jobDate').value,
          status: document.getElementById('jobStatus').value,
          chance: parseInt(document.getElementById('jobChance').value) || 50,
          notes: document.getElementById('jobNotes').value.trim(),
          link: document.getElementById('jobLink').value.trim()
        };
        await saveRecord('job_applications', item);
        closeModal('modalJob');
      });
    }

    const jobChanceSlider = document.getElementById('jobChance');
    const jobChanceVal = document.getElementById('jobChanceVal');
    if (jobChanceSlider && jobChanceVal) {
      jobChanceSlider.addEventListener('input', (e) => {
        jobChanceVal.textContent = `${e.target.value}%`;
      });
    }
  }

  function handleDeleteJob(id) {
    requestDelete('job_applications', id, 'Job Application');
  }

  // Register in module namespace
  app.renderJobsTab = renderJobsTab;
  app.openJobModal = openJobModal;
  app.initJobEvents = initJobEvents;
  app.handleDeleteJob = handleDeleteJob;

  // Global window bindings for inline HTML
  window.openJobModal = openJobModal;
  window.handleDeleteJob = handleDeleteJob;
})(window.GrindOS || window.ProgressOS);
