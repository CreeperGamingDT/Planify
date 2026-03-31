function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let guideReady = false;
let completeButtonRevealed = false;
let completeBtnRef = null;
let revealListenersBound = false;

function isNearBottom() {
  const threshold = 80;
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
}

function maybeRevealCompleteButton() {
  if (!guideReady || completeButtonRevealed || !completeBtnRef) return;
  if (!isNearBottom()) return;
  completeButtonRevealed = true;
  completeBtnRef.classList.add('is-visible');
}

function markGuideReady() {
  guideReady = true;
  maybeRevealCompleteButton();
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = '';
  let listType = null;
  let inCodeBlock = false;
  let codeLines = [];

  const formatInline = text => {
    const withTokens = text.replace(/<link>(.*?)<\/link>/gi, (_match, url) => {
      return `[[[LINK:${url.trim()}]]]`;
    });

    let escaped = escapeHtml(withTokens);

    escaped = escaped.replace(/\[\[\[LINK:(.*?)\]\]\]/g, (_match, url) => {
      const safeUrl = escapeHtml(url.trim());
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
    });

    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  };

  lines.forEach(rawLine => {
    const line = rawLine.trimEnd();
    if (line.trim().startsWith('```')) {
      if (listType) {
        html += listType === 'ol' ? '</ol>' : '</ul>';
        listType = null;
      }
      if (inCodeBlock) {
        const codeContent = escapeHtml(codeLines.join('\n'));
        html += `<div class="code-block">
          <button class="code-copy" type="button">Copy</button>
          <pre><code>${codeContent}</code></pre>
        </div>`;
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    const headingMatch = line.match(/^\s*###\s+(.*)$/);
    const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    const unorderedMatch = line.match(/^\s*[-*]\s+(.*)$/);

    if (headingMatch) {
      if (listType) {
        html += listType === 'ol' ? '</ol>' : '</ul>';
        listType = null;
      }
      html += `<h3 class="guide-title">${formatInline(headingMatch[1])}</h3>`;
      return;
    }

    if (orderedMatch) {
      if (listType !== 'ol') {
        if (listType) html += listType === 'ol' ? '</ol>' : '</ul>';
        html += '<ol>';
        listType = 'ol';
      }
      html += `<li>${formatInline(orderedMatch[1])}</li>`;
      return;
    }

    if (unorderedMatch) {
      if (listType !== 'ul') {
        if (listType) html += listType === 'ol' ? '</ol>' : '</ul>';
        html += '<ul>';
        listType = 'ul';
      }
      html += `<li>${formatInline(unorderedMatch[1])}</li>`;
      return;
    }

    if (listType) {
      html += listType === 'ol' ? '</ol>' : '</ul>';
      listType = null;
    }

    if (line.trim() === '') {
      return;
    }

    html += `<p>${formatInline(line)}</p>`;
  });

  if (listType) html += listType === 'ol' ? '</ol>' : '</ul>';
  if (inCodeBlock) {
    const codeContent = escapeHtml(codeLines.join('\n'));
    html += `<div class="code-block">
      <button class="code-copy" type="button">Copy</button>
      <pre><code>${codeContent}</code></pre>
    </div>`;
  }
  return html;
}

async function loadTaskGuide() {
  const params = new URLSearchParams(window.location.search);
  const scheduleId = params.get('scheduleId');
  const taskId = params.get('taskId');

  const titleEl = document.getElementById('taskTitle');
  const durationEl = document.getElementById('taskDuration');
  const notesEl = document.getElementById('taskNotes');
  const subtitleEl = document.getElementById('taskSubtitle');
  const backBtn = document.getElementById('backToScheduleBtn');
  const completeBtn = document.getElementById('taskCompleteBtn');
  completeBtnRef = completeBtn;

  const statusEl = document.getElementById('guideStatus');
  const errorEl = document.getElementById('guideError');
  const outputEl = document.getElementById('guideOutput');

  if (!scheduleId || !taskId) {
    if (statusEl) statusEl.textContent = 'Missing task information.';
    return;
  }

  const schedule = getSchedule(scheduleId);
  if (!schedule) {
    if (statusEl) statusEl.textContent = 'Schedule not found.';
    return;
  }

  if (backBtn) backBtn.href = `${window.PAGES.schedules}?id=${encodeURIComponent(scheduleId)}`;

  const tasks = Array.isArray(schedule.tasks) ? schedule.tasks : [];
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  const task = taskIndex >= 0 ? tasks[taskIndex] : null;
  if (!task) {
    if (statusEl) statusEl.textContent = 'Task not found.';
    return;
  }
   console.log(task)

  const notes = (task.notes || '').trim();
  const durationText = task.duration ? `${task.duration} min` : 'No duration';

  if (titleEl) titleEl.textContent = task.task || 'Untitled task';
  if (durationEl) durationEl.textContent = durationText;
  if (notesEl) notesEl.textContent = notes || 'No notes provided.';
  if (subtitleEl) subtitleEl.textContent = `Scheduled on ${task.date || 'a future date'}`;

  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      const updatedTasks = tasks.map((t, idx) => {
        if (idx !== taskIndex) return t;
        return { ...t, completed: true, skipped: false };
      });

      const allDone = updatedTasks.every(t => t.completed);
      const finalTasks = allDone
        ? updatedTasks.map(t => ({ ...t, guide: '' }))
        : updatedTasks;

      updateSchedule(schedule.id, { tasks: finalTasks });
      window.location.href = `${window.PAGES.schedules}?id=${encodeURIComponent(scheduleId)}`;
    });
  }

  if (!revealListenersBound) {
    revealListenersBound = true;
    window.addEventListener('scroll', maybeRevealCompleteButton, { passive: true });
    window.addEventListener('resize', maybeRevealCompleteButton);
  }

  if (task.guide) {
    outputEl.innerHTML = renderMarkdown(task.guide);
    bindCopyHandlers(outputEl);
    if (statusEl) statusEl.textContent = 'Guide ready';
    markGuideReady();
    return;
  }

  try {
   
    const response = await fetch('/api/planifyai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task:task.task,
        previousTasks:tasks.filter((x,i)=>i<taskIndex),
        for:"TaskDetails",
        duration:durationText,
        notes
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Request failed (${response.status})`);
    }

    const data = await response.json();
    const raw = typeof data === 'string' ? data : (data.content ?? JSON.stringify(data));
    const clean = raw.replace(/```[a-z]*|```/g, '').trim();

    if (!clean) {
      if (statusEl) statusEl.textContent = 'No guide returned.';
      return;
    }

    outputEl.innerHTML = renderMarkdown(clean);
    bindCopyHandlers(outputEl);
    tasks[taskIndex] = { ...task, guide: clean };
    updateSchedule(schedule.id, { tasks });

    if (statusEl) statusEl.textContent = 'Guide ready';
    markGuideReady();
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Failed to generate guide. Please try again.';
      errorEl.style.display = 'block';
    }
    if (statusEl) statusEl.textContent = 'Error generating guide';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', loadTaskGuide);

let copyHandlersBound = false;
function bindCopyHandlers(container) {
  if (copyHandlersBound || !container) return;
  copyHandlersBound = true;
  container.addEventListener('click', async event => {
    const btn = event.target.closest('.code-copy');
    if (!btn) return;
    const codeEl = btn.parentElement?.querySelector('code');
    if (!codeEl) return;
    try {
      await navigator.clipboard.writeText(codeEl.textContent || '');
      const prev = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => {
        btn.textContent = prev;
      }, 1200);
    } catch {
      btn.textContent = 'Failed';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 1200);
    }
  });
}
