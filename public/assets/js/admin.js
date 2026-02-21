document.addEventListener("DOMContentLoaded", async () => {
  const token = sessionStorage.getItem("adminToken");
  const status = document.getElementById("status");
  const viewContent = document.getElementById("view-content");
  const config = await window.appConfigPromise;
  const str = config?.strings?.admin || {};

  if (!token) {
    status.textContent =
      str.errorNoToken || "Admin token not found. Redirecting to login...";
    setTimeout(() => (window.location.href = "login.html"), 1000);
  } else {
    document
      .getElementById("view-by-user")
      .addEventListener("click", () => loadView("user"));
    document
      .getElementById("view-by-clue")
      .addEventListener("click", () => loadView("clue"));
    document
      .getElementById("view-first-complete")
      .addEventListener("click", () => loadView("firstComplete"));
  }

  function loadView(viewType) {
    viewContent.innerHTML = ""; // Clear previous content
    status.textContent = str.loading || "Loading...";
    status.style.display = "";

    let url;
    switch (viewType) {
      case "user":
        url = "/admin/users";
        break;
      case "clue":
        url = "/admin/scans-by-clue";
        break;
      case "firstComplete":
        url = "/admin/first-complete";
        break;
      default:
        return;
    }

    fetch(url, {
      headers: { "x-admin-token": token },
    })
      .then((res) => {
        if (!res.ok) throw new Error(str.errorFetch || "Error fetching data");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          status.style.display = "none";
          renderView(viewType, data);
        } else {
          status.textContent = str.errorFailedToLoad || "Failed to load data.";
          status.className = "error";
        }
      })
      .catch((err) => {
        status.textContent =
          err.message || str.errorFailedToLoad || "Error loading data.";
        status.className = "error";
      });
  }

  function renderView(viewType, data) {
    switch (viewType) {
      case "user":
        renderUserView(data.users);
        break;
      case "clue":
        renderClueView(data.clues);
        break;
      case "firstComplete":
        renderFirstCompleteView(data.firstComplete);
        break;
    }
  }

  function renderUserView(users) {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>${str.colName || "Name"}</th>
          <th>${str.colIdentifier || "Identifier"}</th>
          <th>${str.colScanCount || "Scan Count"}</th>
          <th>${str.colComplete || "Complete"}</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (user) => `
          <tr>
            <td>${user.name}</td>
            <td>${user.identifier}</td>
            <td>${user.scan_count}</td>
            <td>${user.hasScannedAll ? str.completeCheckmark || "✔️" : ""}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    `;
    viewContent.appendChild(table);
  }

  function renderClueView(clues) {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>${str.colClue || "Clue"}</th>
          <th>${str.colScanCount || "Scan Count"}</th>
        </tr>
      </thead>
      <tbody>
        ${clues
          .map(
            (clue) => `
          <tr>
            <td class="capitalize">${clue.tag_id}</td>
            <td>${clue.scan_count}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    `;
    viewContent.appendChild(table);
  }

  function renderFirstCompleteView(firstComplete) {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>${str.colName || "Name"}</th>
          <th>${str.colIdentifier || "Identifier"}</th>
          <th>${str.colCompletedAt || "Completed At"}</th>
        </tr>
      </thead>
      <tbody>
        ${firstComplete
          .map(
            (entry) => `
          <tr>
            <td>${entry.name}</td>
            <td>${entry.identifier}</td>
            <td>${new Date(entry.timestamp).toLocaleString()}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    `;
    viewContent.appendChild(table);
  }
});
