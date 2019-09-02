//bakpak 8/13/2019 nes

setup(); //init engine
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
function worldCollis(plyPos, objects) {
    var yCollis = false;
    for (var n = 0; n < objects.length; n++) {
        var i = objects[n];
        if (typeof(i.mio) != "object" && i.mio < 499)
            continue;
        var sz = models[i.mio].s;
        var bb = models[i.mio].b;
        for (var o = 0; o < bb.length; o++) {
            var j = bb[o];
            var pmx = 0.07;
            var pmy = 0.25;
            var pmz = 0.07;
            var nx = (sz[0]-j[3])/10+(i.tfm.x-sz[0]/2/10);
            var ny = j[1]/10+(i.tfm.y-sz[1]/2/10);
            var nz = j[2]/10+(i.tfm.z-sz[2]/2/10);
            var px = (sz[0]-j[0])/10+(i.tfm.x-sz[0]/2/10);
            var py = j[4]/10+(i.tfm.y-sz[1]/2/10);
            var pz = j[5]/10+(i.tfm.z-sz[2]/2/10);
            var mx = (px-nx)/2+nx;
            var my = (py-ny)/2+ny;
            var mz = (pz-nz)/2+nz;
            //check if in any voxel volumes
                
            if (nx < (plyPos.x+pmx) && (plyPos.x-pmx) < px &&
                ny < (plyPos.y+pmy) && (plyPos.y-pmy) < py &&
                nz < (plyPos.z+pmz) && (plyPos.z-pmz) < pz) {

                //reposition player
                var collisX, collisY, collisZ;
    
                if (mx > plyPos.x) {
                    collisX = nx - (plyPos.x+pmx);
                } else {
                    collisX = px - (plyPos.x-pmx);
                }
                if (my > plyPos.y) {
                    collisY = ny - (plyPos.y+pmy);
                } else {
                    collisY = py - (plyPos.y-pmy);
                }
                if (mz > plyPos.z) {
                    collisZ = nz - (plyPos.z+pmz);
                } else {
                    collisZ = pz - (plyPos.z-pmz);
                }
    
                if (Math.abs(collisX) < Math.abs(collisY)) {
                    if (Math.abs(collisX) < Math.abs(collisZ)) {
                        plyPos.x += collisX;
                    } else {
                        plyPos.z += collisZ;
                    }
                } else {
                    if (Math.abs(collisY) < Math.abs(collisZ)) {
                        plyPos.y += collisY;
                        yCollis = true;
                    } else {
                        plyPos.z += collisZ;
                    }
                }
            }
        }
    }
    return yCollis;
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

var sz = 2**7+1;
var cnt = sz**2;
function buildTerrain() {
    seed = 0.39954239006;
    var terr = genTerrain(7);
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
    var close = z > 5.4; //MOP
    treePoses.forEach(pos => {
        if (Math.abs(pos[0]-x) < 1 && Math.abs(pos[1]-z) < 1)
            close |= true;
    });
    return close;
}
function buildTrees(terr) {
    seed = 0.72854;
    var treePoses = [];
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
    return {
        v:[0,0,0, sqh,-2,sqh, -sqh,-2,sqh, -sqh,-2,-sqh, sqh,-2,-sqh],
        i:[0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,2,3, 1,3,4],
        n:[0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1],
        c:[1,0.5,0.5,0.3, 1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0,]
    };
}
//#endregion

function start()
{
    createModels();
    //startGame();
    startCave();
}

//#region models
var mdl_tree = 0;
var mdl_playernoleg = 1;
var mdl_playerleg = 2;
var mdl_stick = 3;
var mdl_flashlight = 4;
var mdl_flConeModel = 5;
var mdl_tinyspider_body = 6;
var mdl_tinyspider_leg = 7;
var mdl_hud_healthred = 8;
var mdl_hud_healthgreen = 9;
var mdl_lightsensor = 10;
var mdl_cavebridge = 600;
function createModels() {
    models.push(voxelize(data.tree));//0
    models.push(voxelize(data.playernoleg));//1
    models.push(voxelize(data.playerleg));//2
    models.push(voxelize(data.stick));//3
    models.push(voxelize(data.flashlight));//4
    models.push(createFLConeModel());//5
    models.push(voxelize(data.tinyspider_body));//6
    models.push(voxelize(data.tinyspider_leg));//7
    models.push(voxelize(data.hud_healthred));//8
    models.push(voxelize(data.hud_healthgreen));//9
    models.push(voxelize(data.lightsensor));//10
    //bad hack to do automatic collision
    //however, I want these to be normal models
    //and manually handle the collision
    //(move player when retracting, etc) manually
    models[600] = voxelize(data.cavebridge);//11
}
//#endregion
//#region scene "game"
var gd = {
    terr: {},

    player: {},
    playerlegl: {},
    playerlegr: {},
    playerleganim: 0,
    playerdir: pi,

    sticka: {},
    stickb: {},
    itemclaw: {},
    tar: {},

    //cave
    lightsensors: [],

    spiders: [],
};
function startGame() {
    gd.terr = buildTerrain();
    buildTrees(gd.terr);

    gd.player = addSceneObj(tfm(2.75, 0.251, 5.85, 0, pi, 0, 0.1, 0.1, 0.1), mdl_playernoleg);
    gd.playerlegl = addSceneObj(tfm(2.75, 0.22, 5.87, 0, pi, 0, 0.1, 0.1, 0.1), mdl_playerleg);
    gd.playerlegr = addSceneObj(tfm(2.75, 0.22, 5.83, 0, pi, 0, 0.1, 0.1, 0.1), mdl_playerleg);
    gd.sticka = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), mdl_stick);
    gd.stickb = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), mdl_stick);
    gd.itemclaw = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), mdl_flashlight);
    for (var i in loop(20))
        gd.spiders.push(addSpider(tfm(4.24+(i*0.5), 0.5, 5.85, 0, pi, 0, 0.05, 0.05, 0.05)));
    gd.itemray = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.3, 0.3, 0.3), mdl_flConeModel);
    gd.itemray.shading = "";

    gd.player.tfm.vx = 0;
    gd.player.tfm.vy = 0;

    curLoop = loopGame;
    cam = {
        x: 3, y: 1, z: 7,
        a: -0.3, b: 0, c: 0
    };
}
function loopGame() {
    handleKeys();
    if (keysDown[37]) {
        gd.player.tfm.vx = -0.005;
        gd.playerdir = 0;
        gd.playerleganim += 0.1;
    } else if (keysDown[39]) {
        gd.player.tfm.vx = 0.005;
        gd.playerdir = pi;
        gd.playerleganim += 0.1;
    } else {
        if (gd.playerleganim > 2*pi)
            gd.playerleganim = (gd.playerleganim)%(2*pi);
        gd.playerleganim += ((Math.round(gd.playerleganim/pi)*pi)-gd.playerleganim) * 0.1;
    }
    gd.player.tfm.b += (gd.playerdir-gd.player.tfm.b) * 0.1;
    if (keysDown[38] && !gd.player.tfm.jmp) {
        gd.player.tfm.vy = 0.017;
        gd.player.tfm.jmp = true;
    }

    //player vel and pos
    gd.player.tfm.x += gd.player.tfm.vx;
    gd.player.tfm.y += gd.player.tfm.vy;
    gd.player.tfm.vx /= 1.2;
    gd.player.tfm.vy -= 0.001;
    terrainCollis(gd.player.tfm, gd.player.tfm.y + gd.player.tfm.vy);

    //leg pos and rot
    gd.playerlegl.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,0.2, 0,0,Math.sin(gd.playerleganim)*0.4)));
    gd.playerlegr.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,-0.2, 0,0,-Math.sin(gd.playerleganim)*0.4)));

    //handle spider positions
    gd.spiders.forEach(function(spi) {
        spi.legtime += 0.15;
        terrainCollis(spi.body.tfm);
        spi.body.tfm.y -= 0.06;
        //spider/light collision
        var rotAway = Math.abs(Math.atan2(gd.tar.y-gd.itemclaw.tfm[13], gd.tar.x-gd.itemclaw.tfm[12]) -
                               Math.atan2(spi.body.tfm.y-gd.itemclaw.tfm[13], spi.body.tfm.x-gd.itemclaw.tfm[12]));
        var distAway = Math.sqrt((spi.body.tfm.y-gd.itemclaw.tfm[13])**2+(spi.body.tfm.x-gd.itemclaw.tfm[12])**2);
        var sign = Math.sign(gd.player.tfm.x-spi.body.tfm.x);
        spi.dir = sign>0 ? 0 : pi;
        if (rotAway > 0.4 || distAway > 0.65) {
            spi.body.tfm.x += sign*0.0014;
        }
        spi.body.tfm.x += sign*0.001;
        spi.body.tfm.b += (spi.dir-spi.body.tfm.b)*0.1;
        //leg rotation
        for (var leg in loop(8)) {
            var l = spi.legs[leg];
            var side = Math.floor(leg/4);
            var rot = [pi,0][side] + Math.sin(spi.legtime+((leg%4)*0.4))*0.2*(side*2-1);
            l.tfm = dot(transform(spi.body.tfm),transform(tfm((leg%4)*0.2-0.2,-0.1,0.4*[1,-1][side], 0,rot,0)));
        }
    });

    handleFlashlight();

    gd.camtar = {
        x: gd.player.tfm.x + 0.3, y: gd.player.tfm.y + 0.6, z: gd.player.tfm.z + 1.2
    };

    //handle camera movement
    cam.x += (gd.camtar.x-cam.x) * 0.1;
    cam.y += (gd.camtar.y-cam.y) * 0.1;
    cam.z += (gd.camtar.z-cam.z) * 0.1;
}
function handleFlashlight() {
    //stick arm and claw pos and rot
    gd.sticka.tfm = dot(transform(gd.player.tfm), transform(tfm(0.2,0.5,0, hp/3,hp,0, 0.5,0.5,0.5)));
    gd.stickb.tfm = dot(gd.sticka.tfm, transform(tfm(0,1.45,0, -hp/2,0,0, 1,1,1)));
    
    //target position (ray rotation)
    samePos(gd.tar, cam);
    var mx = (xMouse - 480)/480;
    var my = (yMouse - 360)/360;
    //instead of using matrices and converting from screen space
    //to world space the normal way, I've just offset the mouse
    //by some values I guessed which makes it look good enough
    gd.tar.z -= 1;
    gd.tar.x += mx/1.7*(my*0.14+1)-0.05;
    gd.tar.y -= my/2.2 + 0.38;
    var rayRot = Math.atan2(gd.tar.y-gd.itemclaw.tfm[13], gd.tar.x-gd.itemclaw.tfm[12]);
    var unFlippedRayRot = rayRot;
    if (gd.player.tfm.b < hp)
    {
        rayRot += pi;
        rayRot *= -1;
    }
    
    gd.itemclaw.tfm = dot(gd.stickb.tfm, transform(tfm(0,1.45,0, rayRot-1.3,0,0, 1,1,1)));
    gd.itemray.tfm = dot(gd.itemclaw.tfm, transform(tfm(0,1.5,0, pi,pi,0, 10,10,10)));
    
    spotPos = [gd.itemray.tfm[12],gd.itemray.tfm[13],gd.itemray.tfm[14]];
    var cos = Math.cos;
    var sin = Math.sin;
    //var rx = cos(-cam.b-hp) * cos(cam.a);
    //var ry = sin(cam.a);
    //var rz = sin(-cam.b-hp) * cos(cam.a);
    var rx = cos(0) * cos(unFlippedRayRot);
    var ry = sin(unFlippedRayRot);
    var rz = sin(0) * cos(unFlippedRayRot);
    spotRot = [rx,ry,rz];
}
function terrainCollis(tra,nextY) {
    var offsetX = tra.x - 0.05;
    var leftX = Math.floor(offsetX*10);
    var rightX = Math.ceil(offsetX*10);
    var z = Math.floor(tra.z*10);
    var hl = Math.max(0.001, gd.terr[z+leftX*sizePo]);
    var hr = Math.max(0.001, gd.terr[z+rightX*sizePo]);
    var diff = rightX - offsetX*10;
    var lerp = hl*diff+hr*(1-diff);
    var result = 0.13+lerp;
    if (nextY == null || tra.y < result || (tra.y > result && nextY <= result)) {
        tra.y = result;
        tra.jmp = false;
    }
}
function addSpider(tra) {
    var legs = [];
    for (var i in loop(8)) {
        var newTra = tfm(0,0,0);
        sameTfm(newTra, tra);
        legs[i] = addSceneObj(newTra, mdl_tinyspider_leg); //handle leg placement later
    }
    var body = addSceneObj(tra, mdl_tinyspider_body);
    body.tfm.vx = 0;
    body.tfm.vy = 0;
    body.tfm.vz = 0;
    return {
        body: body,
        legs: legs,
        legtime: 0,
        dir: pi
    };
}
//#endregion
//#region scene "cave"
function startCave() {
    generateLevel(data.boss1_cave);
    loadScene(0);
    gd.player = addSceneObj(tfm(-7, 2, -0.5, 0, pi, 0, 0.1, 0.1, 0.1), mdl_playernoleg);
    gd.playerlegl = addSceneObj(tfm(2.75, 0.22, 5.87, 0, pi, 0, 0.1, 0.1, 0.1), mdl_playerleg);
    gd.playerlegr = addSceneObj(tfm(2.75, 0.22, 5.83, 0, pi, 0, 0.1, 0.1, 0.1), mdl_playerleg);
    gd.sticka = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), mdl_stick);
    gd.stickb = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), mdl_stick);
    gd.itemclaw = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), mdl_flashlight);

    gd.player.tfm.vx = 0;
    gd.player.tfm.vy = 0;

    gd.lightsensors.push({
        obj: addSceneObj(tfm(-1.1, 2.39, -0.5, 0,0,0, 0.3,0.3,0.3), mdl_lightsensor),
        tar: addSceneObj(tfm(-1.15, 1.55, -0.5, 0,0,0, 1,0.8,1), mdl_cavebridge),
        con: function(self, activated) { //todo (use this instead of self?)
            self.tar.tfm.x = Math.max(-2.3, Math.min(-1.15, self.tar.tfm.x+(0.005*(activated?1:-1))))
        }
    });

    gd.itemray = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.3, 0.3, 0.3), mdl_flConeModel);
    gd.itemray.shading = "";

    curLoop = loopCave;
    cam = {
        x: 3, y: 1, z: 7,
        a: -0.3, b: 0, c: 0
    };
}
function loopCave() {
    if (keysDown[37]) {
        gd.player.tfm.vx = -0.01;
        gd.playerdir = 0;
        gd.playerleganim += 0.1;
    } else if (keysDown[39]) {
        gd.player.tfm.vx = 0.01;
        gd.playerdir = pi;
        gd.playerleganim += 0.1;
    } else {
        if (gd.playerleganim > 2*pi)
            gd.playerleganim = (gd.playerleganim)%(2*pi);
        gd.playerleganim += ((Math.round(gd.playerleganim/pi)*pi)-gd.playerleganim) * 0.1;
    }
    gd.player.tfm.b += (gd.playerdir-gd.player.tfm.b) * 0.1;
    if (keysDown[38] && !gd.player.tfm.jmp) {
        gd.player.tfm.vy = 0.017;
        gd.player.tfm.jmp = true;
    }

    //player vel and pos
    gd.player.tfm.x += gd.player.tfm.vx;
    gd.player.tfm.y += gd.player.tfm.vy;
    gd.player.tfm.vx /= 1.2;
    gd.player.tfm.vy -= 0.001;

    if (worldCollis(gd.player.tfm, scene)) { //if on ground
        gd.player.tfm.jmp = false;
        gd.player.tfm.vy = 0;
    }

    //leg pos and rot
    gd.playerlegl.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,0.2, 0,0,Math.sin(gd.playerleganim)*0.4)));
    gd.playerlegr.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,-0.2, 0,0,-Math.sin(gd.playerleganim)*0.4)));

    handleFlashlight();
    
    gd.camtar = {
        x: gd.player.tfm.x + 0.3, y: gd.player.tfm.y + 0.6, z: gd.player.tfm.z + 1.2
    };

    //handle camera movement
    cam.x += (gd.camtar.x-cam.x) * 0.1;
    cam.y += (gd.camtar.y-cam.y) * 0.1;
    cam.z += (gd.camtar.z-cam.z) * 0.1;

    //handle light sensors
    for (var i = 0; i < gd.lightsensors.length; i++) {
        var ls = gd.lightsensors[i];
        var lsobj = ls.obj;

        var rotAway = Math.abs(Math.atan2(gd.tar.y-gd.itemclaw.tfm[13], gd.tar.x-gd.itemclaw.tfm[12]) -
                               Math.atan2(lsobj.tfm.y-gd.itemclaw.tfm[13], lsobj.tfm.x-gd.itemclaw.tfm[12]));
        var distAway = Math.sqrt((lsobj.tfm.y-gd.itemclaw.tfm[13])**2+(lsobj.tfm.x-gd.itemclaw.tfm[12])**2);
        var lsActivated = rotAway < 0.4 && distAway < 1.2;

        ls.con(ls, lsActivated);
    }
}
//#endregion
start(); //start game