const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('ElectrumX API Server is Running...');
});


const fs = require('fs');


function verifyApiKey(req, res, next) {
    const apiKey = req.header('X-API-Key') || req.query.apiKey;
    const validApiKeys = JSON.parse(fs.readFileSync('apiKeys.json'));

    if (apiKey && Object.values(validApiKeys).includes(apiKey)) {
        next();
    } else {
        res.status(401).send('Invalid API Key!');
    }
}

app.use((req, res, next) => {
    if (req.url.startsWith('/proxy')) {
        const apiKeyIndex = req.url.indexOf('?apiKey=');
        if (apiKeyIndex > -1) {
            const path = req.url.substring(0, apiKeyIndex);
            const queryParams = req.url.substring(apiKeyIndex);
            req.url = path.replace('/proxy', '') + queryParams;
        }
    }
    next();
});


app.use(verifyApiKey);


app.use('/proxy', async (req, res) => {
    const targetUrl = `http://<elextrumx-rpc-ip>:<port>${req.url}`;
    try {
        const electrumxResponse = await axios.get(targetUrl);
        res.send(electrumxResponse.data);
    } catch (error) {
        console.log('Error:', error);
        res.status(500).send('ElectrumX server request failed');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});