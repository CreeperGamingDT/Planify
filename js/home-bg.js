document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('homeBg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let points = [];
  let mouse = { x: 0, y: 0, active: false };

  const config = {
    density: 0.00015,
    maxDist: 140,
    pushRadius: 80,
    pushStrength: 0.55,
    baseSpeed: 0.35,
    maxSpeed: 0.75,
    drift: 0.055,
    repelRadius: 20,
    repelStrength: 0.03
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createPoints();
  }

  function createPoints() {
    const count = Math.max(40, Math.floor(width * height * config.density));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * config.baseSpeed * 2,
      vy: (Math.random() - 0.5) * config.baseSpeed * 2,
      size: 1.5 + Math.random() * 1.2
    }));
  }

  function step() {
    if (prefersReduced) {
      draw();
      return;
    }

    points.forEach(p => {
      // Gentle random drift to vary speed while keeping it bounded.
      p.vx += (Math.random() - 0.5) * config.drift;
      p.vy += (Math.random() - 0.5) * config.drift;

      const speed = Math.hypot(p.vx, p.vy);
      if (speed > config.maxSpeed) {
        const scale = config.maxSpeed / speed;
        p.vx *= scale;
        p.vy *= scale;
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.pushRadius && dist > 0.1) {
          const force = (1 - dist / config.pushRadius) * config.pushStrength;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      p.vx *= 0.99;
      p.vy *= 0.99;
    });

    applyRepulsion();
    draw();
    requestAnimationFrame(step);
  }

  function applyRepulsion() {
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1 && dist < config.repelRadius) {
          const force = (1 - dist / config.repelRadius) * config.repelStrength;
          const nx = dx / dist;
          const ny = dy / dist;
          a.vx += nx * force;
          a.vy += ny * force;
          b.vx -= nx * force;
          b.vy -= ny * force;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const isDark = document.body.classList.contains('theme-dark');
    const dotColor = isDark ? '255,255,255' : '0,0,0';

    // Draw lines
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.maxDist) {
          const alpha = 1 - dist / config.maxDist;
          ctx.strokeStyle = `rgba(${dotColor}, ${0.25 * alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw points
    points.forEach(p => {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = `rgba(${dotColor}, 0.6)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  window.addEventListener('mousemove', event => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  window.addEventListener('resize', resize);

  resize();
  step();
});
