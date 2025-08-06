document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem('adminToken');
  const status = document.getElementById('status');
  const viewContent = document.getElementById('view-content');

  if (!token) {
    status.textContent = "Admin token not found. Redirecting to login...";
    setTimeout(() => window.location.href = 'login.html', 1000);
  } else {
    document.getElementById('view-by-user').addEventListener('click', () => loadView('user'));
    document.getElementById('view-by-clue').addEventListener('click', () => loadView('clue'));
    document.getElementById('view-first-complete').addEventListener('click', () => loadView('firstComplete'));
  }

  function loadView(viewType) {
    viewContent.innerHTML = ''; // Clear previous content
    status.textContent = 'Loading...';

    let url;
    switch (viewType) {
      case 'user':
        url = '/admin/users';
        break;
      case 'clue':
        url = '/admin/scans-by-clue';
        break;
      case 'firstComplete':
        url = '/admin/first-complete';
        break;
      default:
        return;
    }

    fetch(url, {
      headers: { 'x-admin-token': token }
    })
    .then(res => {
      if (!res.ok) throw new Error("Error fetching data");
      return res.json();
    })
    .then(data => {
      if (data.success) {
        status.style.display = 'none';
        renderView(viewType, data);
      } else {
        status.textContent = "Failed to load data.";
        status.className = "error";
      }
    })
    .catch(err => {
      status.textContent = err.message || "Error loading data.";
      status.className = "error";
    });
  }

  function renderView(viewType, data) {
    switch (viewType) {
      case 'user':
        renderUserView(data.users);
        break;
      case 'clue':
        renderClueView(data.clues);
        break;
      case 'firstComplete':
        renderFirstCompleteView(data.firstComplete);
        break;
    }
  }

  function renderUserView(users) {
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Identifier</th>
          <th>Scan Count</th>
          <th>Complete</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr>
            <td>${user.name}</td>
            <td>${user.identifier}</td>
            <td>${user.scan_count}</td>
            <td>${user.hasScannedAll ? '✔️' : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    viewContent.appendChild(table);
  }

  function renderClueView(clues) {
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Clue</th>
          <th>Scan Count</th>
        </tr>
      </thead>
      <tbody>
        ${clues.map(clue => `
          <tr>
            <td class="capitalize">${clue.tag_id}</td>
            <td>${clue.scan_count}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    viewContent.appendChild(table);
  }

  function renderFirstCompleteView(firstComplete) {
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Identifier</th>
          <th>Completed At</th>
        </tr>
      </thead>
      <tbody>
        ${firstComplete.map(entry => `
          <tr>
            <td>${entry.name}</td>
            <td>${entry.identifier}</td>
            <td>${new Date(entry.timestamp).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    viewContent.appendChild(table);
  }

});
