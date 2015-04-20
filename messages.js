var logger = require('./logger');

var messages = [];

module.exports = {
    addMessage: function(type, msgObj, user, socket_id) {
        if (!type || !msgObj.message.length || !user.name.length || !socket_id.length) {
            return false;
        }
        messages.push({
            type: type,
            timestamp: msgObj.timestamp,
            message: msgObj.message,
            socket_id: socket_id,
            user: user
        });
        logger.log('[Message saved]', 'Last index:', messages.length - 1);
    },
    getMessages: function(count, offset, name, socket_id) {
        count = count || 10;
        offset = offset || 0;

        var lastIndex = messages.length - 1;
        var filtered = [], i;

        if (lastIndex == -1) {
            return [];
        }

        if (name) {
            if (socket_id) {
                for (i = lastIndex - offset; i >= 0; --i) {
                    if (messages[i].user.name === name && messages[i].socket_id === socket_id) {
                        if (!count--) {
                            break;
                        }
                        filtered.push(messages[i]);
                    }
                }
                return filtered;
            } else {
                for (i = lastIndex - offset; i >= 0; --i) {
                    if (messages[i].user.name === name) {
                        if (!count--) {
                            break;
                        }
                        filtered.push(messages[i]);
                    }
                }
                return filtered;
            }
        }

        if (socket_id) {
            for (i = lastIndex - offset; i >= 0; --i) {
                if (messages[i].socket_id === socket_id) {
                    if (!count--) {
                        break;
                    }
                    filtered.push(messages[i]);
                }
            }
            return filtered;
        }

        return messages.slice(Math.max(lastIndex - count - offset, 0), Math.max(lastIndex - offset, 0) + 1);
    }
};