function loadRemote(path, callback) {
  var fetch = new XMLHttpRequest();
  fetch.open('GET', path);
  fetch.overrideMimeType("text/plain; charset=x-user-defined");
  fetch.onreadystatechange = function() {
    if(this.readyState == 4 && this.status == 200) {
      /* munge response into a binary string */
      var t = this.responseText || "" ;
      var ff = [];
      var mx = t.length;
      var scc= String.fromCharCode;
      for (var z = 0; z < mx; z++) {
        ff[z] = scc(t.charCodeAt(z) & 255);
      }
      console.log(ff);
      callback(ff.join(""));
    }
  }
  fetch.send();
}

// setup midi worker
w = new Worker("midiWorker.js");

var channelData;

w.onmessage = function(event){
    console.log(event.data);
    if (event.data[0] === 'createChannels') {
      // channelData = event.data[1]

      createChannels(event.data[1]);
    }
    else {
      // init midi
      createChannels(event.data);
      startMidiJS(event.data);

    }
};

function sendMidiToWorker(midiData) {
  w.postMessage(midiData)
}