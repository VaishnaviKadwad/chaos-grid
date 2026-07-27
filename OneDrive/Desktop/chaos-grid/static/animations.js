/**
 * CHAOS GRID — Enhanced Animations
 * Adds: particle grid, glitch text, count-up numbers,
 *       smooth page transitions, pulse rings, scan lines.
 *
 * No external library needed — pure JS + CSS.
 * Add: <script src="animations.js"></script> in your HTML head.
 */

// ══════════════════════════════════════════
//  1. INJECT ANIMATION CSS
// ══════════════════════════════════════════
(function injectAnimationStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* ── Glitch text effect ── */
    .glitch {
      position: relative;
      animation: glitch-base 4s infinite;
    }
    .glitch::before,
    .glitch::after {
      content: attr(data-text);
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
    }
    .glitch::before {
      color: #00ffcc;
      animation: glitch-1 4s infinite;
      clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
    }
    .glitch::after {
      color: #ff3344;
      animation: glitch-2 4s infinite;
      clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
    }
    @keyframes glitch-base {
      0%,90%,100% { transform: translate(0); }
      91% { transform: translate(-2px, 1px); }
      93% { transform: translate(2px, -1px); }
      95% { transform: translate(-1px, 2px); }
    }
    @keyframes glitch-1 {
      0%,90%,100% { transform: translate(0); opacity: 0; }
      91% { transform: translate(-4px, 0); opacity: 0.7; }
      93% { transform: translate(4px, 0); opacity: 0.7; }
      95% { opacity: 0; }
    }
    @keyframes glitch-2 {
      0%,90%,100% { transform: translate(0); opacity: 0; }
      92% { transform: translate(4px, 0); opacity: 0.7; }
    }

    /* ── Count-up number ── */
    .count-up {
      display: inline-block;
      transition: transform 0.3s ease;
    }
    .count-up.counting {
      animation: count-pulse 0.1s ease;
    }
    @keyframes count-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); color: #00ffcc; }
      100% { transform: scale(1); }
    }

    /* ── Page transition ── */
    .screen {
      transition: opacity 0.28s cubic-bezier(0.4,0,0.2,1),
                  transform 0.28s cubic-bezier(0.4,0,0.2,1) !important;
    }
    .screen.slide-in {
      animation: slideIn 0.28s cubic-bezier(0.4,0,0.2,1) forwards;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Particle canvas (behind everything) ── */
    #cg-particles {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: 0.35;
    }

    /* ── Raid card entrance ── */
    .rc {
      animation: raidCardIn 0.4s ease both;
    }
    @keyframes raidCardIn {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ── Pulse ring on live dot ── */
    .live-dot::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 1px solid #00ffcc;
      animation: pulse-ring 1.8s ease-out infinite;
    }
    .live-dot { position: relative; }
    @keyframes pulse-ring {
      0%   { transform: scale(0.7); opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* ── Typewriter text ── */
    .typewriter {
      overflow: hidden;
      border-right: 1px solid #00ffcc;
      white-space: nowrap;
      animation:
        typing 2s steps(40, end) forwards,
        blink-caret 0.75s step-end infinite;
    }
    @keyframes typing {
      from { width: 0; }
      to   { width: 100%; }
    }
    @keyframes blink-caret {
      0%,100% { border-color: transparent; }
      50%     { border-color: #00ffcc; }
    }

    /* ── XP bar fill animation ── */
    .prog-fill {
      transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    /* ── Toast slide-up ── */
    #toast {
      transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1) !important;
      transform: translateX(-50%) translateY(20px);
    }
    #toast.show {
      transform: translateX(-50%) translateY(0) !important;
    }

    /* ── Card hover glow ── */
    .card, .rc, .sc {
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s !important;
    }
    .card:hover {
      box-shadow: 0 0 20px rgba(255,255,255,0.04);
    }
    .rc:hover {
      box-shadow: 0 0 16px rgba(0,255,204,0.06);
      transform: translateX(2px);
    }

    /* ── Splash card stagger ── */
    .sc:nth-child(1) { animation-delay: 0.0s; }
    .sc:nth-child(2) { animation-delay: 0.08s; }
    .sc:nth-child(3) { animation-delay: 0.16s; }
    @keyframes scIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .sc { animation: scIn 0.5s ease both; }

    /* ── Status badge flash (for critical raids) ── */
    .badge.badge-critical-flash {
      animation: critFlash 1s ease infinite;
    }
    @keyframes critFlash {
      0%,100% { border-color: #ff3344; color: #ff3344; }
      50%     { border-color: #ff334488; color: #ff334488; }
    }

    /* ── Scan line on map ── */
    .map-scan-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
      overflow: hidden;
    }
    .map-scan-overlay::after {
      content: '';
      position: absolute;
      left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,255,204,0.3), transparent);
      animation: mapScan 6s linear infinite;
    }
    @keyframes mapScan {
      from { top: -2px; }
      to   { top: 100%; }
    }
  `;
  document.head.appendChild(style);
})();

// ══════════════════════════════════════════
//  2. PARTICLE BACKGROUND
// ══════════════════════════════════════════
function initParticles() {
  const canvas = document.createElement("canvas");
  canvas.id = "cg-particles";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function spawnParticles() {
    particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,255,255,${0.04 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw dots
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,204,${p.alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => { resize(); spawnParticles(); });
  resize();
  spawnParticles();
  draw();
}

// ══════════════════════════════════════════
//  3. COUNT-UP NUMBERS
// ══════════════════════════════════════════
function animateCountUp(el, target, duration = 1200) {
  const start = parseInt(el.textContent.replace(/,/g, "")) || 0;
  const step = (target - start) / (duration / 16);
  let current = start;
  let frame;
  function tick() {
    current += step;
    if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
      el.textContent = target.toLocaleString();
      return;
    }
    el.textContent = Math.round(current).toLocaleString();
    el.classList.add("counting");
    setTimeout(() => el.classList.remove("counting"), 100);
    frame = requestAnimationFrame(tick);
  }
  tick();
}

// Auto-apply count-up to stat numbers when they enter view
function observeCountUps() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.countTarget || el.textContent.replace(/,/g, ""));
        if (!isNaN(target) && !el.dataset.counted) {
          el.dataset.counted = "1";
          el.classList.add("count-up");
          animateCountUp(el, target);
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  // Observe elements with class "stat-num" or data-count attribute
  document.querySelectorAll(".stat-num, [data-count]").forEach(el => {
    observer.observe(el);
  });
}

// ══════════════════════════════════════════
//  4. GLITCH EFFECT on CHAOS GRID logo
// ══════════════════════════════════════════
function initGlitch() {
  document.querySelectorAll(".splash-logo, .logo").forEach(el => {
    el.setAttribute("data-text", el.textContent);
    el.classList.add("glitch");
  });
}

// ══════════════════════════════════════════
//  5. MAP SCAN LINE OVERLAY
// ══════════════════════════════════════════
function addMapScanLine() {
  const mapEl = document.getElementById("leafletMap");
  if (mapEl) {
    const overlay = document.createElement("div");
    overlay.className = "map-scan-overlay";
    mapEl.parentElement.style.position = "relative";
    mapEl.parentElement.appendChild(overlay);
  }
}

// ══════════════════════════════════════════
//  6. SMOOTH SCREEN TRANSITIONS
// ══════════════════════════════════════════
function enhanceScreenTransitions() {
  // Intercept the existing go() function
  if (typeof window.go === "function") {
    const _go = window.go;
    window.go = function(screenName) {
      _go(screenName);
      // Add slide-in class to the newly active screen
      setTimeout(() => {
        const active = document.querySelector(".screen.active");
        if (active) {
          active.classList.remove("slide-in");
          void active.offsetWidth; // force reflow
          active.classList.add("slide-in");
        }
      }, 10);
    };
  }
}

// ══════════════════════════════════════════
//  7. RAID CARD STAGGER ANIMATION
// ══════════════════════════════════════════
function animateRaidCards() {
  // Re-run whenever raid list is re-rendered
  const observer = new MutationObserver(() => {
    document.querySelectorAll(".rc:not(.animated)").forEach((card, i) => {
      card.classList.add("animated");
      card.style.animationDelay = `${i * 0.06}s`;
    });
  });
  const list = document.querySelector(".raid-list");
  if (list) observer.observe(list, { childList: true });
}

// ══════════════════════════════════════════
//  8. CRITICAL BADGE FLASH
// ══════════════════════════════════════════
function flashCriticalBadges() {
  setInterval(() => {
    document.querySelectorAll(".badge-w").forEach(b => {
      if (b.textContent.includes("CRITICAL")) {
        b.classList.add("badge-critical-flash");
      }
    });
  }, 500);
}

// ══════════════════════════════════════════
//  9. XP BAR ANIMATED FILL ON LOAD
// ══════════════════════════════════════════
function animateXPBars() {
  document.querySelectorAll(".prog-fill").forEach(bar => {
    const target = bar.style.width;
    bar.style.width = "0%";
    setTimeout(() => { bar.style.width = target; }, 300);
  });
}

// ══════════════════════════════════════════
//  BOOT — run everything on DOMContentLoaded
// ══════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initGlitch();
  observeCountUps();
  enhanceScreenTransitions();
  animateRaidCards();
  flashCriticalBadges();

  // Map scan line: wait for map screen to be initialized
  setTimeout(addMapScanLine, 1500);

  // XP bars: animate when rewards/profile screen opens
  document.querySelectorAll('[onclick*="rewards"], [onclick*="profile"]').forEach(btn => {
    btn.addEventListener("click", () => setTimeout(animateXPBars, 300));
  });

  console.log("[CHAOS GRID] Animations initialized ✓");
});

// Export for manual use
window.CGAnimations = { animateCountUp, animateXPBars, addMapScanLine };
