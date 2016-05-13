var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var chokidar = require('chokidar');
var videos = [];

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

// Setup Socket Events

var defaultSocketEvents = [
  'stopVideo',
  'pauseVideo',
  'playVideo',
  'hideVideoControls',
  'showVideoControls',
  'videoEnded'
];

var setupDefaultEvents = function(socket) {
    defaultSocketEvents.forEach(function(eventName) {
        socket.on(eventName, function(){
          io.emit(eventName);
        });
    });
};

io.on('connection', function(socket){
  console.log('User connected');
  io.emit('files', videos);
  
  socket.on('disconnect', function(){
    console.log('User disconnected');
  });

  socket.on('changeVideo', function(video){
    io.emit('changeVideo', video);
  });

  setupDefaultEvents(socket);
});

var getVideosFromFolder = function() {
  var fileList = [];
  fs.readdir('assets/videos', function (err, files) { // '/' denotes the root folder
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
    var filteredFiles = files.filter(isVideo);
      
    filteredFiles.forEach( function (file) {
      /*
      Write text file
      */
      var fileObject = split_file_name(file);
      var fileName = "section_" + fileObject.section + "-name_" + fileObject.name + ".txt";
      /*
      uncomment to write text file for each video */
      fs.writeFile('assets/associated/video_descriptions/' + fileName, 'Insert video description here');


      fs.lstat('/'+ file, function(err, stats) {
      if (!err && stats.isDirectory()) { //conditing for identifying folders
        console.log('directory: '+file);
      }
      else {
        if(file.indexOf('section_') > -1) {
          fileList.push(split_file_name(file));
        }
      }
      });
    });
  
  });
  videos = fileList;
  io.emit('files', videos);
}
getVideosFromFolder();

// Watch files
var watcher = chokidar.watch('assets/videos', {ignored: /^\./, persistent: true});
watcher
  .on('add', function(path) {console.log('File', path, 'has been added'); getVideosFromFolder(); })
  .on('change', function(path) {console.log('File', path, 'has been changed'); getVideosFromFolder(); })
  .on('unlink', function(path) {console.log('File', path, 'has been removed'); getVideosFromFolder(); })
  .on('error', function(error) {console.error('Error happened', error);})

function split_file_name(filename) {
  var obj = {};
  var arr = filename.split("-").map( function (val) {
      if(val.indexOf('section') > -1){
        val = val.replace('section_', '');
        var result = {'section': val}
        obj.section = val;
        return result;
      }
      if(val.indexOf('name') > -1){
        var re = /(?:\.([^.]+))?$/;
        var ext = re.exec(val)[1]; 
        val = val.replace('name_', '');
        val = val.replace('.'+ext, '');
        var result = {'name': val, 'extension': ext}
        obj.name = val;
        obj.extension = ext;
        return result;
      }
    }
  );
  return obj;
}
