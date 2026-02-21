document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("scan-grid")) {
    handleProgressPage();
  }
});

async function handleProgressPage() {
  const progressStatus = document.getElementById("progress-status");
  const scanGrid = document.getElementById("scan-grid");
  const nameEl = document.getElementById("user-name");
  const identifier = sessionStorage.getItem("userIdentifier");
  const config = await window.appConfigPromise;
  const str = config?.strings?.progress || {};

  if (!identifier) {
    progressStatus.innerHTML =
      str.notRegistered ||
      'You are not registered. Please <a href="login.html">log in or register</a>.';
    return;
  }

  if (!config) {
    progressStatus.textContent =
      str.errorConfig || "Failed to load configuration.";
    return;
  }

  try {
    const res = await fetch(`/scans/${identifier}`);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      progressStatus.textContent =
        str.errorInvalidResponse || "Error: Invalid server response";
      return;
    }

    if (data.success) {
      let userName = "User";
      try {
        const userRes = await fetch(`/user/${identifier}`);
        const userData = await userRes.json();
        if (userRes.ok && userData.success && userData.name) {
          userName = userData.name;
        }
      } catch (e) {}

      nameEl.textContent = window.formatString(
        str.welcome || "Welcome, {name} ({identifier})!",
        { name: userName, identifier },
      );

      const count = data.scans.length;
      if (count === 1) {
        progressStatus.textContent = str.foundSingular || "You've found 1 tag!";
      } else {
        progressStatus.textContent = window.formatString(
          str.foundPlural || "You've found {count} tags!",
          { count },
        );
      }

      const noBadgeLabel = str.noBadge || "No badge yet";
      const badgeInfo = getBadgeInfo(count, config, noBadgeLabel);
      if (badgeInfo.name !== noBadgeLabel) {
        const badgeDisplay = document.createElement("p");
        badgeDisplay.textContent = window.formatString(
          str.yourBadge || "Your Badge: {badge}",
          { badge: badgeInfo.name },
        );
        progressStatus.after(badgeDisplay);
      }

      if (badgeInfo.image) {
        const badgeStamp = document.createElement("img");
        badgeStamp.classList.add("badge-image");
        badgeStamp.src = badgeInfo.image;
        badgeStamp.alt = badgeInfo.name;
        progressStatus.after(badgeStamp);
      }

      scanGrid.innerHTML = "";

      // Create a complete list of tag IDs based on positions
      const positionToTagId = Object.entries(config.tagPositions)
        .sort(([, posA], [, posB]) => posA - posB)
        .map(([tagId]) => tagId);

      positionToTagId.forEach((tagId) => {
        const div = document.createElement("div");
        div.className = "scan-item";
        div.style.backgroundImage = `url('${config.defaultStampImage}')`; // Faded background

        const scan = data.scans.find((s) => s.tag_id === tagId);
        if (scan) {
          const stamp = config.tagStamps[tagId];
          const tagName = tagId.replace("_", " ").replace("-", " ");
          const stampImg = document.createElement("img");
          stampImg.classList.add("stamp-image");
          stampImg.src = stamp ? stamp.image : config.defaultStampImage;
          stampImg.alt = stamp ? tagName : "Default Stamp";
          div.appendChild(stampImg);
          div.classList.add("scanned"); // Add class for scanned items
        }

        scanGrid.appendChild(div);
      });
    } else {
      progressStatus.textContent = window.formatString(
        str.errorLoading || "Error loading progress: {error}",
        { error: data.error || "Unknown error" },
      );
    }
  } catch (err) {
    progressStatus.textContent =
      str.errorNetwork || "Network error or server is down.";
  }
}

function getBadgeInfo(count, config, noBadgeLabel) {
  let badgeInfo = { name: noBadgeLabel, image: null };
  for (let badge of config.badges) {
    if (badge.enabled && count >= badge.level) {
      badgeInfo = { name: badge.name, image: badge.image };
    }
  }
  return badgeInfo;
}
