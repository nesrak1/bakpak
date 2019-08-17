//bakpak 8/13/2019 nes

setup();
//#region common util
var seed;
function seededRand() {
    return seed = seededRandOne(seed);
}
function seededRandOne(seed) {
    if (seed == 0)
        seed = 0.1;
    return Math.sin(1/(seed/1e7))/2;
}
function moveTfm(tfm, len, deg) {
    tfm.x += len * Math.cos(deg);
    tfm.z += len * Math.sin(deg);
    return tfm;
}
//#endregion
//#region terrain
var size, sizePo;
function genTerrain(sz) {
    size = 2**sz;
    sizePo = size+1;
    var terr = new Array(size**2);
    terr[0] = (seededRand()+0.5);
    terr[size] = (seededRand()+0.5);
    terr[size*sizePo] = (seededRand()+0.5);
    terr[sizePo*sizePo-1] = (seededRand()+0.5);
    var last = size;

    for (var i = 0; i < sz; i++) {
        var chunks = 2**i;
        var chunkWidth = last/chunks;

        for (var x = 0; x < chunks; x++) {
            for (var y = 0; y < chunks; y++) {
                step(x*chunkWidth, y*chunkWidth, chunkWidth, terr);
            }
        }
    }
    return terr;
}
function step(x, y, size, terr) {
    var cd = [0,2,0,1,
              1,3,2,3];
    var corners = [
        x+y*sizePo,
        x+size+y*sizePo,
        x+(y+size)*sizePo,
        x+size+(y+size)*sizePo
    ];
    function d(x) {
        return terr[corners[cd[x]]] || 0;
    }
    function avgcor(x) {
        return (d(x)+d(x+4))/2;
    }
    var sideavg = [
        avgcor(1), //bottom
        avgcor(0), //top
        avgcor(2), //left
        avgcor(3)  //right
    ];
    var mx = x+size/2;
    var my = y+size/2;
    for (var i = 0; i < 4; i++) {
        var xv = [mx,mx,x,x+size][i];
        var yv = [y+size,y,my,my][i];
        terr[xv+yv*sizePo] = sideavg[i] + seededRand()*(Math.log2(size)*0.1);
    }
    terr[mx+my*sizePo] = (sideavg[0]+sideavg[1]+sideavg[2]+sideavg[3])/4;
}

var sz = 65;
var cnt = 4225;
function buildTerrain() {
    seed = 0.39954239006;
    var terr = genTerrain(6);
    var verts = new Array(cnt*72);
    var norms = new Array(cnt*72);
    var colrs = new Array(cnt*96);
    for (var i = 0; i < cnt; i++) {
        var h = terr[i];
        var x = Math.floor(i/sz) / 10;
        var z = i%sz / 10;
        var ver = createCubeOfDims(x,0,z,x+0.1,Math.max(0.01, h),z+0.1);
        var j;
        for (j = 0; j < 72; j++) {
            verts[j+(i*72)] = ver[j];
        }
        for (j = 0; j < 72; j++) {
            norms[j+(i*72)] = cubeNorms[j];
        }
        for (j = 0; j < 96; j++) {
            colrs[j+(i*96)] = [0.1,0.8,0.1,1][j%4];
        }
    }
    var indcs = createIndiciesOfCount(verts.length/6);
    addSceneObj(tfm(0,0,0), {v:verts,i:indcs,n:norms,c:colrs});
    return terr;
}
function isClose(x,z,treePoses) {
    var close = false;
    treePoses.forEach(pos => {
        if (Math.abs(pos[0]-x) < 1 && Math.abs(pos[1]-z) < 1)
            close |= true;
    });
    return close;
}
function buildTrees(terr) {
    seed = 0.45;
    var treePoses = [];
    models.push(voxelize(data.tree));
    for (var i = 0; i < cnt; i++) {
        if (seededRand() > 0.49999) {
            var h = terr[i];
            var x = Math.floor(i/sz) / 10;
            var z = i%sz / 10;
            if (!isClose(x,z,treePoses)) {
                addSceneObj(tfm(x+0.05,Math.max(0.001, h)+0.7,z+0.05), 0);
                treePoses.push([x,z]);
            }
        }
    }
}
//#endregion

function start()
{
    startGame();
}

//#region scene "game"
var gd = {
    player: {},
    playerlegl: {},
    playerlegr: {},
    playerleganim: 0,
    terr: {},
};
function startGame() {
    gd.terr = buildTerrain();
    buildTrees(gd.terr);
    
    models.push(voxelize(data.playernoleg));
    models.push(voxelize(data.playerleg));
    gd.player = addSceneObj(tfm(2.75, 0.251, 5.85, 0, pi, 0, 0.1, 0.1, 0.1), 1);
    gd.playerlegl = addSceneObj(tfm(2.75, 0.22, 5.87, 0, pi, 0, 0.1, 0.1, 0.1), 2);
    gd.playerlegr = addSceneObj(tfm(2.75, 0.22, 5.83, 0, pi, 0, 0.1, 0.1, 0.1), 2);
    curLoop = loopGame;
    cam = {
        x: 3, y: 1, z: 7,
        a: -0.3, b: 0, c: 0
    };
}
function loopGame() {
    handleKeys();
    if (keysDown[37]) {
        gd.player.tfm.x -= 0.005;
        gd.player.tfm.b += (-gd.player.tfm.b) * 0.1;
        gd.playerleganim += 0.1;
    } else if (keysDown[39]) {
        gd.player.tfm.x += 0.005;
        gd.player.tfm.b += (pi-gd.player.tfm.b) * 0.1;
        gd.playerleganim += 0.1;
    } else {
        if (gd.playerleganim > 2*pi)
            gd.playerleganim = (gd.playerleganim)%(2*pi);
        gd.playerleganim += ((Math.round(gd.playerleganim/pi)*pi)-gd.playerleganim) * 0.1;
    }

    //leg pos and rot
    gd.playerlegl.tfm = Object.assign({}, gd.player.tfm);
    gd.playerlegr.tfm = Object.assign({}, gd.player.tfm);
    moveTfm(gd.playerlegl.tfm, 0.02, -gd.player.tfm.b+hp);
    moveTfm(gd.playerlegr.tfm, 0.02, -gd.player.tfm.b-hp);
    gd.playerlegl.tfm.y -= 0.031;
    gd.playerlegr.tfm.y -= 0.031;
    gd.playerlegl.tfm.c = Math.sin(gd.playerleganim)*0.4;
    gd.playerlegr.tfm.c = -Math.sin(gd.playerleganim)*0.4;

    var offsetX = gd.player.tfm.x - 0.05;

    //handle y pos
    var leftX = Math.floor(offsetX*10);
    var rightX = Math.ceil(offsetX*10);
    var z = Math.floor(gd.player.tfm.z*10);
    var hl = Math.max(0.001, gd.terr[z+leftX*sizePo]);
    var hr = Math.max(0.001, gd.terr[z+rightX*sizePo]);
    var diff = rightX - offsetX*10;
    var lerp = hl*diff+hr*(1-diff);
    gd.player.tfm.y = 0.13+lerp;

    gd.camtar = {
        x: gd.player.tfm.x + 0.5, y: gd.player.tfm.y + 0.6, z: gd.player.tfm.z + 1.2
    };

    //handle camera movement
    cam.x += (gd.camtar.x-cam.x) * 0.1;
    cam.y += (gd.camtar.y-cam.y) * 0.1;
    cam.z += (gd.camtar.z-cam.z) * 0.1;
}
//#endregion

start();