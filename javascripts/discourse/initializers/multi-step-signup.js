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

  function setHeading(text) {
    let heading = document.querySelector(".mss-heading");

    if (!heading) {
      heading = document.createElement("h2");
      heading.className = "mss-heading";
      heading.style.textAlign = "center";
      heading.style.marginBottom = "20px";

      const form = document.querySelector(".create-account");
      if (form) form.prepend(heading);
    }

    heading.innerText = text;
  }

  function cleanup() {
    initialized = false;

    document.querySelectorAll(".multi-step-nav").forEach((el) => el.remove());
    document.querySelectorAll(".mss-heading").forEach((el) => el.remove());

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
      const input = wrap.querySelector("input, select, textarea");
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

    // ---------------- CORE FIELDS ----------------
    const emailField = document.querySelector(".create-account-email");
    const usernameField = document.querySelector(".create-account__username");
    const passwordField = document.querySelector(".create-account__password");

    // create confirm password
    let confirmField = document.querySelector(".mss-password-confirm");

    if (!confirmField && passwordField) {
      confirmField = document.createElement("div");
      confirmField.className =
        "create-account__password mss-password-confirm";

      confirmField.innerHTML = `
        <label>Re-enter Password*</label>
        <input type="password" class="mss-confirm-input" required />
      `;

      passwordField.after(confirmField);
    }

    const coreFields = [
      emailField,
      usernameField,
      passwordField,
      confirmField,
    ];

    // ---------------- FIELD DETECTION ----------------
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

    let currentStep = 1;
    const totalSteps = 4;

    // ---------------- NAV ----------------
    const nav = document.createElement("div");
    nav.className = "multi-step-nav";
    nav.style.display = "flex";
    nav.style.justifyContent = "space-between";
    nav.style.marginTop = "20px";

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

    // ---------------- STEP CONTROL ----------------
    function showStep(step) {
      currentStep = step;

      // headings
      if (step === 1) setHeading("Create your Account");
      if (step === 2) setHeading("Enter Your Details");
      if (step === 3) setHeading("About Your Organization");
      if (step === 4) setHeading("Participation Agreement");

      // show/hide
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

      const submitBtn = document.querySelector(".sign-up-button");

      if (submitBtn) {
        submitBtn.style.display = step === 4 ? "" : "none";
        submitBtn.disabled = false;
      }

      backBtn.style.display = step === 1 ? "none" : "inline-flex";
      nextBtn.style.display = step === 4 ? "none" : "inline-flex";
    }

    // ---------------- EVENTS ----------------
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();

      let fields = [];

      if (currentStep === 1) fields = coreFields;
      if (currentStep === 2) fields = step2;
      if (currentStep === 3) fields = step3;
      if (currentStep === 4) fields = step4;

      const missing = getRequiredInputs(fields);

      // password match check
      if (currentStep === 1) {
        const pass = passwordField.querySelector("input")?.value;
        const confirm =
          confirmField.querySelector("input")?.value;

        if (pass !== confirm) {
          alert("Passwords do not match");
          return;
        }
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