document.addEventListener('DOMContentLoaded', function () {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const nextButton = document.getElementById('nextStep');
    const prevButton = document.getElementById('prevStep');
    const form = document.getElementById('newEmployeeForm');
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('alert', 'alert-danger');
    alertDiv.style.display = 'none';
    form.prepend(alertDiv);
    const loginForm = document.getElementById('loginForm');
    const mainContent = document.querySelector('.wrapper');
    const loginFormElement = document.getElementById('loginFormElement');


    // Hide main content initially
    mainContent.style.display = 'none';


    // Create login spinner element
    const loginSpinner = document.createElement('div');
    loginSpinner.classList.add('spinner-border', 'text-primary');
    loginSpinner.setAttribute('role', 'status');
    loginSpinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
    loginSpinner.style.display = 'none';
    loginFormElement.appendChild(loginSpinner);

    loginFormElement.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitButton = loginFormElement.querySelector('button[type="submit"]');

        // Show login spinner and disable submit button
        loginSpinner.style.display = 'inline-block';
        submitButton.disabled = true;

        // Send login request to API
        fetch('https://prod-86.westeurope.logic.azure.com:443/workflows/11388c56c87e4424b86ad3abcbf012d1/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=pvYxnmvPdxf74xX5gQHebOf_kwT3zyTkQDkwGxIHfX8', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
            .then(response => {
                if (response.status === 200) {
                    // Login successful
                    loginForm.style.display = 'none';
                    mainContent.style.display = 'flex';
                } else {
                    // Login failed
                    throw new Error('Login failed');
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Login failed. Please try again.');
            })
            .finally(() => {
                // Hide login spinner and re-enable submit button
                loginSpinner.style.display = 'none';
                submitButton.disabled = false;
            });
    });
    // Create a container for the success message and new employee button
    const successContainer = document.createElement('div');
    successContainer.style.display = 'none';
    form.parentNode.insertBefore(successContainer, form.nextSibling);

    // Create a loading spinner
    const spinner = document.createElement('div');
    spinner.classList.add('spinner-border', 'text-primary');
    spinner.setAttribute('role', 'status');
    spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
    spinner.style.display = 'none';
    form.appendChild(spinner);

    // Arrays of required fields for each step
    const requiredFieldsStep1 = ['employeeFirstName', 'employeeLastName', 'employeeEmail', 'employeePhone'];
    const requiredFieldsStep2 = ['employeePosition', 'employeeDepartment', 'startDate'];

    function getFieldLabel(fieldId) {
        const labelElement = document.querySelector(`label[for="${fieldId}"]`);
        return labelElement ? labelElement.textContent : fieldId;
    }

    function validateField(field, errorMessage) {
        if (field.value.trim() === '') {
            field.classList.add('is-invalid');
            return errorMessage;
        } else {
            field.classList.remove('is-invalid');
            return '';
        }
    }

    function validateIsraeliPhoneNumber(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const regex = /^(?:(?:972|0)(?:[23489]|5[0-689]))\d{7}$/;
        return regex.test(cleanPhone);
    }

    function validateEmail(email) {
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return regex.test(email);
    }

    function showAlerts(errorMessages) {
        alertDiv.innerHTML = errorMessages.join('<br>');
        alertDiv.style.display = 'block';
    }

    function hideAlerts() {
        alertDiv.style.display = 'none';
    }

    function validateStep(fields) {
        let errorMessages = [];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const label = getFieldLabel(fieldId);
            const error = validateField(field, `נא למלא את השדה ${label}`);
            if (error) {
                errorMessages.push(error);
            }
        });
        return errorMessages;
    }

    function updateButtonState(button, fields) {
        const isValid = fields.every(fieldId => document.getElementById(fieldId).value.trim() !== '');
        button.disabled = !isValid;
    }

    // Add input event listeners to Step 1 fields
    requiredFieldsStep1.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', () => updateButtonState(nextButton, requiredFieldsStep1));
    });

    // Add input event listeners to Step 2 fields
    requiredFieldsStep2.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', () => updateButtonState(form.querySelector('button[type="submit"]'), requiredFieldsStep2));
    });

    nextButton.addEventListener('click', function () {
        let errorMessages = validateStep(requiredFieldsStep1);

        // Validate phone number
        const phoneField = document.getElementById('employeePhone');
        if (phoneField.value.trim() !== '' && !validateIsraeliPhoneNumber(phoneField.value)) {
            phoneField.classList.add('is-invalid');
            errorMessages.push('נא להזין מספר טלפון ישראלי תקין');
        }

        // Validate email
        const emailField = document.getElementById('employeeEmail');
        if (emailField.value.trim() !== '' && !validateEmail(emailField.value)) {
            emailField.classList.add('is-invalid');
            errorMessages.push('נא להזין כתובת אימייל תקינה');
        }

        if (errorMessages.length === 0) {
            hideAlerts();
            step1.style.display = 'none';
            step2.style.display = 'block';
        } else {
            showAlerts(errorMessages);
        }
    });

    prevButton.addEventListener('click', function () {
        step2.style.display = 'none';
        step1.style.display = 'block';
        hideAlerts();
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        let errorMessages = validateStep(requiredFieldsStep2);
 // Validate mentor email
 const mentorEmailField = document.getElementById('mentorEmail');
 if (mentorEmailField.value.trim() !== '' && !validateEmail(mentorEmailField.value)) {
     mentorEmailField.classList.add('is-invalid');
     errorMessages.push('נא להזין כתובת אימייל תקינה עבור המנטור');
 }

        if (errorMessages.length === 0) {
            hideAlerts();
            submitForm();
        } else {
            showAlerts(errorMessages);
        }
    });

    function submitForm() {
        // Show loading container
        const loadingContainer = document.getElementById('loading-container');
        loadingContainer.style.display = 'block';
        const loadingSteps = document.querySelectorAll('#loading-steps .step');
    
        // Hide form
        form.style.display = 'none';
    
        // Collect all form data
        const formData = new FormData(form);
        const jsonData = {};
    
        for (let [key, value] of formData.entries()) {
            jsonData[key] = value;
        }
        // Add username from login form
        const username = document.getElementById('username').value;
        jsonData.username = username;
        console.log('Sending data:', jsonData);
    
        // Function to update loading steps
        function updateLoadingStep(stepIndex) {
            loadingSteps.forEach((step, index) => {
                if (index === stepIndex) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });
        }
    
        // Simulate step progress
        updateLoadingStep(0);
        setTimeout(() => updateLoadingStep(1), 1000);
        setTimeout(() => updateLoadingStep(2), 2000);
    
        // Send POST request
        fetch('https://prod-119.westeurope.logic.azure.com:443/workflows/b042d076357746619aee30126e5619f3/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RWuE9nuxxQj8NLeGNIKFiTfvk9oI80OPOVB0_jAvMOM', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData),
        })
            .then(response => {
                console.log('Response status:', response.status);
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .then(data => {
                console.log('Success:', data);
                // Update to final step
                updateLoadingStep(3);
                
                // Hide loading container after a short delay
                setTimeout(() => {
                    loadingContainer.style.display = 'none';
                    
                    // Show success message and new employee button
                    successContainer.innerHTML = `
                        <div class="alert alert-success">
                            פתוח לעובד תהליך קליטה חדש באתר: 
                            <a href="https://welcome-ms.netlify.app/?id=${data.id}" target="_blank">
                                https://welcome-ms.netlify.app/?id=${data.id}
                            </a>
                        </div>
                         <iframe src="https://welcome-ms.netlify.app/?id=${data.id}" width="100%" height="600" frameborder="0"></iframe>

                        <button class="btn btn-primary" id="newEmployeeBtn">הגש עובד חדש</button>
                    `;
                    successContainer.style.display = 'block';
    
                    // Add event listener for the new employee button
                    document.getElementById('newEmployeeBtn').addEventListener('click', function () {
                        successContainer.style.display = 'none';
                        form.style.display = 'block';
                        form.reset();
                        step2.style.display = 'none';
                        step1.style.display = 'block';
                        hideAlerts();
                        updateButtonState(nextButton, requiredFieldsStep1);
                        updateButtonState(form.querySelector('button[type="submit"]'), requiredFieldsStep2);
                    });
                }, 1000);
            })
            .catch((error) => {
                console.error('Error:', error);
                loadingContainer.style.display = 'none';
                form.style.display = 'block';
                showAlerts(['An error occurred while submitting the form. Please try again.']);
            });
    }

    // Initialize button states
    updateButtonState(nextButton, requiredFieldsStep1);
    updateButtonState(form.querySelector('button[type="submit"]'), requiredFieldsStep2);
});