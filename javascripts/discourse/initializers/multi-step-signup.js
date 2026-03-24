import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.8", (api) => {
  let initialized = false;
  let globalObserver = null;
  let allStepElements = [];
  let currentStep = 0;
  const TOTAL_STEPS = 4;

  // ─── Hide/show via direct inline style — no CSS classes needed ────────────
  function hideEl(el) {
    el.style.setProperty("display", "none", "important");
  }

  function showEl(el) {
    el.style.removeProperty("display");
    // fallback if removeProperty didn't work
    if (getComputedStyle(el).display === "none") {
      el.style.display = "block";
    }
  }

  // ─── Teardown ──────────────────────────────────────────────────────────────
  function cleanup() {
    if (!initialized) return;
    initialized = false;
    currentStep = 0;
    allStepElements = [];

    document.body.classList.remove(
      "mss-on-step-1", "mss-on-step-2", "mss-on-step-3", "mss-on-step-4"
    );

    document.querySelectorAll(
      ".multi-step-nav, .mss-progress-bar-wrap, .mss-required-text, .create-account__password-confirm, .mss-legal-text-box"
    ).forEach((el) => el.remove());

    // Restore any hidden elements
    document.querySelectorAll("[data-mss-step]").forEach((el) => {
      el.style.removeProperty("display");
      el.removeAttribute("data-mss-step");
    });
  }

  // ─── Progress bar ──────────────────────────────────────────────────────────
  function buildProgressBar() {
    const barWrap = document.createElement("div");
    barWrap.className = "mss-progress-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "signup-progress-bar";
    const segments = [];

    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const seg = document.createElement("div");
      seg.className = "signup-progress-bar__segment";
      const circle = document.createElement("div");
      circle.className = "signup-progress-bar__circle";
      seg.appendChild(circle);
      bar.appendChild(seg);
      segments.push(seg);
    }

    barWrap.appendChild(bar);
    return { barWrap, segments };
  }

  function updateProgressBar(segments, step) {
    segments.forEach((seg, i) => {
      seg.classList.remove("--active", "--complete", "--incomplete");
      if (i + 1 < step) seg.classList.add("--complete");
      else if (i + 1 === step) seg.classList.add("--active");
      else seg.classList.add("--incomplete");
    });
  }

  // ─── Main init ─────────────────────────────────────────────────────────────
  function initMultiStep() {
    if (initialized) return;

    const emailField    = document.querySelector(".create-account-email");
    const usernameField = document.querySelector(".create-account__username");
    const passwordField = document.querySelector(".create-account__password");

    if (!emailField || !usernameField || !passwordField) return;

    // Also wait for user-fields to be rendered if they exist at all
    // Give Discourse a tick to finish rendering
    const userFieldsEl = document.querySelector(".user-fields");
    const groups = userFieldsEl
      ? Array.from(userFieldsEl.querySelectorAll(".input-group"))
      : [];

    initialized = true;

    // ── Tag every element with which step it belongs to ──────────────────────
    function tag(el, step) {
      el.setAttribute("data-mss-step", step);
      allStepElements.push({ el, step });
    }

    tag(emailField, 1);
    tag(usernameField, 1);
    tag(passwordField, 1);

    // Re-enter Password — step 1
    const confirmField = document.createElement("div");
    confirmField.className = "create-account__password create-account__password-confirm";
    confirmField.setAttribute("data-mss-step", "1");
    allStepElements.push({ el: confirmField, step: 1 });

    const confirmLabel = document.createElement("label");
    confirmLabel.textContent = "Re-enter Password*";
    const confirmInput = document.createElement("input");
    confirmInput.type = "password";
    confirmInput.placeholder = "Re-enter your password";
    confirmInput.className = "mss-password-confirm-input";
    confirmField.appendChild(confirmLabel);
    confirmField.appendChild(confirmInput);
    passwordField.after(confirmField);

    // User fields → steps 2, 3, 4
    groups.slice(0, 7).forEach((g) => tag(g, 2));
    groups.slice(7, 12).forEach((g) => tag(g, 3));
    groups.slice(12).forEach((g) => tag(g, 4));

    // Legal text boxes — step 4
    const guidelinesText =
      (typeof settings !== "undefined" && settings.community_guidelines_text) ||
      "Please read our community guidelines carefully before proceeding.";
    const privacyText =
      (typeof settings !== "undefined" && settings.privacy_policy_text) ||
      "Please read our privacy policy carefully before proceeding.";

    const guidelinesBox = document.createElement("div");
    guidelinesBox.className = "mss-legal-text-box";
    guidelinesBox.textContent = guidelinesText;

    const privacyBox = document.createElement("div");
    privacyBox.className = "mss-legal-text-box";
    privacyBox.textContent = privacyText;

    // Insert before step-4 groups or at end of user-fields
    const step4Groups = groups.slice(12);
    if (step4Groups.length >= 1) {
      step4Groups[0].before(guidelinesBox);
      tag(guidelinesBox, 4);
    }
    if (step4Groups.length >= 2) {
      step4Groups[1].before(privacyBox);
      tag(privacyBox, 4);
    } else if (userFieldsEl) {
      userFieldsEl.appendChild(guidelinesBox);
      tag(guidelinesBox, 4);
      userFieldsEl.appendChild(privacyBox);
      tag(privacyBox, 4);
    }

    // ── Progress bar ─────────────────────────────────────────────────────────
    const { barWrap, segments } = buildProgressBar();
    const titleEl = document.querySelector("#create-account-title");
    if (titleEl) {
      titleEl.before(barWrap);
    } else {
      const form = document.querySelector(".create-account");
      if (form) form.prepend(barWrap);
    }

    // Required text
    const requiredText = document.createElement("div");
    requiredText.className = "mss-required-text";
    requiredText.textContent = "Fields marked with * are required.";
    barWrap.after(requiredText);

    // ── Nav buttons ───────────────────────────────────────────────────────────
    const nav = document.createElement("div");
    nav.className = "multi-step-nav";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn mss-back-btn";
    backBtn.textContent = "Back";

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn btn-primary mss-next-btn";
    nextBtn.textContent = "Continue";

    const completeBtn = document.createElement("button");
    completeBtn.type = "button";
    completeBtn.className = "btn btn-primary mss-complete-btn";
    completeBtn.textContent = "Complete Signup";

    nav.appendChild(backBtn);
    nav.appendChild(nextBtn);
    nav.appendChild(completeBtn);

    if (userFieldsEl) {
      userFieldsEl.after(nav);
    } else {
      const form = document.querySelector(".create-account");
      if (form) form.appendChild(nav);
    }

    // Hide Discourse's native submit button
    document.querySelectorAll(".sign-up-button").forEach((btn) => {
      btn.style.cssText = "position:absolute;left:-9999px;opacity:0;pointer-events:none;";
    });

    // ── Step controller ───────────────────────────────────────────────────────
    function goToStep(step) {
      currentStep = step;

      // Update heading
      const heading = document.querySelector("#create-account-title");
      if (heading) {
        const titles = [
          "Create your Account",
          "Enter Your Details",
          "About Your Organization",
          "Participation Agreement",
        ];
        heading.textContent = titles[step - 1] || "";
      }

      // Show/hide every tagged element based on its step number
      allStepElements.forEach(({ el, step: elStep }) => {
        if (elStep === step) {
          showEl(el);
        } else {
          hideEl(el);
        }
      });

      // Nav button visibility
      hideEl(backBtn);
      hideEl(nextBtn);
      hideEl(completeBtn);
      if (step > 1) showEl(backBtn);
      if (step < TOTAL_STEPS) showEl(nextBtn);
      if (step === TOTAL_STEPS) showEl(completeBtn);

      updateProgressBar(segments, step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
    });

    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentStep > 1) goToStep(currentStep - 1);
    });

    completeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      captureStateTags();
      triggerDiscourseSubmit();
    });

    goToStep(1);
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  function triggerDiscourseSubmit() {
    const submitBtn = document.querySelector(".sign-up-button");
    if (submitBtn) {
      submitBtn.style.cssText = "";
      submitBtn.click();
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.style.cssText =
            "position:absolute;left:-9999px;opacity:0;pointer-events:none;";
        }
      }, 1500);
      return;
    }
    const form = document.querySelector("form.create-account") ||
      document.querySelector(".create-account");
    if (form) {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
  }

  // ─── Global observer ──────────────────────────────────────────────────────
  // Watches for the signup modal being added to/removed from the DOM.
  // This is essential because Discourse opens signup as a modal (no page change).
  function startGlobalObserver() {
    if (globalObserver) return;

    globalObserver = new MutationObserver(() => {
      const formPresent = !!document.querySelector(".create-account");
      if (formPresent && !initialized) {
        // Defer one tick so Discourse finishes rendering all fields
        setTimeout(tryInit, 50);
      } else if (!formPresent && initialized) {
        cleanup();
      }
    });

    globalObserver.observe(document.body, { childList: true, subtree: true });
  }

  function tryInit() {
    if (initialized) return;
    const emailField    = document.querySelector(".create-account-email");
    const usernameField = document.querySelector(".create-account__username");
    const passwordField = document.querySelector(".create-account__password");
    if (emailField && usernameField && passwordField) {
      initMultiStep();
    } else {
      // Fields not ready yet, wait a bit more
      setTimeout(tryInit, 100);
    }
  }

  // ─── State-tag capture ─────────────────────────────────────────────────────
  let _pendingStateTags = [];

  function captureStateTags() {
    const stateField = document.querySelector(
      ".user-field-which-states-do-you-work-in, [class*='user-field-which-state']"
    );
    if (!stateField) return;

    const seen = new Set();
    const tags = [];

    function addTag(raw) {
      if (!raw) return;
      const val = raw.trim();
      if (val && !seen.has(val)) { seen.add(val); tags.push(val); }
    }

    stateField
      .querySelectorAll(".select-kit-header .choice, .multi-select-header .choice")
      .forEach((choice) => {
        const val = choice.dataset.value || choice.dataset.name;
        if (val) addTag(val);
        else {
          const nameEl = choice.querySelector(".name");
          if (nameEl) addTag(nameEl.textContent);
        }
      });

    if (tags.length) {
      _pendingStateTags = tags.map((t) =>
        t.trim().toLowerCase().replace(/\s+/g, "_")
      );
    }
  }

  function waitForCurrentUserThenWatch(retries) {
    if (!_pendingStateTags.length) return;
    const remaining = retries === undefined ? 20 : retries;
    if (remaining <= 0) return;
    const currentUser = api.getCurrentUser ? api.getCurrentUser() : null;
    if (currentUser && currentUser.username) {
      applyStateTagWatching();
    } else {
      setTimeout(() => waitForCurrentUserThenWatch(remaining - 1), 500);
    }
  }

  async function applyStateTagWatching() {
    if (!_pendingStateTags.length) return;
    const tagsToWatch = [..._pendingStateTags];
    _pendingStateTags = [];
    for (const tag of tagsToWatch) {
      try {
        await ajax(`/tag/${encodeURIComponent(tag)}/notifications`, {
          type: "PUT",
          contentType: "application/json",
          data: JSON.stringify({ tag_notification: { notification_level: 3 } }),
        });
      } catch (_) {}
    }
  }

  api.onAppEvent("user:created", () => {
    if (!_pendingStateTags.length) captureStateTags();
    setTimeout(() => waitForCurrentUserThenWatch(), 1000);
  });

  // ─── Bootstrap ─────────────────────────────────────────────────────────────
  startGlobalObserver();

  // Also catch direct page-based signup (non-modal)
  api.onPageChange(() => {
    if (document.querySelector(".create-account") && !initialized) {
      tryInit();
    } else if (!document.querySelector(".create-account") && initialized) {
      cleanup();
    }
  });
});
