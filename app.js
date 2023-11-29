const express = require('express');
const app = express();
const axios = require('axios');
const path = require('path');
const fs = require('fs');


//Logs
const logsDir = path.join(__dirname, 'logs');
const usageDir = path.join(logsDir, 'usage');
const errorDir = path.join(logsDir, 'error')
if (!fs.existsSync(logsDir)){
    fs.mkdirSync(logsDir, { recursive: true });
}
if (!fs.existsSync(usageDir)){
    fs.mkdirSync(usageDir, { recursive: true });
}
if (!fs.existsSync(errorDir)){
    fs.mkdirSync(errorDir, { recursive: true });
}


function logRequest(req) {
    const username = req.username || 'unknown';
    const userLogFile = path.join(usageDir, `${username}.log`);

    fs.readFile(userLogFile, 'utf8', (err, data) => {
        let requestCount = 0;
        if (!err) {
            numIndex = data.indexOf("Total Requests: ")+ "Total Requests: ".length
            requestCount = parseInt(data.substring(numIndex), 10) || 0;
        }

        requestCount++;
        const logEntry = `${new Date().toISOString()} - User: ${username} - Path: ${req.path} - Total Requests: ${requestCount}\n`;
        fs.appendFile(userLogFile, logEntry, (error) => {
            if (error) {
                console.error('Count Log Write Failed:', error);
            }
        });
        fs.appendFile(path.join(logsDir, 'all-requests.log'), logEntry, (error) => {
            if (error) {
                console.error('Request Log Write Failed:', error);
            }
        });
    });
}


app.use(express.json());
app.get('/', (req, res) => {
    res.send('ElectrumX API Server is Running...');
});





function verifyApiKey(req, res, next) {
    let apiKey = req.header('X-API-Key') || req.query.apiKey || '';
    
    const validApiKeys = JSON.parse(fs.readFileSync('apiKeys.json'));
    const slashIndex = apiKey.indexOf('/');
    
    if (slashIndex > -1) {
        apiKey = apiKey.substring(0, slashIndex);
        const username = Object.keys(validApiKeys).find(user => validApiKeys[user] === apiKey);
        req.username = username;
        console.log(`\x1b[1;36m${new Date().toISOString()} Hello: \x1b[0m`, username);
        logRequest(req);
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
            
            let queryParams = req.url.substring(apiKeyParamIndex, req.nextSlashIndex);
            let pathAfterProxy = req.url.substring(req.nextSlashIndex);
            req.trueUrl = `/proxy${pathAfterProxy}`

            // rewrite URL
            req.url = `/proxy${pathAfterProxy}${queryParams}`;
        }
    }
    next();
});

app.use(verifyApiKey);


app.use('/proxy', async (req, res) => {
    let targetUrl;

    if (req.nextSlashIndex && req.nextSlashIndex > -1) {
        targetUrl = `http://127.0.0.1:50002${req.trueUrl}`;
        console.log("target url: ",targetUrl)
    } else {
        targetUrl = `http://127.0.0.1:50002/proxy`;
    }
    
    try {
        let electrumxResponse;
        if (req.method === 'POST') {
            electrumxResponse = await axios.post(targetUrl, req.body);
        } else { // default GET
            electrumxResponse = await axios.get(targetUrl);
        }

        res.send(electrumxResponse.data);
    } catch (error) {
        console.log(`\x1b[31mError at ${new Date().toISOString()}\x1b[0m`);
        const errorLog = `${new Date().toISOString()} - ${error}\n`;
        fs.appendFile(path.join(__dirname, `logs/error/${req.username}-${new Date().toISOString()}.log`), errorLog, (error) => {
            if (error) {
                console.error('Error Log Write Failed:', error);
            }
        });
        res.status(500).send('ElectrumX server request failed');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});
