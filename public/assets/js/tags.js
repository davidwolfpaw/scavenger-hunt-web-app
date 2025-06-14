const token = sessionStorage.getItem('adminToken');
fetch('/admin/tags-with-codes', {
    headers: { 'x-admin-token': token }
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) throw new Error(data.error);
    const container = document.getElementById('tags-container');
    container.innerHTML = '';

    data.tags.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.className = 'tag';
      tagElement.innerHTML = `
        <strong>${tag.label || tag.tag_id}</strong><br>
        <img src="${tag.qr}" alt="QR for ${tag.tag_id}" id="qr-${tag.tag_id}"><br>
        <code>${tag.url}</code><br>
        <button onclick="downloadQR('${tag.tag_id}', '${tag.qr}')">Download QR</button>
      `;
      container.appendChild(tagElement);
    });
  })
  .catch(err => {
    document.getElementById('tags-container').innerHTML = 'Error: ' + err.message;
  });

function downloadQR(tagId, qrDataUrl) {
  const link = document.createElement('a');
  link.href = qrDataUrl;
  link.download = `${tagId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
