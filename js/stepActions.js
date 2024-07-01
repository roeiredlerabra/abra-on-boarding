const API_URL = 'https://prod-141.westeurope.logic.azure.com:443/workflows/4f33ac9dab3348378deb3c98f7a6d811/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=n-u7Q4TZ5Dn7u0u2NW3VpK3btXlcIPbCMYYxpuWfUq8'; // Replace with your actual API endpoint

export function sendNoteToApi(itemInternalId, noteText) {
    return fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            itemInternalId: itemInternalId,
            note: noteText
        })
    });
}

export function completeStepApi(currentStepId, nextStepId) {
    return fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            currentStepId: currentStepId,
            nextStepId: nextStepId,
            action: "step completed"
        })
    });
}