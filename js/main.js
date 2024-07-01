import { loadPdf, setupPdfListeners } from './pdfHandler.js';
import { fetchEmployeeData } from './apiService.js';
import { populateEmployeeCard, populateProgressBar, updateDetailsForFirstPendingStep, updateDetails } from './uiUpdater.js';
import { getUrlParameter } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const loadingIndicator = document.getElementById('loading');
    const content = document.getElementById('content');
    const errorAlert = document.getElementById('error');

    setupPdfListeners();

    const id = getUrlParameter('id');
    fetchEmployeeData(id)
        .then(data => {
            loadingIndicator.classList.add('d-none');
            content.classList.remove('d-none');
            const sortedData = data.sort((a, b) => a.field_2 - b.field_2);
            populateEmployeeCard(sortedData[0]);
            populateProgressBar(sortedData, updateDetails);
            updateDetailsForFirstPendingStep(sortedData);
        })
        .catch(error => {
            loadingIndicator.classList.add('d-none');
            errorAlert.classList.remove('d-none');
            console.error('There was a problem with the fetch operation:', error);
        });
});