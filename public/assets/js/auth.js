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

        // Automatically log in the user after successful registration
        try {
          const loginRes = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier })
          });

          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.success) {
            handleLoginSuccess(loginData);
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
    const identifier = document.getElementById('login-identifier').value.trim();
    const status = document.getElementById('login-status');

    try {
      const res = await fetch(`/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        handleLoginSuccess(data);
      } else {
        status.textContent = 'Invalid credentials';
      }
    } catch (err) {
        console.error(err);
      status.textContent = 'Network error or server is down.';
    }
  });
}

function handleLoginSuccess(data) {
  // Store token and identifier in localStorage for session management
    window.MegaplexScavenger.Authentication.token = data.token;

    const user = window.MegaplexScavenger.Authentication.user;

  if (user.isAdmin) {
    window.location.assign('admin.html');
  } else {
    processPendingScans(user.identifier);
    window.location.assign('progress.html');
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

document.addEventListener("DOMContentLoaded", ()=>{
    if(window.MegaplexScavenger.Authentication.user){
        window.location.assign('/progress.html');
    }
})
