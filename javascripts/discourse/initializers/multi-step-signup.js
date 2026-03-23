import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  let initialized = false;

  function cleanup() {
    initialized = false;
    document.querySelectorAll(".multi-step-nav, .multi-step-style").forEach((el) => el.remove());
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
    const page2Groups = groups.slice(0, 10);
    const page3Groups = groups.slice(10);

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
    `;
    document.head.appendChild(styleEl);

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
