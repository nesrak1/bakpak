var snd = {
    //buffer
    dat: "",
    //playback
    pos: 0,
    stop: 0,
    //song data
    tickWait: 120, //ms between each tick
    startLoop: 0, //start of loop
    endLoop: 1, //end of loop
    tpm: 16, //ticks per measure
    instruments: [], //which sound is played for each instrument
    //buffers: [],
    notes: [], //notes with pitches and values
};

function readSong(data) {
    snd.dat = data;
    snd.pos = 0; //also used as playback pos
    snd.tickWait = readNum(3);
    snd.startLoop = readNum(2);
    snd.endLoop = readNum(3);
    snd.tpm = readNum(2);
    var instCount = readNum(1);
    for (var _ of loop(instCount)) {
        snd.instruments.push(readNum(1));
        //snd.buffers.push(A.createBuffer(2,1e6,44100));
    }
    for (var instIdx of loop(instCount)) {
        var noteCount = readNum(3);
        var curNotes = [];
        var i = 0;
        var curX = 0;
        if (snd.instruments[instIdx] == 0) { //note
            var curY = readNum(3);
            while (i < noteCount) {
                var mode = readNum(1);
                //0 = rest 2len
                //1 = rest 1len
                //2 = 1off up 2len
                //3 = 1off down 2len
                //4 = 2off up 2len
                //5 = 2off down 2len
                //6 = 1off up 1len
                //7 = 1off down 1len
                //8 = 2off up 1len
                //9 = 2off down 1len
                var offLen = [0,0,1,1,2,2,1,1,2,2][mode];
                var lenLen = [2,1,2,2,2,2,1,1,1,1][mode];
                var len = readNum(lenLen);
                if (offLen != 0) {
                    var off = readNum(offLen) * [1,-1][mode%2];
                    curY += off;
                    curNotes[curX] = [curY,len];
                    i++;
                }
                curX += len;
            }
        } else { //drum
            while (i < noteCount) {
                var mode = readNum(1);
                var dist;
                if (mode <= 7) { //regular distance
                    dist = mode;
                } else if (mode == 8) {
                    dist = readNum(1) + 8;
                } else if (mode == 9) {
                    dist = readNum(2) + 18;
                }
                curX += dist;
                curNotes[curX] = 1;
                i++;
            }
        }
        snd.notes.push(curNotes);
    }
}

function playSong() {
    snd.pos = 0;
    var id = setInterval(function() {
        snd.notes.forEach(function(i, idx) {
            var j = i[snd.pos];
            if (j !== undefined) {
                if (snd.instruments[idx] == 0) {
                    playPiano(Math.pow(1.05946309436, j[0] - 45) * 440, j[1] * snd.tickWait / 1000 + 0.2/*, snd.buffers[idx]*/);
                } else {
                    playDrum();
                }
            }
        });
        snd.pos++;
        if (snd.pos > snd.endLoop * snd.tpm) {
            snd.pos = snd.startLoop * snd.tpm;
            //clearInterval(id);
        }
    }, snd.tickWait);
}

function readNum(len) {
    return parseInt(read(len));
}

function read(len) {
    var tex = snd.dat.substr(snd.pos, len);
    snd.pos += len;
    return tex;
}

function loop(i) {
    return [...Array(i).keys()];
}

var A = new AudioContext();
var b = (i,s,f,x) => Math.sin((6.28)*(i/s)*f+x);
var w = (i,frequency) => Math.sin(6.28*((i/44100)*frequency)+b(i,44100,frequency,0)**2+(.75*b(i,44100,frequency,.25))+(.1*b(i,44100,frequency,.5)));

function playPiano(frequency, time/*, m*/) {
    var D = [];
    var t = 44100 * time;
    for (var i = 0; i < t; i++){
      D[i] = i < 88
           ? (i / (44100 * .002)) * w(i,frequency)
           : (1-((i-(44100*.002))/(44100*(time-.002))))**((.5*Math.log((frequency*1e4)/44100))**2) * w(i,frequency);
    }
    playSample(D, t+1000);
}

function playDrum() {
    D = [];
    var t = 10400;
    for (var i = 0; i < t; i++) {
        D[i] = Math.sin(i*(-1/12300*i+1.9)/(t/(2*Math.PI))*11)*(-1/t*i+1)*0.8;
    }
    playSample(D, t);
}

function playSample(samp, samps) {
    var m=A.createBuffer(2,samps,44100);
    m.getChannelData(0).set(samp);
    m.getChannelData(1).set(samp);
    var s=A.createBufferSource();
    s.buffer=m;
    s.connect(A.destination);
    s.start();
    setTimeout(function() {
        s.stop();
        s.disconnect();
        s = null;
    }, samps/44100 + 600);
}

function drum(x) {
    //var noise = Math.sin(1/(((x%0.54)+0.01)/10000))/1000;
    var pitch = ((-1/12300)*x+1.9);
    var main = Math.sin(((x*pitch)/(10400/(2*Math.PI)))*11);
    var volume = (-1/10400)*x+1;
    return (main*volume)*0.8;
}

readSong("1200000616300100903378068231666846823166684682316600602678068201678268201678268200204");
playSong();