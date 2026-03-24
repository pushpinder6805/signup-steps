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

  function normalizePlaceholderKey(text) {
    return (text || "")
      .toLowerCase()
      .replace(/\*/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const placeholderConfig = [
    { key: "email", text: "Email Address" },
    { key: "username", text: "Username" },
    { key: "password", text: "Password" },
    { key: "re-enter password", text: "Password" },
    { key: "first name", text: "First Name" },
    { key: "last name", text: "Last Name" },
    { key: "pronouns", text: "Select Pronouns" },
    { key: "phone number", text: "(---) --- ----" },
    { key: "state", text: "Select a State" },
    { key: "city", text: "Select a City" },
    { key: "zip", text: "Zip Code" },
    { key: "role", text: "Select your Role" },
    { key: "organization", text: "Organization Name" },
    { key: "type of organization", text: "Organization Type" },
    {
      key: "groups your organization serves",
      text: "Select Groups Served by your Organization",
    },
    { key: "which state(s)", text: "Select State(s)" },
  ];

  const placeholderMap = new Map(
    placeholderConfig.map(({ key, text }) => [
      normalizePlaceholderKey(key),
      text,
    ])
  );

  function getPlaceholderText(labelText) {
    const normalized = normalizePlaceholderKey(labelText);
    if (!normalized) return "";

    if (placeholderMap.has(normalized)) return placeholderMap.get(normalized);

    for (const [key, text] of placeholderMap.entries()) {
      if (normalized.includes(key)) return text;
    }

    return "";
  }

  function applyPlaceholders() {
    const coreFieldSelectors = [
      { selector: ".create-account-email input", key: "email" },
      { selector: ".create-account__username input", key: "username" },
      {
        selector: ".create-account__password:not(.mss-password-confirm) input",
        key: "password",
      },
      { selector: ".mss-password-confirm input", key: "re-enter password" },
    ];

    coreFieldSelectors.forEach(({ selector, key }) => {
      const input = document.querySelector(selector);
      const text = getPlaceholderText(key);
      if (input && text) input.setAttribute("placeholder", text);
    });

    const groups = Array.from(
      document.querySelectorAll(".user-fields .input-group")
    );

    groups.forEach((wrap) => {
      const label = wrap.querySelector("label");
      const text = getPlaceholderText(label?.innerText || "");
      if (!text) return;

      const input = wrap.querySelector("input, textarea");
      if (input) {
        input.setAttribute("placeholder", text);
        return;
      }

      const selectKit = wrap.querySelector(".select-kit");
      if (selectKit) {
        const header = selectKit.querySelector(".select-kit-header");
        if (header) header.setAttribute("data-placeholder", text);
      }
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

  function attachPasswordToggle(scope = document) {
    scope.querySelectorAll(".toggle-password-mask").forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "true";

      btn.addEventListener("click", () => {
        const wrapper = btn.closest(".password-wrapper") || btn.parentElement;
        const input = wrapper.querySelector("input");

        if (!input) return;

        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";

        const icon = btn.querySelector("use");
        if (icon) {
          icon.setAttribute(
            "href",
            isPassword ? "#far-eye-slash" : "#far-eye"
          );
        }
      });
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

      confirmField.innerHTML = `
        <label>Re-enter Password*</label>
        <div class="password-wrapper">
          <input type="password" required />
          <button class="btn no-text btn-icon btn-transparent toggle-password-mask" type="button">
            <svg class="fa d-icon d-icon-far-eye svg-icon fa-width-auto svg-string" width="1em" height="1em">
              <use href="#far-eye"></use>
            </svg>
            <span aria-hidden="true">&ZeroWidthSpace;</span>
          </button>
        </div>
      `;

      passwordField.after(confirmField);
    }

    const coreFields = [emailField, usernameField, passwordField, confirmField];

    const nav = document.createElement("div");
    nav.className = "multi-step-nav";
    nav.style.textAlign = "center";

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.innerText = "Continue";

    nav.appendChild(nextBtn);

    const container = document.querySelector(".user-fields");
    if (container) container.after(nav);

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (currentStep === 1) {
        let password = "";
        let confirm = "";
        let confirmWrap = null;

        coreFields.forEach((wrap) => {
          const input = wrap.querySelector("input");

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

        if (password !== confirm) {
          showFieldError(confirmWrap, "* Passwords do not match");
          return;
        }

        currentStep++;
      }
    });

    applyPlaceholders();
    attachPasswordToggle(); // ✅ enable eye toggle
  }

  api.onPageChange(() => {
    cleanup();
    setTimeout(initMultiStep, 300);
  });
});