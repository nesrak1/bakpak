//chiisa 5/5/2018 nes

//render
var gl;
var shaderProgram;
var scene = [];
//var modelv = []; //verts
//var modeli = []; //indices
//var modeln = []; //norms
//var modelc = []; //colors
var models = [];
var cam = {x:0,y:0,z:0,a:0,b:0,c:0};
//logic
function voxelize(data) {
    var d = data.split("").map(n => parseInt(n,36));
    var verts = [];
    var indcs = [];
    var norms = [];
    var colrs = [];

    var mats = [];
    var i,j,c = 0;
    var ver;
    for (i = 1; i < d[0]*3+1; i += 3) {
        mats.push([d[i],d[i+1],d[i+2]]);
    }
    var placeSingle = d.indexOf(35);
    if (placeSingle == -1)
        placeSingle = 5e5;
    for (i = d[0]*3+1; i < d.length; i += (i < placeSingle) ? 7 : 4) {
        var x1,y1,z1,x2,y2,z2,mat;
        if (i == placeSingle)
            i++;
        x1 = d[i];
        y1 = d[i+2];
        z1 = d[i+1];
        if (i >= placeSingle) {
            x2 = x1;
            y2 = y1;
            z2 = z1;
            mat = mats[d[i+3]];
        } else {
            x2 = d[i+3];
            y2 = d[i+5];
            z2 = d[i+4];
            mat = mats[d[i+6]];
        }
        ver = createCubeOfDims(0.0+x1/-10+0.4,
                                0.0+y1/10-0.4,
                                0.0+z1/10-0.4,
                                -0.1+x2/-10+0.4,
                                0.1+y2/10-0.4,
                                0.1+z2/10-0.4);
        for (j = 0; j < 72; j++) {
            verts[j+(c*72)] = ver[j];
        }
        norms = norms.concat([
            0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0
        ]);
        var colConv = 0.125;
        for (j = 0; j < 24; j++) {
            colrs = colrs.concat([
                mat[0]*colConv,mat[1]*colConv,mat[2]*colConv,1
            ]);
        }
        c++;
    }
    indcs = createIndiciesOfCount(verts.length/6);

    //modelv.push(verts);
    //modeli.push(indcs);
    //modeln.push(norms);
    //modelc.push(colrs);
    //models.push();
    return {v:verts,i:indcs,n:norms,c:colrs};
}

function createIndiciesOfCount(count) {
    var array = new Array(count*6);
    for (var i = 0; i < count*4; i+=4) {
        for (var j of loop(6)) {
            array[i/4*6+j] = i+[0,1,2,0,2,3][j];
        }
        //array = array.concat([i,i+1,i+2,i,i+2,i+3]);
    }
    return array;
}

var cubeNorms = [0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0];

function createCubeOfDims(x1,y1,z1,x2,y2,z2) {
    return [
        //top z+
        x1,y1,z2,
        x2,y1,z2,
        x2,y2,z2,
        x1,y2,z2,
        //bottom z-
        x1,y1,z1,
        x2,y1,z1,
        x2,y2,z1,
        x1,y2,z1,
        //front x+
        x2,y1,z1,
        x2,y2,z1,
        x2,y2,z2,
        x2,y1,z2,
        //back x-
        x1,y2,z1,
        x1,y1,z1,
        x1,y1,z2,
        x1,y2,z2,
        //right y+
        x2,y2,z1,
        x1,y2,z1,
        x1,y2,z2,
        x2,y2,z2,
        //left y-
        x1,y1,z1,
        x2,y1,z1,
        x2,y1,z2,
        x1,y1,z2
    ];
}

//http://in2gpu.com/2014/07/22/create-fog-shader/ - todo
var resources = {
    vert: `
attribute vec3 in_position;
attribute vec3 in_normal;
attribute vec4 in_color;

uniform mat4 model_matrix, view_matrix, projection_matrix;

varying highp vec3 world_pos;
varying highp vec3 world_normal;
varying highp vec3 world_color;
varying highp vec4 viewSpace;
    
void main() {
    world_pos = (model_matrix * vec4(in_position,1)).xyz;
    world_normal = normalize(mat3(model_matrix) * in_normal);
    world_color = vec3(in_color);

    viewSpace = view_matrix * model_matrix * vec4(in_position,1);
    gl_Position = projection_matrix * viewSpace;
}`,
    frag: `
uniform highp vec3 light_position;
uniform highp vec3 eye_position;
 
//can pass them as uniforms
const highp vec3 DiffuseLight = vec3(0.1, 0.1, 0.1);
//const highp vec3 RimColor = vec3(0.);

//from vertex shader
varying highp vec3 world_pos;
varying highp vec3 world_normal;
varying highp vec3 world_color;
varying highp vec4 viewSpace;
 
const lowp vec3 fogColor = vec3(0.5, 0.5, 0.5);
const lowp float FogDensity = 0.5;
 
void main() {
    //vec3 tex1 = texture(texture1, texcoord).rgb;
     
    //get light an view directions
    highp vec3 L = normalize( light_position - world_pos);
    highp vec3 V = normalize( eye_position - world_pos);
     
    //diffuse lighting
    highp vec3 diffuse = DiffuseLight * (max(0., dot(L,world_normal)) + max(0., dot(vec3(-L.x, L.y, -L.z),world_normal)));
     
    //rim lighting
    //highp float rim = float(1) - max(dot(V, world_normal), 0.0);
    //rim = smoothstep(0.6, 1.0, rim);
    //highp vec3 finalRim = RimColor * vec3(rim, rim, rim);
    //get all lights and texture
    //highp vec3 lightColor = (finalRim + diffuse) * world_color * 3.;
    highp vec3 lightColor = diffuse * world_color * 3.;
     
    //highp vec3 finalColor = vec3(0, 0, 0);
     
    //distance
    //highp float dist = 0.;
    //highp float fogFactor = 0.;

    //range based
    highp float dist = length(viewSpace);
     
    highp float fogFactor = 1.0/exp(dist * FogDensity);
    fogFactor = clamp( fogFactor, 0.0, 1.0 );

    //mix function fogColor*(1−fogFactor) + lightColor*fogFactor
    highp vec3 finalColor = mix(fogColor, lightColor, fogFactor);
     
    //show fogFactor depth(gray levels)
    //fogFactor = 1 - fogFactor;
    //out_color = vec4( fogFactor, fogFactor, fogFactor,1.0 );
    gl_FragColor = vec4(finalColor, 1);
}`};
var resourceMeta = {
    in_position:{},
    in_normal:{},
    in_color:{},
    model_matrix:{},
    view_matrix:{},
    projection_matrix:{},
    light_position:{},
    eye_position:{}
};

function setup() {
    gl = document.getElementById("c").getContext("webgl2");

    var vertShaderSrc = resources.vert;
    var fragShaderSrc = resources.frag;

    var vertexShader = loadShader(gl.VERTEX_SHADER, vertShaderSrc);
    var fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragShaderSrc);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    //this won't work with closure so change this to array or separate variables
    Object.keys(resourceMeta).forEach(function (key) {
        if (key.startsWith("in_"))
            resourceMeta[key] = gl.getAttribLocation(shaderProgram, key);
        else
            resourceMeta[key] = gl.getUniformLocation(shaderProgram, key);
    });

    setupLock();

    requestAnimationFrame(render);

    cam.b = Math.PI;
}

//input start
function setupLock() {
    var canvas = document.getElementById("c");
    canvas.requestPointerLock = canvas.requestPointerLock;
    document.exitPointerLock = document.exitPointerLock;

    canvas.onclick = function() {
        canvas.requestPointerLock();
    };

    document.addEventListener("pointerlockchange", lockChangeAlert, false);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

}

function lockChangeAlert() {
    var canvas = document.getElementById("c");
    if (document.pointerLockElement === canvas) {
        document.addEventListener("mousemove", updatePosition, false);
    } else {
        document.removeEventListener("mousemove", updatePosition, false);
    }
}

function updatePosition(e) {
    cam.b -= e.movementX/100;
    cam.a -= e.movementY/100;
}

function loop(i) {
    return [...Array(i).keys()];
}

var keysDown = {};
function handleKeyDown(event) {
    keysDown[event.keyCode] = true;
}

function handleKeyUp(event) {
    keysDown[event.keyCode] = false;
}

function handleKeys() {
    //put key handling here
    if (keysDown[37] || keysDown[65]) {
        move(0.05,180);
    } else if (keysDown[39] || keysDown[68]) {
        move(0.05,0);
    }

    if (keysDown[38] || keysDown[87]) {
        move(0.05,-90);
    } else if (keysDown[40] || keysDown[83]) {
        move(0.05,90);
    }

    if (keysDown[32]) {
        cam.y += 0.05;
    } else if (keysDown[16] || keysDown[67]) {
        cam.y -= 0.05;
    }
}

function move(len, deg) {
    cam.x += len * Math.cos(((-cam.b*180/Math.PI+deg)%360)*Math.PI/180);
    cam.z += len * Math.sin(((-cam.b*180/Math.PI+deg)%360)*Math.PI/180);
}
//input end

function render() {
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    handleKeys();

    scene.forEach(function(obj) {
        renderObj(obj);
    });

    requestAnimationFrame(render);
}

function renderObj(obj) {
    var proj = new Float32Array(persp(gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100));
    //var vm = new Float32Array(lookAtFps([cam.x-obj.tfm.x,cam.y-obj.tfm.y,cam.z-obj.tfm.z],cam.a,cam.b));
    var vm = new Float32Array(lookAtFps([cam.x,cam.y,cam.z],cam.a,cam.b));
    var mm = new Float32Array(transform(obj.tfm));
    enableBuffer(resourceMeta.in_position, obj.pos, 3);
    enableBuffer(resourceMeta.in_normal, obj.nrm, 3);
    enableBuffer(resourceMeta.in_color, obj.col, 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.idx);
    gl.useProgram(shaderProgram);
    gl.uniformMatrix4fv(resourceMeta.projection_matrix, false, proj);
    gl.uniformMatrix4fv(resourceMeta.view_matrix, false, vm);
    gl.uniformMatrix4fv(resourceMeta.model_matrix, false, mm);
    gl.uniform3f(resourceMeta.eye_position, cam.x,cam.y,cam.z);
    gl.uniform3f(resourceMeta.light_position, 50,50,50);
    gl.drawElements(gl.TRIANGLES, obj.vct/2, gl.UNSIGNED_INT, 0);
}

function enableBuffer(attr, buff, compCount) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buff);
    gl.vertexAttribPointer(attr, compCount, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attr);
}

function addSceneObj(transform,modelIdxOrObj/*,shader*/) {
    var mdl;
    if (typeof(modelIdxOrObj) == "object")
        mdl = modelIdxOrObj;
    else
        mdl = models[modelIdxOrObj];

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mdl.v), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(mdl.i), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mdl.n), gl.STATIC_DRAW);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mdl.c), gl.STATIC_DRAW);

    scene.push({
        tfm: transform,
        pos: positionBuffer,
        idx: indexBuffer,
        nrm: normalBuffer,
        col: colorBuffer,
        vct: mdl.v.length,
    });
}
function removeSceneObj(obj) {
    var idx = scene.indexOf(obj);
    gl.deleteBuffer(obj.pos);
    gl.deleteBuffer(obj.idx);
    gl.deleteBuffer(obj.nrm);
    gl.deleteBuffer(obj.col);
    if (idx !== -1) {
        scene.splice(idx, 1);
    }
}

//utils
//shaders
function loadShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}
//https://www.3dgep.com/understanding-the-view-matrix/
function lookAtFps(eye, pitch, yaw) {
    var cosPitch = Math.cos(pitch);
    var sinPitch = Math.sin(pitch);
    var cosYaw = Math.cos(yaw);
    var sinYaw = Math.sin(yaw);

    var xaxis = [cosYaw, 0, -sinYaw];
    var yaxis = [sinYaw * sinPitch, cosPitch, cosYaw * sinPitch];
    var zaxis = [sinYaw * cosPitch, -sinPitch, cosPitch * cosYaw];

    return [
        xaxis[0],yaxis[0],zaxis[0],0,
        xaxis[1],yaxis[1],zaxis[1],0,
        xaxis[2],yaxis[2],zaxis[2],0,
        -dot3(xaxis,eye),-dot3(yaxis,eye),-dot3(zaxis,eye),1
    ];
}
function dot3(u, v) {
    return u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
}
//L=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[x,y,z,1]]
//M=dot([[w,f,0,0],[-f,w,0,0],[0,0,1,0],[0,0,0,1]],L)
//N=dot([[c,0,-d,0],[0,1,0,0],[d,0,c,0],[0,0,0,1]],M)
//O=dot([[1,0,0,0],[0,a,b,0],[0,-b,a,0],[0,0,0,1]],N)
//P=dot([[p,0,0,0],[0,q,0,0],[0,0,r,0],[0,0,0,1]],O)
//P
function transform(tfm) {
    var a = Math.cos(tfm.a);
    var b = Math.sin(tfm.a);
    var c = Math.cos(tfm.b);
    var d = Math.sin(tfm.b);
    var e = Math.cos(tfm.c);
    var f = Math.sin(tfm.c);
    var p = tfm.d;
    var q = tfm.e;
    var r = tfm.f;
    return [c*p*e,c*f*p,-d*p,0,
           -a*f*q+b*d*q*e,a*q*e+b*d*f*q,b*c*q,0,
            a*d*r*e+b*f*r,a*d*f*r-b*r*e,a*c*r,0,
            tfm.x,tfm.y,tfm.z,1];
}
//https://webgl2fundamentals.org/webgl/lessons/webgl-3d-perspective.html
function persp(aspect, near, far) {
    var fov = 0.7854;
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    var rangeInv = 1.0 / (near - far);
    return [
        f/aspect,0,0,0,
        0,f,0,0,
        0,0,(near+far)*rangeInv,-1,
        0,0,near*far*rangeInv*2,0
    ];
}
//bridges
function tfm(posX, posY, posZ, rotX = 0, rotY = 0, rotZ = 0, sx = 1, sy = 1, sz = 1) {
    return {
        x: posX,
        y: posY,
        z: posZ,
        a: rotX,
        b: rotY,
        c: rotZ,
        d: sx,
        e: sy,
        f: sz
    }
}
