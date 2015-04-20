var express = require('express');
var app = express();

var http = require('http').Server(app);
var socket_io = require('socket.io');
var io = socket_io(http);
var util = require('util');

var users = require('./users');
var logger = require('./logger');
var messages = require('./messages');

function clone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;
    var temp = new obj.constructor();
    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

app.use('/static', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    logger.log('[New HTTP connection]');
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    logger.log('[New socket created]', socket.id);

    var user;

    socket.on('user joined', function(userInfo) {
        user = users.addUser(userInfo, socket).userInfo;
        logger.log('[User joined]', user.name);
    });

    socket.on('chat message', function(msg) {
        if (!user) {
            socket.emit('user not joined');
            return;
        }
        messages.addMessage(msg, clone(user), socket.id);
        logger.log('[New message]', '[from: ' + user.name + ' ]', msg.message);
        socket.broadcast.emit('new message', {
            timestamp: msg.timestamp,
            message: msg.message,
            socket_id: socket.id,
            user: user
        });
    });

    socket.on('chat get', function(params) {
        var msgs = messages.getMessages(params.count, params.offset, params.name, params.socket_id);
        socket.emit('chat loaded', msgs);
    });

    socket.on('user name changed', function (new_name) {
        if (!new_name.length) {
            return;
        }
        var old_name = user.name;
        user = users.changeName(socket.id, new_name).userInfo;
        logger.log('[User name has been changed]', old_name, new_name);
    });

    socket.on('disconnect', function() {
        var disconnectedUser = users.removeUserBySocket(socket.id);
        if (!disconnectedUser) {
            return;
        }
        logger.log('[User has been left]', disconnectedUser.userInfo.name || user.socket.id);
    });
});

var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

http.listen(port, ipaddress, function() {
    console.log("Server listening " + port + " port");
});