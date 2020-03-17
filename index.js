const express = require('express')

const server = express();

server.use(express.json());

server.use((request, response, next) => {
    console.log(
        `Método: ${request.method};
        URL: ${request.url};`)

    return next();
});

server.get('/teste', (request, response) => {

});

server.listen(3000);