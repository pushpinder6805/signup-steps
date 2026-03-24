import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.8", (api) => {
  let initialized = false;

  function cleanup() {
    initialized = false;
    document
      .querySelectorAll(".multi-step-nav, .multi-step-style, .mss-progress-bar-wrap, .mss-legal-text-box, .mss-hidden, .mss-required-text, .create-account__password-confirm")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(
        ".user-fields .input-group, .create-account-email, .create-account__username, .create-account__password"
      )
      .forEach((el) => {
        el.style.display = "";
      });
    document.querySelectorAll(".signup-progress-bar").forEach((el) => {
      el.style.display = "";
    });
    const submitBtn = document.querySelector(".sign-up-button");
    if (submitBtn) submitBtn.style.display = "";
    const signupCta = document.querySelector(".signup-page-cta");
    if (signupCta) signupCta.style.display = "";
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

  function getVisibleRequiredFields(step, coreFields, page2Groups, page3Groups) {
    const missing = [];

    if (step === 1) {
      coreFields.forEach((fieldWrap) => {
        const input = fieldWrap.querySelector("input");
        if (input && input.required && !input.value.trim()) {
          missing.push(input);
        }
      });
    }

    if (step === 2) {
      page2Groups.forEach((group) => {
        const input = group.querySelector("input[type=text], input[type=email], input[type=number], input[type=url], select, textarea");
        if (input && input.required && !input.value.trim()) {
          missing.push(input);
        }
      });
    }

    if (step === 3) {
      page3Groups.forEach((group) => {
        const input = group.querySelector("input[type=text], input[type=email], input[type=number], input[type=url], select, textarea");
        if (input && input.required && !input.value.trim()) {
          missing.push(input);
        }
        const checkbox = group.querySelector("input[type=checkbox]");
        if (checkbox && checkbox.required && !checkbox.checked) {
          missing.push(checkbox);
        }
      });
    }

    return missing;
  }

  function highlightMissing(inputs) {
    inputs.forEach((input) => {
      input.style.outline = "2px solid var(--danger, #c00)";
      input.style.borderRadius = "4px";
      const clearOutline = () => {
        input.style.outline = "";
        input.removeEventListener("input", clearOutline);
        input.removeEventListener("change", clearOutline);
      };
      input.addEventListener("input", clearOutline);
      input.addEventListener("change", clearOutline);
    });
    if (inputs.length) inputs[0].focus();
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

      inputWrapper.appendChild(input);
      inputWrapper.appendChild(toggleBtn);
      passwordConfirmField.appendChild(label);
      passwordConfirmField.appendChild(inputWrapper);

      passwordField.after(passwordConfirmField);
      coreFields.push(passwordConfirmField);
    }

    const styleEl = document.createElement("style");
    styleEl.className = "multi-step-style";
    styleEl.textContent = `
      .mss-progress-bar-wrap {
        margin-bottom: 24px;
        display: flex;
        justify-content: center;
      }
      .signup-progress-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
      }
      .signup-progress-bar__segment {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .signup-progress-bar__step {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .signup-progress-bar__circle {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--primary-low, #d0d0d0);
        border: 1px solid var(--primary-low, #d0d0d0);
        transition: background 0.3s, border-color 0.3s;
      }
      .signup-progress-bar__segment.--active .signup-progress-bar__circle {
        background: var(--tertiary, #5fa1c7);
        border-color: var(--tertiary, #5fa1c7);
      }
      .signup-progress-bar__segment.--complete .signup-progress-bar__circle {
        background: var(--tertiary, #5fa1c7);
        border-color: var(--tertiary, #5fa1c7);
      }
      .signup-progress-bar__segment.--incomplete .signup-progress-bar__circle {
        background: transparent;
        border-color: var(--primary-low, #d0d0d0);
      }

      #create-account-title {
        text-align: center;
        color: var(--primary, #222);
        font-size: 1.85em;
        font-weight: 600;
        margin-bottom: 24px;
      }

      .mss-required-text {
        text-align: center;
        color: var(--primary-medium, #666);
        font-size: 0.95em;
        margin-bottom: 28px;
      }

      .create-account-email label,
      .create-account__username label,
      .create-account__password label {
        color: var(--primary, #222);
        font-weight: 600;
        font-size: 0.95em;
        margin-bottom: 8px;
        display: block;
      }

      .create-account-email input,
      .create-account__username input,
      .create-account__password input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid var(--primary-low, #d0d0d0);
        border-radius: 24px;
        font-size: 1em;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }

      .create-account-email input:focus,
      .create-account__username input:focus,
      .create-account__password input:focus {
        outline: none;
        border-color: var(--tertiary, #0088cc);
      }

      .create-account-email,
      .create-account__username {
        margin-bottom: 20px;
      }

      .create-account__password {
        margin-bottom: 20px;
      }

      .multi-step-nav {
        display: flex;
        justify-content: center;
        margin-top: 24px;
        padding-top: 0;
        border-top: none;
      }

      .multi-step-nav .btn-primary {
        background: var(--primary-low-mid, #c8c8c8);
        color: var(--primary, #222);
        border: none;
        padding: 14px 0;
        border-radius: 24px;
        font-size: 1em;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
        width: 100%;
        max-width: 600px;
      }

      .multi-step-nav .btn-primary:hover {
        background: var(--primary-low, #d8d8d8);
      }

      .multi-step-nav .btn {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .signup-page-cta {
        display: none !important;
      }

      .login-welcome-header .tip,
      .login-welcome-header + .tip {
        display: none !important;
      }

      .mss-legal-text-box {
        border: 1px solid var(--primary-low, #d0d0d0);
        border-radius: 6px;
        padding: 14px 16px;
        max-height: 180px;
        overflow-y: auto;
        font-size: 0.88em;
        line-height: 1.65;
        color: var(--primary, #222);
        background: var(--secondary, #fff);
        margin-bottom: 8px;
        white-space: pre-wrap;
      }
      .mss-legal-text-box.mss-hidden {
        display: none;
      }
      .mss-legal-text-box::-webkit-scrollbar { width: 5px; }
      .mss-legal-text-box::-webkit-scrollbar-thumb { background: var(--primary-medium, #bbb); border-radius: 3px; }
    `;
    document.head.appendChild(styleEl);

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

    page3Groups.forEach((g) => {
      g.style.display = "none";
    });

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

    nav.appendChild(backBtn);
    nav.appendChild(nextBtn);

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

    function showStep(step) {
      currentStep = step;

      coreFields.forEach((f) => {
        f.style.display = step === 1 ? "" : "none";
      });

      groups.forEach((g) => {
        g.style.display = "none";
      });
      if (step === 2) {
        page2Groups.forEach((g) => {
          g.style.display = "";
        });
      }
      if (step === 3) {
        page3Groups.forEach((g) => {
          g.style.display = "";
        });
        guidelinesTextBox.textContent = getGuidelinesText();
        privacyTextBox.textContent = getPrivacyText();
        guidelinesTextBox.classList.remove("mss-hidden");
        privacyTextBox.classList.remove("mss-hidden");
      } else {
        guidelinesTextBox.classList.add("mss-hidden");
        privacyTextBox.classList.add("mss-hidden");
      }

      backBtn.style.display = step === 1 ? "none" : "inline-flex";
      nextBtn.style.display = step === totalSteps ? "none" : "inline-flex";

      const submitBtn = document.querySelector(".sign-up-button");
      if (submitBtn) {
        submitBtn.style.display = step === totalSteps ? "" : "none";
      }

      updateProgressBar(segments, step);
    }

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const missing = getVisibleRequiredFields(
        currentStep,
        coreFields,
        page2Groups,
        page3Groups
      );

      if (missing.length) {
        highlightMissing(missing);
        return;
      }

      if (currentStep === 1 && passwordConfirmField) {
        const passwordInput = passwordField.querySelector("input");
        const confirmInput = passwordConfirmField.querySelector("input");
        if (passwordInput && confirmInput && passwordInput.value !== confirmInput.value) {
          confirmInput.style.outline = "2px solid var(--danger, #c00)";
          confirmInput.style.borderRadius = "4px";
          confirmInput.focus();
          const clearOutline = () => {
            confirmInput.style.outline = "";
            confirmInput.removeEventListener("input", clearOutline);
          };
          confirmInput.addEventListener("input", clearOutline);
          return;
        }
      }

      if (currentStep < totalSteps) showStep(currentStep + 1);
    });

    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentStep > 1) showStep(currentStep - 1);
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
