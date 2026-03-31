function renderCalendar(data, startDate, endDate, days, totalMinutes, scheduleId) {
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('printBtn').style.display = 'inline-block';

  const tasks = Array.isArray(data.tasks) ? data.tasks : [];

  // Build task map
  const taskMap = {};
  tasks.forEach(t => {
    if (!taskMap[t.date]) taskMap[t.date] = [];
    taskMap[t.date].push(t);
  });

  // Stats
  const totalTasks = tasks.length;
  const activeDays = Object.keys(taskMap).length;
  const hrsLabel = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

  // Update header
  document.getElementById('panelTitle').textContent = data.title || 'Your Schedule';
  const fmt = d =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  document.getElementById('panelSubtitle').textContent = `${fmt(startDate)} - ${fmt(endDate)}`;

  // Summary bar
  let html = `<div class="summary-bar">
    <div class="summary-stat"><span class="summary-val">${days.length}</span><span class="summary-key">Days total</span></div>
    <div class="summary-stat"><span class="summary-val">${activeDays}</span><span class="summary-key">Active days</span></div>
    <div class="summary-stat"><span class="summary-val">${totalTasks}</span><span class="summary-key">Tasks</span></div>
    <div class="summary-stat"><span class="summary-val">${hrsLabel}</span><span class="summary-key">Per day</span></div>
  </div>`;

  // Build weeks
  const startD = new Date(startDate + 'T00:00:00');
  const endD = new Date(endDate + 'T00:00:00');
  const todayStr = fmtDate(new Date());

  // Find first Monday on or before startDate
  const firstDay = new Date(startD);
  const dow = firstDay.getDay(); // 0=Sun
  const offset = dow === 0 ? 6 : dow - 1; // Monday = 0
  firstDay.setDate(firstDay.getDate() - offset);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  html += `<div class="calendar-grid">`;
  html += `<div class="week-header">${dayNames.map(d => `<span>${d}</span>`).join('')}</div>`;

  let cur = new Date(firstDay);
  while (cur <= endD) {
    html += `<div class="week-row">`;
    for (let i = 0; i < 7; i++) {
      const d = fmtDate(cur);
      const inRange = cur >= startD && cur <= endD;
      const isToday = d === todayStr;
      const isPast = cur < new Date(todayStr + 'T00:00:00');
      const tasks = taskMap[d] || [];
      const hasTasks = tasks.length > 0;

      if (!inRange) {
        html += `<div class="day-cell empty"></div>`;
      } else {
        const monthLabel =
          cur.getDate() === 1 || cur.getTime() === startD.getTime()
            ? `<span class="day-month-label">${cur.toLocaleDateString('en-US', {
                month: 'short'
              })}</span>`
            : '';

        let cls = 'day-cell';
        if (isToday) cls += ' today';
        if (isPast) cls += ' past';
        if (hasTasks) cls += ' has-tasks';

        html += `<div class="${cls}" style="animation-delay:${(i * 0.04).toFixed(2)}s">`;
        html += `<div class="day-num">${cur.getDate()}${monthLabel}</div>`;

        if (hasTasks) {
          html += `<ul class="task-list">`;
          const scheduleParam = scheduleId || '';
          tasks.forEach(t => {
            const taskId = t.id || '';
            const clickAttr =
              scheduleParam && taskId
                ? `onclick="openTaskView('${scheduleParam}','${taskId}')"`
                : '';
            const taskLabel = escapeHtml(t.task || 'Untitled task');
            const duration = t.duration ? `<span class="task-duration">${t.duration} min</span>` : '';
            const doneClass = t.completed || t.skipped ? 'done' : '';
            const dataAttrs =
              scheduleParam && taskId
                ? `data-schedule-id="${scheduleParam}" data-task-id="${taskId}"`
                : '';
            html += `<li class="task-item ${doneClass}" ${dataAttrs} ${clickAttr}>
              <span class="task-dot"></span><span class="task-text">${taskLabel}</span>${duration}
            </li>`;
          });
          html += `</ul>`;
          const dayTotal = tasks.reduce((s, t) => s + (t.duration || 0), 0);
          if (dayTotal > 0) html += `<div class="day-time">Total: ${dayTotal} min</div>`;
        }

        html += `</div>`;
      }
      cur.setDate(cur.getDate() + 1);
    }
    html += `</div>`;
  }

  html += `</div>`;
  html += `<div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:var(--ink-muted)"></div>Completed</div>
    <div class="legend-item" style="font-style:italic">Click any task to view steps</div>
  </div>`;

  const out = document.getElementById('calendarOutput');
  out.innerHTML = html;
  out.style.display = 'block';
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });

  wireTaskContextMenus();
}

function openTaskView(scheduleId, taskId) {
  const target = `${window.PAGES.taskGuide}?scheduleId=${encodeURIComponent(scheduleId)}&taskId=${encodeURIComponent(taskId)}`;
  window.location.href = target;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wireTaskContextMenus() {
  const menu = ensureTaskMenu();
  if (!menu) return;

  document.querySelectorAll('.task-item').forEach(item => {
    item.addEventListener('contextmenu', event => {
      const scheduleId = item.getAttribute('data-schedule-id');
      const taskId = item.getAttribute('data-task-id');
      if (!scheduleId || !taskId) return;

      event.preventDefault();
      event.stopPropagation();
      showTaskMenu(menu, event.clientX, event.clientY, scheduleId, taskId);
    });
  });
}

function ensureTaskMenu() {
  let menu = document.getElementById('taskContextMenu');
  if (menu) return menu;

  menu = document.createElement('div');
  menu.id = 'taskContextMenu';
  menu.className = 'task-context-menu';
  menu.innerHTML = `
    <button class="task-context-item" data-action="complete">Complete / Skip</button>
    <button class="task-context-item" data-action="reopen">Reopen task</button>
  `;

  menu.addEventListener('click', event => {
    const action = event.target.getAttribute('data-action');
    if (!action) return;

    const scheduleId = menu.getAttribute('data-schedule-id');
    const taskId = menu.getAttribute('data-task-id');
    if (!scheduleId || !taskId) return;

    applyTaskAction(scheduleId, taskId, action);
    hideTaskMenu(menu);
  });

  document.body.appendChild(menu);
  document.addEventListener('click', () => hideTaskMenu(menu));
  window.addEventListener('scroll', () => hideTaskMenu(menu), true);
  window.addEventListener('resize', () => hideTaskMenu(menu));

  return menu;
}

function showTaskMenu(menu, x, y, scheduleId, taskId) {
  const completeBtn = menu.querySelector('[data-action="complete"]');
  const reopenBtn = menu.querySelector('[data-action="reopen"]');

  let isCompleted = false;
  const schedule = getSchedule(scheduleId);
  if (schedule && Array.isArray(schedule.tasks)) {
    const task = schedule.tasks.find(t => t.id === taskId);
    isCompleted = !!(task && task.completed);
  }

  if (completeBtn) completeBtn.style.display = isCompleted ? 'none' : 'block';
  if (reopenBtn) reopenBtn.style.display = isCompleted ? 'block' : 'none';

  menu.setAttribute('data-schedule-id', scheduleId);
  menu.setAttribute('data-task-id', taskId);
  menu.classList.add('open');

  const padding = 12;
  const { innerWidth, innerHeight } = window;
  const rect = menu.getBoundingClientRect();
  let left = x;
  let top = y;

  if (left + rect.width + padding > innerWidth) {
    left = innerWidth - rect.width - padding;
  }
  if (top + rect.height + padding > innerHeight) {
    top = innerHeight - rect.height - padding;
  }

  menu.style.left = `${Math.max(padding, left)}px`;
  menu.style.top = `${Math.max(padding, top)}px`;
}

function hideTaskMenu(menu) {
  if (!menu) return;
  menu.classList.remove('open');
  menu.removeAttribute('data-schedule-id');
  menu.removeAttribute('data-task-id');
}

function applyTaskAction(scheduleId, taskId, action) {
  const schedule = getSchedule(scheduleId);
  if (!schedule) return;

  const tasks = Array.isArray(schedule.tasks) ? schedule.tasks : [];
  const updatedTasks = tasks.map(t => {
    if (t.id !== taskId) return t;
    if (action === 'complete' || action === 'skip') {
      return { ...t, completed: true, skipped: false };
    }
    if (action === 'reopen') {
      return { ...t, completed: false, skipped: false };
    }
    return t;
  });

  const allDone = updatedTasks.every(t => t.completed);
  const finalTasks = allDone ? updatedTasks.map(t => ({ ...t, guide: '' })) : updatedTasks;
  const updated = updateSchedule(scheduleId, { tasks: finalTasks });
  if (typeof renderSchedule === 'function' && updated) {
    renderSchedule(updated);
  }
}
