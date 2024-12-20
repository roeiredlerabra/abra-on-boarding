document.addEventListener('DOMContentLoaded', function () {
    const loadingIndicator = document.getElementById('loading');
    const content = document.getElementById('content');
    const errorAlert = document.getElementById('error');
    const employeeCard = document.getElementById('employeeCard');
    const progressBar = document.getElementById('progressBar');
    const details = document.getElementById('details');
    const pdfLinks = document.querySelectorAll('.pdf-link');
    const pdfFrame = document.getElementById('pdfFrame');
    const pdfModal = new bootstrap.Modal(document.getElementById('pdfModal'));
    let pdfDoc = null;
    let currentScale = window.innerWidth <= 768 ? 0.5 : 1;
    let currentUrl = '';
    pdfLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const pdfUrl = this.getAttribute('href');
            currentUrl = this.getAttribute('href');

            // Load PDF using PDF.js
            loadPdf(pdfUrl);

            // Show modal
            pdfModal.show();
        });
    });

    function loadPdf(url) {
        // Clear previous content
        pdfFrame.innerHTML = '';

        pdfjsLib.getDocument(url).promise.then(function (pdf) {
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                renderPage(pdf, pageNum);
            }
        });
    }

    function renderPage(pdf, pageNumber) {
        pdf.getPage(pageNumber).then(function (page) {
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


    document.getElementById('downloadPdf').addEventListener('click', function () {
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



    function reloadPdf() {
        pdfFrame.innerHTML = '';
        pdfDoc.getPage(1).then(function (page) {
            renderPage(pdfDoc, 1);
        });
    }

    // Adjust modal content when shown
    document.getElementById('pdfModal').addEventListener('shown.bs.modal', function () {
        const modalBody = this.querySelector('.modal-body');
        pdfFrame.style.height = modalBody.offsetHeight + 'px';
    });

    // Adjust modal content when shown
    document.getElementById('pdfModal').addEventListener('shown.bs.modal', function () {
        const modalBody = this.querySelector('.modal-body');
        pdfFrame.style.height = modalBody.offsetHeight + 'px';
    });

    // Adjust modal content when shown
    document.getElementById('pdfModal').addEventListener('shown.bs.modal', function () {
        const modalBody = this.querySelector('.modal-body');
        pdfFrame.style.height = modalBody.offsetHeight + 'px';
    });

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    const id = getUrlParameter('id');
    const apiUrl = 'https://prod-40.westeurope.logic.azure.com:443/workflows/cc435e41c53f41e6a98b585e8148d435/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OI4xx-jq_dUk13TFCLAj-AhJjrfkzwq3J1ngw8jxFTg'; // Replace with your actual API endpoint

    const postData = { id: id };

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Add any other headers your API requires
        },
        body: JSON.stringify(postData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            loadingIndicator.classList.add('d-none');
            content.classList.remove('d-none');
            const sortedData = data.sort((a, b) => a.field_2 - b.field_2);
            populateEmployeeCard(sortedData[0]);
            populateProgressBar(sortedData);
            updateDetailsForFirstPendingStep(sortedData);
        })
        .catch(error => {
            loadingIndicator.classList.add('d-none');
            errorAlert.classList.remove('d-none');
            console.error('There was a problem with the fetch operation:', error);
        });

    function populateEmployeeCard(employeeInfo) {
        const { Title, field_13, field_14, field_12, field_9, field_10, field_8, field_11, field_16, Date } = employeeInfo;

        employeeCard.innerHTML = `
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h2 class="card-title">${Title}</h2>
                        <p class="card-text">${field_13} (${field_14})</p>
                        <p class="card-text">מחלקה: ${field_12}</p>
                        <p class="card-text">תאריך התחלה: ${Date}</p>
                        <p class="card-text">אימייל ארגוני: ${field_10}</p>

                    </div>
                    <div class="col-md-6">

                        <p class="card-text">אימייל אישי: ${field_9}</p>

                        <p class="card-text">טלפון נייד: ${field_8}</p>
                        <p class="card-text">כתובת: ${field_11}</p>
                        <p class="card-text project">פרוייקט ראשי: ${field_16}</p>
                    </div>
                </div>
            </div>
        `;
    }



    function populateProgressBar(sortedData) {
        progressBar.innerHTML = '';

        sortedData.forEach((item, index) => {
            // Skip the step with index 0
            if (parseInt(item.field_2) === 0) {
                return;
            }

            const stepElement = document.createElement('div');
            stepElement.className = 'process-step';
            stepElement.dataset.title = item.field_3;  // Stage name
            stepElement.dataset.step = item.field_2;   // Stage index

            let stepStatus;
            switch (item.field_5.Value) {
                case 'בוצע':
                    stepStatus = 'completed';
                    break;
                case 'ממתין לביצוע':
                    stepStatus = 'current';
                    break;
                case 'לא בוצע':
                    stepStatus = 'upcoming';
                    break;
                default:
                    stepStatus = 'unknown';
            }
            stepElement.classList.add(stepStatus);

            const progressElement = document.createElement('div');
            progressElement.className = 'progress';
            progressElement.innerHTML = `<div class="progress-bar ${stepStatus === 'completed' ? 'bg-success' : ''}" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>`;
            stepElement.appendChild(progressElement);

            progressBar.appendChild(stepElement);

            stepElement.addEventListener('click', () => updateDetails(item));
        });
    }

    function updateDetails(item) {
        // Handle multiple responsible people
        const responsiblesHtml = item.StageResponsible1 && item.StageResponsible1.length > 0
            ? item.StageResponsible1.map(person => `
                <div class="responsible-user">
                    <img src="img/Untitled design (24).png" alt="${person.DisplayName}" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${person.DisplayName}</div>
                        <div class="user-email">${person.Email}</div>
                    </div>
                </div>
            `).join('')
            : '<div class="no-responsible">Not assigned</div>';

        // Check if field_18 contains data
        let formattedField18 = '';
        if (item.field_18) {
            // Format the field_18 content and add RTL styling
            formattedField18 = formatField18(item.field_18);
        }

        // Split field_19 into individual links if it contains multiple URLs
        const links = item.field_19 ? item.field_19.split(',') : [];

        // Create list items for each link
        const linkItems = links.map(link => `<li><a href="${link.trim()}">${link.trim()}</a></li>`).join('');

        details.innerHTML = `
            <div class="card-body">
                <h3 class="card-title">שלב : ${item.field_3}</h3>
                <div class="responsibles">
                    <p>אחראי:</p>
                    ${responsiblesHtml}
                </div>
                <p class="card-text">סטטוס: ${item.field_5.Value}</p>
                <p class="card-text">תאריך: ${item.Date || ""}</p>
                <div class="card-text info-content" style="direction: rtl;">${formattedField18}</div>
                <ul>${linkItems}</ul>
            </div>
        `;
    }


    function formatField18(content) {
        // Split the content into paragraphs
        const paragraphs = content.split('\n');

        // Initialize variables to track if we are inside a list
        let insideList = false;
        let formattedContent = '';

        // Process each paragraph
        paragraphs.forEach(paragraph => {
            paragraph = paragraph.trim();
            if (paragraph === '') return; // Skip empty paragraphs

            if (paragraph.startsWith('•')) {
                // This is a bullet point
                if (!insideList) {
                    formattedContent += '<ul>';
                    insideList = true;
                }
                formattedContent += `<li>${paragraph.substring(1).trim()}</li>`;
            } else {
                if (insideList) {
                    formattedContent += '</ul>';
                    insideList = false;
                }
                if (paragraph.endsWith(':')) {
                    // This is likely a header
                    formattedContent += `<h4>${paragraph}</h4>`;
                } else {
                    // Regular paragraph
                    formattedContent += `<p>${paragraph}</p>`;
                }
            }
        });

        // Close any open list
        if (insideList) {
            formattedContent += '</ul>';
        }

        // Replace URL placeholders with actual links
        formattedContent = formattedContent.replace(/\[URL\](.*?)\[\/URL\]/g, '<a href="#">$1</a>');
        formattedContent = formattedContent.replace(/\[https?:\/\/[^\]]+\](.*?)\[\/URL\]/g, '<a href="#">$1</a>');

        return formattedContent;
    }


    function updateDetailsForFirstPendingStep(sortedData) {
        const firstPendingStep = sortedData.find(item => item.field_5.Value === 'ממתין לביצוע');
        if (firstPendingStep) {
            updateDetails(firstPendingStep);
        }
    }

});
