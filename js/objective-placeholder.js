document.addEventListener('DOMContentLoaded', () => {
  const objectiveInput = document.getElementById('objective');
  if (!objectiveInput) return;

  const objectiveIdeas = [
    'e.g. Learn Spanish conversational basics...',
    'e.g. Build a personal portfolio website...',
    'e.g. Prepare for SAT math in 6 weeks...',
    'e.g. Start a daily workout habit...',
    'e.g. Learn Python for data analysis...',
    'e.g. Master Algebra 1 fundamentals...',
    'e.g. Launch a small online business...',
    'e.g. Improve speaking confidence for interviews...',
    'e.g. Create my own website...'
  ];

  const ROTATE_DELAY = 5000;
  const FADE_OUT_MS = 220;

  let previousIndex = -1;
  let transitioning = false;

  function pickNextIndex() {
    if (objectiveIdeas.length <= 1) return 0;
    let idx = Math.floor(Math.random() * objectiveIdeas.length);
    while (idx === previousIndex) {
      idx = Math.floor(Math.random() * objectiveIdeas.length);
    }
    previousIndex = idx;
    return idx;
  }

  function rotatePlaceholder() {
    if (transitioning) return;
    if (objectiveInput.value.trim().length > 0) return;

    transitioning = true;
    objectiveInput.classList.add('placeholder-dim');

    setTimeout(() => {
      objectiveInput.placeholder = objectiveIdeas[pickNextIndex()];
      objectiveInput.classList.remove('placeholder-dim');
      transitioning = false;
    }, FADE_OUT_MS);
  }

  objectiveInput.placeholder = objectiveIdeas[pickNextIndex()];
  setInterval(rotatePlaceholder, ROTATE_DELAY);
});
