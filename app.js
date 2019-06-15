const express = require("express");
const app = express();//開啟使用express各種功能
const fs = require("fs");
const SONGFILE = "song.txt";
const path = require('path');
const formidable = require('formidable')

app.use('/',express.static('public')); 

// body-parser
var bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}));


app.get('/',function(req, res){ 
  songRender(res)
})

app.post('/upload', function(req, res) { 
  try{
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
      var customFileName = fields.songName 
      var originFileName = files.songFile.name;
      var originFileSize = files.songFile.size
      if(!originFileSize){
        res.redirect('/')
      }
      else if(!customFileName){
        res.redirect('/')
      }
      else {
        var serverOriginPath = files.songFile.path
        var timeStamp = Date.now();
        var serverNewPath = "./uploads/" + timeStamp + "&" + originFileName;
        fs.rename(serverOriginPath, serverNewPath, function(err){
          fs.appendFileSync( SONGFILE, customFileName + "," + originFileName + "," + serverNewPath  + "\n");
          var file = fs.readFileSync(SONGFILE, 'utf8');
          var lines = file.split("\n");
          res.redirect('/')
        });
      }
    })
  }catch (e) {
    res.redirect('/')
  }
})


app.get('/delete', function(req, res) { 
  var songID = req.query.id
  var File = fs.readFileSync(SONGFILE, 'utf8');
  var songList = File.split("\n");
  var songData = songList[songID].split(",");
  var fileServerPath = songData[2]
  fs.unlinkSync(fileServerPath);
  songList.splice(songID, 1)
  songList.pop() // remove space
  var content = ''
  for(let i = 0; i < songList.length; i++){
    if(songList.length){
      content += songList[i] + '\n'
    }
  }
  fs.writeFileSync(SONGFILE, content)
  res.redirect('/')
})

app.get('/uploads/:musicname',function(req,res){ 
  var musicName = req.params.musicname
  var newpath = "/uploads/" + musicName;
  res.sendFile(path.join( __dirname + newpath))
})

function songRender(res, message){
  var file = fs.readFileSync(SONGFILE, 'utf8');
  var html = fs.readFileSync('./public/song.html', 'utf8');
  if(file.length){
    var lines = file.split("\n");
    console.log(message) 
    var line, content="";
    for(let i=0; i< lines.length; i++){
      line = lines[i].split(",")
      if(line.length>1){
        content += '<tr>'
            + '<td>' + (i+1) + '</td>'
            + '<td>' + line[0] + '</td>'
            + '<td>' + line[1] + '</td>'
            + '<td>'
            + '<input name="btnPlay" type="button" value="播放" mp3file="" onClick="okPlay(\''+line[2]+'\')">'  //思考一下原因
            + '<input type="button" value="刪除" onClick="location.href=\'./delete?id='+i+'\'">'  //思考一下原因
            + '</td>'
            + '</tr>';
      }
    }
    var oldcontent = '</form>'
    html = html.replace(oldcontent, content)
  }
  res.status(200).send(html)
}


var port=process.env.PORT||3000

app.listen(port)