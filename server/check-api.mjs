import http from 'http';

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/debts',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('API Status Code:', res.statusCode);
            console.log('Items Returned:', parsed.length);
            if (parsed.length > 0) {
                console.log('Sample Item:', parsed[0]);
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw Data:', data.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
});

req.end();
