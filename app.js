const express = require('express');
const app = express();
const axios = require('axios');

app.get('/', (req, res) => {
    res.send('ElectrumX API Server is Running...');
});


const fs = require('fs');


function verifyApiKey(req, res, next) {
    let apiKey = req.header('X-API-Key') || req.query.apiKey || '';
    
    const validApiKeys = JSON.parse(fs.readFileSync('apiKeys.json'));
    const slashIndex = apiKey.indexOf('/');
    if (slashIndex > -1) {
        apiKey = apiKey.substring(0, slashIndex);
        console.log('Extracted API Key:', apiKey);
    }
    

    if (apiKey && Object.values(validApiKeys).includes(apiKey)) {
        next();
    } else {
        res.status(401).send('Invalid API Key!');
    }
}


app.use((req, res, next) => {
    if (req.url.startsWith('/proxy')) {
        const apiKeyParamIndex = req.url.indexOf('?apiKey=');
        if (apiKeyParamIndex > -1) {
            const nextSlashIndex = req.url.indexOf('/', apiKeyParamIndex + '?apiKey='.length);
            req.nextSlashIndex = nextSlashIndex > -1 ? nextSlashIndex : req.url.length;
            console.log("SI: ", req.nextSlashIndex)
            let queryParams = req.url.substring(apiKeyParamIndex, req.nextSlashIndex);
            let pathAfterProxy = req.url.substring(req.nextSlashIndex);
            req.trueUrl = `/proxy${pathAfterProxy}`

            // 重写 URL
            req.url = `/proxy${pathAfterProxy}${queryParams}`;
            console.log("req.url: ", req.url)
        }
    }
    next();
});

app.use(verifyApiKey);


app.use('/proxy', async (req, res) => {
    let targetUrl;

    if (req.nextSlashIndex && req.nextSlashIndex > -1) {
        targetUrl = `http://<ElectumX RPC server IP>:<port>${req.trueUrl}`;
        console.log("target url: ",targetUrl)
    } else {
        targetUrl = `http://<ElectumX RPC server IP>:<port>/proxy`;
    }

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