import { sendNoteToApi, completeStepApi } from './stepActions.js';
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}
export function populateEmployeeCard(employeeInfo) {
    const {
        Title = "אין ערך זמין",
        field_13 = "אין ערך זמין",
        field_14 = "אין ערך זמין",
        field_12 = "אין ערך זמין",
        field_9 = "אין ערך זמין",
        field_10 = "אין ערך זמין",
        field_8 = "אין ערך זמין",
        field_16 = "אין ערך זמין",
        field_17 = "אין ערך זמין",
        Date = null,
        Mentor = null
    } = employeeInfo;

    const employeeCard = document.getElementById('employeeCard');
    const formattedStartDate = Date ? formatDate(Date) : "אין ערך זמין";

    const getValueOrDefault = (value) => value && value.trim() !== "" ? value : "אין ערך זמין";

    // Check if mentor data is available and not empty
    const isMentorDataAvailable = Mentor && 
        (Mentor.DisplayName || Mentor.Email) &&
        (Mentor.DisplayName !== "אין ערך זמין" || Mentor.Email !== "אין ערך זמין");

    employeeCard.innerHTML = `
    <div class="card-header">
        <div class="user-info">
            <h2>${getValueOrDefault(Title)}</h2>
            <div style="display: inline-block;direction: rtl;">
                <p style="display: inline;">${getValueOrDefault(field_13)}</p>
                <p style="display: inline;">(${getValueOrDefault(field_14)})</p>
            </div>
        </div>
        <img src="img/user.svg" alt="User Image" class="user-image">
    </div>
    <div class="card-body1" dir="rtl">
        <div class="info-column">
            <p><strong>מחלקה:</strong> ${getValueOrDefault(field_12)}</p>
            <p><strong>תאריך התחלה:</strong> ${formattedStartDate}</p>
            <p><strong>אימייל ארגוני:</strong> ${getValueOrDefault(field_10)}</p>
            <p><strong>אימייל אישי:</strong> ${getValueOrDefault(field_9)}</p>
           
        </div>
        <div class="info-column">
         <p><strong>טלפון נייד:</strong> ${getValueOrDefault(field_8)}</p>
            <p><strong>פרוייקט ראשי:</strong> ${getValueOrDefault(field_16)}</p>
            <p><strong>מנהל ישיר:</strong> ${getValueOrDefault(field_17)}</p>
            ${isMentorDataAvailable ? `
            <div class="mentor-info">
                <strong class="mentor-label">מנטור:</strong>
                <div class="mentor-details">
                    <img src="${ 'img/Untitled design (24).png'}" alt="Mentor" class="mentor-image">
                    <div class="mentor-text">
                        <p><strong>${getValueOrDefault(Mentor.DisplayName)}</strong></p>

                        <p>${getValueOrDefault(Mentor.Email)}</p>
                        <p>${getValueOrDefault(Mentor.JobTitle)}</p>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
    `;
}

export function populateProgressBar(sortedData, updateDetailsCallback) {
    const progressBar = document.getElementById('progressBar');
    progressBar.innerHTML = '';

    sortedData.forEach((item, index) => {
        if (parseInt(item.field_2) === 0) return;

        const stepElement = document.createElement('div');
        stepElement.className = 'process-step';
        stepElement.dataset.title = item.field_3;
        stepElement.dataset.step = item.field_2;

        let stepStatus;
        switch (item.field_5.Value) {
            case 'בוצע': stepStatus = 'completed'; break;
            case 'ממתין לביצוע': stepStatus = 'current'; break;
            case 'לא בוצע': stepStatus = 'upcoming'; break;
            default: stepStatus = 'unknown';
        }
        stepElement.classList.add(stepStatus);

        const progressElement = document.createElement('div');
        progressElement.className = 'progress';
        progressElement.innerHTML = `<div class="progress-bar ${stepStatus === 'completed' ? 'bg-success' : ''}" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>`;
        stepElement.appendChild(progressElement);

        progressBar.appendChild(stepElement);

        stepElement.addEventListener('click', () => updateDetailsCallback(item, sortedData));
    });
}

export function updateDetails(item, sortedData) {
    const details = document.getElementById('details');
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

    let formattedField18 = item.field_18 ? formatField18(item.field_18) : '';

    const links = item.field_19 ? item.field_19.split(',') : [];
    const linkItems = links.map(link => `<li><a href="${link.trim()}">${link.trim()}</a></li>`).join('');
    const showAddNoteButton = !item.EmployeeNote;
    const showEditNoteButton = item.EmployeeNote;
    const showCompleteStepButton = item.field_5.Value !== 'בוצע' && item.field_5.Value == 'ממתין לביצוע';
    const formattedDate = formatDate(item.Date);
    details.innerHTML = `
        <div class="card-body">
            <h3 class="card-title">שלב : ${item.field_3}</h3>
            <div class="responsibles">
                <p>אחראי:</p>
                ${responsiblesHtml}
            </div>
            <p class="card-text">סטטוס: ${item.field_5.Value}</p>
            <p class="card-text">תאריך: ${formattedDate}</p>
            <hr class="separator">
            <div class="card-text info-content" style="direction: rtl;">${formattedField18}</div>
            <ul>${linkItems}</ul>
            ${item.EmployeeNote ? `<p class="employee-note">הערת עובד: ${item.EmployeeNote}</p>` : ''}
            <hr class="separator">
             <div class="action-buttons">
                ${showAddNoteButton ? `
                    <button class="btn btn-primary noteBtn" data-itemid="${item.ItemInternalId}">
                        <i class="fas fa-sticky-note"></i> הוסף הערה
                    </button>
                ` : ''}
                ${showEditNoteButton ? `
                    <button class="btn btn-secondary editNoteBtn" data-itemid="${item.ItemInternalId}">
                        <i class="fas fa-edit"></i> ערוך הערה
                    </button>
                ` : ''}
                ${showCompleteStepButton ? `
                    <button class="btn btn-success completeStepBtn" data-itemid="${item.ItemInternalId}">
                        <i class="fas fa-check"></i> סיים שלב
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

export function updateDetailsForFirstPendingStep(sortedData) {
    const firstPendingStep = sortedData.find(item => item.field_5.Value === 'ממתין לביצוע');
    if (firstPendingStep) {
        updateDetails(firstPendingStep, sortedData);
        
        // Auto-scroll to the first pending step in the progress bar
        const stepElement = document.querySelector(`.process-step[data-step="${firstPendingStep.field_2}"]`);
        if (stepElement) {
            stepElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }
    }
}

export function setupEventListeners(sortedData) {
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('noteBtn') || event.target.closest('.noteBtn')) {
            const button = event.target.classList.contains('noteBtn') ? event.target : event.target.closest('.noteBtn');
            const itemInternalId = button.dataset.itemid;
            openNotePopup(itemInternalId);
        } else if (event.target.classList.contains('editNoteBtn') || event.target.closest('.editNoteBtn')) {
            const button = event.target.classList.contains('editNoteBtn') ? event.target : event.target.closest('.editNoteBtn');
            const itemInternalId = button.dataset.itemid;
            openEditNotePopup(itemInternalId, sortedData);
        } else if (event.target.classList.contains('completeStepBtn') || event.target.closest('.completeStepBtn')) {
            const button = event.target.classList.contains('completeStepBtn') ? event.target : event.target.closest('.completeStepBtn');
            const itemInternalId = button.dataset.itemid;
            completeStep(itemInternalId, sortedData);
        }
    });
}

function openNotePopup(itemInternalId, existingNote = '') {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h4>${existingNote ? 'ערוך הערה' : 'הוסף הערה'}</h4>
            <textarea id="noteText" class="note-textarea" rows="4" style="direction: rtl;">${existingNote}</textarea>
            <div class="popup-buttons">
                <button id="saveNote" class="btn btn-primary" ${existingNote ? '' : 'disabled'}>שמור</button>
                <button id="closePopup" class="btn btn-secondary">סגור</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    const noteTextarea = document.getElementById('noteText');
    const saveNoteButton = document.getElementById('saveNote');

    noteTextarea.addEventListener('input', () => {
        updateSaveButtonState(noteTextarea, saveNoteButton);
    });

    saveNoteButton.addEventListener('click', () => saveNote(itemInternalId));
    document.getElementById('closePopup').addEventListener('click', () => document.body.removeChild(popup));
}
function openEditNotePopup(itemInternalId, sortedData) {
    const item = sortedData.find(item => item.ItemInternalId === itemInternalId);
    if (item && item.EmployeeNote) {
        openNotePopup(itemInternalId, item.EmployeeNote);
    }
}
function updateSaveButtonState(textarea, button) {
    // Trim the textarea value to remove leading/trailing whitespace and newlines
    const trimmedValue = textarea.value.trim();

    // Enable the button only if there's non-whitespace content
    button.disabled = trimmedValue.length === 0;
}
function saveNote(itemInternalId) {
    const noteText = document.getElementById('noteText').value;
    if (noteText.trim() !== '') {
        sendNoteToApi(itemInternalId, noteText)
            .then(response => {
                if (response.status === 200) {
                    alert('ההערה נשמרה בהצלחה');
                    document.body.removeChild(document.querySelector('.popup'));
                    location.reload(); // Refresh the page
                } else {
                    alert('שגיאה בשמירת ההערה');
                }
            })
            .catch(error => {
                console.error('Error saving note:', error);
                alert('שגיאה בשמירת ההערה');
            });
    }
}

function completeStep(currentItemInternalId, sortedData) {
    const currentStepIndex = sortedData.findIndex(item => item.ItemInternalId === currentItemInternalId);
    const nextStep = sortedData[currentStepIndex + 1];
    const nextStepId = nextStep ? nextStep.ItemInternalId : null;

    completeStepApi(currentItemInternalId, nextStepId)
        .then(response => {
            if (response.status === 200) {
                alert('השלב הושלם בהצלחה');
                location.reload(); // Refresh the page
            } else {
                alert('שגיאה בהשלמת השלב');
            }
        })
        .catch(error => {
            console.error('Error completing step:', error);
            alert('שגיאה בהשלמת השלב');
        });
}

function formatField18(content) {
    const paragraphs = content.split('\n');
    let insideList = false;
    let formattedContent = '';

    paragraphs.forEach(paragraph => {
        paragraph = paragraph.trim();
        if (paragraph === '') return;

        if (paragraph.startsWith('•')) {
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

            // Handle single words with * as <h4> and keep other text as is
            if (paragraph.startsWith('*') && paragraph.endsWith('*') && paragraph.split(' ').length === 1) {
                formattedContent += `<h4>${paragraph.slice(1, -1).trim()}</h4>`;
            } else {
                paragraph = paragraph.replace(/\*(\S.*?)\*/g, '<h4>$1</h4>');
                formattedContent += `<p>${paragraph}</p>`;
            }
        }
    });

    if (insideList) {
        formattedContent += '</ul>';
    }

    formattedContent = formattedContent.replace(/\[URL\](.*?)\[\/URL\]/g, '<a href="#">$1</a>');
    formattedContent = formattedContent.replace(/\[https?:\/\/[^\]]+\](.*?)\[\/URL\]/g, '<a href="#">$1</a>');

    return formattedContent;
}



