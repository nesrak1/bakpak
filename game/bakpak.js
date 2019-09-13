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
function worldCollis(plyPos, objects, pmx=0.07, pmy=0.25, pmz=0.07, anyCollis=false) {
    var yCollis = false;
    for (var n = 0; n < objects.length; n++) {
        var i = objects[n];
        if (typeof(i.mio) != "object" && i.mio < 499)
            continue;
        var sz = models[i.mio].s;
        var bb = models[i.mio].b;
        for (var o = 0; o < bb.length; o++) {
            var j = bb[o];
            var nx = (sz[0]-j[3])/10+(i.tfm.x-sz[0]/2/10)-0.1;
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
                        yCollis |= anyCollis;
                    } else {
                        plyPos.z += collisZ;
                        yCollis |= anyCollis;
                    }
                } else {
                    if (Math.abs(collisY) < Math.abs(collisZ)) {
                        plyPos.y += collisY;
                        yCollis |= true;
                    } else {
                        plyPos.z += collisZ;
                        yCollis |= anyCollis;
                    }
                }
            }
        }
    }
    return yCollis;
}
function angleDist(angA, angB) {
    return Math.abs(Math.atan2(Math.sin(angA-angB), Math.cos(angA-angB)));
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
    for (var i = 0; i < terr.length; i++) {
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
                addSceneObj(tfm(x+0.05,Math.max(0.001, h)+0.7,z+0.05), mdl_tree);
                treePoses.push([x,z]);
            }
        }
    }
    addSceneObj(tfm(1.6+0.05,0.92,5.8+0.05), mdl_tree);
}
//#endregion
//#region models
function createFLConeModel() {
    return {
        v:[0,0,0, sqh,-2,sqh, -sqh,-2,sqh, -sqh,-2,-sqh, sqh,-2,-sqh],
        i:[0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,2,3, 1,3,4],
        n:[0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1],
        c:[1,0.5,0.5,0.3, 1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0]
    };
}
//#endregion

function start() {
    document.removeEventListener("click", start, false);
    document.getElementById("debug").innerHTML = "";
    ctx.fillStyle = "#fff";
    ctx.font = "20px sans-serif";
    createModels();
    generateLevel(data.boss1_cave);
    generateLevel(data.boss2_factory);
    console.log("BAKPAK js13k19 - nes/egghead");
    startTerrain();
    //startCave();
}

//#region models
var mdl_tree = 0;
var mdl_playernoleg = 1;
var mdl_playerleg = 2;
var mdl_stick = 3;
var mdl_flashlight = 4;
var mdl_flConeModel = 5;
var mdl_grapple = 6;
var mdl_grapple_shot = 7;
var mdl_grapple_rope = 8;
var mdl_tinyspider_body = 9;
var mdl_tinyspider_leg = 10;
var mdl_largespider_leg = 11;
var mdl_lilbot_body = 12;
var mdl_lilbot_leg = 13;
var mdl_eggbot9000_body = 14;
var mdl_eggbot9000_leg = 15;
var mdl_eggbot9000_weapon = 16;
var mdl_eggbot9000_head = 17;
var mdl_hud_healthred = 18;
var mdl_hud_healthyellow = 19;
var mdl_hud_healthgreen = 20;
var mdl_lightsensor = 21;
var mdl_onekstand = 22;
var mdl_lamp = 23;
var mdl_laser = 24;
var mdl_hook = 25;
var mdl_caveent = 26;
var mdl_cavebridge = 700;
var mdl_caveelevator = 701;
var mdl_door = 702;
function createModels() {
    models.push(voxelize(data.tree));
    models.push(voxelize(data.playernoleg));
    models.push(voxelize(data.playerleg));
    models.push(voxelize(data.stick));
    models.push(voxelize(data.flashlight));
    models.push(createFLConeModel());
    models.push(voxelize(data.grapple));
    models.push(voxelize(data.grapple_shot));
    models.push(voxelize(data.grapple_rope));
    models.push(voxelize(data.tinyspider_body));
    models.push(voxelize(data.tinyspider_leg));
    models.push(voxelize(data.largespider_leg));
    models.push(voxelize(data.lilbot_body));
    models.push(voxelize(data.lilbot_leg));
    models.push(voxelize(data.eggbot9000_body));
    models.push(voxelize(data.eggbot9000_leg));
    models.push(voxelize(data.eggbot9000_weapon));
    models.push(voxelize(data.eggbot9000_head));
    models.push(voxelize(data.hud_healthred));
    models.push(voxelize(data.hud_healthyellow));
    models.push(voxelize(data.hud_healthgreen));
    models.push(voxelize(data.lightsensor));
    models.push(voxelize(data.onekstand));
    models.push(voxelize(data.lamp));
    models.push(voxelize(data.laser));
    models.push(voxelize(data.hook));
    models.push(voxelize(data.caveent));
    //bad hack to do automatic collision
    models[700] = voxelize(data.cavebridge);
    models[701] = voxelize(data.caveelevator);
    models[702] = voxelize(data.door);
}
//#endregion
var gd = {
    terr: null,

    player: {},
    playerlegl: {},
    playerlegr: {},
    playerleganim: 0,
    playerdir: pi,
    hasgrap: false,//false
    equipgrap: false,//false
    deploygrap: false,
    grapdist: 0,
    grapoldmat: {},
    grap: {},
    playerhealth: 100,

    sticka: {},
    stickb: {},
    itemclaw: {},
    tar: {},

    isCave: true,

    camzones: [],

    lightsensors: [],
    //cave
    spiderboss: {},
    //factory
    hooks: [],

    bossspawntimer: 200,

    spiders: [],
};
//#region scene "terrain"
function startTerrain() {
    clearSong();
    readSong("1280301916703120460160330493160216331642163316221633164216331622163316421633162216331642163016036049316021643164216531652164316421653165216431642165316521643164216501604004931602165316121613165216531612161316521653161216131652165316121610750570493160216331612163642742742743648743742745641611612611614641741645712712711712742741742643642643741742742741742741741742780783612611612712713712713613645741618713714711811071271361274274174071361261171171561261171171461261271278368125602104971071071071071071071071071071071071071071071071061371071071071071071071071071071071071071071071071471071071071071071071071071071071071071071071061371071071071071071071071071071071071071071071071271071071071071071071071071071071071071071071061371071071071071071071071071071071071071071071071471071071071071071071071071071071071071071071061371071071071071071071071071071071071071071071071271071071071071071071071071071071071071071071061371071071071071071071071071071071071071071071071471071071071071071071071071071071071071071071061371071071071071071071071071071071071071071071071271071071071071071071071071071071071071071071061371071071071071071071071071071071071071071071071471071071071071071071071071071071071071071071061371071071071071071071071071071071071071071071011401402031402031402031402031402031402031402031402031402031402031402031402031402031402031402031402031402031402031402015201111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111");
    playSong();
    fogdens = 0.5;
    if (gd.terr == null)
        gd.terr = buildTerrain();
    buildTrees(gd.terr);

    gd.player = addSceneObj(tfm(2.75, 0.251, 5.85, 0, pi, 0, 0.1, 0.1, 0.1), mdl_playernoleg);
    gd.playerlegl = addSceneObj(tfm(2.75, 0.22, 5.87, 0, pi, 0, 0.1, 0.1, 0.1), mdl_playerleg);
    gd.playerlegr = addSceneObj(tfm(2.75, 0.22, 5.83, 0, pi, 0, 0.1, 0.1, 0.1), mdl_playerleg);
    gd.sticka = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), mdl_stick);
    gd.stickb = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), mdl_stick);
    gd.itemclaw = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.05, 0.05, 0.05), mdl_flashlight);
    addSceneObj(tfm(12,0.4,5.85, 0,0,0, 0.5,0.5,0.5), mdl_caveent);
    gd.itemray = addSceneObj(tfm(2.72, 0.301, 5.85, 0, pi, 0, 0.3, 0.3, 0.3), mdl_flConeModel);
    gd.itemray.shading = "";
    for (var i = 0; i < 20; i++)
        gd.spiders.push(addSpider(tfm(4.24+(i*0.5), 0.5, 5.85, 0, pi, 0, 0.05, 0.05, 0.05)));

    gd.player.tfm.vx = 0;
    gd.player.tfm.vy = 0;

    curLoop = loopTerrain;
    cam = {
        x: 3, y: 1, z: 7,
        a: -0.3, b: 0, c: 0
    };
}
function loopTerrain() {
    if (keysDown[65]) {
        gd.player.tfm.vx = -0.01;
        gd.playerdir = 0;
        gd.playerleganim += 0.1;
    } else if (keysDown[68]) {
        gd.player.tfm.vx = 0.01;
        gd.playerdir = pi;
        gd.playerleganim += 0.1;
    } else {
        if (gd.playerleganim > 2*pi)
            gd.playerleganim = (gd.playerleganim)%(2*pi);
        gd.playerleganim += ((Math.round(gd.playerleganim/pi)*pi)-gd.playerleganim) * 0.1;
    }
    gd.player.tfm.b += (gd.playerdir-gd.player.tfm.b) * 0.1;
    if (keysDown[87] && !gd.player.tfm.jmp) {
        gd.player.tfm.vy = 0.017;
        gd.player.tfm.jmp = true;
    }

    //player vel and pos
    gd.player.tfm.x += gd.player.tfm.vx;
    gd.player.tfm.x = Math.max(1.76, gd.player.tfm.x);
    gd.player.tfm.y += gd.player.tfm.vy;
    gd.player.tfm.vx /= 1.2;
    gd.player.tfm.vy -= 0.001;
    terrainCollis(gd.player.tfm, gd.player.tfm.y + gd.player.tfm.vy);

    if (gd.player.tfm.x > 11.3) {
        gd.player.tfm.x = -5;
        startCave(true);
        return;
    }

    //leg pos and rot
    gd.playerlegl.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,0.2, 0,0,Math.sin(gd.playerleganim)*0.4)));
    gd.playerlegr.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,-0.2, 0,0,-Math.sin(gd.playerleganim)*0.4)));

    handleHealth(() => {
        gd.player.tfm.x = 2.75;
        gd.player.tfm.y = 0.251;
        gd.player.tfm.z = 5.85;

        for (var i = 0; i < gd.spiders.length; i++) {
            removeSceneObj(gd.spiders[i].body);
            gd.spiders[i].legs.forEach(l => removeSceneObj(l));
        }

        gd.spiders = [];
        for (var i = 0; i < 20; i++)
            gd.spiders.push(addSpider(tfm(4.24+(i*0.5), 0.5, 5.85, 0, pi, 0, 0.05, 0.05, 0.05)));
        gd.playerhealth = 100;
    });

    handleSpiders(true);

    handleClaw(true);

    gd.camtar = {
        x: gd.player.tfm.x + 0.3, y: gd.player.tfm.y + 0.6, z: gd.player.tfm.z + 1.2
    };

    //handle camera movement
    cam.x += (gd.camtar.x-cam.x) * 0.1;
    cam.y += (gd.camtar.y-cam.y) * 0.1;
    cam.z += (gd.camtar.z-cam.z) * 0.1;
}
function handleHealth(dieFunc) {
    if (gd.playerhealth <= 0) {
        dieFunc();
    }
    ctx.fillText("HP: " + gd.playerhealth, 10, 30);
}
function handleSpiders(terr) {
    gd.spiders.forEach(spi => {
        spi.legtime += 0.15;
        spi.body.tfm.y -= 0.002;
        if (terr)
            terrainCollis(spi.body.tfm);
        else
            worldCollis(spi.body.tfm, scene, ...(spi.large?[0.4,0.8,0.4]:[0.06, 0.12, 0.06]));
        if (terr)
            spi.body.tfm.y -= 0.02;
        //spider/light collision
        var rotAway = Math.abs(Math.atan2(gd.tar.y-gd.itemclaw.tfm[13], gd.tar.x-gd.itemclaw.tfm[12]) -
                               Math.atan2(spi.body.tfm.y-gd.itemclaw.tfm[13], spi.body.tfm.x-gd.itemclaw.tfm[12]));
        var distAway = Math.sqrt((spi.body.tfm.y-gd.itemclaw.tfm[13])**2+(spi.body.tfm.x-gd.itemclaw.tfm[12])**2);
        var plyDistAway = Math.sqrt((spi.body.tfm.y-gd.player.tfm.y)**2+(spi.body.tfm.x-gd.player.tfm.x)**2);
        var sign = Math.sign(gd.player.tfm.x-spi.body.tfm.x);
        spi.dir = sign>0 ? 0 : pi;
        if (!spi.large) {
            if (rotAway > 0.4 || distAway > 0.65) {
                spi.body.tfm.x += sign*0.0014;
            } else {
                spi.hp--;
            }
            spi.body.tfm.x += sign*0.001;
        }
        if (plyDistAway < 0.15) {
            spi.hp = 0;
            gd.playerhealth -= 20;
        }
        spi.body.tfm.b += (spi.dir-spi.body.tfm.b)*(spi.large?0.05:0.1);
        //leg rotation
        for (var leg = 0; leg < 8; leg++) {
            var l = spi.legs[leg];
            var side = Math.floor(leg/4);
            var rot = [pi,0][side] + Math.sin(spi.legtime+((leg%4)*0.4))*0.2*(side*2-1);
            l.tfm = dot(transform(spi.body.tfm),transform(tfm((leg%4)*0.2-0.2,-0.1,0.4*[1,-1][side], 0,rot,0)));
        }
    });
    for (var i = gd.spiders.length; i --> 0;) {
        if (gd.spiders[i].hp <= 0) {
            removeSceneObj(gd.spiders[i].body);
            gd.spiders[i].legs.forEach(l => removeSceneObj(l));
            gd.spiders.splice(i, 1);
        }
    }
}
function handleClaw(light) {
    //stick arm and claw pos and rot
    gd.sticka.tfm = dot(transform(gd.player.tfm), transform(tfm(0.2,0.5,0, hp/3,hp,0, 0.5,0.5,0.5)));
    gd.stickb.tfm = dot(gd.sticka.tfm, transform(tfm(0,1.45,0, -hp/2,0,0, 1,1,1)));
    //gd.itemclaw.tfm = dot(gd.stickb.tfm, transform(tfm(0,1.45,0, 0,0,0, 1,1,1)));

    //target position (ray rotation)
    samePos(gd.tar, cam);
    var mx = (xMouse - 480)/480;
    var my = (yMouse - 360)/360;
    //instead of using matrices and converting from screen space
    //to world space the normal way, I've just offset the mouse
    //by some values I guessed which makes it look good enough
    gd.tar.z = -0.5;
    var zDist = cam.z-gd.player.tfm.z;
    gd.tar.x += mx*(zDist*0.57)*(my*0.14+1);
    gd.tar.y -= my*(zDist*0.5)+(zDist*0.31);

    var rayRot = Math.atan2(gd.tar.y-gd.itemclaw.tfm[13], gd.tar.x-gd.itemclaw.tfm[12]);
    var unFlippedRayRot = rayRot;
    if (gd.player.tfm.b < hp)
    {
        rayRot += pi;
        rayRot *= -1;
    }
    
    var hidden = light?10:0;
    gd.itemclaw.tfm = dot(gd.stickb.tfm, transform(tfm(0,1.45,0, rayRot-1.3,0,0, 1,1,1)));
    gd.itemray.tfm = dot(gd.itemclaw.tfm, transform(tfm(0,1.5,0, pi,pi,0, hidden,hidden,hidden)));

    if (light) {
        spotPos = [gd.itemray.tfm[12],gd.itemray.tfm[13],gd.itemray.tfm[14]];
        var rx = Math.cos(0) * Math.cos(unFlippedRayRot);
        var ry = Math.sin(unFlippedRayRot);
        var rz = Math.sin(0) * Math.cos(unFlippedRayRot);
        spotRot = [rx,ry,rz];
    } else {
        spotPos = [-100,-100,-100];
    }
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
function addSpider(tra, largeSpider=false) {
    //scene.length-3 to insert before the flashlight even after it's created
    var legs = [];
    for (var i = 0; i < 8; i++) {
        var newTra = tfm(0,0,0);
        sameTfm(newTra, tra);
        legs[i] = addSceneObj(newTra, largeSpider?mdl_largespider_leg:mdl_tinyspider_leg, scene.length-1); //handle leg placement later
    }
    var body = addSceneObj(tra, mdl_tinyspider_body, scene.length-1);
    body.tfm.vx = 0;
    body.tfm.vy = 0;
    body.tfm.vz = 0;
    return {
        body: body,
        legs: legs,
        legtime: 0,
        dir: pi,
        hp: 50,
        large: largeSpider
    };
}
//#endregion
//#region scene "cave"
function startCave(isCave) {
    gd.isCave = isCave;
    
    gd.camzones = [];
    gd.lightsensors = [];
    gd.spiderboss = {};
    gd.hooks = [];
    gd.bossspawntimer = 9999999999;
    gd.spiders = [];

    clearSong();
    if (isCave)
        readSong("128000121630310140501131603166216431662168316621643166216831662164316678478202703811780683789683681683787684682683789683681683787684682683789683681683787684682723661084036033740643645644741743646743643746743743649743742744742643645644741743646743613712714713613614712712712612616613713117127146136116127127147126116146137137136146127349110612611612613711613612613711712714612612712712613613614714712711713613613712711712642683782");
    else
        readSong("128000161660004560160321131603163316321632163316331632163216331633163216321633163316321630320441178068578278468278468378468468578278468278468378468468578278468278468378468468578278468278468378405804411740642744642742685641684744741683642745684682681784742642743743740646783783685614711712712642747645645711712713613643745683744643681683721722722722781622721641723623743643312106406240624062406240624062406240624062406240624062406240624062406240324777777777777777777777777777777712801111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111");
    playSong();

    fogdens = 0.1;
    loadScene(isCave?0:1);
    //loadScene(0);
    gd.player = addSceneObj(tfm(isCave?-8:-16,isCave?2:10,-0.5, 0,pi,0, 0.1,0.1,0.1), mdl_playernoleg);
    gd.playerlegl = addSceneObj(tfm(0,0,0, 0,pi,0, 0.1,0.1,0.1), mdl_playerleg);
    gd.playerlegr = addSceneObj(tfm(0,0,0, 0,pi,0, 0.1,0.1,0.1), mdl_playerleg);
    gd.sticka = addSceneObj(tfm(0,0,0, 0,pi,0, 0.05,0.05,0.05), mdl_stick);
    gd.stickb = addSceneObj(tfm(0,0,0, 0,pi,0, 0.05,0.05,0.05), mdl_stick);
    gd.itemclaw = addSceneObj(tfm(0,0,0, 0,pi,0, 0.05,0.05,0.05), isCave?mdl_flashlight:mdl_grapple);
    gd.grap = addSceneObj(tfm(0,0,0, 0,0,0, 0,0,0), mdl_grapple_shot);
    gd.graprope = addSceneObj(tfm(0,0,0, 0,0,0, 0,0,0), mdl_grapple_rope);

    gd.player.tfm.vx = 0;
    gd.player.tfm.vy = 0;
    //gd.player.tfm.x = -16;
    //gd.player.tfm.y = 10;
    //gd.player.tfm.z = -0.5;
    //gd.player.tfm.x = 10.5;
    //gd.player.tfm.x = 15.6;
    //gd.player.tfm.y = 4;
    //gd.player.tfm.y = 3.7;

    if (isCave)
        setupCaveItems();
    else
        setupFactoryItems();

    gd.itemray = addSceneObj(tfm(0,0,0, 0,pi,0, isCave?0.3:0,isCave?0.3:0,isCave?0.3:0), mdl_flConeModel);
    gd.itemray.shading = "";

    if (isCave)
        gd.spiders.push(gd.spiderboss = addSpider(tfm(14, 1.75, -0.5, 0, pi, 0, 0.8, 0.8, 0.8),true));

    curLoop = loopCave;
    cam = {
        x: 3, y: 1, z: 7,
        a: -0.3, b: 0, c: 0
    };
}
function setupCaveItems() {
    ////
    var ls1 = addSceneObj(tfm(-1.1,2.39,-0.5, 0,0,0, 0.3,0.3,0.3), mdl_lightsensor);
    gd.lightsensors.push({
        obj: ls1,
        tar: addSceneObj(tfm(-1.15,1.55,-0.5, 0,0,0, 1,0.8,1), mdl_cavebridge),
        con: function(self, activated) {
            self.tar.tfm.x = Math.max(-2.3, Math.min(-1.15, self.tar.tfm.x+(0.005*(activated?1:-1))))
        }
    });
    ////
    var ls2 = addSceneObj(tfm(2.3,3,-0.5, 0,0,hp, 0.3,0.3,0.3), mdl_lightsensor);
    gd.lightsensors.push({
        obj: ls2,
        tar: addSceneObj(tfm(3.4,2.1,-0.5, 0,0,0, 1,1,1), mdl_caveelevator),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(2.1, Math.min(4, self.tar.tfm.y+(0.01*(activated?1:-1))))
        }
    });
    gd.lightsensors.push({
        obj: ls2,
        tar: addSceneObj(tfm(4,4,-0.5, 0,0,0, 1,1,1), mdl_caveelevator),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(2.1, Math.min(4, self.tar.tfm.y-(0.01*(activated?1:-1))))
        }
    });
    ////
    var ls3 = addSceneObj(tfm(5.8,2.6,-0.5, 0,0,hp, 0.3,0.3,0.3), mdl_lightsensor);
    gd.lightsensors.push({
        obj: ls3,
        tar: addSceneObj(tfm(7.2,2.1,-0.5, 0,0,0, 1,1,1), mdl_caveelevator),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(2.1, Math.min(4, self.tar.tfm.y+(0.012*(activated?1:-1))))
        }
    });
    gd.lightsensors.push({
        obj: ls3,
        tar: addSceneObj(tfm(8,2.1,-0.5, 0,0,0, 1,1,1), mdl_caveelevator),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(2.1, Math.min(4, self.tar.tfm.y-(0.016*(activated?1:-1))))
        }
    });
    gd.lightsensors.push({
        obj: ls3,
        tar: addSceneObj(tfm(8.8,2.1,-0.5, 0,0,0, 1,1,1), mdl_caveelevator),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(2.1, Math.min(4, self.tar.tfm.y+(0.004*(activated?1:-1))))
        }
    });
    gd.lightsensors.push({
        obj: ls3,
        tar: addSceneObj(tfm(9.6,4,-0.5, 0,0,0, 1,1,1), mdl_caveelevator),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(2.1, Math.min(4, self.tar.tfm.y-(0.0035*(activated?1.2:-0.9))))
        }
    });
    ////
    gd.lightsensors.push({
        obj: addSceneObj(tfm(10.7,2.7,-0.5, 0,0,hp, 0.3,0.3,0.3), mdl_lightsensor),
        tar: addSceneObj(tfm(11.2,2.1,-0.5, 0,0,0, 1,1,1), mdl_caveelevator),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(2.1, Math.min(4, self.tar.tfm.y+(0.01*(activated?1:-1))))
        }
    });
    gd.lightsensors.push({
        obj: addSceneObj(tfm(17.2,2.7,-0.5, 0,0,-hp, 0.3,0.3,0.3), mdl_lightsensor),
        tar: addSceneObj(tfm(16.7,2.1,-0.5, 0,0,0, 1,1,1), mdl_caveelevator),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(2.1, Math.min(4, self.tar.tfm.y+(0.01*(activated?1:-1))))
        }
    });
    addSceneObj(tfm(12.7,3.7,-0.5, 0,-hp,0, 0.2,0.2,0.2), mdl_onekstand);
    gd.lightsensors.push({
        obj: addSceneObj(tfm(12.2,3.6,-0.5, 0,0,pi, 0.1,0.1,0.1), mdl_lightsensor),
        tar: addSceneObj(tfm(12.7,3.7,-0.5, 0,-hp,-0.7, 0.2,0.2,0.2), mdl_lamp),
        laser: addSceneObj(tfm(12.78,3.65,-0.5, 0,-hp,-0.7+hp, 0.1,0,0.1), mdl_laser), //use red as laser
        con: function(self, activated) {
            activated &= gd.player.tfm.y > 3.5;
            if (self.tar.bright == undefined)
                self.tar.bright = 300;
            if (self.tar.bright > 0) {
                if (activated) {
                    self.tar.bright-=2;
                } else if (self.tar.bright < 300) {
                    self.tar.bright+=2;
                }
                self.laser.tfm.e = (300-self.tar.bright)/300*20;
            } else {
                self.done = 1;
            }
        }
    });
    addSceneObj(tfm(15.2,3.6,-0.5, 0,-hp,0, 0.2,0.2,0.2), mdl_onekstand);
    gd.lightsensors.push({
        obj: addSceneObj(tfm(15.7,3.5,-0.5, 0,0,0, 0.1,0.1,0.1), mdl_lightsensor),
        tar: addSceneObj(tfm(15.2,3.6,-0.5, 0,-hp,pi+0.7, 0.2,0.2,0.2), mdl_lamp),
        laser: addSceneObj(tfm(15.12,3.55,-0.5, 0,-hp,0.7-hp, 0.1,0,0.1), mdl_laser),
        con: function(self, activated) {
            activated &= gd.player.tfm.y > 3.6;
            if (self.tar.bright == undefined)
                self.tar.bright = 300;
            if (self.tar.bright > 0) {
                if (activated) {
                    self.tar.bright-=2;
                } else if (self.tar.bright < 300) {
                    self.tar.bright+=2;
                }
                self.laser.tfm.e = (300-self.tar.bright)/300*20;
            } else {
                self.done = 1;
            }
        }
    });
    gd.camzones.push({lxb:2,rxb:4.6,loc:[3.5,4.25,3]});
    gd.camzones.push({lxb:5.7,rxb:10.2,loc:[7.95,4.25,3.5]});
    gd.camzones.push({lxb:10.66,rxb:13,loc:[(13-11)/2+11,4,2.5]});
    gd.camzones.push({lxb:14,rxb:17,loc:[(17-14)/2+14,4,2.5]});
}
function setupFactoryItems() {
    gd.hooks.push(
        addSceneObj(tfm(-12.8,10.7,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(-9,11.6,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(-7,11.6,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(-1,11.6,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(1,11.6,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(5.5,11.6,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(7,11.6,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(7,11.6,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(13,10.5,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(17,10.5,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    gd.hooks.push(
        addSceneObj(tfm(19,10.5,-0.5, 0,pi,0, 0.8,0.8,0.8), mdl_hook)
    );
    ////
    var ls1 = addSceneObj(tfm(11,8.4,-0.5, pi,0,0, 0.5,0.5,0.5), mdl_lightsensor);
    gd.lightsensors.push({
        obj: ls1,
        tar: addSceneObj(tfm(12,9.2,-0.5, 0,pi,0), mdl_door),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(8, Math.min(9.2, self.tar.tfm.y-(0.005*(activated?1:-1))))
        }
    });
    gd.lightsensors.push({
        obj: ls1,
        tar: addSceneObj(tfm(12,10.8,-0.5, 0,pi,0), mdl_door),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(10.8, Math.min(12, self.tar.tfm.y+(0.005*(activated?1:-1))))
        }
    });
    ////
    var ls2 = addSceneObj(tfm(15,8.4,-0.5, pi,0,0, 0.5,0.5,0.5), mdl_lightsensor);
    gd.lightsensors.push({
        obj: ls2,
        tar: addSceneObj(tfm(16,9.2,-0.5, 0,pi,0), mdl_door),
        con: function(self, activated) {
            activated |= 16.27 <= gd.player.tfm.x && gd.player.tfm.x <= 17.75 && gd.player.tfm.y < 9;
            self.tar.tfm.y = Math.max(8, Math.min(9.2, self.tar.tfm.y-(0.005*((activated)?1:-1))))
        }
    });
    gd.lightsensors.push({
        obj: ls2,
        tar: addSceneObj(tfm(16,10.8,-0.5, 0,pi,0), mdl_door),
        con: function(self, activated) {
            activated |= 16.27 <= gd.player.tfm.x && gd.player.tfm.x <= 17.75 && gd.player.tfm.y < 9;
            self.tar.tfm.y = Math.max(10.8, Math.min(12, self.tar.tfm.y+(0.005*((activated)?1:-1))))
        }
    });
    gd.lightsensors.push({
        obj: ls2,
        tar: addSceneObj(tfm(18,9.2,-0.5, 0,pi,0), mdl_door),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(8, Math.min(9.2, self.tar.tfm.y-(0.005*(activated?1:-0.5))))
        }
    });
    gd.lightsensors.push({
        obj: ls2,
        tar: addSceneObj(tfm(18,10.8,-0.5, 0,pi,0), mdl_door),
        con: function(self, activated) {
            self.tar.tfm.y = Math.max(10.8, Math.min(12, self.tar.tfm.y+(0.005*(activated?1:-0.5))))
        }
    });
    gd.camzones.push({lxb:-15.9,rxb:-13.5,loc:[-13.9,11,3]});
    gd.camzones.push({lxb:-13.5,rxb:-11.5,loc:[-10.5,12,4]});
    gd.camzones.push({lxb:-11.5,rxb:-6,loc:[-8,12,4]});
    gd.camzones.push({lxb:-2.8,rxb:-1,loc:[-1,12,4]});
    gd.camzones.push({lxb:-1,rxb:3,loc:[1,12,4]});
    gd.camzones.push({lxb:3,rxb:8,loc:[6,12,4]});
    gd.camzones.push({lxb:10,rxb:13,loc:[11.5,11,4]});
    gd.camzones.push({lxb:13,rxb:16.5,loc:[15.5,11,4]});
    gd.camzones.push({lxb:16.5,rxb:19,loc:[17.5,11,4]});
}
function loopCave() {
    if (!gd.deploygrap) {
        if (keysDown[65]) {
            gd.player.tfm.vx = Math.min(0,Math.min(-0.01,gd.player.tfm.vx));
            gd.playerdir = 0;
            gd.playerleganim += 0.1;
        } else if (keysDown[68]) {
            gd.player.tfm.vx = Math.max(0,Math.max(0.01,gd.player.tfm.vx));
            gd.playerdir = pi;
            gd.playerleganim += 0.1;
        } else {
            if (gd.playerleganim > 2*pi)
                gd.playerleganim = (gd.playerleganim)%(2*pi);
            gd.playerleganim += ((Math.round(gd.playerleganim/pi)*pi)-gd.playerleganim) * 0.1;
        }
        gd.player.tfm.b += (gd.playerdir-gd.player.tfm.b) * 0.1;
        if (keysDown[87] && !gd.player.tfm.jmp) {
            gd.player.tfm.vy = 0.017;
            gd.player.tfm.jmp = true;
        }
        if (gd.hasgrap) {
            if (keysDown[49] && gd.equipgrap) {
                gd.equipgrap = false;
                var idx = scene.indexOf(gd.itemclaw);
                removeSceneObj(gd.itemclaw);
                gd.itemclaw = addSceneObj(tfm(0,0,0, 0,pi,0, 0.05,0.05,0.05), mdl_flashlight, idx);
            } else if (keysDown[50] && !gd.equipgrap) {
                gd.equipgrap = true;
                var idx = scene.indexOf(gd.itemclaw);
                removeSceneObj(gd.itemclaw);
                gd.itemclaw = addSceneObj(tfm(0,0,0, 0,pi,0, 0.05,0.05,0.05), mdl_grapple, idx);
            }
        }
    } else {
        if (gd.playerleganim > 2*pi)
            gd.playerleganim = (gd.playerleganim)%(2*pi);
        gd.playerleganim += ((Math.round(gd.playerleganim/pi)*pi)-gd.playerleganim) * 0.1;
        gd.player.tfm.b += (gd.playerdir-gd.player.tfm.b) * 0.1;
    }

    //player vel and pos
    gd.player.tfm.x += gd.player.tfm.vx;
    gd.player.tfm.y += gd.player.tfm.vy;
    gd.player.tfm.vy -= 0.001;

    if (worldCollis(gd.player.tfm, scene)) { //if on ground
        gd.player.tfm.jmp = false;
        gd.player.tfm.vy = -0.008;
        gd.player.tfm.vx /= 1.2;
    } else {
        gd.player.tfm.vx /= 1.01;
    }

    if (gd.player.tfm.y < -1) {
        if (gd.isCave) {
            gd.player.tfm.x = -1.95;
            gd.player.tfm.y = 1.75;
            gd.player.tfm.vx = 0;
            gd.player.tfm.vy = 0;
        } else {
            gd.player.tfm.x = -15.5;
            gd.player.tfm.y = 8.55;
            gd.player.tfm.vx = 0;
            gd.player.tfm.vy = 0;
        }
    }

    //leg pos and rot
    gd.playerlegl.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,0.2, 0,0,Math.sin(gd.playerleganim)*0.4)));
    gd.playerlegr.tfm = dot(transform(gd.player.tfm),transform(tfm(0,-0.31,-0.2, 0,0,-Math.sin(gd.playerleganim)*0.4)));

    if (gd.bossspawntimer-- <= 0 && gd.spiders.length < 20) {
        gd.bossspawntimer = 200;
        var bossTfm = gd.spiderboss.body.tfm;
        gd.spiders.push(addSpider(tfm(bossTfm.x,bossTfm.y,bossTfm.z+0.2, 0, pi, 0, 0.05, 0.05, 0.05)));
    }

    if (gd.isCave && gd.player.tfm.x > 10.67 && gd.bossspawntimer > 200)
        gd.bossspawntimer = 200;
    
    handleHealth(() => {
        gd.player.tfm.x = 12;
        gd.player.tfm.y = 1.75;
        gd.player.tfm.vx = 0;
        gd.player.tfm.vy = 0;
        gd.playerhealth = 100;
    });

    handleSpiders(false);

    handleClaw(!gd.equipgrap);

    handleGrapple();
    
    var camFocus = true;
    for (var cz of gd.camzones) {
        var loc = cz.loc;
        if (cz.lxb < gd.player.tfm.x && gd.player.tfm.x < cz.rxb) {
            gd.camtar = {
                x: loc[0], y: loc[1], z: loc[2]
            };
            camFocus = false;
            break;
        }
    };
    if (camFocus) {
        gd.camtar = {
            x: gd.player.tfm.x + 0.3, y: gd.player.tfm.y + 0.6, z: gd.player.tfm.z + 1.2
        };
    }

    //handle camera movement
    cam.x += (gd.camtar.x-cam.x) * 0.1;
    cam.y += (gd.camtar.y-cam.y) * 0.1;
    cam.z += (gd.camtar.z-cam.z) * 0.1;

    //handle light sensors
    var done = 0;
    for (var i = 0; i < gd.lightsensors.length; i++) {
        var ls = gd.lightsensors[i];
        var lsobj = ls.obj;

        var rotAway = angleDist(Math.atan2(gd.tar.y-gd.itemclaw.tfm[13], gd.tar.x-gd.itemclaw.tfm[12]),
                                Math.atan2(lsobj.tfm.y-gd.itemclaw.tfm[13], lsobj.tfm.x-gd.itemclaw.tfm[12]));
        var distAway = Math.sqrt((lsobj.tfm.y-gd.itemclaw.tfm[13])**2+(lsobj.tfm.x-gd.itemclaw.tfm[12])**2);
        var lsActivated = rotAway < 0.4 && distAway < 1.6 && !gd.equipgrap;

        ls.con(ls, lsActivated);

        if (ls.done) {
            done += ls.done;
        }
    }
    if (done == 2 && gd.isCave) {
        gd.hasgrap = true;
        gd.equipgrap = true;
        startCave(false);
        return;
    }
}
function handleGrapple() {
    if (gd.equipgrap) {
        if (mouseDown) {
            if (!gd.deploygrap) {
                gd.deploygrap = true;
                gd.grapdist = 0.5;
                gd.oldgrappos = gd.itemclaw.tfm.slice();
            } else {
                var plyDistAway = Math.sqrt((gd.grap.tfm[13]-gd.player.tfm.y)**2+(gd.grap.tfm[12]-gd.player.tfm.x)**2);
                var hooked = false;

                for (var i = 0; i < gd.hooks.length; i++) {
                    var hk = gd.hooks[i];
                    var grapDistAway = Math.sqrt((hk.tfm.y-gd.grap.tfm[13])**2+(hk.tfm.x-gd.grap.tfm[12])**2);
                    if (grapDistAway <= 0.4) {
                        var hookAng = Math.atan2(gd.grap.tfm[13]-gd.itemclaw.tfm[13], gd.grap.tfm[12]-gd.itemclaw.tfm[12]);
                        gd.player.tfm.vx = Math.cos(hookAng) * 0.05;
                        gd.player.tfm.vy = Math.sin(hookAng) * 0.05;
                        if (plyDistAway <= 0.4) {
                            gd.grapdist = 0;
                            gd.grap.tfm = tfm(0,0,0, 0,0,0, 0,0,0);
                            gd.graprope.tfm = tfm(0,0,0, 0,0,0, 0,0,0);
                            gd.deploygrap = false;
                            mouseDown = false;
                            return;
                        }

                        hooked = true;
                        break;
                    }
                }

                gd.oldgrappos[12] = gd.itemclaw.tfm[12];
                gd.oldgrappos[13] = gd.itemclaw.tfm[13];
                gd.oldgrappos[14] = gd.itemclaw.tfm[14];

                if (!hooked)
                    gd.grapdist += 1.6;
                else
                    gd.grapdist -= 1;

                gd.grap.tfm = dot(gd.oldgrappos,transform(tfm(0,gd.grapdist,0, 0,0,0, 3,3,3)));
                gd.graprope.tfm = dot(gd.oldgrappos,transform(tfm(0,0,0, 0,0,0, 3,-gd.grapdist*10-1,3)));

                if (!hooked) {
                    if (worldCollis(tfm(gd.grap.tfm[12],gd.grap.tfm[13],gd.grap.tfm[14]), scene, 0.05, 0.05, 0.05, true) || gd.grapdist > 80) {
                        gd.grapdist = 0;
                        gd.grap.tfm = tfm(0,0,0, 0,0,0, 0,0,0);
                        gd.graprope.tfm = tfm(0,0,0, 0,0,0, 0,0,0);
                        gd.deploygrap = false;
                        mouseDown = false;
                    }
                }
            }
        } else {
            gd.grapdist = 0;
            gd.grap.tfm = tfm(0,0,0, 0,0,0, 0,0,0);
            gd.graprope.tfm = tfm(0,0,0, 0,0,0, 0,0,0);
            gd.deploygrap = false;
        }
    }
}
//#endregion
document.addEventListener("click", start, false);
document.getElementById("debug").innerHTML = "<b>click anywhere to start</b>";