// @ts-check
"use strict";
const webSocketsServerPort = 1337;
const webSocketServer = require('websocket').server;
const http = require('http');

var server = http.createServer();
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
var wsServer = new webSocketServer({
    httpServer: server
});

/**
 * @typedef {Object} RicovChatMessage
 * @property {number} userId - user id
 * @property {'message' | 'system'} type - message type
 * @property {string} message - message text
 * @property {string} date - message date
 * @property {boolean} modified
 * @property {boolean} deleted
 */

/**
 * @type {RicovChatMessage[]}
 */
let history = [];

/**
 * @typedef {Object} RicovChatUser
 * @property {number} id - user id
 * @property {string} name - user name
 */

/**
 * @type {Object.<string, RicovChatUser>}
 */
const users = {};

var clients = [];

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Generate unique id
 * @returns {number} - Unique id
 */
const uniqueId = (() => {
    let idCounter = 0;

    return () => {
        return ++idCounter;
    }
})();

var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// colors.sort(function(a,b) { return Math.random() > 0.5; } );

wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;
    const id = uniqueId();
    console.log(`ID: ${id}`);

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            if (userName === false) { // first message sent by user is their name
                // remember user name
                userName = htmlEntities(message.utf8Data);
                // get random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
                console.log((new Date()) + ' User is known as: ' + userName
                            + ' with ' + userColor + ' color.');
            } else { // log and broadcast the message
                console.log((new Date()) + ' Received Message from '
                            + userName + ': ' + message.utf8Data);
                
                // we want to keep history of all sent messages
                
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor
                };
                history.push(obj);
                history = history.slice(-100);

                // broadcast message to all connected clients
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            clients.splice(index, 1);
            // // push back user's color to be reused by another user
            // colors.push(userColor);
        }
    });

});