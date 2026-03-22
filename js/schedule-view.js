let currentScheduleId = null;

function formatRange(startDate, endDate) {
  const fmt = d =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(startDate)} - ${fmt(endDate)}`;
}

function renderList() {
  const listEl = document.getElementById('scheduleList');
  const emptyEl = document.getElementById('listEmpty');
  const schedules = loadSchedules();

  listEl.innerHTML = '';

  if (schedules.length === 0) {
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';

  schedules.forEach(schedule => {
    const card = document.createElement('div');
    card.className = 'schedule-card';
    if (schedule.id === currentScheduleId) card.classList.add('active');

    const tasks = Array.isArray(schedule.tasks) ? schedule.tasks : [];
    const meta = `${formatRange(schedule.startDate, schedule.endDate)} | ${tasks.length} tasks`;

    const info = document.createElement('div');
    info.className = 'schedule-info';

    const titleEl = document.createElement('div');
    titleEl.className = 'schedule-card-title';
    titleEl.textContent = schedule.title || 'Untitled Schedule';

    const metaEl = document.createElement('div');
    metaEl.className = 'schedule-meta';
    metaEl.textContent = meta;

    info.appendChild(titleEl);
    info.appendChild(metaEl);

    const actions = document.createElement('div');
    actions.className = 'schedule-actions';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-btn';
    menuBtn.type = 'button';
    menuBtn.setAttribute('aria-label', 'Schedule actions');
    menuBtn.textContent = '...';

    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.setAttribute('role', 'menu');

    const renameBtn = document.createElement('button');
    renameBtn.className = 'menu-item';
    renameBtn.setAttribute('data-action', 'rename');
    renameBtn.setAttribute('role', 'menuitem');
    renameBtn.textContent = 'Rename';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'menu-item danger';
    deleteBtn.setAttribute('data-action', 'delete');
    deleteBtn.setAttribute('role', 'menuitem');
    deleteBtn.textContent = 'Delete';

    menu.appendChild(renameBtn);
    menu.appendChild(deleteBtn);
    actions.appendChild(menuBtn);
    actions.appendChild(menu);

    card.appendChild(info);
    card.appendChild(actions);

    card.addEventListener('click', () => {
      renderSchedule(schedule);
    });

    menuBtn.addEventListener('click', event => {
      event.stopPropagation();
      closeAllMenus();
      menu.classList.toggle('open');
    });
    menu.addEventListener('click', event => {
      event.stopPropagation();
      const action = event.target.getAttribute('data-action');
      if (!action) return;

      if (action === 'rename') {
        const next = window.prompt('Rename schedule', schedule.title || '');
        if (next && next.trim()) {
          const updated = updateSchedule(schedule.id, { title: next.trim() });
          if (updated && currentScheduleId === updated.id) {
            renderSchedule(updated);
          }
          renderList();
        }
      }

      if (action === 'delete') {
        const ok = window.confirm('Delete this schedule? This cannot be undone.');
        if (ok) {
          deleteSchedule(schedule.id);
          if (currentScheduleId === schedule.id) {
            clearScheduleView();
          }
          renderList();
        }
      }

      closeAllMenus();
    });

    listEl.appendChild(card);
  });
}

function renderSchedule(schedule) {
  currentScheduleId = schedule.id;
  const tasks = Array.isArray(schedule.tasks) ? schedule.tasks : [];
  const data = { title: schedule.title, tasks };
  const days =
    Array.isArray(schedule.days) && schedule.days.length
      ? schedule.days
      : buildDays(schedule.startDate, schedule.endDate);
  const totalMinutes = schedule.totalMinutes || 0;
  renderCalendar(data, schedule.startDate, schedule.endDate, days, totalMinutes);
  const backBtn = document.getElementById('backToListBtn');
  if (backBtn) backBtn.style.display = 'inline-block';
  renderList();
}

function clearScheduleView() {
  currentScheduleId = null;
  const emptyState = document.getElementById('emptyState');
  const calendarOutput = document.getElementById('calendarOutput');
  const printBtn = document.getElementById('printBtn');
  const backBtn = document.getElementById('backToListBtn');

  if (calendarOutput) {
    calendarOutput.style.display = 'none';
    calendarOutput.innerHTML = '';
  }
  if (emptyState) emptyState.style.display = 'flex';
  if (printBtn) printBtn.style.display = 'none';
  if (backBtn) backBtn.style.display = 'none';

  const titleEl = document.getElementById('panelTitle');
  const subtitleEl = document.getElementById('panelSubtitle');
  if (titleEl) titleEl.textContent = 'Schedule';
  if (subtitleEl) subtitleEl.textContent = 'Select a schedule from the list';
}

function closeAllMenus() {
  document.querySelectorAll('.menu.open').forEach(menu => menu.classList.remove('open'));
}

function buildDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  let cur = new Date(start);
  while (cur <= end) {
    days.push(fmtDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

document.addEventListener('click', closeAllMenus);

document.addEventListener('DOMContentLoaded', () => {
  renderList();
  clearScheduleView();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) {
    const schedule = getSchedule(id);
    if (schedule) {
      renderSchedule(schedule);
      history.replaceState(null, '', 'schedule.html');
    }
  }

  const backBtn = document.getElementById('backToListBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      clearScheduleView();
    });
  }
});

