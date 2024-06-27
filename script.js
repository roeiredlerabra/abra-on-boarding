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
        employeeCard.innerHTML = `
            <div class="card-body">
                <h2 class="card-title">${employeeInfo.Title}</h2>
                <p class="card-text">${employeeInfo.field_13} (${employeeInfo.field_14})</p>
                <p class="card-text">Department: ${employeeInfo.field_12}</p>
                <p class="card-text">Email: ${employeeInfo.field_10}</p>
                <p class="card-text">Phone: ${employeeInfo.field_8}</p>
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
        details.innerHTML = `
            <div class="card-body">
                <h3 class="card-title">Current Stage: ${item.field_3}</h3>
                <p class="card-text">Responsible: ${responsible}</p>
                <p class="card-text">Status: ${item.field_5.Value}</p>
                <p class="card-text">Info: ${item.field_18}</p>
            </div>
        `;
    }

    function updateDetailsForFirstPendingStep(sortedData) {
        const firstPendingStep = sortedData.find(item => item.field_5.Value === 'ממתין לביצוע');
        if (firstPendingStep) {
            updateDetails(firstPendingStep);
        }
    }
});