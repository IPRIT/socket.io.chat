/**
 * Created by Александр on 19.04.2015.
 */

module.exports = {
    log: function () {
        function zeroFill(num) {
            return num < 10 ? '0' + num : num;
        }
        var time = new Date();
        var formattedTime = '[' + zeroFill(time.getHours()) + ':'
            + zeroFill(time.getMinutes()) + ':' + zeroFill(time.getSeconds()) + ']';
        var args = Array.prototype.slice.call(arguments);
        args.unshift(formattedTime);
        console.log.apply(console, args);
    }
};