import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  let observer = null;
  let initialized = false;

  function tryInit() {
    const form = document.querySelector(".create-account");
    if (!form) return false;

    const userFields = form.querySelectorAll(".user-fields .input-group");
    if (!userFields.length) return false;

    if (initialized) return true;
    initialized = true;

    const groups = Array.from(userFields);

    const page1Groups = groups.slice(0, 3);
    const page2Groups = groups.slice(3, 10);
    const page3Groups = groups.slice(10);

    let currentStep = 1;
    const totalSteps = 3;

    const coreSection = form.querySelector("#login-form") || form;
    const coreFields = Array.from(
      form.querySelectorAll(
        ".create-account-email, .create-account__username, .create-account__password"
      )
    );

    function showStep(step) {
      currentStep = step;

      coreFields.forEach((f) => {
        f.style.display = step === 1 ? "" : "none";
      });

      groups.forEach((g) => (g.style.display = "none"));

      if (step === 1) page1Groups.forEach((g) => (g.style.display = ""));
      if (step === 2) page2Groups.forEach((g) => (g.style.display = ""));
      if (step === 3) page3Groups.forEach((g) => (g.style.display = ""));

      backBtn.style.display = step === 1 ? "none" : "inline-flex";
      nextBtn.style.display = step === totalSteps ? "none" : "inline-flex";
      submitArea.style.display = step === totalSteps ? "" : "none";

      progressDots.forEach((dot, i) => {
        dot.classList.toggle("active", i + 1 === step);
        dot.classList.toggle("done", i + 1 < step);
      });

      stepLabel.textContent = `Step ${step} of ${totalSteps}`;

      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const existingSubmit = form.querySelector(".sign-up-button, [type='submit'], .btn-primary:not(.multi-step-next)");
    const submitArea = existingSubmit ? existingSubmit.closest(".d-modal__footer, .modal-footer, .login-buttons") : null;

    const nav = document.createElement("div");
    nav.className = "multi-step-nav";
    nav.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--primary-low, #e8e8e8);
      gap: 12px;
    `;

    const progressWrap = document.createElement("div");
    progressWrap.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    `;

    const progressDots = [];
    for (let i = 1; i <= totalSteps; i++) {
      const dot = document.createElement("div");
      dot.style.cssText = `
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-low, #d0d0d0);
        transition: background 0.2s ease;
      `;
      dot.dataset.step = i;
      progressDots.push(dot);
      progressWrap.appendChild(dot);

      if (i < totalSteps) {
        const line = document.createElement("div");
        line.style.cssText = `flex: 1; height: 2px; background: var(--primary-low, #e0e0e0); border-radius: 2px;`;
        progressWrap.appendChild(line);
      }
    }

    const styleEl = document.createElement("style");
    styleEl.textContent = `
      .multi-step-nav .active { background: var(--tertiary, #0088cc) !important; }
      .multi-step-nav .done { background: var(--success, #5cb85c) !important; }
      .multi-step-nav .btn { display: inline-flex; align-items: center; gap: 6px; }
    `;
    document.head.appendChild(styleEl);

    const stepLabel = document.createElement("span");
    stepLabel.style.cssText = `
      font-size: 0.8em;
      color: var(--primary-medium, #888);
      white-space: nowrap;
    `;

    const btnGroup = document.createElement("div");
    btnGroup.style.cssText = `display: flex; gap: 8px;`;

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn multi-step-back";
    backBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg> Back`;

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn btn-primary multi-step-next";
    nextBtn.innerHTML = `Continue <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>`;

    btnGroup.appendChild(backBtn);
    btnGroup.appendChild(nextBtn);

    nav.appendChild(progressWrap);
    nav.appendChild(stepLabel);
    nav.appendChild(btnGroup);

    const userFieldsContainer = form.querySelector(".user-fields");
    if (userFieldsContainer) {
      userFieldsContainer.after(nav);
    } else {
      form.appendChild(nav);
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
    return true;
  }

  api.onPageChange(() => {
    initialized = false;

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    const existing = document.querySelector(".multi-step-nav");
    if (existing) existing.remove();
    const existingStyle = document.querySelector("style[data-multi-step]");
    if (existingStyle) existingStyle.remove();

    if (tryInit()) return;

    observer = new MutationObserver(() => {
      if (tryInit()) {
        observer.disconnect();
        observer = null;
      }
    });

    const target = document.querySelector(".d-modal__body, .modal-body, #main-outlet, body");
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }
  });
});
