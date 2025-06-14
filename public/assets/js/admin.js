document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem('adminToken');
  const status = document.getElementById('status');
  const table = document.getElementById('user-table');
  const tbody = document.getElementById('user-list');
  const userDetailsModal = document.getElementById('user-details-modal');
  const userDetails = document.getElementById('user-details');
  const closeButton = document.querySelector('.close-button');

  if (!token) {
    status.textContent = "Admin token not found. Redirecting to login...";
    setTimeout(() => window.location.href = 'login.html', 1000);
  } else {
    fetch('/admin/users', {
      headers: { 'x-admin-token': token }
    })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized or error fetching users");
      return res.json();
    })
    .then(data => {
      if (data.success) {
        status.style.display = 'none';
        table.style.display = 'table';

        data.users.forEach(user => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.identifier}</td>
            <td>${user.scan_count}</td>
            <td>${user.hasScannedAll ? '✔️' : ''}</td>
          `;
          row.addEventListener('click', () => fetchUserScans(user.identifier, user.name));
          tbody.appendChild(row);
        });
      } else {
        status.textContent = "Failed to load user list.";
        status.className = "error";
      }
    })
    .catch(err => {
      status.textContent = err.message || "Error loading users.";
      status.className = "error";
    });
  }

  closeButton.addEventListener('click', () => {
    userDetailsModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === userDetailsModal) {
      userDetailsModal.style.display = 'none';
    }
  });
});

function fetchUserScans(identifier, name) {
  const token = sessionStorage.getItem('adminToken');
  const userDetailsModal = document.getElementById('user-details-modal');
  const userDetails = document.getElementById('user-details');

  // Clear previous details
  userDetails.innerHTML = '';

  fetch(`/admin/user/${identifier}/scans`, {
    headers: { 'x-admin-token': token }
  })
  .then(res => {
    if (!res.ok) throw new Error("Error fetching user scans");
    return res.json();
  })
  .then(data => {
    if (data.success && data.scans) {
      // Add user name and identifier above the scans
      const userInfo = document.createElement('div');
      userInfo.innerHTML = `<strong>User:</strong> ${name} <br><strong>Identifier:</strong> ${identifier}`;
      userDetails.appendChild(userInfo);

      if (data.scans.length === 0) {
        const noScans = document.createElement('div');
        noScans.textContent = "No scans found for this user.";
        userDetails.appendChild(noScans);
      } else {
        const list = document.createElement('ul');
        data.scans.forEach(scan => {
          const listItem = document.createElement('li');
          listItem.textContent = `Tag: ${scan.tag_id}, Scanned at: ${new Date(scan.timestamp).toLocaleString()}`;
          list.appendChild(listItem);
        });
        userDetails.appendChild(list);
      }
    } else {
      userDetails.textContent = "No scans found for this user.";
    }
    userDetailsModal.style.display = 'block';
  })
  .catch(err => {
    userDetails.textContent = err.message || "Error loading user scans.";
  });
}
