/* Start of declarations: 
Following declarations give access to functionalities
*/
//Built in http module for HTTP server and client functionalities:
var http = require('http');

//Built in fs module for filesystem related functionalities:
var filesystem = require('fs');

//Built in path module for filesystem path related functionalities:
var path = require('path');

//Add on mime module to determine MIME type based on filename extension:
var mime = require('mime');

//Cache object, which is used to store cached files.
var cache = {};
/* End of declarations */

/*Start of helper functions:
Following functions are used to serve static HTTP-files
*/
//Function for sending 404 error when file requested does not exist:
function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
};

//Function for serving file data. Writes the HTTP headers and then sends contents of the file
function sendFile(response, filePath, fileContents) {
    response.writeHead(200, {"content-type": mime.getType(path.basename(filePath))});
    response.end(fileContents);
};

//Function for serving static files. This function reads the files from disk and the caches them to memory storage(RAM)
function serveStatic(response, cache, absPath) {
    if (cache[absPath]){ //Statement for checking for file from cache
        sendFile(response, absPath, cache[absPath]); //Serve file from memory
    }
    else{
        filesystem.exists(absPath, function (exists) { //Check if file already exists
            if (exists){
                filesystem.readFile(absPath, function(err, data) { //Read file from disk
                    if (err){ //Statement for error situation, show 404-page
                        send404(response);
                    }
                    else{
                        cache[absPath] = data;
                        sendFile(response, absPath, data); //Serve file by reading from disk
                    }
                });
            }
            else{
                send404(response); //Fallback to 404-page if something goes wrong.
            }
        });
    }
};
/* End of helper functions */

/* Start of HTTP-server functions:
Following functions are used to setup HTTP-server
*/

//Creation of HTTP server, using anonymous function to define per-request behavior
var server = http.createServer(function(request, response) {
    var filePath = false;

    if (request.url == '/'){
        filePath = 'public/index.html'; //Default HTML file to be served
    }
    else{
        filePath = 'public' + request.url; //Conversin of URL path to file path
    }
    var absPath = './' + filePath;
    serveStatic(response, cache, absPath); //Static file serve
});

/* End of HTTP-server functions */

//Start the server on port 3000:
server.listen(3000, function() {
    console.log("server is listening on port 3000.");
});

//Set up Socket.IO and start it by using already defined HTTP-server
var chatServer = require('./lib/chat_server.js');
chatServer.listen(server);