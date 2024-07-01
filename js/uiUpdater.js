export function populateEmployeeCard(employeeInfo) {
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

export function populateProgressBar(sortedData) {
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

export function updateDetails(item) {
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

export function updateDetailsForFirstPendingStep(sortedData) {
    const firstPendingStep = sortedData.find(item => item.field_5.Value === 'ממתין לביצוע');
    if (firstPendingStep) {
        updateDetails(firstPendingStep);
    }
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