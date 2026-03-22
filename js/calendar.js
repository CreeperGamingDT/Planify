function renderCalendar(data, startDate, endDate, days, totalMinutes) {
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
  document.getElementById('panelSubtitle').textContent = `${fmt(startDate)} â€“ ${fmt(endDate)}`;

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
          tasks.forEach(t => {
            html += `<li class="task-item" onclick="this.classList.toggle('done')">
              <span class="task-dot"></span>${t.task}
            </li>`;
          });
          html += `</ul>`;
          const dayTotal = tasks.reduce((s, t) => s + (t.duration || 0), 0);
          if (dayTotal > 0) html += `<div class="day-time">${dayTotal} min</div>`;
        }

        html += `</div>`;
      }
      cur.setDate(cur.getDate() + 1);
    }
    html += `</div>`;
  }

  html += `</div>`;
  html += `<div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:var(--amber)"></div>Has tasks</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--forest-light)"></div>Today</div>
    <div class="legend-item" style="font-style:italic">Click any task to mark complete</div>
  </div>`;

  const out = document.getElementById('calendarOutput');
  out.innerHTML = html;
  out.style.display = 'block';
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
