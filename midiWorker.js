// loadRemote('../midifiles/michael_jackson-billie_jean.mid', makeMidi);
// loadRemote('../midifiles/stevie_wonder-superstition.mid', makeMidi);

self.onmessage = function(e) {
  // var stringToReverse = e.data;
  // postMessage( stringToReverse.split("").reverse().join("") );
  makeMidi(e.data);
};

var midiFile;
var m;

var output = {'header': {'bpm': 120, 'timeSignature': [4, 4], 'voices': {} }, 'channel': {}, 'sketches':{} };




function makeMidi(data){
  midiFile = MidiFile(data);

  output.header.ticksPerBeat = midiFile.header.ticksPerBeat;

  for (var i in midiFile.tracks) {
    parseTrackData(midiFile.tracks[i], output);
  }

  // generate UI and track conrollers
  postMessage(["createChannels", output] );
  // createChannels(output);
}

function parseTrackData(trackData, output) {

  var currentTime = 0;

  for (var i in trackData) {

    currentTime += trackData[i].deltaTime;

    // parse bpm and time signature
    if (trackData[i].type === 'meta'){
      if (trackData[i].subtype === 'setTempo') {
        output.header.bpm = 60000000 / trackData[i]['microsecondsPerBeat'];
      }
      else if (trackData[i].subtype === 'timeSignature') {
        output.header.timeSignature[0] = trackData[i].numerator;
        output.header.timeSignature[1] = trackData[i].denominator;
      }
    }

    // parse voices from channel names
    else if (trackData[i].subtype === 'programChange'){
      // console.log(trackData[i]);
      var channel = trackData[i].channel;
      var program = trackData[i].programNumber;
      if (typeof (output.header.voices[channel]) === 'undefined') {
        output.header.voices[channel] = {};
      }
      output.header.voices[channel].program = program;
    }

    // control changes
    // http://www.midi.org/techspecs/midimessages.php
    else if (trackData[i].subtype === 'controller') {
      switch(trackData[i].controllerType) {
        case 7:
          //volume
          if (typeof (output.header.voices[trackData[i].channel]) === 'undefined') {
            output.header.voices[trackData[i].channel] = {};
          }
          output.header.voices[trackData[i].channel].volume = trackData[i].value;
          break;
        case 10:
          // pan
          if (typeof (output.header.voices[trackData[i].channel]) === 'undefined') {
            output.header.voices[trackData[i].channel] = {};
          }
          output.header.voices[trackData[i].channel].pan = trackData[i].value;
          break;
        case 11:
        case 91:
        case 93:
      }
    }

    // tally the noteOff's
    else if (trackData[i].subtype === 'noteOff' || trackData[i].subtype === 'noteOn' && trackData[i].velocity === 0) {
      var note = trackData[i].noteNumber;
      var chan = trackData[i].channel;
      if (typeof(note) == 'number') {
        if (typeof(output.channel[chan]) === 'undefined') {
          output.channel[chan] = {'sequence': [], 'durations': [], 'deltaTimes': [], 'velocities': [], 'notes': [], 'chords': [] };
        }
        var currentBeat = deltaTimeToMeter(currentTime);

        // find the corresponding noteOn event and add to that event
        for (var j = output.channel[chan].sequence.length - 1; j >= 0; j--) {
          var prevEvnt = output.channel[chan].sequence[j];
          if (prevEvnt.note === note && typeof(prevEvnt.noteOff) === 'undefined') {
            var duration = currentBeat - prevEvnt.noteOn;
            prevEvnt.duration = duration;
            prevEvnt.noteOff = currentBeat;
            output.channel[chan].durations.push(duration);
            break;
          }
        }
      }
    }

    // tally the noteOn's
    else if (trackData[i].subtype === 'noteOn') {
      var note = trackData[i].noteNumber;
      var chan = trackData[i].channel;
      if (typeof(note) == 'number') {
        if (typeof(output.channel[chan]) === 'undefined') {
          output.channel[chan] = {'sequence': [], 'durations': [], 'deltaTimes': [], 'velocities': [], 'notes': [], 'chords': [] };
        }
        var currentBeat = deltaTimeToMeter(currentTime);

        output.channel[chan].velocities.push(trackData[i].velocity);

        var deltaTimes = output.channel[chan].deltaTimes;
        var notes = output.channel[chan].notes;
        var chords = output.channel[chan].chords;
        var sequence = output.channel[chan].sequence;



        if (sequence.length > 3 && sequence[sequence.length - 1].noteOn - sequence[sequence.length - 2].noteOn !== 0) {
          var v = 2;
          var chord = [];
          var timeBetweenNotes = sequence[sequence.length - 1].noteOn - sequence[sequence.length - 2].noteOn;
          deltaTimes.push(timeBetweenNotes);

          while (sequence.length > v && sequence[sequence.length - v].noteOn - sequence[sequence.length - v - 1].noteOn === 0) {
            chord.push(notes[notes.length - v]);
            v++;
          }
          if (typeof (notes[notes.length - v]) !== 'undefined'){
            chord.push(notes[notes.length - v]);
          }

          if (chord.length > 2) {
            chords.push(chord);
          }
        }


        notes.push(note);

        sequence.push( {
          'note' : note,
          'noteOn' : currentBeat,
          'velocity' : trackData[i].velocity
        });
      }
    }

  }
  postMessage( output );

  delete midiFile;
}

/*
 deltaTime is the number of 'ticks' from the previous event, and is represented as a variable length quantity.
 */

// via tone.js
function deltaTimeToMeter(deltaTime){
  var timeSigValue = output.header.timeSignature[0] / (output.header.timeSignature[1] / 4);
  var quarters = deltaTime / output.header.ticksPerBeat;
  return quarters;
}


function parseNotes(trackData) {
  var trackTimeline = [];
  for (var i in trackData) {
    if (trackData[i].subtype === 'noteOn') {
      var note = trackData[i].noteNumber;
      if (typeof(note) !== 'number') {
        console.log(note);
      }
      trackTimeline.push(note);
    }
  }
  return trackTimeline;
}


// from Midi JS ?
function MidiFile(data) {
  function readChunk(stream) {
    var id = stream.read(4);
    var length = stream.readInt32();
    return {
      'id': id,
      'length': length,
      'data': stream.read(length)
    };
  }
  
  var lastEventTypeByte;
  
  function readEvent(stream) {
    var event = {};
    event.deltaTime = stream.readVarInt();
    var eventTypeByte = stream.readInt8();
    if ((eventTypeByte & 0xf0) == 0xf0) {
      /* system / meta event */
      if (eventTypeByte == 0xff) {
        /* meta event */
        event.type = 'meta';
        var subtypeByte = stream.readInt8();
        var length = stream.readVarInt();
        switch(subtypeByte) {
          case 0x00:
            event.subtype = 'sequenceNumber';
            if (length != 2) throw "Expected length for sequenceNumber event is 2, got " + length;
            event.number = stream.readInt16();
            return event;
          case 0x01:
            event.subtype = 'text';
            event.text = stream.read(length);
            return event;
          case 0x02:
            event.subtype = 'copyrightNotice';
            event.text = stream.read(length);
            return event;
          case 0x03:
            event.subtype = 'trackName';
            event.text = stream.read(length);
            return event;
          case 0x04:
            event.subtype = 'instrumentName';
            event.text = stream.read(length);
            return event;
          case 0x05:
            event.subtype = 'lyrics';
            event.text = stream.read(length);
            return event;
          case 0x06:
            event.subtype = 'marker';
            event.text = stream.read(length);
            return event;
          case 0x07:
            event.subtype = 'cuePoint';
            event.text = stream.read(length);
            return event;
          case 0x20:
            event.subtype = 'midiChannelPrefix';
            if (length != 1) throw "Expected length for midiChannelPrefix event is 1, got " + length;
            event.channel = stream.readInt8();
            return event;
          case 0x2f:
            event.subtype = 'endOfTrack';
            if (length != 0) throw "Expected length for endOfTrack event is 0, got " + length;
            return event;
          case 0x51:
            event.subtype = 'setTempo';
            if (length != 3) throw "Expected length for setTempo event is 3, got " + length;
            event.microsecondsPerBeat = (
              (stream.readInt8() << 16)
              + (stream.readInt8() << 8)
              + stream.readInt8()
            )
            return event;
          case 0x54:
            event.subtype = 'smpteOffset';
            if (length != 5) throw "Expected length for smpteOffset event is 5, got " + length;
            var hourByte = stream.readInt8();
            event.frameRate = {
              0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
            }[hourByte & 0x60];
            event.hour = hourByte & 0x1f;
            event.min = stream.readInt8();
            event.sec = stream.readInt8();
            event.frame = stream.readInt8();
            event.subframe = stream.readInt8();
            return event;
          case 0x58:
            event.subtype = 'timeSignature';
            if (length != 4) throw "Expected length for timeSignature event is 4, got " + length;
            event.numerator = stream.readInt8();
            event.denominator = Math.pow(2, stream.readInt8());
            event.metronome = stream.readInt8();
            event.thirtyseconds = stream.readInt8();
            return event;
          case 0x59:
            event.subtype = 'keySignature';
            if (length != 2) throw "Expected length for keySignature event is 2, got " + length;
            event.key = stream.readInt8(true);
            event.scale = stream.readInt8();
            return event;
          case 0x7f:
            event.subtype = 'sequencerSpecific';
            event.data = stream.read(length);
            return event;
          default:
            // console.log("Unrecognised meta event subtype: " + subtypeByte);
            event.subtype = 'unknown'
            event.data = stream.read(length);
            return event;
        }
        event.data = stream.read(length);
        return event;
      } else if (eventTypeByte == 0xf0) {
        event.type = 'sysEx';
        var length = stream.readVarInt();
        event.data = stream.read(length);
        return event;
      } else if (eventTypeByte == 0xf7) {
        event.type = 'dividedSysEx';
        var length = stream.readVarInt();
        event.data = stream.read(length);
        return event;
      } else {
        throw "Unrecognised MIDI event type byte: " + eventTypeByte;
      }
    } else {
      /* channel event */
      var param1;
      if ((eventTypeByte & 0x80) == 0) {
        /* running status - reuse lastEventTypeByte as the event type.
          eventTypeByte is actually the first parameter
        */
        param1 = eventTypeByte;
        eventTypeByte = lastEventTypeByte;
      } else {
        param1 = stream.readInt8();
        lastEventTypeByte = eventTypeByte;
      }
      var eventType = eventTypeByte >> 4;
      event.channel = eventTypeByte & 0x0f;
      event.type = 'channel';
      switch (eventType) {
        case 0x08:
          event.subtype = 'noteOff';
          event.noteNumber = param1;
          event.velocity = stream.readInt8();
          return event;
        case 0x09:
          event.noteNumber = param1;
          event.velocity = stream.readInt8();
          if (event.velocity == 0) {
            event.subtype = 'noteOff';
          } else {
            event.subtype = 'noteOn';
          }
          return event;
        case 0x0a:
          event.subtype = 'noteAftertouch';
          event.noteNumber = param1;
          event.amount = stream.readInt8();
          return event;
        case 0x0b:
          event.subtype = 'controller';
          event.controllerType = param1;
          event.value = stream.readInt8();
          return event;
        case 0x0c:
          event.subtype = 'programChange';
          event.programNumber = param1;
          return event;
        case 0x0d:
          event.subtype = 'channelAftertouch';
          event.amount = param1;
          return event;
        case 0x0e:
          event.subtype = 'pitchBend';
          event.value = param1 + (stream.readInt8() << 7);
          return event;
        default:
          throw "Unrecognised MIDI event type: " + eventType
          /* 
          console.log("Unrecognised MIDI event type: " + eventType);
          stream.readInt8();
          event.subtype = 'unknown';
          return event;
          */
      }
    }
  }
  
  stream = Stream(data);
  var headerChunk = readChunk(stream);
  if (headerChunk.id != 'MThd' || headerChunk.length != 6) {
    throw "Bad .mid file - header not found";
  }
  var headerStream = Stream(headerChunk.data);
  var formatType = headerStream.readInt16();
  var trackCount = headerStream.readInt16();
  var timeDivision = headerStream.readInt16();
  
  if (timeDivision & 0x8000) {
    throw "Expressing time division in SMTPE frames is not supported yet"
  } else {
    ticksPerBeat = timeDivision;
  }
  
  var header = {
    'formatType': formatType,
    'trackCount': trackCount,
    'ticksPerBeat': ticksPerBeat
  }
  var tracks = [];
  for (var i = 0; i < header.trackCount; i++) {
    tracks[i] = [];
    var trackChunk = readChunk(stream);
    if (trackChunk.id != 'MTrk') {
      throw "Unexpected chunk - expected MTrk, got "+ trackChunk.id;
    }
    var trackStream = Stream(trackChunk.data);
    while (!trackStream.eof()) {
      var event = readEvent(trackStream);
      tracks[i].push(event);
      //console.log(event);
    }
  }
  
  return {
    'header': header,
    'tracks': tracks
  }
}

function Stream(str) {
  var position = 0;
  
  function read(length) {
    var result = str.substr(position, length);
    position += length;
    return result;
  }
  
  /* read a big-endian 32-bit integer */
  function readInt32() {
    var result = (
      (str.charCodeAt(position) << 24)
      + (str.charCodeAt(position + 1) << 16)
      + (str.charCodeAt(position + 2) << 8)
      + str.charCodeAt(position + 3));
    position += 4;
    return result;
  }

  /* read a big-endian 16-bit integer */
  function readInt16() {
    var result = (
      (str.charCodeAt(position) << 8)
      + str.charCodeAt(position + 1));
    position += 2;
    return result;
  }
  
  /* read an 8-bit integer */
  function readInt8(signed) {
    var result = str.charCodeAt(position);
    if (signed && result > 127) result -= 256;
    position += 1;
    return result;
  }
  
  function eof() {
    return position >= str.length;
  }
  
  /* read a MIDI-style variable-length integer
    (big-endian value in groups of 7 bits,
    with top bit set to signify that another byte follows)
  */
  function readVarInt() {
    var result = 0;
    while (true) {
      var b = readInt8();
      if (b & 0x80) {
        result += (b & 0x7f);
        result <<= 7;
      } else {
        /* b is the last byte */
        return result + b;
      }
    }
  }
  
  return {
    'eof': eof,
    'read': read,
    'readInt32': readInt32,
    'readInt16': readInt16,
    'readInt8': readInt8,
    'readVarInt': readVarInt
  }
}