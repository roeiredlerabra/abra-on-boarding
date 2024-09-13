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
                const monthKey = startDate.substr(0, 7); // Extract YYYY-MM from YYYY-MM-DD
                processedData.timeline[monthKey] = (processedData.timeline[monthKey] || 0) + 1;
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
                        backgroundColor: '#17a2b8'
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
        const sortedMonths = Object.keys(data.timeline).sort();
        if (sortedMonths.length > 0) {
            new Chart(document.getElementById('timelineChart'), {
                type: 'bar',
                data: {
                    labels: sortedMonths.map(monthKey => {
                        const [year, month] = monthKey.split('-');
                        return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
                    }),
                    datasets: [{
                        label: 'Employees Onboarded',
                        data: sortedMonths.map(month => data.timeline[month]),
                        borderColor: '#17a2b8',
                        fill: false,
                        backgroundColor: [
                            '#6c757d', // Grey
                            '#ff5733', // Coral
                            '#33ff57', // Light Green
                            '#28a745', // Green
                            '#ffc107', // Yellow
                            '#dc3545', // Red
                            '#007bff', // Blue
                            '#6610f2', // Purple
                            '#6f42c1', // Indigo
                            '#e83e8c', // Pink
                            '#fd7e14', // Orange
                            '#20c997', // Teal
                            '#17a2b8', // Cyan
                            '#343a40', // Dark
                            '#6c757d', // Grey
                            '#ff5733', // Coral
                            '#33ff57', // Light Green
                            '#ff33ff', // Magenta
                            '#33ccff', // Light Blue
                            '#ffcc33', // Light Orange
                            '#cc33ff', // Violet
                            '#33ffcc', // Aqua
                            '#ffd700', // Gold
                            '#ff69b4', // Hot Pink
                            '#98fb98', // Pale Green
                            '#ffa07a', // Light Salmon
                            '#9370db'  // Medium Purple
                          ]
                          
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monthly Onboarding Timeline'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Month'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Employees'
                            },
                            ticks: {
                                stepSize: 1
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