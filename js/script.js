document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelector("#year");
  const themeToggle = document.querySelector("#themeToggle");
  const themeIcon = document.querySelector(".theme-icon");
  const themeLabel = document.querySelector("#themeLabel");
  const savedTheme = localStorage.getItem("portfolio-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("portfolio-theme", theme);

    if (themeIcon) {
      themeIcon.textContent = theme === "dark" ? "\u263E" : "\u2600";
    }

    if (themeLabel) {
      themeLabel.textContent = theme === "dark" ? "Modo oscuro" : "Modo claro";
    }
  };

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  setTheme(savedTheme || (prefersDark ? "dark" : "light"));

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      setTheme(currentTheme === "dark" ? "light" : "dark");
    });
  }
});
