//bakpak 8/13/2019 nes

//#region common util
var seed;
function seededRand() {
    return seed = seededRandOne(seed);
}
function seededRandOne(seed) {
    return Math.sin(1/(seed/1e7))/2;
}
//#endregion
//#region terrain

setup();
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
                addSceneObj(tfm(x,Math.max(0.001, h)+0.4,0.1+z), 0);
                treePoses.push([x,z]);
            }
        }
    }
}
//#endregion
var terr = buildTerrain();
buildTrees(terr);

models.push(voxelize(data.player));
addSceneObj(tfm(3.4, 0.6, 5.8, 0, 0, 0, 0.1, 0.1, 0.1), 1);