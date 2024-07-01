let currentScale = window.innerWidth <= 768 ? 0.5 : 1;
let currentUrl = '';

export function loadPdf(url) {
    const pdfFrame = document.getElementById('pdfFrame');
    pdfFrame.innerHTML = '';

    pdfjsLib.getDocument(url).promise.then(function(pdf) {
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            renderPage(pdf, pageNum);
        }
    });
}

function renderPage(pdf, pageNumber) {
    pdf.getPage(pageNumber).then(function(page) {
        var viewport = page.getViewport({ scale: currentScale });

        // Create a canvas element to render the page
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Append the canvas to pdfFrame
        pdfFrame.appendChild(canvas);

        // Render the page on the canvas
        var renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        page.render(renderContext);
    });
}

export function setupPdfListeners() {
    const pdfLinks = document.querySelectorAll('.pdf-link');
    const pdfModal = new bootstrap.Modal(document.getElementById('pdfModal'));

    pdfLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pdfUrl = this.getAttribute('href');
            currentUrl = pdfUrl;
            loadPdf(pdfUrl);
            pdfModal.show();
        });
    });

    document.getElementById('downloadPdf').addEventListener('click', function() {
        fetch(currentUrl)
            .then(response => response.arrayBuffer())
            .then(data => {
                const blob = new Blob([data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'downloaded.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a); // Clean up
                URL.revokeObjectURL(url);
            })
            .catch(() => alert('Could not download PDF'));
    });

    document.getElementById('pdfModal').addEventListener('shown.bs.modal', function () {
        const modalBody = this.querySelector('.modal-body');
        document.getElementById('pdfFrame').style.height = modalBody.offsetHeight + 'px';
    });
}