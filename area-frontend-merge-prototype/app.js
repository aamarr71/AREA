const reportButtons = document.querySelectorAll("[data-view]");
const reportViews = document.querySelectorAll("[data-report-view]");

reportButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.view;
    reportButtons.forEach((item) => item.classList.toggle("active", item === button));
    reportViews.forEach((view) => view.classList.toggle("active", view.dataset.reportView === target));
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.dataset.copy || "";
    try {
      await navigator.clipboard.writeText(text);
      const previous = button.textContent;
      button.textContent = "Kopiert";
      window.setTimeout(() => {
        button.textContent = previous;
      }, 1200);
    } catch {
      button.textContent = "Textbaustein";
    }
  });
});

document.querySelectorAll("[data-demo-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    const previous = button.textContent;
    button.textContent = "Anfrage vorgemerkt";
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1600);
  });
});

document.querySelectorAll("[data-login-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.textContent = "Workspace wird geöffnet";
    }
    window.setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 450);
  });
});

document.querySelectorAll("[data-analysis-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.querySelector("[data-analysis-status]");
    const button = form.querySelector('button[type="submit"]');
    if (status) {
      status.classList.add("is-running");
      status.querySelector("b").textContent = "Analyse läuft";
      status.querySelector("small").textContent = "URL validiert, Pipeline gestartet, Report wird vorbereitet.";
    }
    if (button) {
      button.textContent = "Läuft";
    }
  });
});

const revealTargets = document.querySelectorAll(".flow-card, .field-row, .expose-sheet");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    {
      root: null,
      rootMargin: "-14% 0px -18% 0px",
      threshold: 0.22,
    },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}
