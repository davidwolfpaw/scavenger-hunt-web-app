// Fetch config once and expose as a shared promise for all page scripts
window.appConfigPromise = fetch("config.json")
  .then((r) => r.json())
  .catch(() => {
    console.error("Failed to load config.json");
    return {};
  });

// Replace {placeholder} tokens in a string
window.formatString = function (template, replacements) {
  return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? "");
};

function applyStrings(config) {
  const strings = config.strings || {};
  document.querySelectorAll("[data-string-key]").forEach((el) => {
    const key = el.getAttribute("data-string-key");
    const val = key.split(".").reduce((obj, part) => obj?.[part], strings);
    if (val) el.textContent = val;
  });
}

function updateNavBar(config) {
  const nav = config?.strings?.nav || {};
  const navBar = document.getElementById("nav-bar");
  const identifier = sessionStorage.getItem("userToken");
  const isAdmin = !!sessionStorage.getItem("adminToken");

  if (!navBar) return;

  if (identifier) {
    let links = `
      <a href="scan.html">${nav.scan || "Scan"}</a>
      <a href="progress.html">${nav.progress || "Progress"}</a>
    `;

    if (isAdmin) {
      links += `
        <a href="admin.html">${nav.admin || "Admin"}</a>
        <a href="tags.html">${nav.tags || "Tags"}</a>
      `;
    }

    navBar.innerHTML = `
      <div>
        ${links}
      </div>
      <button id="logout-btn">${nav.logout || "Logout"}</button>
    `;

    document.getElementById("logout-btn").addEventListener("click", () => {
      sessionStorage.removeItem("userToken");
      sessionStorage.removeItem("adminToken");
      window.location.href = "index.html";
    });
  } else {
    navBar.innerHTML = `
      <div>
        <a href="login.html#login" class="button">${nav.login || "Login"}</a>
        <a href="login.html#register" class="button">${nav.register || "Register"}</a>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const config = await window.appConfigPromise;

  updateNavBar(config);
  applyStrings(config);

  if (config.scavengerHuntName) {
    const originalTitle = document.title.split(" - ")[0];
    document.title = `${originalTitle} - ${config.scavengerHuntName}`;
  }
});
