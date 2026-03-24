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
    if (submitBtn) {
      submitBtn.style.display = "";
      submitBtn.style.position = "";
      submitBtn.style.left = "";
      submitBtn.style.opacity = "";
      submitBtn.style.pointerEvents = "";
    }
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

  function hasSelectKitValue(group) {
    const selectKit = group.querySelector(".select-kit");
    if (!selectKit) return true;

    const label = group.querySelector("label");
    const fieldName = label ? label.textContent.trim() : "unknown";

    const hiddenSelect = group.querySelector("select");
    if (hiddenSelect && hiddenSelect.value && hiddenSelect.value !== "") {
      console.log(`[Multi-Step] ${fieldName}: Found value in hidden select: "${hiddenSelect.value}"`);
      return true;
    }

    const hasChoice = group.querySelector(".select-kit-header .choice, .formatted-selection .choice");
    if (hasChoice) {
      console.log(`[Multi-Step] ${fieldName}: Found choice element`);
      return true;
    }

    const selectKitDetails = group.querySelector("details.select-kit");
    if (selectKitDetails) {
      const dataValue = selectKitDetails.dataset.value;
      if (dataValue) {
        console.log(`[Multi-Step] ${fieldName}: Found data-value: "${dataValue}"`);
        return true;
      }

      const bodyId = selectKitDetails.id + "-body";
      const body = document.getElementById(bodyId);
      if (body) {
        const checked = body.querySelector(".select-kit-row[aria-checked='true']");
        if (checked) {
          console.log(`[Multi-Step] ${fieldName}: Found checked row in body`);
          return true;
        }
      }
    }

    const headerText = selectKit.querySelector(".select-kit-header .selected-name, .select-kit-header-wrapper .selected-name");
    if (headerText && headerText.textContent.trim() && headerText.textContent.trim() !== "Select...") {
      console.log(`[Multi-Step] ${fieldName}: Has selected text: "${headerText.textContent.trim()}"`);
      return true;
    }

    const summary = selectKit.querySelector("summary");
    if (summary) {
      const summaryText = summary.textContent.trim();
      if (summaryText && summaryText !== "Select..." && summaryText !== "") {
        console.log(`[Multi-Step] ${fieldName}: Summary has text: "${summaryText}"`);
        return true;
      }
    }

    console.log(`[Multi-Step] ${fieldName}: No value detected`);
    console.log(`[Multi-Step] ${fieldName}: HTML:`, selectKit.outerHTML.substring(0, 300));
    return false;
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
        if (group.style.display === "none") return;

        const label = group.querySelector("label");
        const isRequired = label && label.textContent.includes("*");
        const fieldName = label ? label.textContent.trim() : "unknown";

        if (!isRequired) return;

        const input = group.querySelector("input[type=text], input[type=email], input[type=number], input[type=url], textarea");
        const select = group.querySelector("select");
        const selectKit = group.querySelector(".select-kit");

        console.log(`[Multi-Step] Checking ${fieldName}:`, {
          hasInput: !!input,
          hasSelect: !!select,
          hasSelectKit: !!selectKit
        });

        if (input && !input.value.trim()) {
          console.log(`[Multi-Step] ${fieldName}: Input is empty`);
          missing.push(input);
        } else if (select && (!select.value || select.value === "")) {
          console.log(`[Multi-Step] ${fieldName}: Select is empty`);
          missing.push(select);
        } else if (selectKit && !hasSelectKitValue(group)) {
          console.log(`[Multi-Step] ${fieldName}: SelectKit is empty`);
          missing.push(selectKit);
        }
      });
      console.log(`[Multi-Step] Step 2 missing fields:`, missing.length);
    }

    if (step === 3) {
      page3Groups.forEach((group) => {
        if (group.style.display === "none") return;

        const label = group.querySelector("label");
        const isRequired = label && label.textContent.includes("*");

        if (!isRequired) return;

        const input = group.querySelector("input[type=text], input[type=email], input[type=number], input[type=url], textarea");
        const select = group.querySelector("select");
        const selectKit = group.querySelector(".select-kit");
        const checkbox = group.querySelector("input[type=checkbox]");

        if (input && !input.value.trim()) {
          missing.push(input);
        } else if (select && (!select.value || select.value === "")) {
          missing.push(select);
        } else if (selectKit && !hasSelectKitValue(group)) {
          missing.push(selectKit);
        } else if (checkbox && !checkbox.checked) {
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

      #create-account-title::after {
        display: none !important;
        content: none !important;
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
        background: var(--tertiary, #0088cc);
        color: #fff;
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
        background: var(--tertiary-hover, #006ba8);
      }

      .multi-step-nav .btn {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .multi-step-nav .btn[style*="display: none"],
      .multi-step-nav .btn[style*="display:none"] {
        display: none !important;
      }

      .mss-complete-btn {
        background: var(--success, #1ca551) !important;
      }

      .mss-complete-btn:hover {
        background: var(--success-hover, #178f45) !important;
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

    function checkStep1Validation() {
      const missing = getVisibleRequiredFields(1, coreFields, page2Groups, page3Groups);
      const matchNotice = passwordConfirmField ? passwordConfirmField.querySelector(".mss-password-match-notice") : null;

      if (currentStep === 1 && passwordConfirmField) {
        const passwordInput = passwordField.querySelector("input");
        const confirmInput = passwordConfirmField.querySelector("input");

        if (passwordInput && confirmInput && matchNotice) {
          if (confirmInput.value === "") {
            matchNotice.style.display = "none";
          } else if (passwordInput.value !== confirmInput.value) {
            matchNotice.style.display = "block";
            matchNotice.style.color = "#c00";
            matchNotice.textContent = "Passwords do not match";
            nextBtn.disabled = true;
            nextBtn.style.background = "#ccc";
            nextBtn.style.cursor = "not-allowed";
            return;
          } else {
            matchNotice.style.display = "block";
            matchNotice.style.color = "#28a745";
            matchNotice.textContent = "Passwords match";
          }
        }

        if (passwordInput && confirmInput) {
          if (!passwordInput.value || !confirmInput.value || passwordInput.value !== confirmInput.value) {
            nextBtn.disabled = true;
            nextBtn.style.background = "#ccc";
            nextBtn.style.cursor = "not-allowed";
            return;
          }
        }
      }

      if (missing.length === 0) {
        nextBtn.disabled = false;
        nextBtn.style.background = "#28a745";
        nextBtn.style.cursor = "pointer";
      } else {
        nextBtn.disabled = true;
        nextBtn.style.background = "#ccc";
        nextBtn.style.cursor = "not-allowed";
      }
    }

    function checkStep2Validation() {
      const missing = getVisibleRequiredFields(2, coreFields, page2Groups, page3Groups);

      if (missing.length === 0) {
        nextBtn.disabled = false;
        nextBtn.style.background = "#28a745";
        nextBtn.style.cursor = "pointer";
      } else {
        nextBtn.disabled = true;
        nextBtn.style.background = "#ccc";
        nextBtn.style.cursor = "not-allowed";
      }
    }

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

      backBtn.style.display = "none";
      nextBtn.style.display = step === totalSteps ? "none" : "inline-flex";
      completeBtn.style.display = step === totalSteps ? "inline-flex" : "none";

      const submitBtn = document.querySelector(".sign-up-button");
      if (submitBtn) {
        submitBtn.style.position = "absolute";
        submitBtn.style.left = "-9999px";
        submitBtn.style.opacity = "0";
        submitBtn.style.pointerEvents = "none";
      }

      updateProgressBar(segments, step);

      if (step === 1) {
        checkStep1Validation();
      } else if (step === 2) {
        checkStep2Validation();
      } else if (step === 3) {
        checkStep3Validation();
      }
    }

    coreFields.forEach((fieldWrap) => {
      const input = fieldWrap.querySelector("input");
      if (input) {
        input.addEventListener("input", () => {
          if (currentStep === 1) {
            checkStep1Validation();
          }
        });
      }
    });

    page2Groups.forEach((group) => {
      const input = group.querySelector("input, select, textarea");
      if (input) {
        input.addEventListener("input", () => {
          if (currentStep === 2) {
            checkStep2Validation();
          }
        });
        input.addEventListener("change", () => {
          if (currentStep === 2) {
            checkStep2Validation();
          }
        });
      }

      const selectKit = group.querySelector(".select-kit");
      if (selectKit) {
        const observer = new MutationObserver(() => {
          if (currentStep === 2) {
            checkStep2Validation();
          }
        });
        observer.observe(selectKit, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["aria-checked"],
        });
      }
    });

    function checkStep3Validation() {
      const missing = getVisibleRequiredFields(3, coreFields, page2Groups, page3Groups);
      completeBtn.disabled = missing.length > 0;
    }

    page3Groups.forEach((group) => {
      const input = group.querySelector("input, select, textarea");
      if (input) {
        input.addEventListener("input", () => {
          if (currentStep === 3) {
            checkStep3Validation();
          }
        });
        input.addEventListener("change", () => {
          if (currentStep === 3) {
            checkStep3Validation();
          }
        });
      }

      const selectKit = group.querySelector(".select-kit");
      if (selectKit) {
        const observer = new MutationObserver(() => {
          if (currentStep === 3) {
            checkStep3Validation();
          }
        });
        observer.observe(selectKit, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["aria-checked"],
        });
      }
    });

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (nextBtn.disabled) {
        return;
      }

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

    completeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("[Multi-Step] Complete button clicked");

      function showNotice(message) {
        let noticeEl = document.querySelector(".mss-validation-notice");
        if (noticeEl) {
          noticeEl.remove();
        }

        noticeEl = document.createElement("div");
        noticeEl.className = "mss-validation-notice";
        noticeEl.textContent = message;
        noticeEl.style.cssText = `
          background: var(--danger-low, #ffe8e8);
          color: var(--danger, #c00);
          border: 1px solid var(--danger, #c00);
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-size: 0.95em;
          text-align: center;
        `;
        nav.before(noticeEl);

        setTimeout(() => {
          if (noticeEl && noticeEl.parentNode) {
            noticeEl.style.transition = "opacity 0.3s";
            noticeEl.style.opacity = "0";
            setTimeout(() => noticeEl.remove(), 300);
          }
        }, 5000);
      }

      const missingPage3 = getVisibleRequiredFields(3, coreFields, page2Groups, page3Groups);
      console.log("[Multi-Step] Missing page 3 fields:", missingPage3.length);

      if (missingPage3.length) {
        console.log("[Multi-Step] Validation failed on page 3");
        highlightMissing(missingPage3);
        showNotice("Please fill in all required fields before completing signup.");
        return false;
      }

      const missingCore = getVisibleRequiredFields(1, coreFields, page2Groups, page3Groups);
      const missingPage2 = getVisibleRequiredFields(2, coreFields, page2Groups, page3Groups);
      console.log("[Multi-Step] Missing core fields:", missingCore.length, "Missing page 2:", missingPage2.length);

      if (missingCore.length || missingPage2.length) {
        console.log("[Multi-Step] Validation failed on previous pages");
        showNotice("Please complete all previous pages. Some required fields are missing.");
        return false;
      }

      const passwordInput = passwordField ? passwordField.querySelector("input") : null;
      const confirmInput = passwordConfirmField ? passwordConfirmField.querySelector("input") : null;

      if (passwordInput && confirmInput && passwordInput.value !== confirmInput.value) {
        console.log("[Multi-Step] Password mismatch");
        confirmInput.style.outline = "2px solid var(--danger, #c00)";
        confirmInput.style.borderRadius = "4px";
        showNotice("Passwords do not match.");
        return false;
      }

      console.log("[Multi-Step] All validations passed, capturing state tags");
      captureStateTags();

      const actualSubmitBtn = document.querySelector(".sign-up-button") ||
                             document.querySelector('button[type="submit"]') ||
                             document.querySelector('.create-account button.btn-primary');
      console.log("[Multi-Step] Submit button found:", !!actualSubmitBtn);

      if (actualSubmitBtn) {
        console.log("[Multi-Step] Clicking submit button");
        actualSubmitBtn.click();
        return;
      }

      const form = document.querySelector(".create-account") ||
                   document.querySelector("form");
      console.log("[Multi-Step] Form found:", !!form);

      if (form) {
        console.log("[Multi-Step] Attempting form submission");

        try {
          if (form.requestSubmit) {
            form.requestSubmit();
          } else {
            form.submit();
          }
        } catch (error) {
          console.error("[Multi-Step] Form submission error:", error);

          const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      } else {
        console.error("[Multi-Step] No submit button or form found!");
        showNotice("Unable to submit form. Please refresh and try again.");
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
