/*---------------------
    Global Variables
----------------------*/
var voiceTextArea = $('#voice-textarea');
var instructions = $('#recording-instructions');
var usrCmdListLocation = $('ul#usr-cmd-msg');
var feedbackListLocation = $('ul#feedback-msg');

var noteContent = ''; 
var usrCmdTag = 'cmd-';
var feedbackTag = 'log-';
var global_voice = '';

/*---------------------
      Video Feed 
----------------------*/
// var video = document.querySelector("#video-stream");

// navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

// if (navigator.getUserMedia)
// {
//   navigator.getUserMedia({video: true}, handleVideo, videoError);
// }

function handleVideo(stream) 
{
  video.src = window.URL.createObjectURL("http://localhost:8080/stream.wmv");
  createFeedbackMsg('Video Stream connected successfully.');
  console.log('Video Stream connected successfully.');
}

function videoError(e) 
{
  createFeedbackMsg('Video Not Connected.');
  console.log('Video Not Connected.');
}

/*-----------------------------
      Voice Recognition 
------------------------------*/
try {
  var SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(error) {
  createFeedbackMsg('Voice Recognition could not be loaded: ' + error);
  console.log(error);
  $('.no-browser-support').show();
  $('.app').hide();
}

recognition.continuous = true;

recognition.onresult = function(event) {

  // event is a SpeechRecognitionEvent object.
  // It holds all the lines we have captured so far. 
  // We only need the current one.
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;

  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);
  if(!mobileRepeatBug) {
    noteContent += transcript;
    voiceTextArea.val(noteContent);
    //global_voice = noteContent;
    //console.log("Note Content: "+ noteContent);
  }
};

recognition.onstart = function() { 
  instructions.text('Voice recognition activated. Try speaking into the microphone.');
}

recognition.onspeechend = function() {
  instructions.text('Speech recognition has stopped.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('Error detected: ' + event.error);  
  };
}

/*-----------------------------
      Buttons & Text Area!
------------------------------*/
$('#start-record-btn').on('click', function(e) 
{
  if(noteContent.length) {
    noteContent += ' ';
  }
  recognition.start();
});

$('#pause-record-btn').on('click', function(e) {
  recognition.stop();
  instructions.text('Voice recognition paused.');
});

//Updates noteContext when edited via text area
voiceTextArea.on('input', function() {
  noteContent = $(this).val();
});

$('#send-cmd-btn').on('click', function(e) {
  recognition.stop();

  if(!noteContent.length) 
  {
    instructions.text('Cannot input empty command.');
  }
  else 
  {
    saveNote(new Date().toLocaleString(), noteContent, usrCmdTag);
      instructions.text('Command save and sent successfully.');
      global_voice = noteContent;
      noteContent = '';
      renderOutput(usrCmdTag, usrCmdListLocation);
      voiceTextArea.val('');
  }
});

$('#clear-feedback-btn').on('click',function(e)
{
  for(var i = 0; i < localStorage.length; i++)
  {
    var itemKey = localStorage.key(i);
    if(itemKey.substring(0,feedbackTag.length) == feedbackTag)
    {
      localStorage.removeItem(itemKey);
           i = i - 1;
    }
  }
  renderOutput(feedbackTag, feedbackListLocation);
  instructions.text("System Feedback has been cleared.");
});

$('#clear-cmds-btn').on('click',function(e)
{
  for(var i = 0; i < localStorage.length; i++)
  {
    var itemKey = localStorage.key(i);
    if(itemKey.substring(0,usrCmdTag.length) == usrCmdTag)
    {
      localStorage.removeItem(itemKey);
      i = i - 1;
    }
  }
  renderOutput(usrCmdTag, usrCmdListLocation);
  instructions.text("Sent-Commands have been cleared.");
});

usrCmdListLocation.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // Delete note.
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();  
    deleteNote(dateTime, usrCmdTag);
    target.closest('.note').remove();
  }
  renderOutput(usrCmdTag, usrCmdListLocation);
});

feedbackListLocation.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // Delete note.
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();  
    deleteNote(dateTime, feedbackTag);
    target.closest('.note').remove();
  }
  renderOutput(feedbackTag, feedbackListLocation);
});
/*-----------------------------
      Output Functions
------------------------------*/

function renderOutput(tag, location)
{
  var tagList = getTagNotes(tag);
  var html = '';
  if(tagList.length) {
    tagList.forEach(function(note) {
      html+= `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span> 
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;    
    });
  }
  else {
    html = '<li><p class="content">There is no content to display</p></li>';
  }
  location.html(html);
}

function saveNote(dateTime, content, tag) 
{
    localStorage.setItem(tag + dateTime, content);
    return true;
}

function getTagNotes(tag) 
{
  var list = [];
  var key;
  for(var i = 0; i < localStorage.length; i++)
  {
    key = localStorage.key(i);
    if(key.substring(0,tag.length) == tag)
    {
      list.push({
        date: key.replace(tag, ''),
        content: localStorage.getItem(localStorage.key(i))
      });
    }
  }
  return list;
}

function createFeedbackMsg(msg)
{
  if(msg.length)
  {
    saveNote(new Date().toLocaleString(), msg, feedbackTag);
    renderOutput(feedbackTag, feedbackListLocation);
  }
}

function deleteNote(dateTime, tag) {
  localStorage.removeItem(tag + dateTime); 
}

function parseCommand()
{
  for(const key in TargetTable)
  {
    if(noteContent.toLowerCase().includes(TargetTable[key]))
    {
      objTarget = TargetTable[key];
      createFeedbackMsg('Object target set to: ' + objTarget);
      console.log("TargetTable update = " + objTarget);
    }
  }

  for(const key in actionTable)
  {
    if(noteContent.toLowerCase().includes(actionTable[key]))
    {
      cmdAction = actionTable[key];
      createFeedbackMsg('Command Action set to: ' + cmdAction);
      console.log("actionTable update = " + cmdAction);
    }
  }
}

/*-----------------------------
      Setup Code
------------------------------*/
var firstRun = true;

if(firstRun)
{
  renderOutput(usrCmdTag, usrCmdListLocation);
  renderOutput(feedbackTag, feedbackListLocation);
  firstRun = false;
}