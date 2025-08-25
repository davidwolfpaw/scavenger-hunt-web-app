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
  const tagId = urlParams.get('tag');

  if (tagId) {
    processTag(tagId);
  }

  // Start QR code scanning
  startScanButton.addEventListener('click', () => {
    startQrCodeScanner();
  });
}

function startQrCodeScanner() {
  console.log("Starting QR code scanner...");
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
  }, 100); // Give the browser time to render the element
}

function processTag(tagId) {
  const identifier = sessionStorage.getItem('userIdentifier');
  const msg = document.getElementById('scan-message');

  if (!msg) return;

  if (tagId) {
    if (identifier) {
      fetch('/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, identifier })
      }).then(res => res.json())
      .then(data => {
        if (data.success) {
          msg.textContent = data.alreadyScanned
            ? 'You already found this one!'
            : 'Tag logged successfully!';
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
