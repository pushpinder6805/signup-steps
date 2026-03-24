import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  let initialized = false;

  function safeHide(el) {
    if (!el) return;
    el.style.visibility = "hidden";
    el.style.position = "absolute";
    el.style.pointerEvents = "none";
  }

  function safeShow(el) {
    if (!el) return;
    el.style.visibility = "";
    el.style.position = "";
    el.style.pointerEvents = "";
  }

  function cleanup() {
    initialized = false;

    document
      .querySelectorAll(".multi-step-nav, .mss-progress-bar-wrap")
      .forEach((el) => el.remove());

    document
      .querySelectorAll(
        ".user-fields .input-group, .create-account-email, .create-account__username, .create-account__password"
      )
      .forEach((el) => safeShow(el));

    const submitBtn = document.querySelector(".sign-up-button");
    if (submitBtn) submitBtn.style.display = "";
  }

  function getRequiredInputs(containers) {
    const missing = [];

    containers.forEach((wrap) => {
      const input = wrap.querySelector(
        "input, select, textarea"
      );

      if (!input) return;

      if (input.required) {
        if (input.type === "checkbox") {
          if (!input.checked) missing.push(input);
        } else if (!input.value.trim()) {
          missing.push(input);
        }
      }
    });

    return missing;
  }

  function highlightMissing(inputs) {
    inputs.forEach((input) => {
      input.style.outline = "2px solid red";

      const clear = () => {
        input.style.outline = "";
        input.removeEventListener("input", clear);
      };

      input.addEventListener("input", clear);
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

    const coreFields = Array.from(
      document.querySelectorAll(
        ".create-account-email, .create-account__username, .create-account__password"
      )
    );

    const step2 = groups.slice(0, Math.ceil(groups.length / 2));
    const step3 = groups.slice(Math.ceil(groups.length / 2));

    let currentStep = 1;
    const totalSteps = 3;

    const nav = document.createElement("div");
    nav.className = "multi-step-nav";

    const backBtn = document.createElement("button");
    backBtn.className = "btn";
    backBtn.innerText = "Back";

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.innerText = "Continue";

    nav.appendChild(backBtn);
    nav.appendChild(nextBtn);

    const container = document.querySelector(".user-fields");
    if (container) container.after(nav);

    function showStep(step) {
      currentStep = step;

      // Step 1
      coreFields.forEach((el) =>
        step === 1 ? safeShow(el) : safeHide(el)
      );

      // Step 2
      step2.forEach((el) =>
        step === 2 ? safeShow(el) : safeHide(el)
      );

      // Step 3
      step3.forEach((el) =>
        step === 3 ? safeShow(el) : safeHide(el)
      );

      const submitBtn = document.querySelector(".sign-up-button");

      if (submitBtn) {
        submitBtn.style.display = step === totalSteps ? "" : "none";
        submitBtn.disabled = false; // safety
      }

      backBtn.style.display = step === 1 ? "none" : "inline-flex";
      nextBtn.style.display = step === totalSteps ? "none" : "inline-flex";
    }

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();

      let missing = [];

      if (currentStep === 1) {
        missing = getRequiredInputs(coreFields);
      }

      if (currentStep === 2) {
        missing = getRequiredInputs(step2);
      }

      if (currentStep === 3) {
        missing = getRequiredInputs(step3);
      }

      if (missing.length) {
        highlightMissing(missing);
        return;
      }

      if (currentStep < totalSteps) {
        showStep(currentStep + 1);
      }
    });

    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentStep > 1) {
        showStep(currentStep - 1);
      }
    });

    showStep(1);
  }

  api.onPageChange(() => {
    cleanup();
    setTimeout(initMultiStep, 300);
  });
});