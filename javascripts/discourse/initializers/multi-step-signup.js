import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  let initialized = false;

  function cleanup() {
    initialized = false;
    document
      .querySelectorAll(".multi-step-nav, .multi-step-style, .mss-legal-block")
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

  function buildLegalBlock(title, bodyText, checkboxLabel) {
    const wrap = document.createElement("div");
    wrap.className = "mss-legal-block";
    wrap.style.cssText = "margin-bottom: 16px; display: none;";

    const heading = document.createElement("div");
    heading.className = "mss-legal-heading";
    heading.textContent = title;

    const box = document.createElement("div");
    box.className = "mss-legal-box";
    box.textContent = bodyText;

    const checkRow = document.createElement("label");
    checkRow.className = "mss-legal-check-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "mss-legal-checkbox";

    const checkLabel = document.createElement("span");
    checkLabel.className = "mss-legal-check-label";
    checkLabel.innerHTML = checkboxLabel;

    checkRow.appendChild(checkbox);
    checkRow.appendChild(checkLabel);

    wrap.appendChild(heading);
    wrap.appendChild(box);
    wrap.appendChild(checkRow);

    return { wrap, checkbox };
  }

  function initMultiStep() {
    if (initialized) return;

    const groups = Array.from(
      document.querySelectorAll(".user-fields .input-group")
    );
    if (!groups.length) return;

    initialized = true;

    const settings = api.container.lookup("service:site-settings");
    const guidelinesText =
      (settings && settings.community_guidelines_text) ||
      "Please read our community guidelines carefully before proceeding.";
    const privacyText =
      (settings && settings.privacy_policy_text) ||
      "Please read our privacy policy carefully before proceeding.";

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
      .multi-step-dot.active { background: var(--tertiary, #0088cc) !important; }
      .multi-step-dot.done   { background: var(--success, #5cb85c) !important; }
      .multi-step-nav .btn   { display: inline-flex !important; align-items: center; gap: 6px; }
      .mss-legal-block { margin-bottom: 20px; }
      .mss-legal-heading {
        font-weight: 700;
        color: var(--tertiary, #0d47a1);
        margin-bottom: 8px;
        font-size: 0.95em;
        letter-spacing: 0.01em;
      }
      .mss-legal-box {
        border: 1px solid var(--primary-low, #d0d0d0);
        border-radius: 6px;
        padding: 14px 16px;
        max-height: 180px;
        overflow-y: auto;
        font-size: 0.88em;
        line-height: 1.65;
        color: var(--primary, #222);
        background: var(--secondary, #fff);
        margin-bottom: 12px;
        white-space: pre-wrap;
      }
      .mss-legal-box::-webkit-scrollbar { width: 5px; }
      .mss-legal-box::-webkit-scrollbar-thumb { background: var(--primary-medium, #bbb); border-radius: 3px; }
      .mss-legal-check-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        cursor: pointer;
        margin-bottom: 4px;
      }
      .mss-legal-checkbox {
        margin-top: 2px;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        cursor: pointer;
        accent-color: var(--tertiary, #0d47a1);
      }
      .mss-legal-check-label {
        font-size: 0.9em;
        font-weight: 600;
        color: var(--primary, #222);
        line-height: 1.4;
      }
      .mss-legal-check-label span.required { color: var(--danger, #c00); }
    `;
    document.head.appendChild(styleEl);

    const { wrap: guidelinesBlock, checkbox: guidelinesCheckbox } =
      buildLegalBlock(
        "Community Guidelines",
        guidelinesText,
        `I agree to the Community Guidelines<span class="required">*</span>`
      );

    const { wrap: privacyBlock, checkbox: privacyCheckbox } = buildLegalBlock(
      "Privacy Policy",
      privacyText,
      `I agree to the Privacy Policy<span class="required">*</span>`
    );

    const userFieldsEl = document.querySelector(".user-fields");
    if (userFieldsEl) {
      if (page3Groups.length > 0) {
        page3Groups[0].before(guidelinesBlock);
        page3Groups[0].before(privacyBlock);
      } else {
        userFieldsEl.appendChild(guidelinesBlock);
        userFieldsEl.appendChild(privacyBlock);
      }
    }

    page3Groups.forEach((g) => {
      g.style.display = "none";
    });

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

    const progressWrap = document.createElement("div");
    progressWrap.style.cssText = `display: flex; align-items: center; gap: 6px; flex: 1;`;

    const dots = [];
    for (let i = 1; i <= totalSteps; i++) {
      const dot = document.createElement("div");
      dot.className = "multi-step-dot";
      dot.style.cssText = `width: 10px; height: 10px; border-radius: 50%; background: var(--primary-low, #d0d0d0); transition: background 0.2s;`;
      dots.push(dot);
      progressWrap.appendChild(dot);
      if (i < totalSteps) {
        const line = document.createElement("div");
        line.style.cssText = `flex: 1; height: 2px; background: var(--primary-low, #e0e0e0); border-radius: 2px;`;
        progressWrap.appendChild(line);
      }
    }

    const stepLabel = document.createElement("span");
    stepLabel.style.cssText = `font-size: 0.8em; color: var(--primary-medium, #888); white-space: nowrap;`;

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
    nav.appendChild(progressWrap);
    nav.appendChild(stepLabel);
    nav.appendChild(btnGroup);

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

      guidelinesBlock.style.display = step === 3 ? "" : "none";
      privacyBlock.style.display = step === 3 ? "" : "none";

      backBtn.style.display = step === 1 ? "none" : "inline-flex";
      nextBtn.style.display = step === totalSteps ? "none" : "inline-flex";

      const submitBtn = document.querySelector(".sign-up-button");
      if (submitBtn) {
        submitBtn.style.display = step === totalSteps ? "" : "none";
      }

      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i + 1 === step);
        dot.classList.toggle("done", i + 1 < step);
      });

      stepLabel.textContent = `Step ${step} of ${totalSteps}`;
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

    const submitBtn = document.querySelector(".sign-up-button");
    if (submitBtn) {
      submitBtn.addEventListener(
        "click",
        (e) => {
          if (!guidelinesCheckbox.checked || !privacyCheckbox.checked) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (!guidelinesCheckbox.checked) {
              guidelinesCheckbox.closest(".mss-legal-check-row").style.outline =
                "2px solid var(--danger, #c00)";
              guidelinesCheckbox.closest(".mss-legal-check-row").style.borderRadius = "3px";
            }
            if (!privacyCheckbox.checked) {
              privacyCheckbox.closest(".mss-legal-check-row").style.outline =
                "2px solid var(--danger, #c00)";
              privacyCheckbox.closest(".mss-legal-check-row").style.borderRadius = "3px";
            }
          }
        },
        true
      );

      guidelinesCheckbox.addEventListener("change", () => {
        if (guidelinesCheckbox.checked) {
          guidelinesCheckbox.closest(".mss-legal-check-row").style.outline = "";
        }
      });

      privacyCheckbox.addEventListener("change", () => {
        if (privacyCheckbox.checked) {
          privacyCheckbox.closest(".mss-legal-check-row").style.outline = "";
        }
      });
    }

    showStep(1);
  }

  api.onPageChange(() => {
    cleanup();
    setTimeout(() => initMultiStep(), 300);
  });
});
