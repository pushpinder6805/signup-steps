import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  api.onPageChange(() => {
    const form = document.querySelector(".create-account");
    if (!form) return;

    const allFields = form.querySelectorAll(".user-field");
    if (!allFields.length) return;

    // prevent re-init
    if (form.dataset.multistepInit) return;
    form.dataset.multistepInit = "true";

    const fields = Array.from(allFields);

    // split steps
    const step1 = fields.slice(0, 3);
    const step2 = fields.slice(3, 10);
    const step3 = fields.slice(10);

    let currentStep = 1;

    function showStep(step) {
      currentStep = step;

      // hide all
      fields.forEach(f => (f.style.display = "none"));

      if (step === 1) step1.forEach(f => (f.style.display = "block"));
      if (step === 2) step2.forEach(f => (f.style.display = "block"));
      if (step === 3) step3.forEach(f => (f.style.display = "block"));

      // button visibility
      backBtn.style.display = step === 1 ? "none" : "inline-block";
      nextBtn.style.display = step === 3 ? "none" : "inline-block";

      stepLabel.innerText = `Step ${step} of 3`;

      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // ===== UI =====
    const nav = document.createElement("div");
    nav.style.marginTop = "20px";

    const stepLabel = document.createElement("div");
    stepLabel.style.marginBottom = "10px";
    stepLabel.style.fontWeight = "600";

    const backBtn = document.createElement("button");
    backBtn.innerText = "Back";
    backBtn.className = "btn";

    const nextBtn = document.createElement("button");
    nextBtn.innerText = "Continue";
    nextBtn.className = "btn btn-primary";

    nav.appendChild(stepLabel);
    nav.appendChild(backBtn);
    nav.appendChild(nextBtn);

    form.appendChild(nav);

    // ===== Actions =====
    nextBtn.onclick = (e) => {
      e.preventDefault();

      if (currentStep === 1) showStep(2);
      else if (currentStep === 2) showStep(3);
    };

    backBtn.onclick = (e) => {
      e.preventDefault();

      if (currentStep === 2) showStep(1);
      else if (currentStep === 3) showStep(2);
    };

    // ===== Init =====
    showStep(1);
  });
});
