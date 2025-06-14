function updateNavBar() {
  const navBar = document.getElementById('nav-bar');
  const identifier = sessionStorage.getItem('userToken');
  const isAdmin = !!sessionStorage.getItem('adminToken');

  if (!navBar) return;

  if (identifier) {
    let links = `
      <a href="scan.html">Scan</a>
      <a href="progress.html">Progress</a>
    `;

    if (isAdmin) {
      links += `
        <a href="admin.html">Admin</a>
        <a href="tags.html">Tags</a>
      `;
    }

    navBar.innerHTML = `
      <div>
        ${links}
      </div>
      <button id="logout-btn">Logout</button>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('adminToken');
      window.location.href = 'index.html';
    });
  } else {
    navBar.innerHTML = `
      <div>
        <a href="login.html#login">Login</a>
        <a href="login.html#register">Register</a>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Check if the user is logged in and update the navbar accordingly
  updateNavBar();

  // Fetch the config.json file and update the title
  const originalTitle = document.title.split(' - ')[0];
  fetch('../../config.json')
  .then(response => response.json())
  .then(config => {
    if (config.scavengerHuntName) {
    document.title = `${originalTitle} - ${config.scavengerHuntName}`;
    }
  })
  .catch(() => {
    // Fail silently if config.json is missing or invalid
    console.error('Failed to load config.json');

  });
});
