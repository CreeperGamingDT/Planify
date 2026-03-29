const today = new Date();
document.getElementById('startDate').value = fmtDate(today);
const finishDaysEl = document.getElementById('finishDays');
if (finishDaysEl && !finishDaysEl.value) {
  finishDaysEl.value = 14;
}
