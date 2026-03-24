import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  let initialized = false;
  let currentStep = 1;

  function safeHide(el) {
    if (!el) return;
    el.style.display = "none";
  }

  function safeShow(el) {
    if (!el) return;
    el.style.display = "";
  }

  function setHeading(text) {
    const heading = document.querySelector("#create-account-title");
    if (heading) heading.innerText = text;
  }

  function updateCTAButtonText(step) {
    const label = document.querySelector(".signup-page-cta__signup .d-button-label");
    if (!label) return;
    label.textContent = step === 4 ? "Complete Sign Up" : "Sign Up";
  }

  function updateProgressBar(step) {
    const segments = document.querySelectorAll(".signup-progress-bar__segment");

    segments.forEach((seg, index) => {
      const stepNum = index + 1;
      seg.classList.remove("--active", "--complete", "--incomplete");

      if (stepNum < step) seg.classList.add("--complete");
      else if (stepNum === step) seg.classList.add("--active");
      else seg.classList.add("--incomplete");
    });
  }

  function cleanup() {
    initialized = false;

    document.querySelectorAll(".multi-step-nav").forEach((el) => el.remove());

    document
      .querySelectorAll(".user-fields .input-group, .create-account-email, .create-account__username, .create-account__password")
      .forEach((el) => safeShow(el));
  }

  function clearFieldError(wrap) {
    const error = wrap.querySelector(".field-error");
    if (error) error.remove();
  }

  function showFieldError(wrap, message) {
    clearFieldError(wrap);

    const error = document.createElement("div");
    error.className = "field-error";
    error.innerText = message;

    const controls = wrap.querySelector(".controls");

    if (controls) controls.appendChild(error);
    else wrap.appendChild(error);
  }

  // ✅ PLACEHOLDERS (SAFE ADD)
  function applyPlaceholders() {
    const map = [
      { key: "email", text: "Email Address" },
      { key: "username", text: "Username" },
      { key: "password", text: "Password" },
      { key: "re-enter password", text: "Password" },
      { key: "first name", text: "First Name" },
      { key: "last name", text: "Last Name" },
      { key: "pronouns", text: "Select Pronouns" },
      { key: "state", text: "Select a State" },
      { key: "city", text: "Select a City" },
      { key: "zip", text: "Zip Code" },
      { key: "role", text: "Select your Role" },
      { key: "organization", text: "Organization Name" },
      { key: "type of organization", text: "Organization Type" },
      { key: "groups your organization serves", text: "Select Groups Served by your Organization" },
      { key: "which state(s)", text: "Select State(s)" }
    ];

    document.querySelectorAll(".user-fields .input-group, .user-field").forEach((wrap) => {
      const label = wrap.querySelector("label");
      if (!label) return;

      const labelText = label.innerText.toLowerCase();

      const input = wrap.querySelector("input, textarea");
      if (input) {
        const match = map.find((m) => labelText.includes(m.key));
        if (match) input.setAttribute("placeholder", match.text);
      }

      const selectHeader = wrap.querySelector(".select-kit-header");
      if (selectHeader) {
        const match = map.find((m) => labelText.includes(m.key));
        if (match) {
          const el =
            selectHeader.querySelector(".name") ||
            selectHeader.querySelector(".formatted-selection");

          if (el) el.innerText = match.text;
        }
      }
    });
  }

  function initMultiStep() {
    if (initialized) return;

    const groups = Array.from(
      document.querySelectorAll(".user-fields .input-group")
    );
    if (!groups.length) return;

    initialized = true;

    const emailField = document.querySelector(".create-account-email");
    const usernameField = document.querySelector(".create-account__username");
    const passwordField = document.querySelector(".create-account__password");

    let confirmField = document.querySelector(".mss-password-confirm");

    if (!confirmField && passwordField) {
      confirmField = document.createElement("div");
      confirmField.className = "create-account__password mss-password-confirm";
      confirmField.innerHTML =
        "<label>Re-enter Password*</label><input type='password' required />";
      passwordField.after(confirmField);
    }

    const coreFields = [emailField, usernameField, passwordField, confirmField];

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

    const nav = document.createElement("div");
    nav.className = "multi-step-nav";

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.innerText = "Continue";

    nav.appendChild(nextBtn);

    const container = document.querySelector(".user-fields");
    if (container) container.after(nav);

    function showStep(step) {
      currentStep = step;

      updateProgressBar(step);

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
    }

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (currentStep === 1) {
        const missing = [];

        let password = "";
        let confirm = "";
        let confirmWrap = null;

        coreFields.forEach((wrap) => {
          const input = wrap.querySelector("input");

          if (!input || !input.value.trim()) missing.push(wrap);
          else clearFieldError(wrap);

          if (
            wrap.classList.contains("create-account__password") &&
            !wrap.classList.contains("mss-password-confirm")
          ) {
            password = input.value;
          }

          if (wrap.classList.contains("mss-password-confirm")) {
            confirm = input.value;
            confirmWrap = wrap;
          }
        });

        if (missing.length) {
          highlightMissing(missing);
          return;
        }

        if (password !== confirm) {
          showFieldError(confirmWrap, "* Passwords do not match");
          return;
        }

        showStep(2);
        return;
      }

      showStep(currentStep + 1);
    });

    // apply placeholders safely
    setTimeout(applyPlaceholders, 300);

    showStep(1);
  }

  api.onPageChange(() => {
    cleanup();
    setTimeout(initMultiStep, 300);
  });
});