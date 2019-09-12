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
var sceneDatas = [];
var cam = {x:0,y:0,z:0,a:0,b:0,c:0};
var curLoop=Function();
var xMouse=480,yMouse=360;
var mouseDown=false;
var spotPos=[0,0,0];
var spotRot=[0,0,0];
//logic
function voxelize(data) {
    var d = data.split("").map(n => parseInt(n,36));
    var verts = [];
    var indcs = [];
    var norms = [];
    var colrs = [];
    var boxes = [];

    var mats = [];
    var i,j,c = 0;
    var ver;
    var hx = d[0]/2/10;
    var hy = d[1]/2/10;
    var hz = d[2]/2/10;
    for (i = 4; i < d[3]*3+4; i += 3) {
        mats.push([d[i],d[i+1],d[i+2]]);
    }
    var placeSingle = d.indexOf(35);
    if (placeSingle == -1)
        placeSingle = 5e5;
    for (i = d[3]*3+4; i < d.length; i += (i < placeSingle) ? 7 : 4) {
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
        boxes.push([x1,y1,z1,x2,y2,z2]);
        ver = createCubeOfDims(0.0+x1/-10+hx,
                               0.0+y1/ 10-hy,
                               0.0+z1/ 10-hz,
                              -0.1+x2/-10+hx,
                               0.1+y2/ 10-hy,
                               0.1+z2/ 10-hz);
        for (j = 0; j < 72; j++) {
            verts[j+(c*72)] = ver[j];
        }
        if (mat[0] == 9)
            mat[0] = 100;
        if (mat[1] == 9)
            mat[1] = 100;
        norms = norms.concat(cubeNorms);
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
    return {v:verts,i:indcs,n:norms,c:colrs,s:[d[0],d[1],d[2]],b:boxes};
}

function createIndiciesOfCount(count) {
    var array = new Array(count*6);
    for (var i = 0; i < count*4; i+=4) {
        for (var j = 0; j < 6; j++) {
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

function generateLevel(input) {
    var sceneData = input[0];
    var modelData = input[1];
    var len = parseInt(sceneData.slice(0, 3));
    var posData = sceneData.substr(3, len*9).match(/[\d][\d][\d]/g).map(n => parseInt(n));

    var idxStart = Math.max(500,models.length);
    var idxCur = idxStart;
    var mdlIdxs = [];
    //basically 231 => 001112
    //this map is also a mop to loop through each element
    sceneData.slice(3 + len*9).match(/[0-9a-z]/g).map(n => {
        mdlIdxs = mdlIdxs.concat(Array(parseInt(n, 36)).fill(idxCur));
        models[idxCur] = voxelize(modelData[idxCur-idxStart]); //mop to do this in the same loop
        idxCur++;
    });
    
    var s = [];
    for (var i = 0; i < posData.length; i += 3) {
        s.push({x:posData[i], y:posData[i+1], z:posData[i+2], m:mdlIdxs[i/3]});
    }
    sceneDatas.push(s);
}
function loadScene(sceneIdx, dontClearObjects = false) {
    if (!dontClearObjects)
        scene = [];
    if (sceneIdx == -1) return;
    var offsetOdds = (v, dir, s) => {
        return models[s.m].s[dir]&1?v+0.5:v;
    };
    sceneDatas[sceneIdx].forEach(s => {
        addSceneObj(tfm((offsetOdds(s.x-500,0,s)/-10), (offsetOdds(s.z-500,1,s)/10), (offsetOdds(s.y-500,2,s)/10)), s.m);
    });
}

//http://in2gpu.com/2014/07/22/create-fog-shader/ - todo
/*var resources = {
    vert: `
attribute vec3 in_position;
attribute vec3 in_normal;
attribute vec4 in_color;

uniform mat4 model_matrix, view_matrix, projection_matrix;

varying highp vec3 world_pos;
varying highp vec3 world_normal;
varying highp vec4 world_color;
varying highp vec4 viewSpace;
bool useShading;
    
void main() {
    world_pos = (model_matrix * vec4(in_position,1)).xyz;
    world_normal = normalize(mat3(model_matrix) * in_normal);
    world_color = in_color;

    viewSpace = view_matrix * model_matrix * vec4(in_position,1);
    gl_Position = projection_matrix * viewSpace;
}`,
    frag: `
uniform highp vec3 spot_position;
uniform highp vec3 spot_rotation;

uniform highp vec3 light_position;
uniform highp vec3 eye_position;
uniform bool useShading;
 
//can pass them as uniforms
const highp vec3 DiffuseLight = vec3(0.1, 0.1, 0.1);
//const highp vec3 RimColor = vec3(0.);

//from vertex shader
varying highp vec3 world_pos;
varying highp vec3 world_normal;
varying highp vec4 world_color;
varying highp vec4 viewSpace;
 
const lowp vec3 fogColor = vec3(0.5, 0.5, 0.5);
const lowp float FogDensity = 0.1;
 
void main() {
    //vec3 tex1 = texture(texture1, texcoord).rgb;
     
    //get light an view directions
    highp vec3 L = normalize(light_position - world_pos);
    highp vec3 V = normalize(eye_position - world_pos);
     
    //diffuse lighting
    highp vec3 diffuse = DiffuseLight;
    if (useShading) {
        diffuse = diffuse * (max(0., dot(L,world_normal)) + max(0., dot(vec3(-L.x, L.y, -L.z),world_normal)));

        highp vec3 LL = spot_position - world_pos;
        highp float distToLight = length(LL);
        LL = normalize(LL);
        highp float cosDir = dot(LL, -spot_rotation);
        highp float spotEffect = smoothstep(0.958, 1.0, cosDir);
        highp float heightAttenuation = smoothstep(5.0, 0.0, distToLight);
        diffuse += spotEffect * heightAttenuation;
    }
     
    //rim lighting
    //highp float rim = float(1) - max(dot(V, world_normal), 0.0);
    //rim = smoothstep(0.6, 1.0, rim);
    //highp vec3 finalRim = RimColor * vec3(rim, rim, rim);
    //get all lights and texture
    //highp vec3 lightColor = (finalRim + diffuse) * world_color * 3.;
    highp vec4 lightColor = vec4(diffuse,1) * world_color * vec4(3.,3.,3.,1.);
     
    //highp vec3 finalColor = vec3(0, 0, 0);
     
    //distance
    //highp float dist = 0.;
    //highp float fogFactor = 0.;

    //range based
    highp float dist = length(viewSpace);
     
    highp float fogFactor = 1.0/exp(dist * FogDensity);
    fogFactor = clamp( fogFactor, 0.0, 1.0 );

    //mix function fogColor*(1-fogFactor) + lightColor*fogFactor
    highp vec4 finalColor = mix(vec4(fogColor,world_color.a), lightColor, vec4(fogFactor));
     
    //show fogFactor depth(gray levels)
    //fogFactor = 1 - fogFactor;
    //out_color = vec4( fogFactor, fogFactor, fogFactor,1.0 );
    gl_FragColor = finalColor;
}`};*/
var resources = {
    vert:"attribute vec3 in_position,in_normal;attribute vec4 in_color;uniform mat4 model_matrix,view_matrix,projection_matrix;varying highp vec3 world_pos,world_normal;varying highp vec4 world_color,viewSpace;bool v;void main(){world_pos=(model_matrix*vec4(in_position,1)).xyz,world_normal=normalize(mat3(model_matrix)*in_normal),world_color=in_color,viewSpace=view_matrix*model_matrix*vec4(in_position,1),gl_Position=projection_matrix*viewSpace;}",
    frag:"uniform highp vec3 spot_position,spot_rotation,light_position,eye_position;uniform bool useShading;const highp vec3 v=vec3(.1,.1,.1);varying highp vec3 world_pos,world_normal;varying highp vec4 world_color,viewSpace;const lowp vec3 h=vec3(.5,.5,.5);const lowp float l=.1;void main(){highp vec3 w=normalize(light_position-world_pos),d=normalize(eye_position-world_pos),n=v;if(useShading){n=n*(max(0.,dot(w,world_normal))+max(0.,dot(vec3(-w.x,w.y,-w.z),world_normal)));highp vec3 s=spot_position-world_pos;highp float f=length(s);s=normalize(s);highp float e=dot(s,-spot_rotation),r=smoothstep(.958,1.,e),g=smoothstep(5.,0.,f);n+=r*g;}highp vec4 s=vec4(n,1)*world_color*vec4(3.,3.,3.,1.);highp float f=length(viewSpace),e=1./exp(f*l);e=clamp(e,0.,1.);highp vec4 r=mix(vec4(h,world_color.w),s,vec4(e));gl_FragColor=r;}"
}
var resourceMeta = {
    in_position:{},
    in_normal:{},
    in_color:{},
    model_matrix:{},
    view_matrix:{},
    projection_matrix:{},
    light_position:{},
    eye_position:{},
    spot_position:{},
    spot_rotation:{},
    useShading:{}
};

//gl consts
var GL_TRIANGLES = 4;
var GL_DEPTH_BUFFER_BIT = 256;
var GL_LEQUAL = 515;
var GL_SRC_ALPHA = 770;
var GL_ONE_MINUS_SRC_ALPHA = 771;
var GL_DEPTH_TEST = 2929;
var GL_BLEND = 3042;
var GL_UNSIGNED_INT = 5125;
var GL_FLOAT = 5126;
var GL_COLOR_BUFFER_BIT = 16384;
var GL_ARRAY_BUFFER = 34962;
var GL_ELEMENT_ARRAY_BUFFER = 34963;
var GL_STATIC_DRAW = 35044;
var GL_FRAGMENT_SHADER = 35632;
var GL_VERTEX_SHADER = 35633;
var GL_COMPILE_STATUS = 35713;

function setup() {
    gl = document.getElementById("c").getContext("webgl2");

    var vertShaderSrc = resources.vert;
    var fragShaderSrc = resources.frag;

    var vertexShader = loadShader(GL_VERTEX_SHADER, vertShaderSrc);
    var fragmentShader = loadShader(GL_FRAGMENT_SHADER, fragShaderSrc);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    //this won't work with closure so change this to array or separate variables
    Object.keys(resourceMeta).forEach(key => {
        if (key.startsWith("in_"))
            resourceMeta[key] = gl.getAttribLocation(shaderProgram, key);
        else
            resourceMeta[key] = gl.getUniformLocation(shaderProgram, key);
    });
    
    gl.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    gl.enable(GL_BLEND);

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
        //canvas.requestPointerLock();
    };
    canvas.onmouseup = () => mouseDown = false;
    canvas.onmousedown = () => mouseDown = true;
    document.addEventListener("mousemove", setMousePos, false);

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

function setMousePos(e) {
    var rect = document.getElementById("c").getBoundingClientRect();
    xMouse = e.clientX - rect.left;
    yMouse = e.clientY - rect.top;
}

function updatePosition(e) {
    cam.b -= e.movementX/140;
    cam.a -= e.movementY/140;
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
    if (keysDown[65]) {
        move(0.05,180);
    } else if (keysDown[68]) {
        move(0.05,0);
    }

    if (keysDown[87]) {
        move(0.05,-90);
    } else if (keysDown[83]) {
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
    gl.enable(GL_DEPTH_TEST);
    gl.depthFunc(GL_LEQUAL);
    gl.clear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    curLoop();
    //handleKeys();

    scene.forEach(obj => {
        renderObj(obj);
    });

    requestAnimationFrame(render);
}

function renderObj(obj) {
    var proj = new Float32Array(persp(gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100));
    //var vm = new Float32Array(lookAtFps([cam.x-obj.tfm.x,cam.y-obj.tfm.y,cam.z-obj.tfm.z],cam.a,cam.b));
    var vm = new Float32Array(lookAtFps([cam.x,cam.y,cam.z],cam.a,cam.b));
    var transformValue = obj.tfm;
    if (!Array.isArray(obj.tfm)) {
        transformValue = transform(obj.tfm);
    }
    var mm = new Float32Array(transformValue);
    enableBuffer(resourceMeta.in_position, obj.pos, 3);
    enableBuffer(resourceMeta.in_normal, obj.nrm, 3);
    enableBuffer(resourceMeta.in_color, obj.col, 4);
    gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, obj.idx);
    gl.useProgram(shaderProgram);
    gl.uniformMatrix4fv(resourceMeta.projection_matrix, false, proj);
    gl.uniformMatrix4fv(resourceMeta.view_matrix, false, vm);
    gl.uniformMatrix4fv(resourceMeta.model_matrix, false, mm);
    gl.uniform3f(resourceMeta.eye_position, cam.x,cam.y,cam.z);
    gl.uniform3f(resourceMeta.light_position, 50,50,50);
    gl.uniform3f(resourceMeta.spot_position, ...spotPos);
    gl.uniform3f(resourceMeta.spot_rotation, ...spotRot);
    gl.uniform1i(resourceMeta.useShading, obj.shading === undefined);
    gl.drawElements(GL_TRIANGLES, obj.ict, GL_UNSIGNED_INT, 0);
}

function enableBuffer(attr, buff, compCount) {
    gl.bindBuffer(GL_ARRAY_BUFFER, buff);
    gl.vertexAttribPointer(attr, compCount, GL_FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attr);
}

function addSceneObj(transform,modelIdxOrObj,insIdx=scene.length) {
    var mdl;
    if (typeof(modelIdxOrObj) == "object")
        mdl = modelIdxOrObj;
    else
        mdl = models[modelIdxOrObj];

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(GL_ARRAY_BUFFER, positionBuffer);
    gl.bufferData(GL_ARRAY_BUFFER, new Float32Array(mdl.v), GL_STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, new Uint32Array(mdl.i), GL_STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(GL_ARRAY_BUFFER, normalBuffer);
    gl.bufferData(GL_ARRAY_BUFFER, new Float32Array(mdl.n), GL_STATIC_DRAW);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(GL_ARRAY_BUFFER, colorBuffer);
    gl.bufferData(GL_ARRAY_BUFFER, new Float32Array(mdl.c), GL_STATIC_DRAW);

    var object;
    scene.splice(insIdx, 0, object = {
        tfm: transform,
        pos: positionBuffer,
        idx: indexBuffer,
        nrm: normalBuffer,
        col: colorBuffer,
        vct: mdl.v.length,
        ict: mdl.i.length,
        mio: modelIdxOrObj
    });

    return object;
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
var pi = Math.PI;
var hp = pi/2;
var sqh = Math.sqrt(2)/2;
//shaders
function loadShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var compiled = gl.getShaderParameter(shader, GL_COMPILE_STATUS);
    console.log(compiled ? "shader compiled successfully" : "failed to compile");
    var compilationLog = gl.getShaderInfoLog(shader);
    if (compilationLog != "")
        console.log("compile log: " + compilationLog);
    return shader;
}
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
//L=[[a,b,c,0],[d,z,f,0],[g,h,i,0],[j,k,l,1]]
//M=dot([[m,n,o,0],[p,q,r,0],[s,t,u,0],[v,w,x,1]],L)
//M
function dot(matA, matB) {
    var a = matA[0]; var b = matA[1]; var c = matA[2];
    var d = matA[4]; var e = matA[5]; var f = matA[6];
    var g = matA[8]; var h = matA[9]; var i = matA[10];
    var j = matA[12];var k = matA[13];var l = matA[14];

    var m = matB[0]; var n = matB[1]; var o = matB[2];
    var p = matB[4]; var q = matB[5]; var r = matB[6];
    var s = matB[8]; var t = matB[9]; var u = matB[10];
    var v = matB[12];var w = matB[13];var x = matB[14];
    return [a*m+d*n+g*o,b*m+h*o+n*e,c*m+f*n+i*o,0,
            a*p+d*q+g*r,b*p+h*r+q*e,c*p+f*q+i*r,0,
            a*s+d*t+g*u,b*s+h*u+t*e,c*s+f*t+i*u,0,
            j+a*v+d*w+g*x,k+b*v+h*x+w*e,l+c*v+f*w+i*x,1];
}
//L=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[x,y,z,1]]
//M=dot([[w,f,0,0],[-f,w,0,0],[0,0,1,0],[0,0,0,1]],L)
//N=dot([[c,0,-d,0],[0,1,0,0],[d,0,c,0],[0,0,0,1]],M)
//O=dot([[1,0,0,0],[0,a,b,0],[0,-b,a,0],[0,0,0,1]],N)
//P=dot([[p,0,0,0],[0,q,0,0],[0,0,r,0],[0,0,0,1]],O)
//P
function transform(tra) { //todo - use new dot function?
    var a = Math.cos(tra.a);
    var b = Math.sin(tra.a);
    var c = Math.cos(tra.b);
    var d = Math.sin(tra.b);
    var e = Math.cos(tra.c);
    var f = Math.sin(tra.c);
    var p = tra.d;
    var q = tra.e;
    var r = tra.f;
    return [c*p*e,c*f*p,-d*p,0,
           -a*f*q+b*d*q*e,a*q*e+b*d*f*q,b*c*q,0,
            a*d*r*e+b*f*r,a*d*f*r-b*r*e,a*c*r,0,
            tra.x,tra.y,tra.z,1];
}
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
