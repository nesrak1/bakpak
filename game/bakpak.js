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
function samePos(tra, tar) {
    tra.x = tar.x;
    tra.y = tar.y;
    tra.z = tar.z;
}
function sameTfm(tra, tar) {
    samePos(tra, tar);
    tra.a = tar.a;
    tra.b = tar.b;
    tra.c = tar.c;
    tra.d = tar.d;
    tra.e = tar.e;
    tra.f = tar.f;
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
    for (var i in loop(terr.length)) {
        terr[i] *= 0.7;
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
//#region models
function createFLConeModel() {
    var ra = 0.94281;
    var rb = 0.33333;
    var rc = sqh*2;
    //return {
    //    v:[-sqh,-1,-sqh, sqh,-1,-sqh, sqh,-1,sqh, -sqh,-1,sqh, 0,1,0],
    //    i:[0,4,1, 1,4,2, 2,4,3, 3,4,0, 0,1,2, 0,2,3],
    //    n:[0,rb,-ra, ra,rb,0, 0,rb,ra, -rb,ra,0, 0,-1,0],
    //    c:Array(5).fill([1,0.8,0,1]).flat()
    //};
    return {
        v:[0,0,0, sqh,-2,sqh, -sqh,-2,sqh, -sqh,-2,-sqh, sqh,-2,-sqh],
        i:[0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,2,3, 1,3,4],
        n:[0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, ],
        //n:Array(6).fill([0,0,1]).flat(),
        c:Array(5).fill([2.5,2,0.5,0.2]).flat()
    };
}
//#endregion

function start()
{
    startGame();
}

//#region scene "game"
var gd = {
    terr: {},

    player: {},
    playerlegl: {},
    playerlegr: {},
    playerleganim: 0,

    sticka: {},
    stickb: {},
    itemclaw: {},
    tar: {},

    spiders: [],
};
function startGame() {
    gd.terr = buildTerrain();
    buildTrees(gd.terr);
    
    //todo - automatic voxelize
    models.push(voxelize(data.playernoleg));//1
    models.push(voxelize(data.playerleg));//2
    models.push(voxelize(data.stick));//3
    models.push(voxelize(data.flashlight));//4
    models.push(createFLConeModel());//5
    models.push(voxelize(data.tinyspider_body));//6
    models.push(voxelize(data.tinyspider_leg));//7

    gd.player = addSceneObj(tfm(2.75, 0.251, 5.85, 0, pi, 0, 0.1, 0.1, 0.1), 1);
    gd.playerlegl = addSceneObj(tfm(2.75, 0.22, 5.87, 0, pi, 0, 0.1, 0.1, 0.1), 2);
    gd.playerlegr = addSceneObj(tfm(2.75, 0.22, 5.83, 0, pi, 0, 0.1, 0.1, 0.1), 2);
    gd.sticka = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), 3);
    gd.stickb = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), 3);
    gd.itemclaw = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), 4);
    gd.spiders.push(addSpider(tfm(4.24, 0.5, 5.85, 0, pi, 0, 0.05, 0.05, 0.05)));
    gd.itemray = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.3, 0.3, 0.3), 5);
    gd.itemray.shading = "";
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
    //samePos(gd.playerlegl.tfm, gd.player.tfm);
    //samePos(gd.playerlegr.tfm, gd.player.tfm);
    //moveTfmXZ(gd.playerlegl.tfm, 0.02, -gd.player.tfm.b+hp);
    //moveTfmXZ(gd.playerlegr.tfm, 0.02, -gd.player.tfm.b-hp);
    //gd.playerlegl.tfm.y -= 0.031;
    //gd.playerlegr.tfm.y -= 0.031;
    //gd.playerlegl.tfm.c = Math.sin(gd.playerleganim)*0.4;
    //gd.playerlegr.tfm.c = -Math.sin(gd.playerleganim)*0.4;
    gd.playerlegl.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,0.2, 0,0,Math.sin(gd.playerleganim)*0.4)));
    gd.playerlegr.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,-0.2, 0,0,-Math.sin(gd.playerleganim)*0.4)));
    //handle y pos
    terrainCollis(gd.player.tfm);

    //handle spider positions
    gd.spiders.forEach(function(spi) {
        //spi.body.tfm = gd.player.tfm;
        //terrainCollis(spi.body.tfm);
        //spi.body.tfm = tfm(4.24, 0.5, 5.85, 0, pi, 0, 0.05, 0.05, 0.05);
        spi.legtime += 0.15;
        for (var leg in loop(8)) {
            var l = spi.legs[leg];
            var side = Math.floor(leg/4);
            var rot = [pi,0][side] + Math.sin(spi.legtime+((leg%4)*0.4))*0.2*(side*2-1);
            l.tfm = dot(transform(spi.body.tfm),transform(tfm((leg%4)*0.2-0.2,-0.1,0.5*[1,-1][side], 0,rot,0)));
            //sameTfm(l.tfm, spi.body.tfm);
            //l.tfm.b = [pi,0][side];
            //moveTfmXZ(l.tfm, (leg%4)*0.01-0.005, spi.body.tfm.b);
            //moveTfmXZ(l.tfm, 0.025, spi.body.tfm.b-dirTableX);
        }
    });

    //target position
    samePos(gd.tar, cam);
    var mx = (xMouse - 480)/480;
    var my = (yMouse - 360)/360;
    //instead of using matrices and converting from screen space
    //to world space the normal way, I've just offset the mouse
    //by some values I guessed which makes it look good enough
    gd.tar.z -= 1;
    gd.tar.x += mx/1.7*(my*0.14+1)-0.05;
    gd.tar.y -= my/2.2 + 0.38;

    //stick arm and claw pos and rot
    gd.sticka.tfm = dot(transform(gd.player.tfm), transform(tfm(0.2,0.5,0, hp/3,hp,0, 0.5,0.5,0.5)));
    gd.stickb.tfm = dot(gd.sticka.tfm, transform(tfm(0,1.45,0, -hp/2,0,0, 1,1,1)));

    var rayRot = Math.atan2(gd.tar.y-gd.itemclaw.tfm[13], gd.tar.x-gd.itemclaw.tfm[12]);
    if (gd.player.tfm.b < hp)
    {
        rayRot += pi;
        rayRot *= -1;
    }
    
    gd.itemclaw.tfm = dot(gd.stickb.tfm, transform(tfm(0,1.45,0, rayRot-1.3,0,0, 1,1,1)));
    gd.itemray.tfm = dot(gd.itemclaw.tfm, transform(tfm(0,1.5,0, pi,pi,0, 5,5,5)));
    //sticka
    //samePos(gd.sticka.tfm, gd.player.tfm);
    //gd.sticka.tfm.y += 0.05;
    //moveTfmXZ(gd.sticka.tfm, 0.03, -gd.player.tfm.b);
    //gd.sticka.tfm.a = hp/3;
    //gd.sticka.tfm.b = gd.player.tfm.b+hp;

    //stickb
    //samePos(gd.stickb.tfm, gd.sticka.tfm);
    //gd.stickb.tfm.a = hp/3;
    //gd.stickb.tfm.b = gd.player.tfm.b-hp;
    //moveTfmXZ(gd.stickb.tfm, Math.sin(gd.sticka.tfm.a)*0.07, -gd.player.tfm.b);
    //moveTfmXY(gd.stickb.tfm, Math.cos(gd.sticka.tfm.a)*0.07, hp);
    //clawstick
    //samePos(gd.itemclaw.tfm, gd.stickb.tfm);
    ////gd.itemclaw.tfm.a = hp;
    //gd.itemclaw.tfm.b = gd.player.tfm.b-hp;
    //moveTfmXZ(gd.itemclaw.tfm, Math.sin(-gd.stickb.tfm.a)*0.07, -gd.player.tfm.b);
    //moveTfmXY(gd.itemclaw.tfm, Math.cos(-gd.stickb.tfm.a)*0.07, hp);
    //itemray
    //samePos(gd.itemray.tfm, gd.itemclaw.tfm);
    //gd.itemray.tfm.a = gd.itemclaw.tfm.a-pi;
    //gd.itemray.tfm.b = gd.player.tfm.b-hp;
    //moveTfmXZ(gd.itemray.tfm, Math.sin(-gd.itemclaw.tfm.a)*0.07, -gd.player.tfm.b);
    //moveTfmXY(gd.itemray.tfm, Math.cos(-gd.itemclaw.tfm.a)*0.07, hp);

    gd.camtar = {
        x: gd.player.tfm.x + 0.3, y: gd.player.tfm.y + 0.6, z: gd.player.tfm.z + 1.2
    };

    //handle camera movement
    cam.x += (gd.camtar.x-cam.x) * 0.1;
    cam.y += (gd.camtar.y-cam.y) * 0.1;
    cam.z += (gd.camtar.z-cam.z) * 0.1;
}
function terrainCollis(tra) {
    var offsetX = tra.x - 0.05;
    var leftX = Math.floor(offsetX*10);
    var rightX = Math.ceil(offsetX*10);
    var z = Math.floor(tra.z*10);
    var hl = Math.max(0.001, gd.terr[z+leftX*sizePo]);
    var hr = Math.max(0.001, gd.terr[z+rightX*sizePo]);
    var diff = rightX - offsetX*10;
    var lerp = hl*diff+hr*(1-diff);
    tra.y = 0.13+lerp;
}
function addSpider(tra) {
    var legs = [];
    for (var i in loop(8)) {
        var newTra = tfm(0,0,0);
        sameTfm(newTra, tra);
        legs[i] = addSceneObj(newTra, 7); //handle leg placement later
    }
    return {
        body: addSceneObj(tra, 6),
        legs: legs,
        legtime: 0
    };
}
//#endregion

start();