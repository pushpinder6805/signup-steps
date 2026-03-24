import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.8", (api) => {
  let initialized = false;
  let observer = null;

  // ─── Teardown ────────────────────────────────────────────────────────────────
  function cleanup() {
    initialized = false;

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    document.body.classList.remove(
      "mss-on-step-1",
      "mss-on-step-2",
      "mss-on-step-3",
      "mss-on-step-4"
    );

    document
      .querySelectorAll(
        ".multi-step-nav, .mss-progress-bar-wrap, .mss-required-text, .create-account__password-confirm"
      )
      .forEach((el) => el.remove());

    document.querySelectorAll(".mss-legal-text-box[data-mss]").forEach((el) => el.remove());

    document
      .querySelectorAll("[class*='mss-step-']")
      .forEach((el) => {
        el.classList.remove("mss-step-1", "mss-step-2", "mss-step-3", "mss-step-4");
      });
  }

  // ─── Progress bar ────────────────────────────────────────────────────────────
  function buildProgressBar(totalSteps) {
    const barWrap = document.createElement("div");
    barWrap.className = "mss-progress-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "signup-progress-bar";
    const segments = [];

    for (let i = 1; i <= totalSteps; i++) {
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

  function updateProgressBar(segments, currentStep) {
    segments.forEach((seg, i) => {
      seg.classList.remove("--active", "--complete", "--incomplete");
      const n = i + 1;
      if (n < currentStep) seg.classList.add("--complete");
      else if (n === currentStep) seg.classList.add("--active");
      else seg.classList.add("--incomplete");
    });
  }

  // ─── Legal text box ──────────────────────────────────────────────────────────
  function buildTextBox(text) {
    const box = document.createElement("div");
    box.className = "mss-legal-text-box mss-hidden";
    box.setAttribute("data-mss", "1");
    box.textContent = text;
    return box;
  }

  // ─── Core init ───────────────────────────────────────────────────────────────
  function initMultiStep() {
    if (initialized) return;

    // Must be on the signup page
    if (!document.querySelector(".create-account")) return;

    // Wait until user-fields are present
    const userFieldsEl = document.querySelector(".user-fields");
    const groups = userFieldsEl
      ? Array.from(userFieldsEl.querySelectorAll(".input-group"))
      : [];

    // Core Discourse fields (always present on signup form)
    const emailField    = document.querySelector(".create-account-email");
    const usernameField = document.querySelector(".create-account__username");
    const passwordField = document.querySelector(".create-account__password");

    // Need at least the core fields to proceed
    if (!emailField || !usernameField || !passwordField) return;

    initialized = true;

    const TOTAL_STEPS = 4;

    // ── Assign step classes to core fields ──────────────────────────────────
    emailField.classList.add("mss-step-1");
    usernameField.classList.add("mss-step-1");
    passwordField.classList.add("mss-step-1");

    // ── Re-enter Password field ──────────────────────────────────────────────
    const passwordConfirmField = document.createElement("div");
    passwordConfirmField.className = "create-account__password create-account__password-confirm mss-step-1";

    const confirmLabel = document.createElement("label");
    confirmLabel.textContent = "Re-enter Password*";

    const confirmWrapper = document.createElement("div");
    confirmWrapper.style.position = "relative";

    const confirmInput = document.createElement("input");
    confirmInput.type = "password";
    confirmInput.placeholder = "Re-enter your password";
    confirmInput.className = "mss-password-confirm-input";

    confirmWrapper.appendChild(confirmInput);
    passwordConfirmField.appendChild(confirmLabel);
    passwordConfirmField.appendChild(confirmWrapper);
    passwordField.after(passwordConfirmField);

    // ── Assign step classes to user-field groups ─────────────────────────────
    // page 2: first 7 groups  → Enter Your Details
    // page 3: next 5 groups   → About Your Organization
    // page 4: remaining       → Participation Agreement
    groups.slice(0, 7).forEach((g) => g.classList.add("mss-step-2"));
    groups.slice(7, 12).forEach((g) => g.classList.add("mss-step-3"));
    groups.slice(12).forEach((g) => g.classList.add("mss-step-4"));

    // ── Legal text boxes (step 4) ────────────────────────────────────────────
    const guidelinesText =
      (settings && settings.community_guidelines_text) ||
      "Please read our community guidelines carefully before proceeding.";
    const privacyText =
      (settings && settings.privacy_policy_text) ||
      "Please read our privacy policy carefully before proceeding.";

    const guidelinesBox = buildTextBox(guidelinesText);
    const privacyBox    = buildTextBox(privacyText);

    const step4Groups = groups.slice(12);
    if (step4Groups.length >= 1) step4Groups[0].before(guidelinesBox);
    if (step4Groups.length >= 2) step4Groups[1].before(privacyBox);
    else if (step4Groups.length === 1) step4Groups[0].after(privacyBox);
    else if (userFieldsEl) {
      userFieldsEl.appendChild(guidelinesBox);
      userFieldsEl.appendChild(privacyBox);
    }

    // ── Progress bar ─────────────────────────────────────────────────────────
    const { barWrap, segments } = buildProgressBar(TOTAL_STEPS);
    const titleEl = document.querySelector("#create-account-title");
    if (titleEl) {
      titleEl.before(barWrap);
    } else {
      document.querySelector(".create-account").prepend(barWrap);
    }

    // ── "Fields marked with * are required" notice ───────────────────────────
    const requiredText = document.createElement("div");
    requiredText.className = "mss-required-text";
    requiredText.textContent = "Fields marked with * are required.";
    if (titleEl) titleEl.after(requiredText);
    else barWrap.after(requiredText);

    // ── Navigation buttons ───────────────────────────────────────────────────
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
      document.querySelector(".create-account").appendChild(nav);
    }

    // Hide the original Discourse submit button (visually) so our nav drives flow
    document.querySelectorAll(".sign-up-button").forEach((btn) => {
      btn.style.cssText = "position:absolute;left:-9999px;opacity:0;pointer-events:none;";
    });

    // ── Step controller ──────────────────────────────────────────────────────
    let currentStep = 0;

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

      // Swap body class
      document.body.classList.remove(
        "mss-on-step-1", "mss-on-step-2", "mss-on-step-3", "mss-on-step-4"
      );
      document.body.classList.add(`mss-on-step-${step}`);

      // Legal boxes only visible on step 4
      [guidelinesBox, privacyBox].forEach((box) => {
        box.classList.toggle("mss-hidden", step !== 4);
      });

      // Nav visibility
      backBtn.classList.toggle("mss-hidden", step === 1);
      nextBtn.classList.toggle("mss-hidden", step === TOTAL_STEPS);
      completeBtn.classList.toggle("mss-hidden", step !== TOTAL_STEPS);

      updateProgressBar(segments, step);

      // Scroll form to top
      const form = document.querySelector(".create-account");
      if (form) form.scrollTop = 0;
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

    // Start on step 1
    goToStep(1);
  }

  // ─── Trigger Discourse's own form submission ─────────────────────────────────
  function triggerDiscourseSubmit() {
    const submitBtn =
      document.querySelector(".sign-up-button") ||
      document.querySelector("form.create-account [type='submit']");

    if (submitBtn) {
      submitBtn.removeAttribute("style");
      submitBtn.click();
      setTimeout(() => {
        submitBtn.style.cssText =
          "position:absolute;left:-9999px;opacity:0;pointer-events:none;";
      }, 500);
      return;
    }

    const form =
      document.querySelector("form.create-account") ||
      document.querySelector(".create-account");

    if (form && form.requestSubmit) {
      form.requestSubmit();
    } else if (form) {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
  }

  // ─── Wait for form to appear, then init ──────────────────────────────────────
  function waitForForm() {
    if (initialized) return;

    // Check immediately
    const ready =
      document.querySelector(".create-account-email") &&
      document.querySelector(".create-account__username") &&
      document.querySelector(".create-account__password");

    if (ready) {
      initMultiStep();
      return;
    }

    // Watch for DOM changes
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      if (initialized) {
        observer.disconnect();
        observer = null;
        return;
      }
      const nowReady =
        document.querySelector(".create-account-email") &&
        document.querySelector(".create-account__username") &&
        document.querySelector(".create-account__password");
      if (nowReady) {
        observer.disconnect();
        observer = null;
        initMultiStep();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── State-tag capture (existing feature) ────────────────────────────────────
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
      if (val && !seen.has(val)) {
        seen.add(val);
        tags.push(val);
      }
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

  // ─── Page change hook ─────────────────────────────────────────────────────────
  api.onPageChange((url) => {
    cleanup();
    // Only activate on signup-related routes
    if (
      url.includes("/signup") ||
      url.includes("/register") ||
      document.querySelector(".create-account")
    ) {
      waitForForm();
    }
  });
});
