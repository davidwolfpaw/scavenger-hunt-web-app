document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('scan-grid')) {
        handleProgressPage();
    }
});

async function loadConfig() {
    try {
        return await window.MegaplexScavenger.Config.get();
    } catch (error) {
        console.error('Failed to load configuration:', error);
        return null;
    }
}

async function handleProgressPage() {
    const progressStatus = document.getElementById('progress-status');
    const container = document.querySelector('.container');
    const scanGrid = document.getElementById('scan-grid');
    const nameEl = document.getElementById('user-name');
    const identifier = sessionStorage.getItem('userIdentifier');

    if (!identifier) {
        progressStatus.innerHTML = 'You are not registered. Please <a href="login.html">log in or register</a>.';
        return;
    }

    const config = await loadConfig();
    if (!config) {
        progressStatus.textContent = 'Failed to load configuration.';
        return;
    }

    try {
        const res = await fetch(`/scans/${identifier}`);
        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            progressStatus.textContent = 'Error: Invalid server response';
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
            } catch (e) { }

            nameEl.textContent = `Welcome, ${userName} (${identifier})!`;

            const tagWord = data.scans.length === 1 ? 'tag' : 'tags';
            progressStatus.textContent = `You’ve found ${data.scans.length} ${tagWord}!`;

            const badgeInfo = getBadgeInfo(data.scans.length, config);
            if (badgeInfo.name !== "No badge yet") {
                const badgeDisplay = document.createElement('p');
                badgeDisplay.textContent = `Your Badge: ${badgeInfo.name}`;
                progressStatus.after(badgeDisplay);
            }

            if (badgeInfo.image) {
                const badgeStamp = document.createElement('img');
                badgeStamp.classList.add('badge-image');
                badgeStamp.src = badgeInfo.image;
                badgeStamp.alt = badgeInfo.name;
                progressStatus.after(badgeStamp);
            }

            scanGrid.innerHTML = '';

            // Create a complete list of tag IDs based on positions
            const positionToTagId = Object.entries(config.tagPositions)
                .sort(([, posA], [, posB]) => posA - posB)
                .map(([tagId]) => tagId);

            positionToTagId.forEach(tagId => {
                const div = document.createElement('div');
                div.className = 'scan-item';
                div.style.backgroundImage = `url('${config.defaultStampImage}')`; // Faded background

                const scan = data.scans.find(s => s.tag_id === tagId);
                if (scan) {
                    const stamp = config.tagStamps[tagId];
                    const tagName = tagId.replace('_', ' ').replace('-', ' ');
                    const stampImg = document.createElement('img');
                    stampImg.classList.add('stamp-image');
                    stampImg.src = stamp ? stamp.image : config.defaultStampImage;
                    stampImg.alt = stamp ? tagName : "Default Stamp";
                    div.appendChild(stampImg);
                    div.classList.add('scanned'); // Add class for scanned items
                }

                scanGrid.appendChild(div);
            });

            // Check if the user has completed the scavenger hunt
            if(data.scans.length === data.required){
            const completionRes = await fetch(`/user/${identifier}/verify`);
            const completionData = await completionRes.json();

            const congrats = document.createElement('div');
            congrats.classList.add('congrats-message')
            const congratsMessage = document.createElement('p');
            congratsMessage.textContent = "Congratulations on completing the scavenger hunt! Present this code to Gaming to claim your prize!";
            congratsMessage.style.fontWeight = 'bold';
            congratsMessage.style.color = 'green';
            congratsMessage.style.textAlign = 'center';

            const qrCodeImage = document.createElement('img');
            qrCodeImage.src = completionData.qr;
            qrCodeImage.alt = "Completion QR Code";
            qrCodeImage.style.display = 'block';
            qrCodeImage.style.marginTop = '20px';

            congrats.appendChild(congratsMessage);
            congrats.appendChild(qrCodeImage);
            container.appendChild(congrats);
            }
        }
    } catch (err) {
        progressStatus.textContent = 'Network error or server is down.';
    }
}

function getBadgeInfo(count, config) {
    let badgeInfo = { name: "No badge yet", image: null };
    for (let badge of config.badges) {
        if (badge.enabled && count >= badge.level) {
            badgeInfo = { name: badge.name, image: badge.image };
        }
    }
    return badgeInfo;
}
