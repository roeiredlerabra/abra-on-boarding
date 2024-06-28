document.addEventListener('DOMContentLoaded', function() {
    const loadingIndicator = document.getElementById('loading');
    const content = document.getElementById('content');
    const errorAlert = document.getElementById('error');
    const employeeCard = document.getElementById('employeeCard');
    const progressBar = document.getElementById('progressBar');
    const details = document.getElementById('details');

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
                        <p class="card-text">Department: ${field_12}</p>
                        <p class="card-text">Start Date: ${Date}</p>
                        <p class="card-text">Email: ${field_10}</p>

                    </div>
                    <div class="col-md-6">

                        <p class="card-text">Personal Email: ${field_9}</p>

                        <p class="card-text">Phone: ${field_8}</p>
                        <p class="card-text">Address: ${field_11}</p>
                        <p class="card-text project">Main Project: ${field_16}</p>
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
            switch(item.field_5.Value) {
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
        const responsible = item.StageResponsible1[0] ? item.StageResponsible1[0].DisplayName : 'Not assigned';
    
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
                <p class="card-text">אחראי: ${responsible}</p>
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
