import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.8", (api) => {
  let initialized = false;

  function cleanup() {
    initialized = false;
    document.body.classList.remove("mss-on-step-1", "mss-on-step-2", "mss-on-step-3");
    document
      .querySelectorAll(".multi-step-nav, .mss-progress-bar-wrap, .mss-legal-text-box, .mss-required-text, .create-account__password-confirm")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(".mss-step-1, .mss-step-2, .mss-step-3")
      .forEach((el) => {
        el.classList.remove("mss-step-1", "mss-step-2", "mss-step-3");
      });
  }

  function buildTextBox(bodyText) {
    const box = document.createElement("div");
    box.className = "mss-legal-text-box mss-hidden";
    box.textContent = bodyText;
    return box;
  }

  function buildProgressBar(totalSteps) {
    const barWrap = document.createElement("div");
    barWrap.className = "mss-progress-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "signup-progress-bar";

    const segments = [];
    for (let i = 1; i <= totalSteps; i++) {
      const seg = document.createElement("div");
      seg.className = "signup-progress-bar__segment";

      const step = document.createElement("div");
      step.className = "signup-progress-bar__step";

      const circle = document.createElement("div");
      circle.className = "signup-progress-bar__circle";

      step.appendChild(circle);
      seg.appendChild(step);
      bar.appendChild(seg);
      segments.push(seg);
    }

    barWrap.appendChild(bar);
    return { barWrap, segments };
  }

  function updateProgressBar(segments, currentStep) {
    segments.forEach((seg, i) => {
      seg.classList.remove("--active", "--complete", "--incomplete");
      const stepNum = i + 1;
      if (stepNum < currentStep) {
        seg.classList.add("--complete");
      } else if (stepNum === currentStep) {
        seg.classList.add("--active");
      } else {
        seg.classList.add("--incomplete");
      }
    });
  }


  function initMultiStep() {
    if (initialized) return;

    const groups = Array.from(
      document.querySelectorAll(".user-fields .input-group")
    );
    if (!groups.length) return;

    initialized = true;

    function getGuidelinesText() {
      const val = settings && settings.community_guidelines_text;
      return (val && String(val).trim()) || "Please read our community guidelines carefully before proceeding.";
    }

    function getPrivacyText() {
      const val = settings && settings.privacy_policy_text;
      return (val && String(val).trim()) || "Please read our privacy policy carefully before proceeding.";
    }

    const page2Groups = groups.slice(0, 12);
    const page3Groups = groups.slice(12);

    let currentStep = 1;
    const totalSteps = 3;

    const coreFields = Array.from(
      document.querySelectorAll(
        ".create-account-email, .create-account__username, .create-account__password"
      )
    );

    const passwordField = document.querySelector(".create-account__password");
    let passwordConfirmField = null;

    if (passwordField) {
      passwordConfirmField = document.createElement("div");
      passwordConfirmField.className = "create-account__password create-account__password-confirm";

      const label = document.createElement("label");
      label.textContent = "Re-enter Password*";

      const inputWrapper = document.createElement("div");
      inputWrapper.style.position = "relative";

      const input = document.createElement("input");
      input.type = "password";
      input.required = true;
      input.placeholder = "Password";
      input.className = "mss-password-confirm-input";

      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "mss-password-toggle";
      toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      toggleBtn.style.cssText = `
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        color: var(--primary-medium, #666);
      `;

      toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        input.type = input.type === "password" ? "text" : "password";
      });

      const matchNotice = document.createElement("div");
      matchNotice.className = "mss-password-match-notice";
      matchNotice.style.cssText = `
        margin-top: 8px;
        font-size: 0.9em;
        font-weight: 500;
        display: none;
      `;

      inputWrapper.appendChild(input);
      inputWrapper.appendChild(toggleBtn);
      passwordConfirmField.appendChild(label);
      passwordConfirmField.appendChild(inputWrapper);
      passwordConfirmField.appendChild(matchNotice);

      passwordField.after(passwordConfirmField);
      coreFields.push(passwordConfirmField);
    }


    const guidelinesTextBox = buildTextBox(getGuidelinesText());
    const privacyTextBox = buildTextBox(getPrivacyText());

    const userFieldsContainer = document.querySelector(".user-fields");

    const guidelinesField = page3Groups.find((g) =>
      g.querySelector("[class*='user-field-community-guidelines']")
    );
    const privacyField = page3Groups.find((g) =>
      g.querySelector("[class*='user-field-privacy-policy']")
    );

    if (guidelinesField) {
      guidelinesField.before(guidelinesTextBox);
    } else if (page3Groups.length && page3Groups[0].parentNode) {
      page3Groups[0].parentNode.insertBefore(guidelinesTextBox, page3Groups[0]);
    } else if (userFieldsContainer) {
      userFieldsContainer.appendChild(guidelinesTextBox);
    }

    if (privacyField) {
      privacyField.before(privacyTextBox);
    } else if (page3Groups.length > 1 && page3Groups[1].parentNode) {
      page3Groups[1].parentNode.insertBefore(privacyTextBox, page3Groups[1]);
    } else if (guidelinesTextBox.parentNode) {
      guidelinesTextBox.parentNode.appendChild(privacyTextBox);
    } else if (userFieldsContainer) {
      userFieldsContainer.appendChild(privacyTextBox);
    }

    const { barWrap, segments } = buildProgressBar(totalSteps);

    let requiredText = document.querySelector(".mss-required-text");
    if (!requiredText) {
      requiredText = document.createElement("div");
      requiredText.className = "mss-required-text";
      requiredText.textContent = "Fields marked with * are required.";
    }

    const nav = document.createElement("div");
    nav.className = "multi-step-nav";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn";
    backBtn.innerHTML = `&#8592; Back`;
    backBtn.style.cssText = `margin-right: auto;`;

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn btn-primary";
    nextBtn.innerHTML = `Continue`;

    const completeBtn = document.createElement("button");
    completeBtn.type = "button";
    completeBtn.className = "btn btn-primary mss-complete-btn";
    completeBtn.innerHTML = `Complete signup`;
    completeBtn.style.display = "none";

    nav.appendChild(backBtn);
    nav.appendChild(nextBtn);
    nav.appendChild(completeBtn);

    const userFieldsEl = document.querySelector(".user-fields");
    const formEl = document.querySelector(".create-account");

    document.querySelectorAll(".signup-progress-bar").forEach((el) => {
      const wrap = el.closest(".mss-progress-bar-wrap");
      if (wrap) return;
      el.style.display = "none";
    });

    const headingContainer =
      document.querySelector("#create-account-title") ||
      document.querySelector(".login-welcome-header");

    if (headingContainer) {
      headingContainer.before(barWrap);
      if (!document.querySelector(".mss-required-text")) {
        headingContainer.after(requiredText);
      }
    } else if (formEl) {
      formEl.before(barWrap);
      if (!document.querySelector(".mss-required-text")) {
        formEl.before(requiredText);
      }
    } else if (userFieldsEl) {
      userFieldsEl.before(barWrap);
      if (!document.querySelector(".mss-required-text")) {
        userFieldsEl.before(requiredText);
      }
    }

    const signupCta = document.querySelector(".signup-page-cta");
    if (signupCta) {
      signupCta.style.display = "none";
    }

    document.querySelectorAll(".login-welcome-header .tip, .login-welcome-header + .tip").forEach((el) => {
      el.style.display = "none";
    });

    if (userFieldsEl) {
      userFieldsEl.after(nav);
    }

    coreFields.forEach((f) => f.classList.add("mss-step-1"));
    page2Groups.forEach((g) => g.classList.add("mss-step-2"));
    page3Groups.forEach((g) => g.classList.add("mss-step-3"));

    function showStep(step) {
      currentStep = step;

      const heading = document.querySelector("#create-account-title");
      if (heading) {
        if (step === 1) {
          heading.textContent = "Create your account";
        } else if (step === 2) {
          heading.textContent = "Enter Your Details";
        } else if (step === 3) {
          heading.textContent = "Participation Agreement";
        }
      }

      document.body.classList.remove("mss-on-step-1", "mss-on-step-2", "mss-on-step-3");
      document.body.classList.add(`mss-on-step-${step}`);

      if (step === 3) {
        guidelinesTextBox.textContent = getGuidelinesText();
        privacyTextBox.textContent = getPrivacyText();
        guidelinesTextBox.classList.remove("mss-hidden");
        privacyTextBox.classList.remove("mss-hidden");
      } else {
        guidelinesTextBox.classList.add("mss-hidden");
        privacyTextBox.classList.add("mss-hidden");
      }

      backBtn.classList.toggle("mss-hidden", step === 1);
      nextBtn.classList.toggle("mss-hidden", step === totalSteps);
      completeBtn.classList.toggle("mss-hidden", step !== totalSteps);

      updateProgressBar(segments, step);
    }

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentStep < totalSteps) showStep(currentStep + 1);
    });

    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentStep > 1) showStep(currentStep - 1);
    });

    completeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      captureStateTags();

      const actualSubmitBtn = document.querySelector(".sign-up-button") ||
                             document.querySelector('button[type="submit"]') ||
                             document.querySelector('.create-account button.btn-primary');

      if (actualSubmitBtn) {
        actualSubmitBtn.click();
        return;
      }

      const form = document.querySelector(".create-account") ||
                   document.querySelector("form");

      if (form) {
        try {
          if (form.requestSubmit) {
            form.requestSubmit();
          } else {
            form.submit();
          }
        } catch (error) {
          const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      }
    });

    showStep(1);
  }

  let _pendingStateTags = [];

  function captureStateTags() {
    const stateField = document.querySelector(
      ".user-field-which-states-do-you-work-in"
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

    stateField.querySelectorAll(
      ".select-kit-header .choice, .multi-select-header .choice, .formatted-selection .choice, .choices .choice"
    ).forEach((choice) => {
      const val = choice.dataset.value || choice.dataset.name;
      if (val) {
        addTag(val);
      } else {
        const nameEl = choice.querySelector(".name");
        if (nameEl) addTag(nameEl.textContent);
      }
    });

    if (!tags.length) {
      stateField.querySelectorAll("[data-value]").forEach((el) => {
        if (el.closest(".select-kit-body, .select-kit-collection")) return;
        addTag(el.dataset.value);
      });
    }

    if (!tags.length) {
      const selectKit = stateField.querySelector("details.select-kit");
      if (selectKit) {
        const bodyId = selectKit.id + "-body";
        const body = document.getElementById(bodyId);
        const searchTarget = body || stateField;
        searchTarget.querySelectorAll(".select-kit-row[aria-checked='true']").forEach((row) => {
          addTag(row.dataset.value || row.dataset.name);
        });
      }
    }

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
    const username = currentUser && currentUser.username;

    if (username) {
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

  api.onPageChange(() => {
    cleanup();
    setTimeout(() => initMultiStep(), 300);
  });

  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest(".sign-up-button, .signup-page-cta__signup")) {
        captureStateTags();
      }
    },
    true
  );
});
