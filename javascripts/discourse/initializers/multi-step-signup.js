import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  let initialized = false;

  function cleanup() {
    initialized = false;
    document.querySelectorAll(".multi-step-nav, .multi-step-style, .privacy-policy-wrapper").forEach((el) => el.remove());
    document.querySelectorAll(".user-fields .input-group, .create-account-email, .create-account__username, .create-account__password").forEach((el) => {
      el.style.display = "";
    });
    const submitBtn = document.querySelector(".sign-up-button");
    if (submitBtn) submitBtn.style.display = "";
  }

  function initMultiStep() {
    if (initialized) return;

    const groups = Array.from(document.querySelectorAll(".user-fields .input-group"));
    if (!groups.length) return;

    initialized = true;

    const page1Groups = [];
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
      .privacy-policy-box {
        border: 1px solid var(--primary-low, #d0d0d0);
        border-radius: 6px;
        padding: 16px;
        max-height: 220px;
        overflow-y: auto;
        font-size: 0.9em;
        line-height: 1.6;
        color: var(--primary, #222);
        background: var(--secondary, #fff);
        margin-bottom: 16px;
      }
      .privacy-policy-box::-webkit-scrollbar { width: 6px; }
      .privacy-policy-box::-webkit-scrollbar-thumb { background: var(--primary-medium, #aaa); border-radius: 3px; }
      .privacy-policy-label {
        font-weight: bold;
        color: var(--tertiary, #0088cc);
        margin-bottom: 8px;
        font-size: 1em;
      }
    `;
    document.head.appendChild(styleEl);

    const privacyWrapper = document.createElement("div");
    privacyWrapper.className = "privacy-policy-wrapper";
    privacyWrapper.style.display = "none";

    const privacyLabel = document.createElement("div");
    privacyLabel.className = "privacy-policy-label";
    privacyLabel.textContent = "Privacy Policy";

    const privacyBox = document.createElement("div");
    privacyBox.className = "privacy-policy-box";
    privacyBox.innerHTML = `
      <p>By creating an account and using our platform, you agree to the collection and use of your information in accordance with this Privacy Policy.</p>
      <p>We collect information you provide directly to us, such as your name, email address, organization details, and any other information you choose to provide during registration. This information is used to create and manage your account, communicate with you about the platform, and improve our services.</p>
      <p>We may also collect information about how you use the platform, including log data, device information, and usage patterns. This helps us understand how our services are used and enables us to make improvements.</p>
      <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your consent, except as required by law or to trusted third parties who assist us in operating the platform, conducting our business, or serving you, so long as those parties agree to keep this information confidential.</p>
      <p>We implement a variety of security measures to maintain the safety of your personal information. Your personal information is stored in secure networks and is only accessible by a limited number of persons who have special access rights and are required to keep the information confidential.</p>
      <p>You have the right to access, correct, or delete your personal data at any time. If you wish to exercise these rights, please contact us through the platform's support channels.</p>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
      <p>By continuing to use the platform after changes become effective, you agree to be bound by the revised Privacy Policy. If you do not agree to the new terms, please stop using the platform.</p>
    `;

    privacyWrapper.appendChild(privacyLabel);
    privacyWrapper.appendChild(privacyBox);

    if (page3Groups.length > 0) {
      page3Groups[0].before(privacyWrapper);
    } else {
      const userFieldsEl2 = document.querySelector(".user-fields");
      if (userFieldsEl2) userFieldsEl2.appendChild(privacyWrapper);
    }

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

    const userFieldsEl = document.querySelector(".user-fields");
    if (userFieldsEl) {
      userFieldsEl.after(nav);
    }

    function showStep(step) {
      currentStep = step;

      coreFields.forEach((f) => { f.style.display = step === 1 ? "" : "none"; });

      groups.forEach((g) => { g.style.display = "none"; });
      if (step === 2) page2Groups.forEach((g) => { g.style.display = ""; });
      if (step === 3) page3Groups.forEach((g) => { g.style.display = ""; });

      privacyWrapper.style.display = step === 3 ? "" : "none";

      backBtn.style.display = step === 1 ? "none" : "inline-flex";
      nextBtn.style.display = step === totalSteps ? "none" : "inline-flex";

      const submitBtn = document.querySelector(".sign-up-button");
      if (submitBtn) submitBtn.style.display = step === totalSteps ? "" : "none";

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

    showStep(1);
  }

  api.onPageChange(() => {
    cleanup();
    setTimeout(() => initMultiStep(), 300);
  });
});
