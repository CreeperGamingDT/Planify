const STORAGE_KEY = 'planify_schedules';

function createScheduleId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `sched_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadSchedules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(s => s && s.id)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch {
    return [];
  }
}

function saveSchedules(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function addSchedule(schedule) {
  const list = loadSchedules();
  list.unshift(schedule);
  saveSchedules(list.slice(0, 50));
  return schedule;
}

function updateSchedule(id, updates) {
  const list = loadSchedules();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const next = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  list[idx] = next;
  saveSchedules(list);
  return next;
}

function deleteSchedule(id) {
  const list = loadSchedules();
  const next = list.filter(s => s.id !== id);
  saveSchedules(next);
  return next.length !== list.length;
}

function getSchedule(id) {
  return loadSchedules().find(s => s.id === id) || null;
}
