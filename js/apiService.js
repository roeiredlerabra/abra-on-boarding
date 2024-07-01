const API_URL = 'https://prod-40.westeurope.logic.azure.com:443/workflows/cc435e41c53f41e6a98b585e8148d435/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OI4xx-jq_dUk13TFCLAj-AhJjrfkzwq3J1ngw8jxFTg';

export function fetchEmployeeData(id) {
    const postData = { id: id };

    return fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}