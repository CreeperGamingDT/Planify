document.addEventListener('DOMContentLoaded', () => {
  const taglineEl = document.querySelector('.tagline');
  if (!taglineEl) return;

  const current = taglineEl.textContent.trim();
  const pageTaglines = {
    'page-generate': [
      'Developing Schedule',
      'New schedule',
      'Plan builder',
      'Schedule setup',
      'Create schedule',
      'Goal intake'
    ],
    'page-schedule': [
      'Viewing Schedules',
      'Schedules library',
      'Schedule list',
      'Plan library',
      'Saved schedules',
      'Schedule hub'
    ],
    'page-task': [
      'Viewing Task',
      'Task guide',
      'Task steps',
      'Step guide',
      'Task breakdown',
      'How-to'
    ]
  };

  const pageKey = Object.keys(pageTaglines).find(key => document.body.classList.contains(key));
  let options = pageKey ? pageTaglines[pageKey].slice() : [current];

  if (!options.includes(current)) options.push(current);
  const pick = options[Math.floor(Math.random() * options.length)];
  taglineEl.textContent = pick;
});
