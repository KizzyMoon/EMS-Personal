(() => {
  const desktopQuery = window.matchMedia("(min-width: 901px)");
  const drawer = document.querySelector(".sidebar-quick-links");
  const quickTab = document.querySelector(".mobile-quick-tab");

  if (!drawer || !quickTab) return;

  function setDrawerOpen(open) {
    document.body.classList.toggle("quick-drawer-open", open);
    quickTab.classList.toggle("drawer-active", open);
    drawer.setAttribute("aria-hidden", String(!open));
    quickTab.setAttribute("aria-expanded", String(open));
  }

  function prepareFolders() {
    drawer.querySelectorAll(".quick-link-category").forEach((category, index) => {
      const heading = category.querySelector(":scope > h3");
      const links = category.querySelector(":scope > .quick-links-grid");
      if (!heading || !links) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-folder-button";
      button.innerHTML = `<span>${heading.textContent}</span><i aria-hidden="true"></i>`;
      button.setAttribute("aria-expanded", String(index === 0));
      heading.replaceWith(button);
      category.classList.toggle("is-open", index === 0);

      button.addEventListener("click", () => {
        const shouldOpen = !category.classList.contains("is-open");
        drawer.querySelectorAll(".quick-link-category").forEach((entry) => {
          entry.classList.remove("is-open");
          entry.querySelector(".quick-folder-button")?.setAttribute("aria-expanded", "false");
        });
        category.classList.toggle("is-open", shouldOpen);
        button.setAttribute("aria-expanded", String(shouldOpen));
      });
    });
  }

  prepareFolders();
  setDrawerOpen(false);

  document.addEventListener("click", (event) => {
    if (!desktopQuery.matches) return;

    const tab = event.target.closest(".mobile-quick-tab");
    if (tab) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setDrawerOpen(!document.body.classList.contains("quick-drawer-open"));
      return;
    }

    if (event.target.closest(".quick-drawer-close")) {
      setDrawerOpen(false);
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("quick-drawer-open")) {
      setDrawerOpen(false);
      quickTab.focus();
    }
  });

  desktopQuery.addEventListener("change", () => setDrawerOpen(false));
})();
