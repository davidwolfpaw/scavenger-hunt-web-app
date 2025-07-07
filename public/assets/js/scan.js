document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('scan-message')) {
    handleScanPage();
  }
});

async function handleScanPage() {
  const msg = document.getElementById('scan-message');
  const videoContainer = document.getElementById('video-container');
  const startScanButton = document.getElementById('start-scan');
  const nfcStatus = document.getElementById('nfc-status');

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

  // Initialize NFC scanning if supported
  if ('NDEFReader' in window) {
    const ndef = new NDEFReader();
    ndef.scan().then(() => {
      nfcStatus.textContent = "NFC reader started. Tap an NFC tag.";
      ndef.onreading = event => {
        const message = event.message;
        for (const record of message.records) {
          if (record.recordType === "text") {
            const decoder = new TextDecoder(record.encoding);
            const tagId = decoder.decode(record.data);
            processTag(tagId);
          }
        }
      };
    }).catch(error => {
      nfcStatus.textContent = `NFC scan failed: ${error.message}`;
    });
  } else {
    nfcStatus.textContent = "NFC not supported on this device.";
  }
}

function startQrCodeScanner() {
  try {
    const html5QrCode = new Html5Qrcode("preview");
    html5QrCode.start(
      { facingMode: "environment" }, // Use the back camera
      {
        fps: 10, // frame per second for qr code scanning
        qrbox: 250 // width of scanning box
      },
      (qrMessage) => {
        // Handle successful scan
        processTag(qrMessage);
        html5QrCode.stop().then(() => {
          // QR Code scanning is stopped.
        }).catch(err => {
          // Stop failed, handle it.
        });
      },
      (errorMessage) => {
        // Optional callback for errors
      }
    ).catch(err => {
      // Start failed, handle it.
    });
  } catch (error) {
    console.error("Error initializing QR code scanner:", error);
  }
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
