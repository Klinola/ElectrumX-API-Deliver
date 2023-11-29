const crypto = require('crypto');

function generateApiKey() {
    return crypto.randomBytes(16).toString('hex');
}

console.log("Generated API Key:", generateApiKey());