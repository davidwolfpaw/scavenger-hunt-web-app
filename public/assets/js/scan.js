document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('scan-message')) {
        handleScanPage();
    }
});

async function handleScanPage() {
    const msg = document.getElementById('scan-message');
    const videoContainer = document.getElementById('video-container');
    const startScanButton = document.getElementById('start-scan');

    if (!msg) return;

    // Check for URL-based scan
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('tag')){
        processTag(window.location.href);
    }

    // Start QR code scanning
    startScanButton.addEventListener('click', () => {
        startQrCodeScanner();
    });
}

function startQrCodeScanner() {
    console.log("Starting QR code scanner...");
    const startScanButton = document.getElementById('start-scan');
    
    const msg = document.getElementById('scan-message');
    msg.innerHTML = "";

    let previewElement = document.getElementById("preview");
    if (!previewElement) {
        previewElement = document.createElement("div");
        previewElement.id = "preview";
        previewElement.style.width = "320px";
        previewElement.style.height = "320px";
        previewElement.style.display = "block";
        previewElement.style.background = "#000";
        const videoContainer = document.getElementById("video-container");
        if (videoContainer) {
            videoContainer.appendChild(previewElement);
        } else {
            document.body.appendChild(previewElement);
        }
    }
    
    startScanButton.style.display = 'none';

    // Wait for the element to be rendered and have non-zero dimensions
    setTimeout(() => {
        const html5QrCode = new Html5Qrcode("preview");
        console.log("Html5Qrcode instance created:", html5QrCode);

        const config = {
            fps: 10,
            qrbox: 250 // Use a fixed size or adjust as needed
        };

        console.log("Starting QR code scanning with config:", config);

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (qrMessage) => {
                console.log("QR Code detected: ", qrMessage);
                processTag(qrMessage);
                html5QrCode.stop().then(() => {
                    
                    startScanButton.style.display = 'block';
                    startScanButton.innerText = "Scan Another"
                    console.log("QR Code scanning stopped.");
                }).catch(err => {
                    console.error("Failed to stop scanning:", err);
                });
            },
            (errorMessage) => {
                console.error("QR Code scanning error:", errorMessage);
            }
        ).catch(err => {
            console.error("Failed to start QR Code scanner:", err);
        });
    }, 0); // Give the browser time to render the element
}

async function processTag(scan) {
    const scanUrl = new URL(scan);
    const user = window.MegaplexScavenger.Authentication.user;
    const config = await window.MegaplexScavenger.Config.get();
    const msg = document.getElementById('scan-message');

    const tagId = scanUrl.searchParams.get('tag');

    if (!msg) return;

    if (!tagId) {
        msg.textContent = 'Invalid QR Code scanned';
        return;
    }

    if (tagId) {
        if (user.identifier) {
            fetch('/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagId, identifier: user.identifier })
            }).then(res => res.json())
                .then(data => {
                    if (data.success) {
                        msg.innerHTML = `
                            <span style="margin: 0.5em;">You ${data.alreadyScanned ? "already " : ""}found ${config.tagStamps[tagId].name}!</span>
                            <img src="${config.tagStamps[tagId].image}">
                        `;
                    } else {
                        msg.textContent = 'Scan failed: ' + (data.error || 'Unknown error');
                    }
                }).catch(err => {
                    msg.textContent = 'Network or server error during scan.';
                });
        } else {
            let pendingScans = JSON.parse(localStorage.getItem('pendingScans') || '[]');
            if (!pendingScans.includes(tagId)) {
                pendingScans.push(tagId);
                localStorage.setItem('pendingScans', JSON.stringify(pendingScans));
            }
            msg.textContent = 'Tag saved! Please log in or register to save your progress.';
        }
    } else {
        msg.textContent = 'No tag provided.';
    }
}
