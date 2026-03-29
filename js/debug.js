(function () {
  const DEBUG_STATE = {
    bar: null,
    scheduleChip: null,
    taskChip: null,
    refreshBound: false
  };

  function ensureDebugStyles() {
    if (document.getElementById('debugStyles')) return;
    const style = document.createElement('style');
    style.id = 'debugStyles';
    style.textContent = `
      .debug-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 3rem 0;
        flex-wrap: wrap;
      }
      .debug-chip {
        font-size: 0.7rem;
        color: var(--ink-muted);
        border: 1px solid var(--rule);
        border-radius: 6px;
        padding: 0.2rem 0.45rem;
        background: var(--parchment);
      }
      .debug-btn {
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        color: var(--ink);
        background: var(--parchment);
        border: 1px solid var(--rule);
        border-radius: 6px;
        padding: 0.28rem 0.55rem;
        cursor: pointer;
      }
      .debug-btn:hover { border-color: var(--amber-light); }
    `;
    document.head.appendChild(style);
  }

  function ensureDebugBar() {
    if (DEBUG_STATE.bar) return DEBUG_STATE.bar;
    const header = document.querySelector('header');
    if (!header) return null;
    const bar = document.createElement('div');
    bar.className = 'debug-bar';
    header.insertAdjacentElement('afterend', bar);
    DEBUG_STATE.bar = bar;
    return bar;
  }

  function getCurrentScheduleId() {
    if (window.currentScheduleId) return window.currentScheduleId;
    const active = document.querySelector('.schedule-card.active');
    if (active && active.dataset.scheduleId) return active.dataset.scheduleId;
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function updateIdChips() {
    if (!DEBUG_STATE.bar) return;
    const scheduleId = getCurrentScheduleId();
    if (DEBUG_STATE.scheduleChip) {
      DEBUG_STATE.scheduleChip.textContent = `Schedule ID: ${scheduleId || 'n/a'}`;
    }
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    if (DEBUG_STATE.taskChip) {
      DEBUG_STATE.taskChip.textContent = `Task ID: ${taskId || 'n/a'}`;
    }
  }

  function bindRefreshOnClick() {
    if (DEBUG_STATE.refreshBound) return;
    DEBUG_STATE.refreshBound = true;
    document.addEventListener('click', () => {
      setTimeout(updateIdChips, 0);
    });
  }

  function resolveSchedule(scheduleId) {
    if (scheduleId) return getSchedule(scheduleId);
    const all = loadSchedules();
    return all.length ? all[0] : null;
  }

  function resolveTask(schedule, taskId) {
    if (!schedule || !Array.isArray(schedule.tasks)) return null;
    return schedule.tasks.find(t => t.id === taskId) || null;
  }

  function completeAllTasks(scheduleId, preserveGuides = false) {
    let id = scheduleId;
    let preserve = preserveGuides;
    if (typeof scheduleId === 'boolean') {
      preserve = scheduleId;
      id = null;
    }

    const schedule = resolveSchedule(id);
    if (!schedule) return null;

    const tasks = Array.isArray(schedule.tasks) ? schedule.tasks : [];
    const updatedTasks = tasks.map(t => ({ ...t, completed: true, skipped: false }));
    const finalTasks = preserve ? updatedTasks : updatedTasks.map(t => ({ ...t, guide: '' }));
    const updated = updateSchedule(schedule.id, { tasks: finalTasks });
    if (typeof renderSchedule === 'function' && updated) {
      renderSchedule(updated);
    }
    return updated;
  }

  async function regenerateTaskGuide(scheduleId, taskId) {
    const schedule = resolveSchedule(scheduleId);
    if (!schedule) throw new Error('Schedule not found');

    const tasks = Array.isArray(schedule.tasks) ? schedule.tasks : [];
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    const task = taskIndex >= 0 ? tasks[taskIndex] : null;
    if (!task) throw new Error('Task not found');

    const durationText = task.duration ? `${task.duration} min` : 'No duration';
    const notes = (task.notes || '').trim();

    const response = await fetch('/api/planifyai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: task.task,
        previousTasks: tasks.filter((_, i) => i < taskIndex),
        for: 'TaskDetails',
        duration: durationText,
        notes
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Request failed (${response.status})`);
    }

    const data = await response.json();
    const raw = typeof data === 'string' ? data : data.content ?? JSON.stringify(data);
    const clean = raw.replace(/```[a-z]*|```/g, '').trim();

    if (!clean) throw new Error('No guide returned');

    tasks[taskIndex] = { ...task, guide: clean };
    updateSchedule(schedule.id, { tasks });
    return clean;
  }

  window.PlanifyDebug = {
    completeAllTasks,
    regenerateTaskGuide,
    view() {
      ensureDebugStyles();
      const bar = ensureDebugBar();
      if (!bar) return null;

      if (bar.childElementCount === 0) {
        const scheduleChip = document.createElement('div');
        scheduleChip.className = 'debug-chip';
        bar.appendChild(scheduleChip);
        DEBUG_STATE.scheduleChip = scheduleChip;

        const params = new URLSearchParams(window.location.search);
        if (params.get('taskId')) {
          const taskChip = document.createElement('div');
          taskChip.className = 'debug-chip';
          bar.appendChild(taskChip);
          DEBUG_STATE.taskChip = taskChip;

          const reloadBtn = document.createElement('button');
          reloadBtn.className = 'debug-btn';
          reloadBtn.type = 'button';
          reloadBtn.textContent = 'Reload Guide';
          reloadBtn.addEventListener('click', async () => {
            const scheduleId = params.get('scheduleId');
            const taskId = params.get('taskId');
            if (!scheduleId || !taskId) return;
            reloadBtn.disabled = true;
            const prev = reloadBtn.textContent;
            reloadBtn.textContent = 'Reloading...';
            try {
              await regenerateTaskGuide(scheduleId, taskId);
              window.location.reload();
            } catch (err) {
              console.error(err);
              reloadBtn.textContent = 'Failed';
              setTimeout(() => {
                reloadBtn.textContent = prev;
                reloadBtn.disabled = false;
              }, 1200);
            }
          });
          bar.appendChild(reloadBtn);
        } else {
          const completeBtn = document.createElement('button');
          completeBtn.className = 'debug-btn';
          completeBtn.type = 'button';
          completeBtn.textContent = 'Complete All Tasks';
          completeBtn.addEventListener('click', () => {
            const scheduleId = getCurrentScheduleId();
            if (!scheduleId) return;
            completeBtn.disabled = true;
            completeAllTasks(scheduleId, true);
            setTimeout(() => {
              completeBtn.disabled = false;
            }, 500);
          });
          bar.appendChild(completeBtn);
        }
      }

      updateIdChips();
      bindRefreshOnClick();
      return bar;
    }
  };
})();
