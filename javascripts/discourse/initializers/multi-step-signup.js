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
    });

    if (wrappers.length) {
      wrappers[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // ✅ POLICY BOX (FROM SETTINGS)
  function injectPolicyBox() {
    const field = document.querySelector(
      ".user-field-community-guidelines .controls"
    );

    if (!field) return;
    if (field.querySelector(".policy-box")) return;

    const text = settings.community_guidelines_text || "";

    const formattedText = text
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
    nav.style.textAlign = "center";

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.innerText = "Continue";

    nav.appendChild(nextBtn);

    const container = document.querySelector(".user-fields");
    if (container) container.after(nav);

    function showStep(step) {
      currentStep = step;

      if (step === 1) setHeading("Create your Account");
      if (step === 2) setHeading("Enter Your Details");
      if (step === 3) setHeading("About Your Organization");

      if (step === 4) {
        setHeading("Participation Agreement");

        // inject policy box
        setTimeout(injectPolicyBox, 100);
      }

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

      const cta = document.querySelector(".signup-page-cta");
      if (cta) {
        if (step === 4) safeShow(cta);
        else safeHide(cta);
      }

      nextBtn.style.display = step === 4 ? "none" : "inline-flex";

      updateCTAButtonText(step);
    }

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (currentStep === 1) {
        const inputs = coreFields.map(f => f.querySelector("input"));
        const missing = inputs.filter(i => !i.value.trim());

        if (missing.length) {
          highlightMissing(missing.map(i => i.closest(".input-group")));
          return;
        }

        showStep(2);
        return;
      }

      const map = { 2: step2, 3: step3, 4: step4 };
      const missing = getStepMissingFields(map[currentStep]);

      if (missing.length) {
        highlightMissing(missing);
        return;
      }

      showStep(currentStep + 1);
    });

    showStep(1);
  }

  api.onPageChange(() => {
    cleanup();
    setTimeout(initMultiStep, 300);
  });
});