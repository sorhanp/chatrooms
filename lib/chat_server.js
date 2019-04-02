/* Start of declarations: 
Following declarations allow the use of Socket.IO and initialize  variables that define chat state:
*/
//var socketio = require('socket.io');
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
var defaultRoom = 'Lobby'
/* End of declarations */

/* Start of connection-handling logic: 
Following declarations allow handle connections
*/
exports.listen = function(server) {
    var io = require('socket.io')(server); //Start Socket.IO server using existing HTTP-server

    io.on('connection', function (socket) { //Define how connection of each user will be handled
        //Call function for handling the first time setup of user
        handleFirstTimeConnection(socket);

        //Call functions that are used to handle messaging, name- and room changes
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttemps(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        //Call function for handling communication with client
        handleClientCommunication(socket, io);

        //Handle cleanup when disconnecting
        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};
/* End of connection-handling logic */

/*Start of helper functions:
Following functions are used to handle application scenarios and events
*/
// Function for user connecting for the first time
function handleFirstTimeConnection(socket){
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed); //Set up guest name when connected

    socket.leave(socket.id); //Leave the default room, which is automatically joined identified by socket's id

    //Place new user to defaultRoom
    socket.join(defaultRoom); //Assign user to defaultRoom
    currentRoom[socket.id] = defaultRoom; //Inform that user is in the room
    socket.emit('joinResult', {//infrom the user about the new room
        succcess: true,
        room: defaultRoom,
        message: "Welcome to Chatrooms! You are automatically placed to room called " + defaultRoom + ". Please see chat commands below."
    }); 
    socket.broadcast.to(defaultRoom).emit('message', { //Inform other users, that user has joined
        text: nickNames[socket.id] + ' has joined ' + defaultRoom + '.'
    });
}

//Function for assigning guest names
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest' + guestNumber; //Guest name generation
    nickNames[socket.id] = name; //Combine guest name and connection ID associated to client.
    socket.emit('nameResult', { //Inform user about usernam,e
        success: true,
        name: name
    });
    namesUsed.push(name); //Mark username as used
    return guestNumber + 1; //Increment generated guest names counter 
}

//Function for joining rooms
function joinRoom(socket, room) {
    socket.join(room); //Assign user to room
    currentRoom[socket.id] = room; //Inform that user is in the room
    socket.emit('joinResult', {//infrom the user about the new room
        succcess: true,
        room: room,
        message: "Room changed"
    }); 
    socket.broadcast.to(room).emit('message', { //Inform other users, that user has joined
        text: nickNames[socket.id] + ' has joined ' + room + '.'
    });
}

//Function for username changes:
function handleNameChangeAttemps(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function(name) { //Monitor for nameAttempt-events
        if (name.indexOf('Guest') == 0){ //Statement to block usernames that begin with Guest
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        }
        else{
            if(namesUsed.indexOf(name) == -1){ //Statement to register unregistered usernames
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex]; //Delete previous username to make it available
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' is now known as ' + name + '.'
                });
            }
            else{
                socket.emit('nameResult', { //Print error if name is alreayd in use
                    success: false,
                    message: 'That name is already in use.'
                });
            }
        }
    });
}

//Function for sending messages:
function handleMessageBroadcasting(socket, nickNames) {
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit ('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

//Function for joining/creating a room:
function handleRoomJoining(socket) {
    socket.on('join', function(room) {
        if(room.newRoom == currentRoom[socket.id]){
            socket.emit('joinResult', { //Print error if name is alreayd in use
                success: false,
                message: 'You are already in that room.'
            });
        }
        else{
            socket.leave(currentRoom[socket.id]);
            joinRoom(socket, room.newRoom);
        }
    });
}

//Function for handling communication with client
function handleClientCommunication(socket, io) {
    socket.on('rooms', function() { //When requested display list of occupied rooms.
        socket.emit('rooms', io.sockets.adapter.rooms);
    });

    socket.on('users', function() {
        //Acquire names of current room
        io.of('/').in(currentRoom[socket.id]).clients((error, usersInRoom) => {
            if (error) throw error;
            var usersInRoomSummary = [];
            for (var index in usersInRoom){
                var userSocketId = usersInRoom[index];
                usersInRoomSummary[index] = nickNames[userSocketId];
            }
            socket.emit('users', usersInRoomSummary);
        });
    });
}

//Function for user disconnections:
function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}
/* End of helper functions */