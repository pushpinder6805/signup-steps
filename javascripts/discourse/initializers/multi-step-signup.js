import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  let observer = null;
  let formObserver = null;
  let initialized = false;

  function cleanup() {
    initialized = false;
    if (observer) { observer.disconnect(); observer = null; }
    if (formObserver) { formObserver.disconnect(); formObserver = null; }
    document.querySelectorAll(".multi-step-nav, .multi-step-style").forEach((el) => el.remove());
  }

  function waitForFields(form, callback) {
    const existing = form.querySelectorAll(".user-fields .input-group");
    if (existing.length > 0) { callback(existing); return; }

    if (formObserver) formObserver.disconnect();
    formObserver = new MutationObserver(() => {
      const fields = form.querySelectorAll(".user-fields .input-group");
      if (fields.length > 0) {
        formObserver.disconnect();
        formObserver = null;
        callback(fields);
      }
    });
    formObserver.observe(form, { childList: true, subtree: true });
  }

  function initMultiStep(form) {
    if (initialized) return;
    initialized = true;

    waitForFields(form, (fieldNodeList) => {
      const groups = Array.from(fieldNodeList);
      const page1Groups = groups.slice(0, 3);
      const page2Groups = groups.slice(3, 10);
      const page3Groups = groups.slice(10);

      let currentStep = 1;
      const totalSteps = 3;

      const coreFields = Array.from(
        form.querySelectorAll(
          ".create-account-email, .create-account__username, .create-account__password"
        )
      );

      const styleEl = document.createElement("style");
      styleEl.className = "multi-step-style";
      styleEl.textContent = `
        .multi-step-dot.active { background: var(--tertiary, #0088cc) !important; }
        .multi-step-dot.done   { background: var(--success, #5cb85c) !important; }
        .multi-step-nav .btn   { display: inline-flex; align-items: center; gap: 6px; }
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
        dot.style.cssText = `
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--primary-low, #d0d0d0);
          transition: background 0.2s;
        `;
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

      const userFieldsEl = form.querySelector(".user-fields");
      if (userFieldsEl) {
        userFieldsEl.after(nav);
      }

      function findSubmitBtn() {
        return form.querySelector(".sign-up-button") ||
          form.closest(".d-modal")?.querySelector(".sign-up-button") ||
          form.closest(".modal")?.querySelector(".sign-up-button") ||
          document.querySelector(".d-modal .sign-up-button") ||
          document.querySelector(".modal .sign-up-button");
      }

      function showStep(step) {
        currentStep = step;

        coreFields.forEach((f) => { f.style.display = step === 1 ? "" : "none"; });

        groups.forEach((g) => { g.style.display = "none"; });
        if (step === 1) page1Groups.forEach((g) => { g.style.display = ""; });
        if (step === 2) page2Groups.forEach((g) => { g.style.display = ""; });
        if (step === 3) page3Groups.forEach((g) => { g.style.display = ""; });

        backBtn.style.display = step === 1 ? "none" : "";
        nextBtn.style.display = step === totalSteps ? "none" : "";

        const submitBtn = findSubmitBtn();
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

      showStep(1);
    });
  }

  function watchForModal() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(() => {
      const form = document.querySelector(".create-account");
      if (form && !form.querySelector(".multi-step-nav")) {
        initMultiStep(form);
      }
      if (!document.querySelector(".create-account")) {
        cleanup();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  api.onPageChange(() => {
    cleanup();
    watchForModal();

    const form = document.querySelector(".create-account");
    if (form) initMultiStep(form);
  });

  watchForModal();
});
