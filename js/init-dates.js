const today = new Date();
document.getElementById('startDate').value = fmtDate(today);
const inTwoWeeks = new Date(today);
inTwoWeeks.setDate(today.getDate() + 13);
document.getElementById('endDate').value = fmtDate(inTwoWeeks);
