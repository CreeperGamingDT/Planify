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
    'e.g. Create my own website...',
    'e.g. Study for AP Biology unit tests...',
    'e.g. Write a scholarship essay draft...',
    'e.g. Build a mobile app...',
    'e.g. Learn guitar chords and strumming...',
    'e.g. Prepare for a product management interview...',
    'e.g. Train for a 5K in 8 weeks...',
    'e.g. Learn how to use Excel...',
    'e.g. Finish a short story draft...',
    'e.g. Practice public speaking for a presentation...',
    'e.g. Learn basic Photoshop editing...',
    'e.g. Study for my math test...',
    'e.g. Create a YouTube plan...',
    'e.g. Organize a study schedule...',
    'e.g. Improve my typing speed to atleast 80 wpm...',
    'e.g. Build a habit tracker app...',
    'e.g. Learn React fundamentals...',
    'e.g. Plan a personal finance budget...',
    'e.g. Prepare for a driving test...',
    'e.g. Learn SQL basics...'
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
