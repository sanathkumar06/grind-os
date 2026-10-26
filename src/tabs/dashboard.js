/**
 * ==============================================================================
 * GRIND OS - DASHBOARD TAB MODULE (DYNAMIC TRACK-AWARE)
 * ==============================================================================
 */

window.GrindOS = window.GrindOS || window.ProgressOS || {};

(function(app) {
  const { state, getCurrentWeekId, isDateToday, isTrackActive } = app;

  function evaluateStatus() {
    const hasJobToday = state.data.jobs.some(j => isDateToday(j.applied_date));
    const hasGermanToday = state.data.german.some(g => isDateToday(g.date));
    const hasCodingToday = state.data.coding.some(c => isDateToday(c.date));

    return {
      jobs: {
        isDone: hasJobToday,
        count: state.data.jobs.length,
        latest: state.data.jobs[0]
      },
      german: {
        isDone: hasGermanToday,
        count: state.data.german.length,
        latest: state.data.german[0]
      },
      coding: {
        isDone: hasCodingToday,
        count: state.data.coding.length,
        latest: state.data.coding[0]
      },
    };
  }

  function renderDashboard(status) {
    if (!status) status = evaluateStatus();

    // Date & Header
    const dateEl = document.getElementById('currentDateDisplay');
    if (dateEl) {
      const today = new Date();
      dateEl.textContent = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) + ` • Week ${getCurrentWeekId().split('-W')[1]}`;
    }

    // Toggle track card visibility on home screen based on active user preferences
    const cardJobs = document.getElementById('cardDashJobs');
    const cardGerman = document.getElementById('cardDashGerman');
    const cardCoding = document.getElementById('cardDashCoding');

    if (cardJobs) cardJobs.style.display = isTrackActive('jobs') ? 'block' : 'none';
    if (cardGerman) cardGerman.style.display = isTrackActive('german') ? 'block' : 'none';
    if (cardCoding) cardCoding.style.display = isTrackActive('coding') ? 'block' : 'none';

    // Calculate completion score only across currently ACTIVE tracks
    let activeTotal = 0;
    let completedCount = 0;

    if (isTrackActive('jobs')) {
      activeTotal++;
      if (status.jobs.isDone) completedCount++;
    }
    if (isTrackActive('german')) {
      activeTotal++;
      if (status.german.isDone) completedCount++;
    }
    if (isTrackActive('coding')) {
      activeTotal++;
      if (status.coding.isDone) completedCount++;
    }

    const scoreText = document.getElementById('scoreText');
    const scoreFill = document.getElementById('scoreFill');
    if (scoreText && scoreFill) {
      if (activeTotal > 0) {
        scoreText.textContent = `${completedCount} / ${activeTotal} Completed`;
        const pct = (completedCount / activeTotal) * 100;
        scoreFill.style.width = `${pct}%`;
      } else {
        scoreText.textContent = `0 Tracks Enabled`;
        scoreFill.style.width = `0%`;
      }
    }

    // 1. Job Applications Card
    if (cardJobs && isTrackActive('jobs')) {
      cardJobs.className = `track-card ${status.jobs.isDone ? 'status-done' : 'status-pending'}`;
      const badge = cardJobs.querySelector('.status-badge');
      if (badge) {
        badge.className = `status-badge ${status.jobs.isDone ? 'badge-done' : 'badge-pending'}`;
        badge.innerHTML = `<span class="status-dot"></span> ${status.jobs.isDone ? 'Applied Today' : 'No Action Today'}`;
      }
      
      const preview = cardJobs.querySelector('.track-card-preview');
      if (preview) {
        if (status.jobs.latest) {
          preview.textContent = `Latest: ${status.jobs.latest.role} at ${status.jobs.latest.company} (${status.jobs.latest.chance}% chance)`;
        } else {
          preview.textContent = 'No applications recorded yet. Click to add your first job application.';
        }
      }
      const stat = cardJobs.querySelector('.track-stat');
      if (stat) stat.textContent = `${status.jobs.count} Total Tracked`;
    }

    // 2. German Learning Card
    if (cardGerman && isTrackActive('german')) {
      cardGerman.className = `track-card ${status.german.isDone ? 'status-done' : 'status-pending'}`;
      const badge = cardGerman.querySelector('.status-badge');
      if (badge) {
        badge.className = `status-badge ${status.german.isDone ? 'badge-done' : 'badge-pending'}`;
        badge.innerHTML = `<span class="status-dot"></span> ${status.german.isDone ? 'Completed Today' : 'Pending Today'}`;
      }

      const preview = cardGerman.querySelector('.track-card-preview');
      if (preview) {
        if (status.german.latest) {
          preview.textContent = status.german.isDone 
            ? `Learned: "${status.german.latest.learned_today.slice(0, 75)}..."`
            : `Up Next: "${status.german.latest.next_session_plan ? status.german.latest.next_session_plan.slice(0, 75) : 'Review vocabulary'}..."`;
        } else {
          preview.textContent = 'No German sessions logged yet. Click to record your daily progress.';
        }
      }
      const stat = cardGerman.querySelector('.track-stat');
      if (stat) stat.textContent = `${status.german.count} Sessions Logged`;
    }

    // 3. Coding Upskill Card
    if (cardCoding && isTrackActive('coding')) {
      cardCoding.className = `track-card ${status.coding.isDone ? 'status-done' : 'status-pending'}`;
      const badge = cardCoding.querySelector('.status-badge');
      if (badge) {
        badge.className = `status-badge ${status.coding.isDone ? 'badge-done' : 'badge-pending'}`;
        badge.innerHTML = `<span class="status-dot"></span> ${status.coding.isDone ? 'Practiced Today' : 'Pending Today'}`;
      }

      const preview = cardCoding.querySelector('.track-card-preview');
      if (preview) {
        if (status.coding.latest) {
          preview.textContent = `${status.coding.latest.summary.slice(0, 75)}... (${status.coding.latest.hours_spent || 1} hrs)`;
        } else {
          preview.textContent = 'Track your daily coding exercises, LeetCode, or personal project commits.';
        }
      }
      const stat = cardCoding.querySelector('.track-stat');
      const totalHours = state.data.coding.reduce((acc, c) => acc + (parseFloat(c.hours_spent) || 0), 0);
      if (stat) stat.textContent = `${totalHours.toFixed(1)} hrs Total`;
    }

    
  }

  // Register in module namespace
  app.evaluateStatus = evaluateStatus;
  app.renderDashboard = renderDashboard;
})(window.GrindOS || window.ProgressOS);
