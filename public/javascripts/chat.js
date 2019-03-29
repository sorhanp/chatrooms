//Client side Class that receives Socket.IO socket as a argument when instantiated:
var Chat = function(socket) {
    this.socket = socket;
};

//Client side function for sending chat messages:
Chat.prototype.sendMessage = function(room, text) {
    var message = {
        room: room,
        text: text
    };
    this.socket.emit('message', message);
};

//Client side function for room changing:
Chat.prototype.changeRoom = function(room) {
    this.socket.emit('join', {
        newRoom: room
    });
};

//Client side function for processing chat commands:
Chat.prototype.processCommand = function(command) {
    var words = command.split(' ');
    var command = words[0].substring(1, words[0].length).toLowerCase(); //Parse first word for command
    var message = false;

    switch(command) {
        case 'join': //Case for room changing/creation
        words.shift();
        var room = words.join(' ');
        this.changeRoom(room);
        break;

        case 'nick': //Case for changing username
        words.shift();
        var name = words.join(' ');
        this.socket.emit('nameAttempt', name);
        break;

        default: //Case for non-existing commands.
        message = 'Unrecognized command.';
        break;
    }

    return message;
};