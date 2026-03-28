$(document).ready(function() {
    let video = document.getElementById('video');
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    let stream = null;
    let scanning = true;
    let history = JSON.parse(localStorage.getItem('qrHistory')) || [];

    // Start camera
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            video.srcObject = stream;
            video.play();
            requestAnimationFrame(scanFrame);
        } catch (err) {
            alert("Camera access denied or not available. Try on a mobile device with camera.");
        }
    }

    function scanFrame() {
        if (!scanning || !video.videoWidth) {
            requestAnimationFrame(scanFrame);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            handleScanResult(code.data);
            // Pause scanning briefly after success
            scanning = false;
            setTimeout(() => { scanning = true; }, 1500);
        }

        requestAnimationFrame(scanFrame);
    }

    function handleScanResult(data) {
        const resultHTML = `
            <div class="d-flex justify-content-between">
                <div>
                    <strong>Scanned:</strong><br>
                    <span class="text-break">${data}</span>
                </div>
                <button onclick="copyToClipboard('${data.replace(/'/g, "\\'")}')" class="btn btn-sm btn-light">Copy</button>
            </div>
            <div class="mt-2">
                ${data.startsWith('http') ? `<a href="${data}" target="_blank" class="btn btn-sm btn-primary">Open Link</a>` : ''}
            </div>
        `;
        $('#scanResult').html(resultHTML).removeClass('d-none');

        // Save to history
        addToHistory(data);
    }

    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    function addToHistory(data) {
        const entry = {
            id: Date.now(),
            text: data,
            time: new Date().toLocaleString()
        };
        history.unshift(entry);
        if (history.length > 50) history.pop();
        localStorage.setItem('qrHistory', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const $list = $('#historyList');
        $list.empty();
        history.forEach(item => {
            const $item = $(`
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <small class="text-muted">${item.time}</small><br>
                        <span class="text-break">${item.text}</span>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="copyToClipboard('${item.text.replace(/'/g, "\\'")}')">Copy</button>
                </div>
            `);
            $list.append($item);
        });
    }

    // Generate QR
    $('#generateQRBtn').on('click', function() {
        const text = $('#qrText').val().trim();
        if (!text) return alert("Please enter some text or URL");

        const fg = $('#fgColor').val();
        const bg = $('#bgColor').val();

        $('#generatedQR').empty();

        const qr = new QRCode($('#generatedQR')[0], {
            text: text,
            width: 280,
            height: 280,
            colorDark: fg,
            colorLight: bg,
            correctLevel: QRCode.CorrectLevel.H
        });

        $('#downloadQR').removeClass('d-none').off('click').on('click', function() {
            const canvas = $('#generatedQR canvas')[0];
            if (canvas) {
                const link = document.createElement('a');
                link.download = 'qr-code.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        });
    });

    // Gallery scan
    $('#scanFromGallery').on('click', function() {
        $('#galleryInput').click();
    });

    $('#galleryInput').on('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    handleScanResult(code.data);
                } else {
                    alert("No QR/Barcode found in the image.");
                }
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Flashlight simulation (note: real torch needs advanced API, here we toggle a class)
    $('#toggleFlash').on('click', function() {
        alert("Flashlight simulation: In a real mobile app this would turn on the torch. On web it's limited by browser.");
    });

    // Initialize
    startCamera();
    renderHistory();

    // Dark mode toggle example (add a button if needed)
    $('body').addClass('dark-mode'); // Optional: start in dark for modern feel
});
