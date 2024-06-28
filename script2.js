document.addEventListener('DOMContentLoaded', function() {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const nextButton = document.getElementById('nextStep');
    const prevButton = document.getElementById('prevStep');
    const form = document.getElementById('newEmployeeForm');
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('alert', 'alert-danger');
    alertDiv.style.display = 'none';
    form.prepend(alertDiv);

    // Arrays of required fields for each step
    const requiredFieldsStep1 = ['employeeFirstName', 'employeeLastName', 'employeeEmail', 'employeePhone'];
    const requiredFieldsStep2 = ['employeeAddress', 'employeePosition', 'employeeDepartment', 'startDate'];

    function getFieldLabel(fieldId) {
        const labelElement = document.querySelector(`label[for="${fieldId}"]`);
        return labelElement ? labelElement.textContent : fieldId;
    }

    function validateStep(fields) {
        let isValid = true;
        let emptyFields = [];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field.value.trim() === '') {
                field.classList.add('is-invalid');
                isValid = false;
                emptyFields.push(getFieldLabel(fieldId));
            } else {
                field.classList.remove('is-invalid');
            }
        });

        if (!isValid) {
            alertDiv.innerHTML = `נא למלא את השדות הבאים: ${emptyFields.join(', ')}`;
            alertDiv.style.display = 'block';
        } else {
            alertDiv.style.display = 'none';
        }

        return isValid;
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

    nextButton.addEventListener('click', function() {
        if (validateStep(requiredFieldsStep1)) {
            const phoneField = document.getElementById('employeePhone');
            const emailField = document.getElementById('employeeEmail');
            let isValid = true;

            if (!validateIsraeliPhoneNumber(phoneField.value)) {
                phoneField.classList.add('is-invalid');
                alertDiv.innerHTML = 'נא להזין מספר טלפון ישראלי תקין';
                isValid = false;
            } else {
                phoneField.classList.remove('is-invalid');
            }

            if (!validateEmail(emailField.value)) {
                emailField.classList.add('is-invalid');
                alertDiv.innerHTML = alertDiv.innerHTML ? 
                    alertDiv.innerHTML + '<br>נא להזין כתובת אימייל תקינה' : 
                    'נא להזין כתובת אימייל תקינה';
                isValid = false;
            } else {
                emailField.classList.remove('is-invalid');
            }

            if (isValid) {
                alertDiv.style.display = 'none';
                step1.style.display = 'none';
                step2.style.display = 'block';
            } else {
                alertDiv.style.display = 'block';
            }
        }
    });

    prevButton.addEventListener('click', function() {
        step2.style.display = 'none';
        step1.style.display = 'block';
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateStep(requiredFieldsStep2)) {
            // Collect all form data
            const formData = new FormData(form);
            const jsonData = {};
            
            for (let [key, value] of formData.entries()) {
                jsonData[key] = value;
            }
    
            console.log('Sending data:', jsonData);
    
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
                    return { success: true };
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .then(data => {
                console.log('Success:', data);
                alertDiv.innerHTML = 'Form submitted successfully!';
                alertDiv.classList.remove('alert-danger');
                alertDiv.classList.add('alert-success');
                alertDiv.style.display = 'block';
                form.reset();
            })
            .catch((error) => {
                console.error('Error:', error);
                alertDiv.innerHTML = 'An error occurred while submitting the form. Please try again.';
                alertDiv.classList.remove('alert-success');
                alertDiv.classList.add('alert-danger');
                alertDiv.style.display = 'block';
            });
        }
    });
});