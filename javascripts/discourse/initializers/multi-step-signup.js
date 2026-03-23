import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  let initialized = false;

  function cleanup() {
    initialized = false;
    document
      .querySelectorAll(".multi-step-nav, .multi-step-style, .mss-progress-bar-wrap, .mss-legal-text-box, .mss-hidden")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(
        ".user-fields .input-group, .create-account-email, .create-account__username, .create-account__password"
      )
      .forEach((el) => {
        el.style.display = "";
      });
    const submitBtn = document.querySelector(".sign-up-button");
    if (submitBtn) submitBtn.style.display = "";
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

    const siteSettings = api.container.lookup("service:site-settings");

    function resolveSettingText(value, fallback) {
      if (value === null || value === undefined) return fallback;
      const str = Array.isArray(value) ? value.join("\n") : String(value);
      return str.trim() || fallback;
    }

    function getGuidelinesText() {
      return resolveSettingText(
        siteSettings && siteSettings.community_guidelines_text,
        "Please read our community guidelines carefully before proceeding."
      );
    }

    function getPrivacyText() {
      return resolveSettingText(
        siteSettings && siteSettings.privacy_policy_text,
        "Please read our privacy policy carefully before proceeding."
      );
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

    const styleEl = document.createElement("style");
    styleEl.className = "multi-step-style";
    styleEl.textContent = `
      .mss-progress-bar-wrap {
        margin-bottom: 20px;
      }
      .signup-progress-bar {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 0;
      }
      .signup-progress-bar__segment {
        display: flex;
        align-items: center;
        flex: 1;
        position: relative;
      }
      .signup-progress-bar__segment::after {
        content: '';
        flex: 1;
        height: 2px;
        background: var(--primary-low, #d0d0d0);
        transition: background 0.3s;
      }
      .signup-progress-bar__segment:last-child::after {
        display: none;
      }
      .signup-progress-bar__segment.--complete::after {
        background: var(--tertiary, #0088cc);
      }
      .signup-progress-bar__step {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .signup-progress-bar__circle {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--primary-low, #d0d0d0);
        border: 2px solid var(--primary-low, #d0d0d0);
        transition: background 0.3s, border-color 0.3s, transform 0.2s;
      }
      .signup-progress-bar__segment.--active .signup-progress-bar__circle {
        background: var(--tertiary, #0088cc);
        border-color: var(--tertiary, #0088cc);
        transform: scale(1.25);
      }
      .signup-progress-bar__segment.--complete .signup-progress-bar__circle {
        background: var(--tertiary, #0088cc);
        border-color: var(--tertiary, #0088cc);
      }
      .signup-progress-bar__segment.--incomplete .signup-progress-bar__circle {
        background: var(--primary-low, #d0d0d0);
        border-color: var(--primary-low, #d0d0d0);
      }
      .multi-step-nav .btn { display: inline-flex !important; align-items: center; gap: 6px; }
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
    } else if (guidelinesTextBox.parentNode) {
      guidelinesTextBox.parentNode.insertBefore(privacyTextBox, guidelinesTextBox.nextSibling);
    } else if (userFieldsContainer) {
      userFieldsContainer.appendChild(privacyTextBox);
    }

    page3Groups.forEach((g) => {
      g.style.display = "none";
    });

    const { barWrap, segments } = buildProgressBar(totalSteps);

    const nav = document.createElement("div");
    nav.className = "multi-step-nav";
    nav.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--primary-low, #e8e8e8);
      gap: 12px;
    `;

    const btnGroup = document.createElement("div");
    btnGroup.style.cssText = `display: flex; gap: 8px;`;

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn";
    backBtn.innerHTML = `&#8592; Back`;

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn btn-primary";
    nextBtn.innerHTML = `Continue &#8594;`;

    btnGroup.appendChild(backBtn);
    btnGroup.appendChild(nextBtn);
    nav.appendChild(btnGroup);

    const userFieldsEl = document.querySelector(".user-fields");
    const formEl = document.querySelector(".create-account");

    if (formEl) {
      formEl.prepend(barWrap);
    } else if (userFieldsEl) {
      userFieldsEl.before(barWrap);
    }

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

      if (currentStep < totalSteps) showStep(currentStep + 1);
    });

    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentStep > 1) showStep(currentStep - 1);
    });

    showStep(1);
  }

  api.onPageChange(() => {
    cleanup();
    setTimeout(() => initMultiStep(), 300);
  });
});
