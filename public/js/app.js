var socket;
var chatConfig = {};

$(document).ready(function () {
    Cache.init();
    if (!Cache.cur_user.hasKey('user_name')) {
        var newName = prompt("Введите имя");
        if (newName) {
            newName = newName.replace(/\s+/gi, '_');
        }
        Cache.cur_user.add('user_name', newName);
    }
    chatConfig.name = Cache.cur_user.get('user_name') || false;
    $('.user-name').text(chatConfig.name);
    if (!chatConfig.name) {
        alert("Чтобы начать писать, необходимо войти.");
        Cache.cur_user.clear();
        return;
    }

    socket = io();

    socket.emit('user joined', {
        name: chatConfig.name,
        timestamp: new Date().getTime()
    }).emit('chat get', {
        count: 50,
        offset: 0
    });

    socket.on('chat loaded', function(messages) {
        for (var i = 0; i < messages.length; ++i) {
            messages[i].isOwn = messages[i].user.name == chatConfig.name;
            Page.insertMessage(messages[i].type, messages[i]);
        }
    });

    socket.on('user not joined', function() {
        socket.emit('user joined', {
            name: chatConfig.name,
            timestamp: new Date().getTime()
        });
    });

    socket.on('another user joined', function(params) {
        Page.insertMessage('USER_JOIN', params);
    });

    socket.on('user left', function(params) {
        Page.insertMessage('USER_LEFT', params);
    });

    socket.on('user change nickname', function(params) {
        Page.insertMessage('USER_CHANGE_NICKNAME', params);
    });

    socket.on('new message', function(res) {
        console.log(res);
        Page.insertMessage('CHAT_MESSAGE', res);
    });

    chatConfig.socket = socket;
});


var Utils = {
    zeroFill: function(num) {
        return num < 10 ? '0' + num : num;
    },
    hash: function(str, mod) {
        mod = mod || 1e15;
        var hash = 0, p_pow = 1, p = 37;
        for (var i = 0; i < str.length; ++i) {
            hash += ((str.charCodeAt(i) + 1) * p_pow) % mod;
            hash %= mod;
            p_pow = (p_pow *= p) % mod;
        }
        return hash;
    }
};

var Page = {
    theme_colors: [
        '#CDEBC7',
        '#F0A3ED',
        '#ACEB68',
        '#EBDA68',
        '#EBB768',
        '#EB7B68',
        '#AF9AF1',
        '#FE5656'
    ],
    insertMessage: function(type, params) {
        if (!type) {
            return;
        }
        switch (type) {
            case 'USER_JOIN':
                insertUserJoinMessage(params);
                break;
            case 'USER_LEFT':
                insertUserLeftMessage(params);
                break;
            case 'USER_CHANGE_NICKNAME':
                insertUserChangeNickMessage(params);
                break;
            case 'CHAT_MESSAGE':
                insertChatMessage(params);
                break;
            default:
                break;
        }

        function insertUserJoinMessage(params) {
            var layer = $('#messages'),
                message = $('<li>\n    <div class="message-notification"></div>\n</li>');

            $('.message-notification', message).append(
                'Пользователь ' + params.user.name.replace(/[<]/g, '&lt;').replace(/[>]/g, '&gt;') +
                ' присоединяется к чату.'
            );

            layer.append(message);
            $(document.body).scrollTop(layer.innerHeight());
        }

        function insertUserLeftMessage(params) {
            var layer = $('#messages'),
                message = $('<li>\n    <div class="message-notification"></div>\n</li>');

            $('.message-notification', message).append(
                'Пользователь ' + params.user.name.replace(/[<]/g, '&lt;').replace(/[>]/g, '&gt;') +
                ' вышел из чата.'
            );

            layer.append(message);
            $(document.body).scrollTop(layer.innerHeight());
        }

        function insertUserChangeNickMessage(params) {
            var layer = $('#messages'),
                message = $('<li>\n    <div class="message-notification"></div>\n</li>');

            $('.message-notification', message).append(
                'Пользователь ' + params.user.old_name.replace(/[<]/g, '&lt;').replace(/[>]/g, '&gt;') +
                ' сменил имя на ' + params.user.name.replace(/[<]/g, '&lt;').replace(/[>]/g, '&gt;')
            );

            layer.append(message);
            $(document.body).scrollTop(layer.innerHeight());
        }

        function insertChatMessage(msg) {
            var isOwn = msg.isOwn || false,
                layer = $('#messages'),
                message = $('<li>\n    <div class="message">\n        <div class="message-owner">\n            <a href="#" onclick="return false;" class="message-owner-name"></a>\n        </div>\n        <div class="message-timestamp"></div>\n        <div class="message-text"></div>\n    </div>\n</li>');

            var time = new Date(msg.timestamp);

            var zeroFill = Utils.zeroFill;
            $('.message-timestamp', message).append(
                zeroFill(time.getHours()) + ':' + zeroFill(time.getMinutes()) + ':' + zeroFill(time.getSeconds())
            );
            msg.message = ' ' + msg.message;
            var formattedText = msg.message.replace(
                /[<]/g, '&lt;'
            ).replace(
                /[>]/g, '&gt;'
            ).replace(
                /^\s[@]([a-zA-Z0-9_а-яА-Я]{1,64})\,/i,
                '<b style="color: #000;">[Приватное сообщение для $1]:</b>'
            ).replace(
                /^\s(?:https?:\/\/)?(?:www\.)?youtu(?:|\.be|be\.com|\.b)(?:\/v\/|\/watch\\?v=|e\/|(?:\/\??#)?\/watch(?:.+)v=)(.{11})(?:\&[^\s]*)?/gi,
                '<iframe src="//www.youtube.com/embed/$1" type="text/html" frameborder="0" border="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen="" width="500px" height="400px"></iframe>'
            ).replace(
                /^\s(?:https?:\/\/)?(?:www\.)?coub\.com\/view\/([a-zA-Z0-9_]+)(?:\&[^\s]*)?/gi,
                '<iframe src="//coub.com/embed/$1?muted=false&autostart=false&originalSize=false&hideTopBar=false&startWithHD=false" allowfullscreen="true" frameborder="0" width="500px" height="300px"></iframe>'
            ).replace(
                /\[((http|https)\:\/\/(www\.)?[^\r\n\t\f \[\]\"]+)\]/gi,
                '<img style="max-width: 90%;" src="$1" />'
            ).replace(
                /\s((http|https)\:\/\/(www\.)?[^\r\n\t\f }{\"]+)/gi,
                '<a target="_blank" href="$1">$1</a>'
            );
            $('.message-text', message).append(formattedText);

            if (isOwn) {
                $('.message', message).addClass('own');
                $('.message-owner-name', message).append(chatConfig.name);
            } else {
                $('.message-owner-name', message).append(msg.user.name) 
            }

            var name = !isOwn ? msg.user.name : chatConfig.name;
            $('.message-owner-name', message).on('click', function() {
                var input = $('#m');
                input.val('@' + name + ', ');
                input.focus();
            });

            if (!isOwn) {
                var color_index = Utils.hash(msg.socket_id ? msg.socket_id : 0) % 8;
                $('.message', message).css({backgroundColor: Page.theme_colors[color_index]});
            }

            layer.append(message);
            $(document.body).scrollTop(layer.innerHeight());
        }
    },
    onSubmit: function() {
        try {
            var msg = $('#m').val();

            if (!msg.trim().length) {
                return false;
            }

            this.insertMessage('CHAT_MESSAGE', {
                timestamp: new Date().getTime(),
                message: msg,
                socket_id: socket.id,
                isOwn: true
            });

            socket.emit('chat message', {
                timestamp: new Date().getTime(),
                message: msg
            });

            $('#m').val('');
            return false;
        } catch (e) {
            console.log(e);
        }
    },
    changeName: function(el) {
        var newName = prompt("Введите имя");
        if (!newName) {
            return;
        }
        newName = newName.replace(/\s+/gi, '_');

        Cache.cur_user.add('user_name', newName);
        chatConfig.name = newName;
        el.innerHTML = newName;

        socket.emit('user name changed', newName);
    }
};

// ObjectStorage Advanced Library v1.0 by Alex Belov
// https://github.com/IPRIT
// Date: 03.09.2013
// Released under the MIT license.
var ObjectStorage = function ObjectStorage(b, d) {
    var c;
    b = b || "_objectStorage";
    ObjectStorage.instances[b] ?
        (c = ObjectStorage.instances[b], c.duration = d || c.duration) :
        (c = this, c._name = b, c.duration = d || 500, c._init(), ObjectStorage.instances[b] = c);
    return c;
};
ObjectStorage.instances = {};
ObjectStorage.prototype = {
    _save: function(a) {
        var b = encodeURIComponent(JSON.stringify(this[a]));
        a = window[a + "Storage"];
        a.getItem(this._name) !== b && a.setItem(this._name, b);
    },
    _get: function(a) {
        var str = "{}";
        if (window[a + "Storage"].getItem(this._name)) {
            str = decodeURIComponent(window[a + "Storage"].getItem(this._name));
        }
        this[a] = JSON.parse(str) || {};
    },
    _init: function() {
        var a = this;
        a._get("local");
        a._get("session");
        (function d() {
            a.timeoutId = setTimeout(function() {
                a._save("local");
                d();
            }, a._duration);
        })();
        window.addEventListener("beforeunload", function() {
            a._save("local");
            a._save("session");
        });
    },
    timeoutId: null,
    local:{},
    session:{}
};

var CacheManager = function CacheManager(storage_name) {
    var storage;

    function init() {
        storage = new ObjectStorage(storage_name).local;
        storage.items = storage.items || {};
    }

    function isCorrect() {
        return storage.items !== undefined;
    }

    function add(key, value, cache_time) {
        if (!isCorrect()) {
            return;
        }
        cache_time = cache_time || 1e9;

        storage.items[key] = {
            obj: typeof value == "string" ? encodeURIComponent(value) : value,
            _expired_time: new Date().getTime() + cache_time * 1000
        };
    }

    function clear() {
        if (!isCorrect()) {
            return;
        }
        storage.items = {};
    }

    function remove(key) {
        if (!isCorrect()) {
            return;
        }
        storage.items[key] = null;
        delete storage.items[key];
    }

    function get(key) {
        if (!hasKey(key)) {
            return null;
        }
        console.log('Cache obj [' + key + ']', storage.items[key]);
        return typeof storage.items[key].obj == "string" ? decodeURIComponent(storage.items[key].obj) : storage.items[key].obj;
    }

    function isExpired(key) {
        return !storage.items[key] || new Date().getTime() > storage.items[key]._expired_time;
    }

    function hasKey(key) {
        if (!isCorrect()) {
            return false;
        }
        return storage.items[key] && !isExpired(key);
    }

    init();

    return {
        isCorrect: isCorrect,
        add: add,
        clear: clear,
        remove: remove,
        get: get,
        isExpired: isExpired,
        hasKey: hasKey
    }
};

var Cache = {
    cur_user: null,
    init: function() {
        this.cur_user = new CacheManager('userCache');
    }
};