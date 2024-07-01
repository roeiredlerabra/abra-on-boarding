import { loadPdf, setupPdfListeners } from './pdfHandler.js';
import { fetchEmployeeData } from './apiService.js';
import { 
    populateEmployeeCard, 
    populateProgressBar, 
    updateDetailsForFirstPendingStep, 
    updateDetails,
    setupEventListeners  // Import the new function
} from './uiUpdater.js';
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
            
            // Update this line to pass both updateDetails and sortedData
            populateProgressBar(sortedData, (item) => updateDetails(item, sortedData));
            
            updateDetailsForFirstPendingStep(sortedData);
            
            // Add this line to set up the event listeners for the new buttons
            setupEventListeners(sortedData);
        })
        .catch(error => {
            loadingIndicator.classList.add('d-none');
            errorAlert.classList.remove('d-none');
            console.error('There was a problem with the fetch operation:', error);
        });

    // Add any global event listeners or initializations here
    window.addEventListener('resize', handleResize);
});

// Add any additional functions needed for the main script
function handleResize() {
    // Handle any resize-related updates
    // For example, you might need to adjust the PDF viewer size
    const pdfFrame = document.getElementById('pdfFrame');
    if (pdfFrame) {
        const modalBody = document.querySelector('#pdfModal .modal-body');
        if (modalBody) {
            pdfFrame.style.height = modalBody.offsetHeight + 'px';
        }
    }
}

// If you need any global state or variables, declare them here
let currentStep = null;

// Export any functions or variables that might be needed in other modules
export { currentStep };