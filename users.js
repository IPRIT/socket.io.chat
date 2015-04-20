/**
 * Created by Александр on 19.04.2015.
 */
var logger = require('./logger');
var users = [];

module.exports = {
    addUser: function(userInfo, socket) {
        if (!socket || !userInfo.name.length || this.socketExists(socket.id)) {
            return;
        }
        var obj = {
            userInfo: {
                name: userInfo.name,
                joined_timestamp: userInfo.timestamp
            },
            socket: socket
        };
        users.push(obj);
        logger.log('[The number of users]', users.length);

        return obj;
    },
    socketExists: function(socket_id) {
        if (!socket_id.length) {
            throw new Error("Socket id must be not empty");
        }
        for (var el = 0; el < users.length; ++el) {
            if (users[el].socket.id === socket_id) {
                return true;
            }
        }
        return false;
    },
    removeUserBySocket: function(socket_id) {
        if (!socket_id.length) {
            throw new Error("Socket id must be not empty");
        }
        for (var el = 0; el < users.length; ++el) {
            if (users[el].socket.id === socket_id) {
                var user = users[el];
                users.splice(el, 1);
                logger.log('[User has been deleted]', user.userInfo.name || user.socket.id);
                return user;
            }
        }
        return false;
    },
    removeUserByName: function(name) {
        if (!name.length) {
            throw new Error("Name must be not empty");
        }
        for (var el = 0; el < users.length; ++el) {
            if (users[el].userInfo.name === name) {
                var user = users[el];
                users.splice(el, 1);
                logger.log('[User has been deleted]', user.userInfo.name || user.socket.id);
                return user;
            }
        }
        return false;
    },
    getUserBySocket: function(socket_id) {
        if (!socket_id.length) {
            throw new Error("Socket id must be not empty");
        }
        for (var el = 0; el < users.length; ++el) {
            if (users[el].socket.id === socket_id) {
                return users[el];
            }
        }
        return false;
    },
    getUserByName: function(name) {
        if (!name.length) {
            throw new Error("Name must be not empty");
        }
        for (var el = 0; el < users.length; ++el) {
            if (users[el].userInfo.name === name) {
                return users[el];
            }
        }
        return false;
    },
    changeName: function(socket_id, name) {
        if (!name.length) {
            throw new Error("Name must be not empty");
        }
        for (var el = 0; el < users.length; ++el) {
            if (users[el].socket.id === socket_id) {
                users[el].userInfo.name = name;
                return users[el];
            }
        }
        return false;
    }
};