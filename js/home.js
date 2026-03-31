document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('homeGetStartedBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const schedules = loadSchedules();
    const target = schedules.length > 0 ? window.PAGES.schedules : window.PAGES.createSchedule;
    window.location.href = target;
  });
});
