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

var seed;
function seededRand() {
    return seed = seededRandOne(seed);
}
function seededRandOne(seed) {
    if (seed == 0)
        seed += 0.1;
    return Math.sin(1/(seed/1e7))/2;
}

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

function playSample(samp, samps, fr = 22050) {
    var m=A.createBuffer(2,samps,fr);
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
    }, samps/fr + 600);
}

//function drum(x) {
//    //var noise = Math.sin(1/(((x%0.54)+0.01)/10000))/1000;
//    var pitch = ((-1/12300)*x+1.9);
//    var main = Math.sin(((x*pitch)/(10400/(2*Math.PI)))*11);
//    var volume = (-1/10400)*x+1;
//    return (main*volume)*0.8;
//}
var d96,d97,d98,d99;
var cx = [];
function genDrum() {
    clearCombo();
    d96 = loopWave(function(x){ return 0+
        combo([0,16,63/64,0/256],[3,1,32/128,0/256],[3,0.5,64/64,128/256],5000,x,0)},5000);
        //combo([5,5,16/64,0/256],[0,1,32/128,0/256],[3,0.5,64/64,128/256],5000,x,1)},5000);
    clearCombo();
    d97 = loopWave(function(x){ return 0+
        combo([0,40,30/128,0/256],[3,1,44/128,0/256],[3,0.5,64/128,128/256],10000,x,0)+
        combo([5,14,41/128,0/256],[5,3,32/128,0/256],[3,0.5,64/128,128/256],10000,x,1)},10000);
    clearCombo();
    d98 = loopWave(function(x){ return 0+
        combo([5,48,30/128,0/256],[5,1,32/128,0/256],[3,0.5,64/128,128/256],1000,x,0)},1000);
    clearCombo();
    d99 = loopWave(function(x){ return 0+
        combo([5,48,30/128,0/256],[5,1,32/128,0/256],[3,0.5,64/128,128/256],10000,x,0)},10000);
    //playSample(d96, 5000, 22050);
    //playSample(d97, 10000, 22050);
    //playSample(d98, 1000, 22050);
    //playSample(d99, 10000, 22050);
}
genDrum();

function clearCombo() {
    cx[0] = 0; cx[1] = 0;
}

function loopWave(eq, len) {
    var a = new Array(len);
    for (i in loop(len)) {
        a[i] = eq(i);
    }
    return a;
}

function combo(main, pitch, volume, len, x, cxi) {
    var p = wave(...pitch, len, x);
    p = p > 0 ? 4*p+1 : p+1;
    var v = wave(...volume, len, x)*2+1;
    var m = wave(...main, len, cx[cxi])*v;
    cx[cxi] += p;
    if (x%500==0)
        console.log(v);
    return m;
}

function wave(type, rep, top, off, len, x) {
    var sub = Math.min(1,rep);
    x += off*len;
    rep /= len;
    if (rep == 0)
        return top;
    return [Math.sin((2*Math.PI*x)*rep), //sine
        2/Math.PI*Math.asin(Math.sin(2*Math.PI*x*rep)), //triangle
        2*(x*rep-Math.floor(x*rep))-sub, //sawtooth
        2*(-x*rep-Math.floor(-x*rep))-(1-sub)-1, //reverse sawtooth
        (-1)**Math.floor(2*x*rep), //square
        2*seededRandOne(x*rep) //seeded rand
    ][type] * top; //square
}

clearCombo();
download("audio.wav",createSample(function(x){ return 0+
    combo([0,40,30/128,0/256],[3,1,44/128,0/256],[3,0.5,64/64,128/256],10000,x,0)+
    combo([5,14,41/128,0/256],[5,3,32/128,0/256],[3,0.5,64/64,128/256],10000,x,1)
}, 5000));
//download("audio.wav",createSample(function(x){return combo([0,10,32/128,0],[2,1,32/128,0/256],[0,0,0/128,0],3000,x)}, 3000));
//download("audio.wav",createSample(function(x){return combo([0,5,32/128,0],[4,0,-32/128,0/256],[0,0,0/128,0],3000,x)}, 3000));
//download("audio.wav",createSample(function(x){return combo([0,5,32/128,0],[4,0,32/128,0/256],[0,0,0/128,0],3000,x)}, 3000));
//download("audio.wav",createSample(function(x){return Math.sin(x/200)}, 3000));

//var com = [];
//for (var i = 0; i < 3000; i++) {
//    com[i] = combo([0,99,32/64,0],[2,1,55/64,197/256],[0,0,0/64,0],i);
//}
//playSample(com, com.length, 22050);

//readSong("songdatahere");
//playSong();

function createSample(waveEquation, len) {
    //reusing vars for mop
    var tex = "";
    for (var i = 0; i < len; i++) {
        var v = waveEquation(i) * 32767;
        tex += wordByte2((v<0)?v+65535:v);
    }
    var dat = "RIFF"+wordByte2(len*2+36)+"\0\0WAVEfmt "+atob("EAAAAAEAAQAiVgAAiFgBAAIAEAA=")+"data"+wordByte2(len*2)+"\0\0"+tex;
    return "data:audio/wav;base64,"+btoa(dat);
}
function wordByte2(num) {
    var z = String.fromCharCode;
    return z(num&255)+z(num>>8);
}
function wordByte(num) {
    //something broke here and I can't remember what it was so just use wordByte2
    return String.fromCharCode(num&255)+String.fromCharCode(num&0xFF00>>8)+String.fromCharCode(num>>16);
    //for two numbers, much smaller but very limited
    //return z(num&255)+z(num>>8);
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', text);
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }