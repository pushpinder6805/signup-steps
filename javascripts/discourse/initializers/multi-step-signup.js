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

    if (controls) {
      controls.appendChild(error);
    } else {
      wrap.appendChild(error);
    }
  }

  function getStepMissingFields(stepContainers) {
    const missing = [];

    stepContainers.forEach((wrap) => {
      if (!wrap || wrap.style.display === "none") return;

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
        const header = selectKit.querySelector(".select-kit-header");

        if (header) {
          const value = header.getAttribute("data-value");
          if (value && value.trim() !== "") {
            hasValue = true;
          }
        }

        const selectedChoices = selectKit.querySelectorAll(".selected-choice");
        if (selectedChoices.length > 0) {
          hasValue = true;
        }
      }

      if (hasValue) {
        clearFieldError(wrap);
      } else {
        missing.push(wrap);
      }
    });

    return missing;
  }

  function highlightMissing(wrappers) {
    wrappers.forEach((wrap) => {
      const existing = wrap.querySelector(".field-error");
      if (existing) existing.remove();

      const error = document.createElement("div");
      error.className = "field-error";
      error.innerText = "* This is required";

      const controls = wrap.querySelector(".controls");

      if (controls) {
        controls.appendChild(error);
      } else {
        wrap.appendChild(error);
      }
    });

    if (wrappers.length) {
      wrappers[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function injectPolicyBoxes() {
    injectSinglePolicy(
      ".user-field-community-guidelines",
      settings.community_guidelines_text
    );

    injectSinglePolicy(
      ".user-field-privacy-policy",
      settings.privacy_policy_text
    );
  }

  function injectSinglePolicy(selector, text) {
    const field = document.querySelector(`${selector} .controls`);
    if (!field) return;

    if (field.querySelector(".policy-box")) return;

    const formattedText = (text || "")
      .replace(/\n/g, "<br>")
      .replace(/\.\s/g, ".<br><br>");

    const box = document.createElement("div");
    box.className = "policy-box";

    box.innerHTML = `
      <div class="policy-box__inner">
        ${formattedText}
      </div>
    `;

    const checkbox = field.querySelector(".checkbox-label");

    if (checkbox) {
      field.insertBefore(box, checkbox);
    } else {
      field.appendChild(box);
    }
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

    function showStep(step) {
      currentStep = step;

      if (step === 1) setHeading("Create your Account");
      if (step === 2) setHeading("Enter Your Details");
      if (step === 3) setHeading("About Your Organization");

      if (step === 4) {
        setHeading("Participation Agreement");
        setTimeout(injectPolicyBoxes, 100);
      }

      updateProgressBar(step);

      coreFields.forEach((el) =>
        step === 1 ? safeShow(el) : safeHide(el)
      );
    }

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.innerText = "Continue";

    document.querySelector(".user-fields")?.after(nextBtn);

    // ✅ FIXED STEP 1 VALIDATION (WITH PASSWORD MATCH)
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (currentStep === 1) {
        const missing = [];

        let passwordValue = "";
        let confirmValue = "";
        let confirmWrap = null;

        coreFields.forEach((wrap) => {
          const input = wrap.querySelector("input");

          if (!input || !input.value.trim()) {
            missing.push(wrap);
          } else {
            clearFieldError(wrap);
          }

          if (
            wrap.classList.contains("create-account__password") &&
            !wrap.classList.contains("mss-password-confirm")
          ) {
            passwordValue = input.value;
          }

          if (wrap.classList.contains("mss-password-confirm")) {
            confirmValue = input.value;
            confirmWrap = wrap;
          }
        });

        if (missing.length) {
          highlightMissing(missing);
          return;
        }

        // 🔥 password mismatch check
        if (passwordValue !== confirmValue) {
          showFieldError(confirmWrap, "* Passwords do not match");
          return;
        }

        showStep(2);
        return;
      }
    });

    showStep(1);
  }

  api.onPageChange(() => {
    cleanup();
    setTimeout(initMultiStep, 300);
  });
});