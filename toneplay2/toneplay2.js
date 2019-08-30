var ac = new AudioContext();
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
    notes: [], //notes with pitches and values
    randNoise: seededRandNoise()
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
    snd.pos = 0;
    snd.tickWait = readNum(3);
    snd.startLoop = readNum(2);
    snd.endLoop = readNum(3);
    snd.tpm = readNum(2);
    var instCount = readNum(1);
    for (var _ of loop(instCount)) {
        var oscType = readNum(1);
        snd.instruments.push(oscType);
    }
    for (var instIdx of loop(instCount)) {
        var noteCount = readNum(3);
        var curNotes = [];
        var i = 0;
        var curX = 0;
        if (snd.instruments[instIdx] < 4) { //note
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
                curX++;
                i++;
            }
        }
        snd.notes.push(curNotes);
    }
}

function playSong() {
    snd.notes.forEach(function(i, idx) {
        i.forEach(function(j, jdx) {
            var inst = snd.instruments[idx];
            if (j !== undefined) {
                if (inst < 4) {
                    var freq = Math.pow(1.05946309436, j[0] - 45) * 440;
                    var len = j[1] * snd.tickWait / 1000;
                    playInst(freq, len, jdx, inst);
                } else {
                    //playDrum(jdx, inst - 4);
                }
            }
        });
    });
}

//needed for all oscillators and gain nodes
//the noise function already has both l and r set
//if we don't use this function, the sound will
//only come out of the left ear and not the right
function enableLeftAndRightEarsForAwesomeHeadphoneUsers(thing) {
    thing.channelCountMode = "explicit";
    thing.channelCount = 2;
}

function playInst(freq, len, pos, oscType) {
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    var ct = ac.currentTime;
    
    osc.type = ["sine","square","sawtooth","triangle"][oscType];
    
    enableLeftAndRightEarsForAwesomeHeadphoneUsers(gain);
    enableLeftAndRightEarsForAwesomeHeadphoneUsers(osc);

    var startTime = (pos*snd.tickWait)/1000;
    var endTime = ct + startTime + (len*snd.tickWait+200)/1000;

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.frequency.value = freq;
    osc.start(ct + startTime);

    gain.gain.setValueAtTime(0.3, ct);
    gain.gain.linearRampToValueAtTime(0.3, ct + 50/1000);
    gain.gain.linearRampToValueAtTime(0.3, endTime - 100/1000);
    gain.gain.linearRampToValueAtTime(0.0, endTime);

    osc.stop(endTime);
}

function playDrum(pos, drumType) {
    var snd1;// = ac.createOscillator();
    var snd2;// = ac.createOscillator();
    var gain1 = ac.createGain();
    var gain2 = ac.createGain();
    var len = [0.3,0.5][drumType];
    var ct = ac.currentTime;

    var startTime = (pos*snd.tickWait)/1000;
    var endTime = ct + startTime + len;

    //bass
    if (drumType == 0) {
        //sine - todo double osc volume
        var snd1 = ac.createOscillator();
        snd1.type = "sine";
        snd1.frequency.setValueAtTime(105, ct);
        snd1.frequency.linearRampToValueAtTime(47, endTime);
        enableLeftAndRightEarsForAwesomeHeadphoneUsers(snd1);
        //rand
        snd2 = ac.createBufferSource();
        snd2.buffer = snd.randNoise;
        snd2.loop = true;

        //envelope
        gain1.gain.setValueAtTime(0.2, ct);
        gain1.gain.linearRampToValueAtTime(0.2, ct + 50/1000);  
        gain1.gain.linearRampToValueAtTime(0.1, endTime - 100/1000);
        gain1.gain.linearRampToValueAtTime(0.0, endTime);
        
        gain2.gain.setValueAtTime(0.5, ct);
        gain2.gain.linearRampToValueAtTime(0.4, ct + (64/255)*0.226);
        gain2.gain.linearRampToValueAtTime(0.2, ct + (91/255)*0.226);
        gain2.gain.linearRampToValueAtTime(0.0, endTime);
    } else if (drumType == 1) {
        //sine - todo double osc volume
        var snd1 = ac.createOscillator();
        snd1.type = "sine";
        snd1.frequency.setValueAtTime(88*2, ct);
        snd1.frequency.linearRampToValueAtTime(88/2, endTime);
        enableLeftAndRightEarsForAwesomeHeadphoneUsers(snd1);
        //rand
        snd2 = ac.createBufferSource();
        snd2.buffer = snd.randNoise;
        snd2.loop = true;

        //envelope
        gain1.gain.setValueAtTime(30/200, ct);
        gain1.gain.linearRampToValueAtTime(30/200, ct + (64/255)*0.5);  
        gain1.gain.linearRampToValueAtTime(19/200, ct + (111/255)*0.5);
        gain1.gain.linearRampToValueAtTime(0.0, endTime);
        
        gain2.gain.setValueAtTime(63/200, ct);
        gain2.gain.linearRampToValueAtTime(18/200, ct + (64/255)*0.5);  
        gain2.gain.linearRampToValueAtTime(12/200, ct + (91/255)*0.5);
        gain2.gain.linearRampToValueAtTime(0.0, endTime);
    }
    enableLeftAndRightEarsForAwesomeHeadphoneUsers(gain1);
    enableLeftAndRightEarsForAwesomeHeadphoneUsers(gain2);
    
    gain1.connect(ac.destination);
    gain2.connect(ac.destination);
    snd1.connect(gain1);
    snd2.connect(gain2);

    snd1.start(ct + startTime);
    snd2.start(ct + startTime);

    snd1.stop(endTime);
    snd2.stop(endTime);
}

function seededRandNoise() {
    seed = 0.44100;
    var sampLen = 44100;
    var buff = ac.createBuffer(2, sampLen, 22050);
    var leftちゃん = buff.getChannelData(0);
    var rightちゃん = buff.getChannelData(1);
    for (var i = 0; i < sampLen; i++) {
        var val = seededRand() / 2;
        leftちゃん[i] = val;
        rightちゃん[i] = val;
    }
    return buff;
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

readSong("10700015123003072036036720625622727625622727625622727625622725627722725627722725627722725627722727625622727625622727625622727625622725627722725627722725627722725627722727625622727625622727625622727625622725627722725627722725627722725627722048060036780627622764761782617712712612765762781616711712615740742741645742742624623645741621721724614712742642622621622622740744743722721613713725623722030073737373737373737373737373737");
document.getElementById("play").onclick = function() { playSong(); };