var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var chokidar = require('chokidar');
var videos = [];
var config = require('./config.js');

// Host the assets folder
app.use(express.static('assets'));

// Setup Routes
app.get('/', function(req, res){
  res.sendfile('html/index.html');
});

app.get('/screen', function(req, res){
  res.sendfile('html/screen.html');
});

app.get('/control', function(req, res){
  res.sendfile('html/control.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

// Default Socket Events
var defaultSocketEvents = [
  'stopVideo',
  'pauseVideo',
  'playVideo',
  'hideVideoControls',
  'showVideoControls',
  'videoEnded'
];

/**
 * Setup Default Socket Events
 * @param socket - socket instance
 */
var setupDefaultEvents = function(socket) {
    defaultSocketEvents.forEach(function(eventName) {
        socket.on(eventName, function(){
          io.emit(eventName);
        });
    });
};

/**
 * Setup Socket Listeners and Emitters
 * @param socket - socket instance
 */
io.on('connection', function(socket){
  console.log('User connected');
  
  socket.on('disconnect', function(){
    console.log('User disconnected');
  });

  io.emit('files', videos);

  socket.on('changeVideo', function(video){
    io.emit('changeVideo', video);
  });

  setupDefaultEvents(socket);
});

/**
 * Read videos from folder
 */
var getVideosFromFolder = function() {
  var fileList = [];
  fs.readdir(config.videoPath, function (err, files) { // '/' denotes the root folder
  
    if (err) throw err;

    // Check if video is mp4
    var isVideo = function(file) {
      if(file.indexOf('.') !== 0) {
        var fileExtension = file.substr(file.lastIndexOf('.')+1);
        if(fileExtension === 'mp4') {
        return true;
        }
      }
      return false;
    };
    
    // Push only video files into new array
    var filteredFiles = files.filter(isVideo);
      
    filteredFiles.forEach( function (file) {
      fs.lstat('/'+ file, function(err, stats) {
        if (!err && stats.isDirectory()) {
          console.log('directory: '+file);
        }
        else {
            fileList.push(file);
        }
      });
    });
  });
  videos = fileList;
  io.emit('files', videos);
}
getVideosFromFolder();

// Watch files
var watcher = chokidar.watch(config.videoPath, {ignored: /^\./, persistent: true});
watcher
  .on('add', function(path) {console.log('File', path, ' has been added'); getVideosFromFolder(); })
  .on('change', function(path) {console.log('File', path, ' has been changed'); getVideosFromFolder(); })
  .on('unlink', function(path) {console.log('File', path, ' has been removed'); getVideosFromFolder(); })
  .on('error', function(error) {console.error('Error watching files: ', error);})

var createFileObject = function (filename) {
  
};