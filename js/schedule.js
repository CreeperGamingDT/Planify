async function generateSchedule() {
  const objective = document.getElementById('objective').value.trim();
  const notes = document.getElementById('notes').value.trim();
  const startDate = document.getElementById('startDate').value;
  const finishDays = parseInt(document.getElementById('finishDays').value) || 0;
  const hours = parseInt(document.getElementById('hoursPerDay').value) || 0;
  const minutes = parseInt(document.getElementById('minutesPerDay').value) || 0;

  if (!objective) {
    showError('Please enter an objective.');
    return;
  }
  if (!startDate) {
    showError('Please select a start date.');
    return;
  }
  if (finishDays <= 0) {
    showError('Please enter how many days to finish.');
    return;
  }
  if (hours === 0 && minutes === 0) {
    showError('Please enter at least some daily time.');
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.classList.add('loading');
  document.getElementById('btnText').textContent = 'Generating...';

  const contextNotes = [notes, fileText].filter(Boolean).join('\n\n');
  const totalMinutes = hours * 60 + minutes;

  // Count working days
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + finishDays - 1);
  const endDate = fmtDate(end);
  const days = [];
  let cur = new Date(start);
  while (cur <= end) {
    days.push(fmtDate(cur));
    cur.setDate(cur.getDate() + 1);
  }


  try {
    const response = await fetch('/api/planifyai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          objective,
          contextNotes,
          startDate,
          endDate,
          finishDays,
          totalMinutes,
          for:"Calender",
      })
    });
    console.log(response)
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Request failed (${response.status})`);
    }
    const data = await response.json();
    const raw = typeof data === 'string' ? data : (data.content ?? JSON.stringify(data));
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const tasks = rawTasks.map(t => ({
      id: t.id || createTaskId(),
      date: t.date,
      task: t.task,
      duration: t.duration,
      notes:t.notes
    }));

    const schedule = {
      id: createScheduleId(),
      title: (parsed.title || objective || 'Untitled Schedule').trim(),
      tasks,
      startDate,
      endDate,
      finishDays,
      totalMinutes,
      days,
      objective,
      notes: contextNotes,
      rawResponse: raw,
      createdAt: new Date().toISOString()
    };
    addSchedule(schedule);
    window.location.href = `index.html?id=${encodeURIComponent(schedule.id)}`;
  } catch (err) {
    showError('Failed to generate schedule. Please try again.');
    console.error(err);
  } finally {
    btn.classList.remove('loading');
    document.getElementById('btnText').textContent = 'Generate Schedule';
  }
}
