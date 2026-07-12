// Tema claro/escuro: alterna html[data-theme], persiste em localStorage
// (chave cultiv-theme, restaurada pelo boot inline do layout) e mantém o
// rótulo de todos os alternadores em sincronia.

export function initTheme(): void {
  const applyLabel = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    document.querySelectorAll("[data-theme-label]").forEach((el) => {
      el.textContent = dark ? "TEMA ESCURO" : "TEMA CLARO";
    });
  };
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const d = document.documentElement;
      d.dataset.theme = d.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("cultiv-theme", d.dataset.theme);
      } catch {
        /* storage indisponível: o tema vale só para esta visita */
      }
      applyLabel();
    })
  );
  applyLabel();
}
