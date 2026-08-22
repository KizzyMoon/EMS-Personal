(() => {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.body.appendChild(script);
    });
  }

  loadScript("ems-dashboard-core.js?v=20260818-core-2")
    .then(() => loadScript("ems-dashboard-ra-overrides.js?v=20260818-ra-ui-2"))
    .then(() => loadScript("ems-dashboard-ra-checklist-overrides.js?v=20260822-manual-checklist-1"))
    .catch((error) => {
      console.error(error);
      document.body.innerHTML = `<main style="padding:2rem;color:#f8d7da;background:#080d14;min-height:100vh;font-family:sans-serif"><h1>EMS dashboard could not load</h1><p>${error.message}</p></main>`;
    });
})();
