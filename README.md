# ElectrumX-API-Deliver
A JS scirpt to manage the ElectrumX server API. 

Prerequisites
```
sudo apt install nodejs npm -y
npm install express axios nodemon
```

Change the `targeUrl` in `app.js` to your ElectrumX server 

The api keys are stored manually on `apiKey.json`, and here is an example 

```
{
    "user1": "c1ed192d3927d0236992838ce85516ef",
    "user2": "<another apikey>"
}
```

You can use `generateApiKey.js` to generate a new key or use your own one. 
The usage of `generateApiKey.js` is 
```
node generateApiKey.js
```

and you should copy the key to the `apiKey.json` and set a username for it. 


### Use the following command to start the API server 
```
nodemon
```

An example URL GET query would be like (replace the ip address with your own one)
```
http://127.0.0.1:3000/proxy?apiKey=c1ed192d3927d0236992838ce85516ef
``` 

