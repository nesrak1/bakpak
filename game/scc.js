var b,n,q=[],aa=[],r=0,t=0,u=0,v=0,w=0;function ba(){var a=("119100"+Math.floor(Math.min(35,Math.max(2,10*x[y]))).toString(36)+"0000").split("").map((a)=>parseInt(a,36)),e=[],d=[],f=[],g=[];d=[];var c,m=0,h=3*a[0]+1;for(c=1;c<h;c+=3)d.push([a[c],a[c+1],a[c+2]]);var k=a.indexOf(35);-1==k&&(k=3E5);for(c=h;c<a.length;c+=c<k?7:4){c==k&&c++;var l=a[c];var p=a[c+2];var P=a[c+1];if(c>=k){var Q=l;var R=p;var S=P;h=d[a[c+3]]}else Q=a[c+3],R=a[c+5],S=a[c+4],h=d[a[c+6]];p=ca(l/-10+.4,p/10-.4,P/10-.4,-.1+Q/-10+.4,.1+R/10-.4,.1+S/10-.4);for(l=0;72>l;l++)e[l+72*m]=p[l];f=f.concat([0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0]);for(l=0;24>l;l++)g=g.concat([.125*h[0],.125*h[1],.125*h[2],1]);m++}d=da(e.length/6);return{f:e,i:d,n:f,a:g}}function da(a){for(var e=[],d=0;d<4*a;d+=4)e=e.concat([d,d+1,d+2,d,d+2,d+3]);return e}function ca(a,e,d,f,g,c){return[a,e,c,f,e,c,f,g,c,a,g,c,a,e,d,f,e,d,f,g,d,a,g,d,f,e,d,f,g,d,f,g,c,f,e,c,a,g,d,a,e,d,a,e,c,a,g,c,f,g,d,a,g,d,a,g,c,f,g,c,a,e,d,f,e,d,f,e,c,a,e,c]}var z={o:{},m:{},l:{},u:{},D:{},A:{},s:{},h:{}};function ea(){var a=document.getElementById("c");a.requestPointerLock=a.requestPointerLock||a.H;document.exitPointerLock=document.exitPointerLock||document.F;a.onclick=function(){a.requestPointerLock()};document.addEventListener("pointerlockchange",A,!1);document.addEventListener("mozpointerlockchange",A,!1);document.onkeydown=fa;document.onkeyup=ha}function A(){var a=document.getElementById("c");document.pointerLockElement===a||document.G===a?document.addEventListener("mousemove",B,!1):document.removeEventListener("mousemove",B,!1)}function B(a){w-=a.movementX/100;v-=a.movementY/100}var C={};function fa(a){C[a.keyCode]=!0}function ha(a){C[a.keyCode]=!1}function D(a){r+=.01*Math.cos((180*-w/Math.PI+a)%360*Math.PI/180);u+=.01*Math.sin((180*-w/Math.PI+a)%360*Math.PI/180)}function E(){b.clearColor(.5,.5,.5,1);b.le(1);b.enable(2929);b.eu(515);b.clear(16384|b.DEPTH_BUFFER_BIT);C[37]||C[65]?D(180):(C[39]||C[68])&&D(0);C[38]||C[87]?D(-90):(C[40]||C[83])&&D(90);if(C[32])t+=.01;else if(C[16]||C[67])t-=.01;q.forEach(function(a){var e=Math.tan(.5*Math.PI-.3927),d=1/-99.9;e=new Float32Array([e/(b.canvas.clientWidth/b.canvas.clientHeight),0,0,0,0,e,0,0,0,0,100.1*d,-1,0,0,20*d,0]);d=[r,t,u];var f=v,g=w,c=Math.cos(f);f=Math.sin(f);var m=Math.cos(g),h=Math.sin(g);g=[m,0,-h];var k=[h*f,c,m*f];c=[h*c,-f,c*m];d=new Float32Array([g[0],k[0],c[0],0,g[1],k[1],c[1],0,g[2],k[2],c[2],0,-F(g,d),-F(k,d),-F(c,d),1]);c=a.B;f=Math.cos(c.b);m=Math.sin(c.b);g=Math.cos(c.c);k=Math.sin(c.c);h=Math.cos(c.a);var l=Math.sin(c.a);c=new Float32Array([g*h,g*l,-k,0,-f*l+m*k*h,f*h+m*k*l,m*g,0,f*k*h+m*l,f*k*l-m*h,f*g,0,c.x,c.y,c.z,1]);G(z.o,a.w,3);G(z.m,a.v,3);G(z.l,a.g,4);b.if(34963,a.j);b.sg(n);b.nm4(z.A,!1,e);b.nm4(z.D,!1,d);b.nm4(z.u,!1,c);b.uniform3f(z.h,r,t,u);b.uniform3f(z.s,50,0,0);b.re(4,a.C/2,5123,0)});requestAnimationFrame(E)}function G(a,e,d){b.if(34962,e);b.eAo(a,d,5126,!1,0,0);b.nVt(a)}function H(a,e){a=b.rS(a);b.hS(a,e);b.oe(a);console.log("Shader compiled successfully: "+b.edm(a,35713));console.log("Shader compiler log: "+b.edL(a));return a}function F(a,e){return a[0]*e[0]+a[1]*e[1]+a[2]*e[2]};var I;function J(){return I=Math.sin(1/(I/1E7))/2}(function(){b=document.getElementById("c").getContext("webgl2");var a=H(35633,"attribute vec3 in_position,in_normal;attribute vec4 in_color;uniform mat4 model_matrix,view_matrix,projection_matrix;varying highp vec3 world_pos,world_normal,world_color;varying highp vec4 viewSpace;void main(){world_pos=(model_matrix*vec4(in_position,1)).xyz,world_normal=normalize(mat3(model_matrix)*in_normal),world_color=vec3(in_color),viewSpace=view_matrix*model_matrix*vec4(in_position,1),gl_Position=projection_matrix*viewSpace;}"),e=H(35632,"uniform highp vec3 light_position,eye_position;const highp vec3 v=vec3(.15,.05,0.),w=vec3(.2,.2,.2);varying highp vec3 world_pos,world_normal,world_color;varying highp vec4 viewSpace;const lowp vec3 l=vec3(.5,.5,.5);const lowp float h=.4;void main(){highp vec3 f=normalize(light_position-world_pos),e=normalize(eye_position-world_pos),s=v*max(float(0),dot(f,world_normal));highp float c=float(1)-max(dot(e,world_normal),0.);c=smoothstep(.6,1.,c);highp vec3 r=w*vec3(c,c,c),n=(r+s)*world_color,d=vec3(0,0,0);highp float g=float(0),o=float(0);g=length(viewSpace);o=1./exp(g*h);o=clamp(o,0.,1.);d=mix(l,n,o);gl_FragColor=vec4(d,1);}");n=b.rP();b.tS(n,a);b.tS(n,e);b.io(n);Object.keys(z).forEach(function(a){z[a]=a.startsWith("in_")?b.ert(n,a):b.efa(n,a)});ea();requestAnimationFrame(E);w=Math.PI})();var K;function ia(){function a(a){return((g[m[c[a]]]||0)+(g[m[c[a+4]]]||0))/2}for(var e=L*M,d=N*M,f=M,g=O,c=[0,2,0,1,1,3,2,3],m=[e+d*K,e+f+d*K,e+(d+f)*K,e+f+(d+f)*K],h=[a(1),a(0),a(2),a(3)],k=e+f/2,l=d+f/2,p=0;4>p;p++)g[[k,k,e,e+f][p]+[d+f,d,l,l][p]*K]=h[p]+.1*J()*Math.log2(f);g[k+l*K]=(h[0]+h[1]+h[2]+h[3])/4}I=.29007399;var x;K=65;var O=Array(4096);O[0]=J()+.5;O[64]=J()+.5;O[64*K]=J()+.5;O[K*K-1]=J()+.5;for(var T=0;6>T;T++)for(var U=2**T,M=64/U,L=0;L<U;L++)for(var N=0;N<U;N++)ia();x=O;for(var y=0;4096>y;y++){var V=void 0,ja={x:Math.floor(y/64)/10,y:0,z:y%64/10,b:0,c:0,a:0},W=ba();V="object"==typeof W?W:aa[W];var X=b.rB();b.if(34962,X);b.uD(34962,new Float32Array(V.f),35044);var Y=b.rB();b.if(34963,Y);b.uD(34963,new Uint16Array(V.i),35044);var _=b.rB();b.if(34962,_);b.uD(34962,new Float32Array(V.n),35044);var ka=b.rB();b.if(34962,ka);b.uD(34962,new Float32Array(V.a),35044);q.push({B:ja,w:X,j:Y,v:_,g:ka,C:V.f.length})};