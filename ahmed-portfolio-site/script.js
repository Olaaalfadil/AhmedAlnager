// Progress bar
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    document.getElementById('progress-bar').style.width = (scrollTop / height * 100) + '%';
  });

  // Intersection observer for reveal + timeline
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal, .timeline-item').forEach(el => observer.observe(el));

  // Modal
  function openModal(id) {
    document.getElementById('modal-' + id).classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModalDirect(id) {
    document.getElementById('modal-' + id).classList.remove('open');
    document.body.style.overflow = '';
  }
  function closeModal(event, id) {
    if (event.target === document.getElementById('modal-' + id)) {
      closeModalDirect(id);
    }
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => {
        m.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  });

  // ── Theme Toggle ──
  const themeBtn = document.getElementById('theme-toggle');
  const html = document.documentElement;
  // Restore saved preference
  if (localStorage.getItem('theme') === 'dark') html.classList.add('dark');
  themeBtn.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
  });

// ── 3D Atom Word Cloud ──────────────────────────────────────────────
(function() {
  const canvas = document.getElementById('atom-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const DPR = window.devicePixelRatio || 1;
  const SIZE = 420;
  canvas.width  = SIZE * DPR;
  canvas.height = SIZE * DPR;
  canvas.style.width  = SIZE + 'px';
  canvas.style.height = SIZE + 'px';
  ctx.scale(DPR, DPR);

  const W = SIZE, H = SIZE, CX = W / 2, CY = H / 2;

  const words = [
    { text: 'Planning',     size: 13.5 },
    { text: 'RAID',         size: 12.5 },
    { text: 'Delivery',     size: 14   },
    { text: 'Branding',     size: 12.5 },
    { text: 'Reporting',    size: 13   },
    { text: 'Milestones',   size: 11.5 },
    { text: 'Design',       size: 13.5 },
    { text: 'Stakeholders', size: 11   },
    { text: 'Scope',        size: 14   },
    { text: 'Execution',    size: 12.5 },
    { text: 'Budgeting',    size: 12.5 },
    { text: 'WBS',          size: 13   },
    { text: 'Risk Mgmt',    size: 12   },
    { text: 'Proposals',    size: 12.5 },
    { text: 'Visual ID',    size: 12   },
    { text: 'Events',       size: 13.5 },
    { text: 'Coordination', size: 11   },
    { text: 'PMO',          size: 14   },
    { text: 'Campaigns',    size: 12.5 },
    { text: 'Handover',     size: 12   },
  ];

  // Distribute words evenly on a sphere using Fibonacci lattice
  const R = 150;
  const golden = Math.PI * (3 - Math.sqrt(5));

  const nodes = words.map((w, i) => {
    const y = 1 - (i / (words.length - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    return {
      text: w.text,
      size: w.size,
      ox: Math.cos(theta) * r,
      oy: y,
      oz: Math.sin(theta) * r,
    };
  });

  // Rotation state
  let rotX = 0.3, rotY = 0;
  const autoSpeedX = 0.0014, autoSpeedY = 0.0025;
  let dragging = false, lastMX = 0, lastMY = 0, velX = 0, velY = 0;

  canvas.addEventListener('mousedown', e => {
    dragging = true; lastMX = e.clientX; lastMY = e.clientY; velX = velY = 0;
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastMX, dy = e.clientY - lastMY;
    velY = dx * 0.007; velX = dy * 0.007;
    rotY += velY; rotX += velX;
    lastMX = e.clientX; lastMY = e.clientY;
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('touchstart', e => {
    dragging = true; lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY; velX = velY = 0;
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const dx = e.touches[0].clientX - lastMX, dy = e.touches[0].clientY - lastMY;
    velY = dx * 0.007; velX = dy * 0.007;
    rotY += velY; rotX += velX;
    lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
  }, { passive: false });
  canvas.addEventListener('touchend', () => { dragging = false; });

  function rotY3d(x, z, a) { return { x: x*Math.cos(a)+z*Math.sin(a), z: -x*Math.sin(a)+z*Math.cos(a) }; }
  function rotX3d(y, z, a) { return { y: y*Math.cos(a)-z*Math.sin(a), z:  y*Math.sin(a)+z*Math.cos(a) }; }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (!dragging) {
      rotY += autoSpeedY;
      rotX += autoSpeedX * 0.35;
    } else {
      velX *= 0.9; velY *= 0.9;
    }

    // Project all nodes
    const projected = nodes.map(n => {
      let x = n.ox * R, y = n.oy * R, z = n.oz * R;
      const ry = rotY3d(x, z, rotY); x = ry.x; z = ry.z;
      const rx = rotX3d(y, z, rotX); y = rx.y; z = rx.z;
      const depth = (z + R) / (R * 2);
      return { ...n, px: CX + x, py: CY + y, depth, z };
    });

    projected.sort((a, b) => a.z - b.z);

    // Read live theme colors each frame
    const style = getComputedStyle(document.documentElement);
    const accentRgb = style.getPropertyValue('--accent-rgb').trim() || '0,98,122';
    const inkColor = style.getPropertyValue('--ink').trim() || '#1A1814';
    const ink2Color = style.getPropertyValue('--ink2').trim() || '#6B6560';

    // Subtle connecting lines between nearby words
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const a = projected[i], b = projected[j];
        const d = Math.hypot(a.px - b.px, a.py - b.py);
        if (d < 130) {
          const alpha = (1 - d / 130) * 0.05 * Math.min(a.depth, b.depth);
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.strokeStyle = `rgba(${accentRgb},${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Nucleus glow
    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, 20);
    grad.addColorStop(0, `rgba(${accentRgb},0.28)`);
    grad.addColorStop(1, `rgba(${accentRgb},0)`);
    ctx.beginPath();
    ctx.arc(CX, CY, 20, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw word pills
    projected.forEach(n => {
      const d = n.depth;
      const scale = 0.48 + d * 0.76;
      const alpha = 0.15 + d * 0.85;
      const fs = Math.round(n.size * scale);
      if (fs < 6) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(n.px, n.py);

      if (d > 0.68) {
        ctx.shadowColor = `rgba(${accentRgb},0.28)`;
        ctx.shadowBlur = 12;
      }

      ctx.font = `600 ${fs}px 'Poppins', sans-serif`;
      const tw = ctx.measureText(n.text).width;
      const padH = fs * 0.42;
      const padV = fs * 0.22;
      const pw = tw + padH * 2;
      const ph = fs + padV * 2;
      const pr = fs * 0.18;

      // Pill background
      const bgAlpha = d > 0.55 ? 0.06 + d * 0.09 : 0.025;
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, pr);
      ctx.fillStyle = `rgba(${accentRgb},${bgAlpha})`;
      ctx.fill();

      // Pill border
      if (d > 0.45) {
        ctx.strokeStyle = `rgba(${accentRgb},${0.05 + d * 0.18})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // Text color — use ink var for readability in both modes
      ctx.fillStyle = d > 0.6 ? inkColor : ink2Color;
      ctx.globalAlpha = alpha * (d > 0.6 ? 1 : 0.55 + d * 0.45);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.text, 0, 0);
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  draw();
})();
