/*Start of helper functions:
Following functions are used to display text data.
*/

//This function will be used for untrusted data, such as user inputs
function divEscapedContentElement(message) {
    return $('<div class = ownmessage></div>').text(message);
};

//This function will be used for trusted data
function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
};

//Function for printing out timestamps to user messages and system message
function getTimestamp() {
    var time = new Date(); //Get local time from users browser

    //Transform hours to HH:DD:SS format since getHours, getMinutes and getSeconds print out single digits. 
    //For example 01:02:03 becomes 1:2:3 without transforming
    var hour = time.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = time.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = time.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    return "[" + hour + ":" + min + ":" + sec + "] ";

}

//Function for processing user input
function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    var systemMessage;

    if (message.charAt(0) == '/') { //Statement to check, if input begins with /-character...
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append(divSystemContentElement(getTimestamp() + systemMessage));
            $('#messages').scrollTop($('#messages').prop('scrollHeight'));
        }
    }
    else { //...if not, send as a message to users
        chatApp.sendMessage($('#room').text(), message); //Broadcast the input
        $('#messages').append(divEscapedContentElement(getTimestamp() + "You: " + message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }

    $('#send-message').val('');
}
/* End of helper functions */

/*Start of client-side application logic:
Following code handles client-side initiation of Socket.IO event handling.
*/
var socket = io();

$(document).ready(function() {
    var chatApp = new Chat(socket);

    socket.on('nameResult', function(result) {
        var message = getTimestamp();

        if (result.success){
            message += 'You are now known as ' + result.name + '.'; //Print result of username change
        }
        else{
            message += result.message;
        }
        $('#messages').append(divSystemContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    });

    socket.on('joinResult', function(result) { //Print result of room change
        var message = getTimestamp();
        if(result.success){
            $('#room').text(result.room);
            message += result.message;
            
        }
        else{
            $('#room').text(result.room);
            message += result.message;
        }
        $('#messages').append(divSystemContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    });

    socket.on('message', function(message) { //Print message
        var newElement = $('<div></div>').text(getTimestamp() + message.text);
        $('#messages').append(newElement);
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    });

    socket.on('rooms', function(rooms) { //Print available rooms
        $('#room-list').empty();

        for(var room in rooms) {
            if(room != ''){
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        $('#room-list div').click(function() { //Room can be change by clicking on room name
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });

    socket.on('users', function(users) { //Print users
        $('#user-list').empty();
        
        for (var user in users) {
            $('#user-list').append(divEscapedContentElement(users[user]));
        }

    });

    setInterval(function() { //Request room- and userlists each second
        socket.emit('rooms');
        socket.emit('users');
    }, 1000);

    $('#send-message').focus();

    $('#send-form').submit(function() { //Permit chat messages by allowing form submit
        processUserInput(chatApp, socket);
        return false;
    });
});

/* End of client-side application logic */