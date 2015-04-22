var express = require('express');
var app = express();
var bl = require('bl');

var http = require('http').Server(app);
var socket_io = require('socket.io');
var io = socket_io(http);

var users = require('./users');
var logger = require('./logger');
var messages = require('./messages');

function clone(obj){
    if (obj == null || typeof(obj) != 'object')
        return obj;
    var temp = new obj.constructor();
    for (var key in obj) {
        temp[key] = clone(obj[key]);
    }
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
        messages.addMessage('USER_JOIN', { message: '...' }, clone(user), socket.id);
        socket.broadcast.emit('another user joined', {
            user: user
        });
        logger.log('[User joined]', user.name);
    });

    socket.on('chat message', function(msg) {
        if (!user) {
            socket.emit('user not joined');
            return;
        }
        var cmd = msg.message.trim().toLowerCase();
        if (cmd.match(new RegExp('^misisbooks', 'i'))) {
            cmd = cmd.replace(new RegExp('^(misisbooks)', 'i'), '').trim();
            if (cmd.match(new RegExp('^search', 'i'))) {
                var q = cmd.replace(new RegExp('^(search)', 'i'), '').trim(),
                    arr = q.split(' '),
                    count = arr[arr.length - 1];
                if (arr.length > 1) {
                    q = q.replace(/(\d+)$/i, '').trim();
                }

                var result = '';
                require('http').get('http://twosphere.ru/api/materials.search?q=' + q +
                    '&access_token=d23a1425766546e8bb3f8c1e8dad54b8c594f1fcec898d8af1fd3712a266c85f&fields=all&count=' +
                    count, function(res) {

                    res.setEncoding('utf8');
                    res.pipe(bl(function(err, data) {
                        result += data.toString();
                    }));

                    res.on('error', function(e) {
                        throw new Error('Get request failed');
                    });

                    res.on('end', function() {
                        var items = JSON.parse(result).response.items;
                        msg.message = '';
                        for (var el in items) {
                            msg.message += items[el].name + ' —  ' + items[el].download_url + ' \n\n';
                        }
                        messages.addMessage('CHAT_MESSAGE', msg, clone(user), socket.id);
                        logger.log('[New message]', '[from: ' + user.name + ' ]', msg.message);
                        socket.broadcast.emit('new message', {
                            timestamp: msg.timestamp,
                            message: msg.message,
                            socket_id: socket.id,
                            user: user
                        });
                    });
                });
                return;
            }
        }

        var isPrivate = /^[@]([a-zA-Z0-9_а-яА-Я]{1,64})/i.test(msg.message);
        if (isPrivate) {
            var peer_name = msg.message.match(/^[@]([a-zA-Z0-9_а-яА-Я]{1,64})/i)[1],
                peer = users.getUserByName(peer_name),
                peer_socket_id = peer ? peer.socket.id : '';
            logger.log('[New private message]', '[from: ' + user.name + ' ]', msg.message);
            socket.broadcast.to(peer_socket_id).emit('new message', {
                timestamp: msg.timestamp,
                message: msg.message,
                socket_id: socket.id,
                user: user
            });
        } else {
            messages.addMessage('CHAT_MESSAGE', msg, clone(user), socket.id);
            logger.log('[New message]', '[from: ' + user.name + ' ]', msg.message);
            socket.broadcast.emit('new message', {
                timestamp: msg.timestamp,
                message: msg.message,
                socket_id: socket.id,
                user: user
            });
        }
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

        var userObj = clone(user);
        userObj.old_name = old_name;

        messages.addMessage('USER_CHANGE_NICKNAME', { message: '...' }, userObj, socket.id);
        io.emit('user change nickname', {
            user: userObj
        });
        logger.log('[User name has been changed]', old_name, new_name);
    });

    socket.on('disconnect', function() {
        var disconnectedUser = users.removeUserBySocket(socket.id);
        if (!disconnectedUser) {
            return;
        }
        messages.addMessage('USER_LEFT', { message: '...' }, clone(user), socket.id);
        io.emit('user left', {
            user: user
        });
        logger.log('[User has been left]', disconnectedUser.userInfo.name || user.socket.id);
        user = null;
        disconnectedUser = null;
    });
});

var ipaddress = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port      = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || '8080';

http.listen(port, ipaddress, function() {
    console.log("Server listening " + port + " port");
});
