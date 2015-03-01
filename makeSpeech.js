//loadStrings('lyrics/lyrics1.txt');

var lyrics;
var lyricIndex = 0;


var msg = new SpeechSynthesisUtterance('Hello World');


var voices = window.speechSynthesis.getVoices();

function makeSpeech() {
  msg = null;
  msg = new SpeechSynthesisUtterance(getNextLyric());
  msg.voice = voices[2];
  msg.pitch = 0.2;
  msg.rate = 0.3;
  // msg.text = getNextLyric();

  window.speechSynthesis.speak(msg);
}


function getNextLyric() {
  lyricIndex++;
  return lyrics[lyricIndex % lyrics.length];
}

function preload() {
  lyrics = loadStrings('lyrics/lyrics4.txt');
}

function setup() {

}