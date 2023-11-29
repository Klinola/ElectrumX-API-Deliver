const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('ElectrumX API Server is Running...');
});


const express = require('express');
const fs = require('fs');


function verifyApiKey(req, res, next) {
    const apiKey = req.header('X-API-Key');
    const validApiKeys = JSON.parse(fs.readFileSync('apiKeys.json'));

    if (apiKey && Object.values(validApiKeys).includes(apiKey)) {
        next(); 
    } else {
        res.status(401).send('Invalid API key!');
    }
}

app.use(verifyApiKey);

app.use('/proxy', async (req, res) => {
    try {
        const electrumxResponse = await axios.get(`http://<server-ip-address>:<port>${req.url}`);
        res.send(electrumxResponse.data);
    } catch (error) {
        res.status(500).send('ElectrumX Server request failed');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});