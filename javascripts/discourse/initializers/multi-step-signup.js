import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  let initialized = false;
  let observer = null;
  let currentStep = 1;

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

  function setHeading(text) {
    const heading = document.querySelector("#create-account-title");
    if (heading) heading.innerText = text;
  }

  function hideButtons() {
    const cta = document.querySelector(".signup-page-cta");
    if (cta) cta.style.display = "none";
  }

  function showButtons() {
    const cta = document.querySelector(".signup-page-cta");
    if (cta) cta.style.display = "";
  }

  function cleanup() {
    initialized = false;

    document.querySelectorAll(".multi-step-nav").forEach((el) => el.remove());

    document
      .querySelectorAll(".user-fields .input-group, .create-account-email, .create-account__username, .create-account__password")
      .forEach((el) => safeShow(el));

    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // -------- VALIDATION --------
  function getStepMissingFields(stepContainers) {
    const missing = [];

    stepContainers.forEach((wrap) => {
      if (!wrap || wrap.style.visibility === "hidden") return;

      const label = wrap.querySelector("label");
      const isRequired = label && label.innerText.includes("*");
      if (!isRequired) return;

      let hasValue = false;

      const inputs = wrap.querySelectorAll("input, textarea");

      inputs.forEach((input) => {
        if (input.type === "checkbox") {
          if (input.checked) hasValue = true;
        } else if (input.value && input.value.trim()) {
          hasValue = true;
        }
      });

      const selectKit = wrap.querySelector(".select-kit");

      if (selectKit) {
        const selected =
          selectKit.querySelector(".selected-name") ||
          selectKit.querySelector(".selected-choice");

        if (selected) hasValue = true;
      }

      if (!hasValue) missing.push(wrap);
    });

    return missing;
  }

  function highlightMissing(wrappers) {
    wrappers.forEach((wrap) => {
      wrap.style.border = "1px solid red";

      const input = wrap.querySelector("input, textarea");

      const clear = () => {
        wrap.style.border = "";
        input && input.removeEventListener("input", clear);
        input && input.removeEventListener("change", clear);
      };

      if (input) {
        input.addEventListener("input", clear);
        input.addEventListener("change", clear);
      }
    });

    if (wrappers.length) {
      wrappers[0].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  function initMultiStep() {
    if (initialized) return;

    const groups = Array.from(
      document.querySelectorAll(".user-fields .input-group")
    );
    if (!groups.length) return;

    initialized = true;

    // -------- CORE --------
    const emailField = document.querySelector(".create-account-email");
    const usernameField = document.querySelector(".create-account__username");
    const passwordField = document.querySelector(".create-account__password");

    let confirmField = document.querySelector(".mss-password-confirm");

    if (!confirmField && passwordField) {
      confirmField = document.createElement("div");
      confirmField.className =
        "create-account__password mss-password-confirm";

      confirmField.innerHTML =
        "<label>Re-enter Password*</label>" +
        "<input type='password' required />";

      passwordField.after(confirmField);
    }

    const coreFields = [
      emailField,
      usernameField,
      passwordField,
      confirmField,
    ];

    // -------- FIELD DETECTION --------
    function findField(keyword) {
      return groups.find((g) =>
        g.innerText.toLowerCase().includes(keyword)
      );
    }

    const step2 = [
      findField("first"),
      findField("last"),
      findField("pronoun"),
      findField("phone"),
      findField("state"),
      findField("city"),
      findField("zip"),
    ].filter(Boolean);

    const step3 = [
      findField("role"),
      findField("organization"),
      findField("type"),
      findField("groups"),
      findField("which state"),
    ].filter(Boolean);

    const step4 = [
      groups.find((g) =>
        g.querySelector("[class*='community-guidelines']")
      ),
      groups.find((g) =>
        g.querySelector("[class*='privacy-policy']")
      ),
    ].filter(Boolean);

    const totalSteps = 4;

    // -------- NAV --------
    const nav = document.createElement("div");
    nav.className = "multi-step-nav";
    nav.style.display = "flex";
    nav.style.justifyContent = "center";
    nav.style.marginTop = "20px";

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.innerText = "Continue";

    nav.appendChild(nextBtn);

    const container = document.querySelector(".user-fields");
    if (container) container.after(nav);

    // -------- OBSERVER --------
    observer = new MutationObserver(() => {
      const cta = document.querySelector(".signup-page-cta");
      if (!cta) return;

      if (currentStep === 4) {
        cta.style.display = "";
      } else {
        cta.style.display = "none";
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // -------- STEP CONTROL --------
    function showStep(step) {
      currentStep = step;

      if (step === 1) setHeading("Create your Account");
      if (step === 2) setHeading("Enter Your Details");
      if (step === 3) setHeading("About Your Organization");
      if (step === 4) setHeading("Participation Agreement");

      coreFields.forEach((el) =>
        step === 1 ? safeShow(el) : safeHide(el)
      );

      step2.forEach((el) =>
        step === 2 ? safeShow(el) : safeHide(el)
      );

      step3.forEach((el) =>
        step === 3 ? safeShow(el) : safeHide(el)
      );

      step4.forEach((el) =>
        step === 4 ? safeShow(el) : safeHide(el)
      );

      if (step === 4) showButtons();
      else hideButtons();

      nextBtn.style.display = step === 4 ? "none" : "inline-flex";
    }

    // -------- EVENTS --------
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (currentStep === 1) {
        const emailInput = emailField.querySelector("input");
        const usernameInput = usernameField.querySelector("input");
        const passwordInput = passwordField.querySelector("input");
        const confirmInput = confirmField.querySelector("input");

        const missing = [];

        if (!emailInput.value.trim()) missing.push(emailInput);
        if (!usernameInput.value.trim()) missing.push(usernameInput);
        if (!passwordInput.value.trim()) missing.push(passwordInput);
        if (!confirmInput.value.trim()) missing.push(confirmInput);

        if (
          passwordInput.value &&
          confirmInput.value &&
          passwordInput.value !== confirmInput.value
        ) {
          alert("Passwords do not match");
          confirmInput.focus();
          return;
        }

        if (missing.length) {
          highlightMissing(missing.map(i => i.closest(".input-group")));
          return;
        }

        showStep(2);
        return;
      }

      let fields = [];
      if (currentStep === 2) fields = step2;
      if (currentStep === 3) fields = step3;
      if (currentStep === 4) fields = step4;

      const missing = getStepMissingFields(fields);

      if (missing.length) {
        highlightMissing(missing);
        return;
      }

      if (currentStep < totalSteps) {
        showStep(currentStep + 1);
      }
    });

    showStep(1);
  }

  api.onPageChange(() => {
    cleanup();
    setTimeout(initMultiStep, 300);
  });
});