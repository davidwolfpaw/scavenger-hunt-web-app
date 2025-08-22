const registrationForm = document.getElementById('registration-form');
const loginForm = document.getElementById('login-form');

if (registrationForm) {
  registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const identifier = document.getElementById('register-identifier').value.trim();
    const status = document.getElementById('register-status');

    // Clear previous error message
    status.textContent = '';

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier })
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        status.textContent = 'Error: Invalid server response';
        return;
      }

      if (res.ok && data.success) {
        status.textContent = 'Registered successfully! Logging in...';
        // Store the identifier in sessionStorage
        sessionStorage.setItem('userIdentifier', identifier);

        // Automatically log in the user after successful registration
        try {
          const loginRes = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, identifier })
          });

          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.success) {
            handleLoginSuccess(loginData, identifier);
          } else {
            status.textContent = 'Error logging in after registration.';
          }
        } catch (loginErr) {
          status.textContent = 'Network error during auto-login.';
        }
      } else {
        status.textContent = 'Error: ' + (data.error || 'Unknown error');
      }
    } catch (err) {
      status.textContent = 'Network error or server is down.';
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('login-name').value.trim();
    const identifier = document.getElementById('login-identifier').value.trim();
    const status = document.getElementById('login-status');

    try {
      const res = await fetch(`/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Store the identifier in sessionStorage upon successful login
        sessionStorage.setItem('userIdentifier', identifier);
        handleLoginSuccess(data, identifier);
      } else {
        status.textContent = 'Invalid credentials';
      }
    } catch (err) {
      status.textContent = 'Network error or server is down.';
    }
  });
}

function handleLoginSuccess(data, identifier) {
  // Store token and identifier in sessionStorage for session management
  sessionStorage.setItem('userToken', data.token);
  sessionStorage.setItem('userIdentifier', identifier);

  if (data.isAdmin) {
    sessionStorage.setItem('adminToken', data.token);
    window.location.href = 'admin.html';
  } else {
    processPendingScans(data.identifier);
    window.location.href = 'progress.html';
  }
}

async function processPendingScans(identifier) {
  const pendingScans = JSON.parse(localStorage.getItem('pendingScans') || '[]');
  if (pendingScans.length > 0) {
    for (const tagId of pendingScans) {
      try {
        await fetch('/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagId, identifier })
        });
      } catch (err) {
        console.error('Error processing pending scan:', err);
      }
    }
    localStorage.removeItem('pendingScans');
  }
}
