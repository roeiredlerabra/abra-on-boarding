document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginFormElement');
    const dashboardWrapper = document.querySelector('.wrapper');
    const loginFormContainer = document.getElementById('loginForm');

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
                    loginFormContainer.style.display = 'none';
                    dashboardWrapper.style.display = 'block';
                    fetchDashboardData();
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
    function fetchDashboardData() {
        fetch('https://prod-101.westeurope.logic.azure.com:443/workflows/bf300bc8879a4537910d9df618ead05c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jMJwQxxi0-aB8Mn0agnl4lFHDg2KHVhwb0H0GgwXarE', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Include any necessary authentication tokens
        })
        .then(response => response.json())
        .then(data => {
            const processedData = processEmployeeData(data);
            createCharts(processedData);
    
            // Add these lines
            const employeeList = processEmployeeList(data);
            displayEmployeeList(employeeList);
        })
        .catch((error) => {
            console.error('Error fetching dashboard data:', error);
        });
    }

    function processEmployeeData(data) {
        const processedData = {
            statusCounts: { 'בוצע': 0, 'בתהליך': 0, 'טרם החל': 0 },
            departmentCounts: {},
            timeline: {},
            stageProgress: {}
        };
    
        // Group data by employee ID (field_0)
        const employeeGroups = data.reduce((groups, item) => {
            const group = (groups[item.field_0] || []);
            group.push(item);
            groups[item.field_0] = group;
            return groups;
        }, {});
    
        Object.values(employeeGroups).forEach(employeeSteps => {
            // Sort steps by field_2 to ensure correct order
            employeeSteps.sort((a, b) => a.field_2 - b.field_2);
            
            const firstStep = employeeSteps[0];
            const lastStep = employeeSteps[employeeSteps.length - 1];
    
            // Determine overall status
            let status;
            if (lastStep.field_5.Value === 'בוצע' && lastStep.field_2 === employeeSteps.length - 1) {
                status = 'בוצע';
            } else if (employeeSteps.some(step => step.field_5.Value === 'בוצע')) {
                status = 'בתהליך';
            } else {
                status = 'טרם החל';
            }
    
            // Count statuses
            processedData.statusCounts[status]++;
    
            // Count departments
            const department = firstStep.field_12;
            processedData.departmentCounts[department] = (processedData.departmentCounts[department] || 0) + 1;
    
            // Process timeline
            const startDate = firstStep.Date;
            if (startDate) {
                const timelineKey = startDate.split('T')[0];
                processedData.timeline[timelineKey] = (processedData.timeline[timelineKey] || 0) + 1;
            }
    
            // Process stage progress
            employeeSteps.forEach(step => {
                const stage = step.field_3;
                if (step.field_5.Value === 'בוצע') {
                    processedData.stageProgress[stage] = (processedData.stageProgress[stage] || 0) + 1;
                }
            });
        });
    
        return processedData;
    }

    function createCharts(data) {
        // Status Chart
        if (Object.values(data.statusCounts).some(count => count > 0)) {
            new Chart(document.getElementById('statusChart'), {
                type: 'bar',  // Changed from 'pie' to 'bar'
                data: {
                    labels: Object.keys(data.statusCounts),
                    datasets: [{
                        label: 'Number of Employees',  // Added label for the dataset
                        data: Object.values(data.statusCounts),
                        backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Onboarding Status'
                        },
                        legend: {
                            display: false  // Usually, bar charts don't need a legend
                        }
                    },
                    scales: {  // Added scales for x and y axes
                        x: {
                            title: {
                                display: true,
                                text: 'Status'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Employees'
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('statusChart').insertAdjacentHTML('afterend', '<p>No status data available</p>');
        }
    
        // Department Chart
        if (Object.keys(data.departmentCounts).length > 0) {
            new Chart(document.getElementById('departmentChart'), {
                type: 'bar',
                data: {
                    labels: Object.keys(data.departmentCounts),
                    datasets: [{
                        label: 'Employees',
                        data: Object.values(data.departmentCounts),
                        backgroundColor: '#007bff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Onboarding by Department'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Employees'
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('departmentChart').insertAdjacentHTML('afterend', '<p>No department data available</p>');
        }
    
        // Timeline Chart
        const sortedDates = Object.keys(data.timeline).sort();
        if (sortedDates.length > 0) {
            new Chart(document.getElementById('timelineChart'), {
                type: 'line',
                data: {
                    labels: sortedDates,
                    datasets: [{
                        label: 'Employees Onboarded',
                        data: sortedDates.map(date => data.timeline[date]),
                        borderColor: '#17a2b8',
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Onboarding Timeline'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Employees'
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('timelineChart').insertAdjacentHTML('afterend', '<p>No timeline data available</p>');
        }
    
        // Stage Progress Chart
        if (Object.keys(data.stageProgress).length > 0) {
            new Chart(document.getElementById('stageProgressChart'), {
                type: 'bar',
                data: {
                    labels: Object.keys(data.stageProgress),
                    datasets: [{
                        label: 'Completed Stages',
                        data: Object.values(data.stageProgress),
                        backgroundColor: '#20c997'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Onboarding Stage Progress'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Employees'
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('stageProgressChart').insertAdjacentHTML('afterend', '<p>No stage progress data available</p>');
        }
    }
    function processEmployeeList(data) {
        const employeeList = [];
        const employeeGroups = data.reduce((groups, item) => {
            const group = (groups[item.field_0] || []);
            group.push(item);
            groups[item.field_0] = group;
            return groups;
        }, {});
    
        Object.entries(employeeGroups).forEach(([employeeId, steps]) => {
            steps.sort((a, b) => a.field_2 - b.field_2);
            const firstStep = steps[0];
            
            let currentStage = 'Done';
            let status = 'בוצע';
            let completedSteps = 0;
    
            for (let i = 0; i < steps.length; i++) {
                if (steps[i].field_5.Value === 'ממתין לביצוע') {
                    currentStage = steps[i].field_3;
                    status = 'בתהליך';
                    break;
                } else if (steps[i].field_5.Value === 'בוצע') {
                    completedSteps++;
                }
            }
    
            if (completedSteps === 0) {
                status = 'טרם החל';
                currentStage = 'Not started';
            }
    
            const percentComplete = (completedSteps / steps.length) * 100;
    
            // Combine first name (field_6) and last name (field_7)
            const fullName = `${firstStep.field_6} ${firstStep.field_7}`;
    
            employeeList.push({
                name: fullName,
                department: firstStep.field_12,
                currentStage: currentStage,
                startDate: firstStep.Date.split('T')[0],
                percentComplete: percentComplete.toFixed(2)
            });
        });
    
        return employeeList;
    }
    
    function displayEmployeeList(employeeList) {
        const tableBody = document.getElementById('employeeListBody');
        tableBody.innerHTML = '';
    
        employeeList.forEach(employee => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = employee.name;
            row.insertCell(1).textContent = employee.department;
            row.insertCell(2).textContent = employee.currentStage;
            row.insertCell(3).textContent = employee.startDate;
            row.insertCell(4).textContent = `${employee.percentComplete}%`;
        });
    }
});