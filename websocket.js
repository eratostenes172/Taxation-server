"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = "TaxationServer";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Importing the dependencies
require("dotenv").config();

var WebSocket = require("ws"),
    http = require("http"),
    fs = require('fs'),
    express = require("express"),
    bodyParser = require("body-parser");

// Defining the Express app
var app = express();

// Global variables
var usersTemp = [];

// Configure bodyParser to convert the body of our requests to JSON
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb', }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});



/*Helper function for validate token*/
function tokenIsValid(token) {
    const options = {
        url: process.env.URL_TOKEN_VERIFICATION,
        method: "POST",
        headers: {
            Authorization: 'Bearer ' + token
        }
    };
    return new Promise(function(resolve, reject) {
        request(options, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                var jsonBody = JSON.parse(body);
                if (jsonBody.cdgo_rspsta !== 0) {
                    resolve(false);
                } else {
                    var user = jsonBody.usrio;
                    user.token = token;
                    usersTemp.push(user);
                    resolve(true);
                }
            } else {
                reject(false);
            }
        });
    });
}

function userNotification(idUsrio, message) {
    wsServer.clients.forEach(function(client) {
        if (client.usuario.id_usrio == idUsrio) {
            client.send(JSON.stringify(message));
        }
    });
}

function userDelete(idUsrio) {
    wsServer.clients.forEach(function(client) {
        if (client.usuario.id_usrio == idUsrio) {
            client.terminate();
        }
    });
}

function showUsers() {
    console.log("=============================================================");
    console.log("Total clients: ", wsServer.clients.size);
    wsServer.clients.forEach(function each(client) {
        console.log("Nombre: " + client.usuario.nmbre_trcro + " Client.ID: " + client.usuario.id_usrio);
    });
    console.log("=============================================================");
}

var server = http.createServer({}, app).listen(3000, () => {
    console.log(new Date() + " Server is listening on port " + 3000);
});

// WebSocket server
var wsServer = new WebSocket.Server({
    server,
    clientTracking: true,
    verifyClient: async function(info, done) {
        const params = url.parse(info.req.url, true).query;
        console.log('params', params);
        //Validate the token
        var valid = await tokenIsValid(params.token);
        if (valid) {
            done(true);
        } else {
            done(false, 403, "Not valid token");
        }
    }
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on("connection", function(socket, request) {
    console.log('Conexion entrante: ' + socket);
    const params = url.parse(request.url, true).query;
    socket.id = params.token;

    //Find the token
    socket.usuario = usersTemp.find(usuario => usuario.token === socket.id);

    //Delete user from temporal array
    usersTemp.splice(usersTemp.findIndex(usuario => usuario.token === socket.id), 1);
    showUsers();
    socket.on('close', function() {
        showUsers();
    });
});