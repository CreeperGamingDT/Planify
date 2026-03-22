async function generateSchedule() {
  const objective = document.getElementById('objective').value.trim();
  const notes = document.getElementById('notes').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const hours = parseInt(document.getElementById('hoursPerDay').value) || 0;
  const minutes = parseInt(document.getElementById('minutesPerDay').value) || 0;

  if (!objective) {
    showError('Please enter an objective.');
    return;
  }
  if (!startDate || !endDate) {
    showError('Please select a start and end date.');
    return;
  }
  if (new Date(endDate) < new Date(startDate)) {
    showError('End date must be after start date.');
    return;
  }
  if (hours === 0 && minutes === 0) {
    showError('Please enter at least some daily time.');
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.classList.add('loading');
  document.getElementById('btnText').textContent = 'Generatingâ€¦';

  const contextNotes = [notes, fileText].filter(Boolean).join('\n\n');
  const totalMinutes = hours * 60 + minutes;

  // Count working days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  let cur = new Date(start);
  while (cur <= end) {
    days.push(fmtDate(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const prompt = `You are a productivity planner. The user has the following objective:

"${objective}"

${contextNotes ? 'Notes and context:\n' + contextNotes : ''}

Timeframe: ${startDate} to ${endDate} (${days.length} days)
Available time per day: ${hours}h ${minutes}min (${totalMinutes} minutes)

Create a practical, actionable daily schedule. Break the objective into specific tasks distributed logically across the days. Each day can have 1â€“4 tasks. Tasks should be concrete and completable within the day's time budget.

Respond ONLY with valid JSON (no markdown, no explanation) in this exact format:
{
  "title": "Short schedule title",
  "tasks": [
    { "date": "YYYY-MM-DD", "task": "Task description", "duration": 30 }
  ]
}

Rules:
- Only include dates from ${startDate} to ${endDate}
- duration is in minutes, realistic for the task
- Total duration per day should not exceed ${totalMinutes} minutes
- Tasks should build progressively toward the objective
- Be specific and actionable`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const schedule = {
      id: createScheduleId(),
      title: (parsed.title || objective || 'Untitled Schedule').trim(),
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      startDate,
      endDate,
      totalMinutes,
      days,
      createdAt: new Date().toISOString()
    };
    addSchedule(schedule);
    window.location.href = `schedule.html?id=${encodeURIComponent(schedule.id)}`;
  } catch (err) {
    showError('Failed to generate schedule. Please try again.');
    console.error(err);
  } finally {
    btn.classList.remove('loading');
    document.getElementById('btnText').textContent = 'Generate Schedule';
  }
}
