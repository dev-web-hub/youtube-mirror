(() => {
  "use strict";

  const viewport = document.getElementById("viewport");
  const track = document.getElementById("track");
  const cta = document.getElementById("cta");
  const hint = document.getElementById("hint");

  /** 5 slots: -2 -1 0 +1 +2 */
  const vids = Array.from(track.querySelectorAll("video"));
  const slotOf = (v) => Number(v.getAttribute("data-slot"));

  const STATE = {
    feed: [],
    idx: 0,               // current index in feed for slot 0
    swipes: 0,
    CTA_AFTER: 22,
    CTA_URL: "/plp/en/automation-roadmap/",
    unlocked: false,
    paused: false,

    // drag physics
    dragging: false,
    pointerId: null,
    startY: 0,
    lastY: 0,
    offsetPx: 0,
    vPxPerMs: 0,
    lastT: 0,
    moved: false,

    // wheel
    wheelLock: false,

    // animation
    anim: 0,
    height: 1
  };

  function nowMs() { return performance.now(); }

  function setTransform(px) {
    STATE.offsetPx = px;
    track.style.transform = `translate3d(0, ${px}px, 0)`;
  }

  function clampIndex(i) {
    const n = STATE.feed.length || 1;
    i = i % n;
    if (i < 0) i += n;
    return i;
  }

  function safePlay(v) {
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  function ensureDefaults(v) {
    v.muted = true;
    v.loop = true;            // loop single clip until user advances
    v.playsInline = true;
    v.preload = "auto";
  }

  vids.forEach(ensureDefaults);

  function currentVideo() {
    return vids.find(v => slotOf(v) === 0) || vids[2];
  }

  function pauseAllExceptZero() {
    for (const v of vids) {
      if (slotOf(v) === 0) continue;
      try { v.pause(); } catch {}
    }
  }

  function applyMuteState() {
    for (const v of vids) {
      if (!STATE.unlocked) {
        v.muted = true;
      } else {
        // avoid overlap audio: only slot 0 is unmuted
        v.muted = slotOf(v) !== 0;
      }
    }
  }

  function loadVideo(v, src) {
    return new Promise((resolve) => {
      if (v.getAttribute("data-src") === src) return resolve();

      // hard reset decode pipeline
      try { v.pause(); } catch {}
      v.removeAttribute("src");
      v.load();

      const done = () => {
        v.removeEventListener("loadeddata", done);
        v.removeEventListener("canplay", done);
        resolve();
      };

      v.addEventListener("loadeddata", done, { once: true });
      v.addEventListener("canplay", done, { once: true });

      v.src = src;
      v.setAttribute("data-src", src);
      v.load();
    });
  }

  function srcForSlot(slot) {
    if (!STATE.feed.length) return null;
    const i = clampIndex(STATE.idx + slot);
    return STATE.feed[i];
  }

  async function hydrateSlots() {
    if (!STATE.feed.length) return;

    const jobs = [];
    for (const v of vids) {
      const slot = slotOf(v);
      const src = srcForSlot(slot);
      if (src) jobs.push(loadVideo(v, src));
    }

    // Ensure slot 0 is ready, then play it (muted until unlock)
    await Promise.all(jobs);

    applyMuteState();
    pauseAllExceptZero();

    const v0 = currentVideo();
    v0.currentTime = 0;
    if (!STATE.paused) safePlay(v0);
  }

  function showCTA() {
    const v0 = currentVideo();
    try { v0.pause(); } catch {}
    cta.style.display = "flex";
    cta.innerHTML = `
      <div class="card">
        <h2>This feed is automated</h2>
        <p>See how it was built.</p>
        <a href="${STATE.CTA_URL}">View roadmap</a>
      </div>
    `;
  }

  function hideHintSoon() {
    if (!hint) return;
    hint.style.opacity = "0";
    hint.style.pointerEvents = "none";
  }

  function unlock() {
    if (STATE.unlocked) return;
    STATE.unlocked = true;
    applyMuteState();
    const v0 = currentVideo();
    if (!STATE.paused) safePlay(v0);
    hideHintSoon();
  }

  function togglePause() {
    const v0 = currentVideo();
    if (!v0) return;

    if (STATE.paused) {
      STATE.paused = false;
      applyMuteState();
      safePlay(v0);
    } else {
      STATE.paused = true;
      try { v0.pause(); } catch {}
    }
    hideHintSoon();
  }

  // tap-to-pause + unlock-on-first-gesture
  viewport.addEventListener("pointerup", (e) => {
    if (STATE.pointerId !== e.pointerId) return;

    // if it was a drag, don't treat as tap
    const wasDrag = STATE.moved;
    STATE.moved = false;

    if (!STATE.unlocked) unlock();
    if (!wasDrag) togglePause();
  }, { passive: true });

  // drag/inertia/snap
  function stopAnim() {
    if (STATE.anim) cancelAnimationFrame(STATE.anim);
    STATE.anim = 0;
  }

  function animateTo(targetPx, ms, onDone) {
    stopAnim();
    const start = STATE.offsetPx;
    const delta = targetPx - start;
    const t0 = nowMs();
    const dur = Math.max(120, ms | 0);

    const step = () => {
      const t = nowMs();
      const p = Math.min(1, (t - t0) / dur);
      // easeOutCubic
      const e = 1 - Math.pow(1 - p, 3);
      setTransform(start + delta * e);
      if (p < 1) {
        STATE.anim = requestAnimationFrame(step);
      } else {
        STATE.anim = 0;
        if (onDone) onDone();
      }
    };
    STATE.anim = requestAnimationFrame(step);
  }

  async function commitStep(dir) {
    // dir: +1 => next (drag up), -1 => prev (drag down)
    if (!STATE.feed.length) return;

    STATE.swipes++;
    if (STATE.swipes === STATE.CTA_AFTER) {
      setTransform(0);
      showCTA();
      return;
    }

    // advance index
    STATE.idx = clampIndex(STATE.idx + dir);

    // rotate sources: we reuse the same 5 <video> elements, just retarget their srcs
    // Strategy: after commit, hard reset transform, then refresh the 5 sources around new idx.
    setTransform(0);
    await hydrateSlots();
  }

  function snapFromOffset(offsetPx) {
    const H = STATE.height || 1;

    // predicted end with inertia
    const predicted = offsetPx + (STATE.vPxPerMs * 220); // ~220ms inertial lookahead

    // each slot is 1 * H (full page)
    const rawSteps = Math.round(predicted / H);
    // clamp to at most 1 step per gesture (industry-feel, prevents skipping 10 clips)
    const steps = Math.max(-1, Math.min(1, rawSteps));

    if (steps === 0) {
      animateTo(0, 160, () => {});
      return;
    }

    // Visual: animate to +/-H then commit
    animateTo(steps * H, 200, () => {
      commitStep(-steps); // note: track moves with finger; content index moves opposite
    });
  }

  viewport.addEventListener("pointerdown", (e) => {
    if (STATE.pointerId != null) return;
    STATE.pointerId = e.pointerId;
    viewport.setPointerCapture(e.pointerId);

    stopAnim();
    STATE.dragging = true;
    STATE.startY = e.clientY;
    STATE.lastY = e.clientY;
    STATE.offsetPx = 0;
    STATE.vPxPerMs = 0;
    STATE.lastT = nowMs();
    STATE.moved = false;

    if (!STATE.unlocked) unlock();
  }, { passive: true });

  viewport.addEventListener("pointermove", (e) => {
    if (!STATE.dragging || STATE.pointerId !== e.pointerId) return;

    const t = nowMs();
    const dy = e.clientY - STATE.startY;       // down is positive
    const delta = e.clientY - STATE.lastY;

    if (Math.abs(dy) > 6) STATE.moved = true;

    // velocity
    const dt = Math.max(1, t - STATE.lastT);
    const v = delta / dt;
    // low-pass filter
    STATE.vPxPerMs = (STATE.vPxPerMs * 0.75) + (v * 0.25);

    // rubberband clamp (never show more than ~1.15 pages)
    const H = STATE.height || 1;
    const clamped = Math.max(-H * 1.15, Math.min(H * 1.15, dy));
    setTransform(clamped);

    STATE.lastY = e.clientY;
    STATE.lastT = t;
  }, { passive: true });

  viewport.addEventListener("pointercancel", (e) => {
    if (STATE.pointerId !== e.pointerId) return;
    STATE.dragging = false;
    STATE.pointerId = null;
    snapFromOffset(STATE.offsetPx);
  }, { passive: true });

  viewport.addEventListener("pointerup", (e) => {
    if (STATE.pointerId !== e.pointerId) return;
    STATE.dragging = false;
    STATE.pointerId = null;

    // snap (tap handler also runs, but it checks moved flag)
    snapFromOffset(STATE.offsetPx);
  }, { passive: true });

  // wheel: one step per wheel “intent”
  document.addEventListener("wheel", (e) => {
    if (STATE.wheelLock) return;
    if (!STATE.feed.length) return;

    const dy = e.deltaY;
    if (Math.abs(dy) < 24) return;

    STATE.wheelLock = true;
    if (!STATE.unlocked) unlock();

    const dir = dy > 0 ? +1 : -1; // wheel down => next
    animateTo(-dir * STATE.height, 180, () => {
      commitStep(dir);
      setTimeout(() => { STATE.wheelLock = false; }, 180);
    });
  }, { passive: true });

  // keyboard
  document.addEventListener("keydown", (e) => {
    if (!STATE.feed.length) return;
    if (e.key === " " || e.key === "Spacebar") {
      if (!STATE.unlocked) unlock();
      togglePause();
      return;
    }
    if (e.key === "ArrowDown") {
      if (!STATE.unlocked) unlock();
      animateTo(-STATE.height, 180, () => commitStep(+1));
    }
    if (e.key === "ArrowUp") {
      if (!STATE.unlocked) unlock();
      animateTo(STATE.height, 180, () => commitStep(-1));
    }
  });

  function updateHeight() {
    STATE.height = Math.max(1, viewport.getBoundingClientRect().height || 1);
  }
  window.addEventListener("resize", updateHeight);
  updateHeight();

  // Boot
  fetch("/cubecast/feed.json", { cache: "no-store" })
    .then(r => r.json())
    .then(async (d) => {
      STATE.feed = Array.isArray(d.videos) ? d.videos : [];
      STATE.CTA_AFTER = d.inject_after_swipes || STATE.CTA_AFTER;
      STATE.CTA_URL = d.cta_url || STATE.CTA_URL;
      STATE.idx = 0;

      await hydrateSlots();

      // Start muted autoplay (mobile policy safe)
      applyMuteState();
      const v0 = currentVideo();
      if (v0 && !STATE.paused) safePlay(v0);
    })
    .catch(() => {});
})();
