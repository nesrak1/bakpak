var ac = new AudioContext();
var snd = {snds:[]};

function clearSong() {
    snd.snds.forEach(o => o.stop());
    clearInterval(snd.intv);
    snd = {
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
        snds: [],
        nrminst: 0,
        intv: {},
        randNoise: seededRandNoise()
    };
}
function readSong(data) {
    snd.dat = data;
    snd.pos = 0;
    snd.tickWait = readNum(3);
    snd.startLoop = readNum(2);
    snd.endLoop = readNum(3);
    snd.tpm = readNum(2);
    var instCount = readNum(1);
    for (var i = 0; i < instCount; i++) {
        var oscType = readNum(1);
        snd.instruments.push(oscType);
    }
    for (var instIdx = 0; instIdx < instCount; instIdx++) {
        var noteCount = readNum(3);
        var curNotes = [];
        var i = 0;
        var curX = 0;
        if (snd.instruments[instIdx] < 4) { //note
            snd.nrminst++;
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
				if (isNaN(len))
					return;
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
    snd.intv = setInterval(function x() {
        snd.snds = [];
        snd.notes.forEach(function(i, idx) {
            i.forEach(function(j, jdx) {
                var inst = snd.instruments[idx];
                if (j !== undefined) {
                    if (inst < 4) {
                        var freq = Math.pow(1.05946309436, j[0] - 45) * 440;
                        var len = j[1] * snd.tickWait / 1000;
                        playInst(freq, len, jdx, inst);
                    } else {
                        playDrum(jdx+0.5, inst - 4);
                    }
                }
            });
        });
        return x;
    }(), snd.tickWait*snd.endLoop*snd.tpm); //no time, run
}

//needed for all oscillators and gain nodes
//the noise function already has both l and r set
//if we don't use this function, the sound will
//only come out of the left ear and not the right
function fixHp(thing) {
    thing.channelCountMode = "explicit";
    thing.channelCount = 2;
}

function playInst(freq, len, pos, oscType) {
    var osc = ac.createOscillator();
    snd.snds.push(osc);
    var gain = ac.createGain();
    var ct = ac.currentTime;
    
    osc.type = ["sine","square","sawtooth","triangle"][oscType];
    
    fixHp(gain);
    fixHp(osc);

    var startTime = (pos*snd.tickWait)/1000;
    var endTime = ct + startTime + (8*len*snd.tickWait)/1000;

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.frequency.value = freq;
    osc.start(ct + startTime);

    gain.gain.setValueAtTime(0.3/snd.nrminst, ct);
    gain.gain.linearRampToValueAtTime(0.3/snd.nrminst, ct + 50/1000);
    gain.gain.linearRampToValueAtTime(0.3/snd.nrminst, endTime - 10/1000);
    gain.gain.linearRampToValueAtTime(0.0, endTime);

    osc.stop(endTime);
}

function ZZFXLib(){this.x=ac;this.r=Date.now();this.buffer=0;this.volume=.5;this.randomness=.1}ZZFXLib.prototype.z=function(b,d,t){var a=this.Generate(b),c;for(c in d)a[c]=d[c];return this.Z(a.volume,a.randomness,a.frequency,a.length,a.attack,a.slide,a.noise,a.modulation,a.modulationPhase,t)};
ZZFXLib.prototype.Z=function(b,d,a,c,e,g,h,k,l,t){c=void 0===c?1:c;e=void 0===e?.1:e;g=void 0===g?0:g;h=void 0===h?0:h;k=void 0===k?0:k;l=void 0===l?0:l;b*=this.volume;a*=2*Math.PI/44100;a*=1+d*(2*this.R()-1);g*=1E3*Math.PI/Math.pow(44100,2);c=0<c?44100*(10<c?10:c)|0:1;e*=c|0;k*=2*Math.PI/44100;l*=Math.PI;d=[];for(var m=0,n=0,f=0;f<c;++f)d[f]=b*Math.cos(m*a*Math.cos(n*k+l))*(f<e?f/e:1-(f-e)/(c-e)),m+=1+h*(2*this.R()-1),n+=1+h*(2*this.R()-1),a+=g;this.buffer=d;b=this.x.createBuffer(2,d.length,44100);
a=this.x.createBufferSource();b.getChannelData(0).set(d);b.getChannelData(1).set(d);a.buffer=b;a.connect(this.x.destination);a.start(t);return a};
ZZFXLib.prototype.Generate=function(b){var d=this.r;this.r=b;for(var a=9;a--;)this.R();a={};a.seed=b;a.volume=1;a.randomness=b?this.randomness:0;a.frequency=b?2E3*Math.pow(this.R(),2)|0:220;a.slide=b?parseFloat((10*Math.pow(this.R(),3)).toFixed(1)):0;a.length=b?parseFloat((.1+this.R()).toFixed(1)):1;a.attack=b?parseFloat(this.R().toFixed(2)):.1;a.noise=b?parseFloat((5*Math.pow(this.R(),3)).toFixed(1)):0;a.modulation=b?parseFloat((99*Math.pow(this.R(),5)).toFixed(1)):0;a.modulationPhase=b?parseFloat(this.R().toFixed(2)):
0;this.r=d;return a};ZZFXLib.prototype.Note=function(b,d){return b*Math.pow(2,d/12)};ZZFXLib.prototype.R=function(){this.r^=this.r<<13;this.r^=this.r>>7;this.r^=this.r<<17;return Math.abs(this.r)%1E9/1E9};var ZZFX=new ZZFXLib;

function playDrum(pos, drumType) {
    var ct = ac.currentTime;
    var startTime = (pos*snd.tickWait)/1000;

    if (drumType == 0) {
        snd.snds.push(ZZFX.z(1,{volume:.2,randomness:0,frequency:150,attack:-0.03,slide:-0.5,modulation:0,modulationPhase:0},ct+startTime));
    } else if (drumType == 1) {
        snd.snds.push(ZZFX.z(1,{volume:.2,randomness:0,frequency:950,attack:-0.55,slide:0,noise:5.2,modulation:0,modulationPhase:0},ct+startTime));
    } else if (drumType == 2) {
        snd.snds.push(ZZFX.z(1,{volume:.2,randomness:0,frequency:1550,length:.1,attack:-0.55,slide:0,noise:5,modulation:0,modulationPhase:0},ct+startTime));
    }
}

function seededRandNoise() {
    seed = 0.44100;
    var sampLen = 44100;
    var buff = ac.createBuffer(2, sampLen, 22050);
    var leftChan = buff.getChannelData(0);
    var rightChan = buff.getChannelData(1);
    for (var i = 0; i < sampLen; i++) {
        var val = seededRand() / 2;
        leftChan[i] = val;
        rightChan[i] = val;
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

//readSong("128000161660004560160321131603163316321632163316331632163216331633163216321633163316321630320441178068578278468278468378468468578278468278468378468468578278468278468378468468578278468278468378405804411740642744642742685641684744741683642745684682681784742642743743740646783783685614711712712642747645645711712713613643745683744643681683721722722722781622721641723623743643312106406240624062406240624062406240624062406240624062406240624062406240324777777777777777777777777777777712801111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111");
//document.getElementById("play").onclick = function() { playSong(); };