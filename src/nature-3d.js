import * as THREE from './vendor/three/three.module.min.js';
import { ENVIRONMENTS } from './nature-environments.js';
import { landscapeVertex, landscapeFragment, grassVertex, grassFragment, waterVertex, waterFragment } from './nature-shaders.js';

// A layered environment stage: original landscape art, fitted moving water,
// and genuine 3D foreground vegetation. A fixed camera keeps the editor restful.
const FOV = 48;
const GROUND = 2.6;
const DEPTH = 140;
const random = i => { const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n); };

function inside(x,y,polygon) {
    let hit=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
        const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
        if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;
    }
    return hit;
}

function makeRegions(environment) {
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=432;
    const context=canvas.getContext('2d');context.fillStyle='#000';context.fillRect(0,0,768,432);
    const shape=(ctx,polygon)=>{
        ctx.beginPath();polygon.forEach(([x,y],i)=>i?ctx.lineTo(x*768,y*432):ctx.moveTo(x*768,y*432));ctx.closePath();ctx.fill();
    };
    for(const [key,color] of [['water','#f00'],['grassRegions','#0f0'],['canopy','#00f']]){
        const layer=document.createElement('canvas');layer.width=768;layer.height=432;
        const ctx=layer.getContext('2d');ctx.fillStyle=color;
        if(key==='canopy'){
            for(const [x,y,rx,ry] of environment.canopy){ctx.beginPath();ctx.ellipse(x*768,y*432,rx*768,ry*432,0,0,Math.PI*2);ctx.fill();}
            // Fern / branch masks must not bend adjacent water or its rocks.
            ctx.globalCompositeOperation='destination-out';
            for(const polygon of [...environment.water,...(environment.waterHoles||[])])shape(ctx,polygon);
        }else{
            for(const polygon of environment[key])shape(ctx,polygon);
            if(key==='grassRegions'||key==='water'){
                ctx.globalCompositeOperation='destination-out';
                const holes=key==='water'?environment.waterHoles:[...environment.grassHoles,...(environment.waterHoles||[])];
                for(const polygon of holes||[])shape(ctx,polygon);
            }
        }
        context.globalCompositeOperation='lighter';context.filter='blur(2px)';context.drawImage(layer,0,0);
    }
    const texture=new THREE.CanvasTexture(canvas);texture.generateMipmaps=false;
    texture.minFilter=texture.magFilter=THREE.LinearFilter;
    return texture;
}

function blade(type) {
    const geometry=new THREE.BufferGeometry(),vertices=[],uv=[],indices=[];
    const width=[0.010,0.017,0.007][type],curl=[0.08,0.14,0.23][type];
    for(let i=0;i<=5;i++){
        const t=i/5,w=width*Math.pow(1-t,0.72),lean=t*t*(type===2?-.06:.02);
        vertices.push(lean-w,t,t*t*curl,lean+w,t,t*t*curl);uv.push(0,t,1,t);
        if(i<5){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
    return geometry;
}

function disposeStage(scene) {
    const geometry=new Set(),materials=new Set(),textures=new Set();
    scene?.traverse(object=>{
        if(object.isInstancedMesh)object.dispose();
        if(object.geometry)geometry.add(object.geometry);
        for(const material of Array.isArray(object.material)?object.material:[object.material]){
            if(!material)continue;materials.add(material);
            for(const uniform of Object.values(material.uniforms||{}))if(uniform.value?.isTexture)textures.add(uniform.value);
        }
    });
    geometry.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());textures.forEach(item=>item.dispose());
}

export function createNature3D(canvas) {
    const renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.NoToneMapping;
    const camera=new THREE.PerspectiveCamera(FOV,1,0.1,400);
    const artCamera=new THREE.PerspectiveCamera(FOV,16/9,0.1,400);
    const gl=renderer.getContext(),loader=new THREE.TextureLoader(),clock={value:0};
    let scene=null,aspect=16/9,width=1,height=1,pending=null,version=0,lastTime=null,disposed=false;

    function releaseFrame(){if(pending){gl.deleteSync(pending);pending=null;}}
    function clear(){
        if(pending&&!gl.isContextLost())gl.finish();releaseFrame();
        disposeStage(scene);scene=null;lastTime=null;renderer.renderLists.dispose();
    }

    async function setScene(kind) {
        const generation=++version;clear();
        if(!kind||disposed)return false;
        const environment=ENVIRONMENTS[kind];
        if(!environment)throw new Error(`Unknown nature environment: ${kind}`);
        const art=await loader.loadAsync(new URL(`../assets/backgrounds/${kind}.webp`,import.meta.url).href);
        if(generation!==version||disposed){art.dispose();return false;}
        art.colorSpace=THREE.SRGBColorSpace;art.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
        aspect=art.image.width/art.image.height;
        artCamera.aspect=aspect;artCamera.updateProjectionMatrix();
        const regions=makeRegions(environment);
        scene=new THREE.Scene();
        const uniforms={uTime:clock,uArt:{value:art},uRegions:{value:regions},uClouds:{value:environment.clouds?1:0}};
        const background=new THREE.Mesh(
            new THREE.PlaneGeometry(2*DEPTH*Math.tan(FOV*Math.PI/360)*aspect,2*DEPTH*Math.tan(FOV*Math.PI/360)),
            new THREE.ShaderMaterial({uniforms,vertexShader:landscapeVertex,fragmentShader:landscapeFragment,depthWrite:false,depthTest:false}),
        );
        background.position.z=-DEPTH;background.renderOrder=-10;scene.add(background);

        if(!environment.clouds){
            const geometry=new THREE.PlaneGeometry(260,260,140,140);geometry.rotateX(-Math.PI/2);
            const material=new THREE.ShaderMaterial({
                uniforms:{...uniforms,uRiver:{value:environment.river?1:0},uNight:{value:environment.night?1:0},uArtProjection:{value:artCamera.projectionMatrix}},
                vertexShader:waterVertex,fragmentShader:waterFragment,transparent:true,depthWrite:false,
            });
            const water=new THREE.Mesh(geometry,material);water.position.set(0,-GROUND,-100);water.renderOrder=0;scene.add(water);
        }

        // Sampling the artwork at each root blends the live blades into its light,
        // shadows and local color, instead of placing a uniform green carpet over it.
        const sample=document.createElement('canvas');sample.width=256;sample.height=144;
        const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(art.image,0,0,256,144);
        const pixels=ctx.getImageData(0,0,256,144).data;
        const fallback=new THREE.Color(environment.grass),roots=[[],[],[]],tan=Math.tan(FOV*Math.PI/360);
        for(let i=0;i<23000;i++){
            const u=random(i+40),v=0.57+Math.pow(random(i+9010),0.72)*0.49,checkV=Math.min(v,0.997);
            if(!environment.grassRegions.some(p=>inside(u,checkV,p))||environment.grassHoles.some(p=>inside(u,checkV,p)))continue;
            const z=-GROUND/((v-0.5)*2*tan),x=(u-0.5)*2*tan*aspect*(-z);
            const type=random(i+4700)<0.55?0:random(i+6710)<0.78?1:2;
            const index=(Math.min(143,Math.floor(checkV*144))*256+Math.min(255,Math.floor(u*256)))*4;
            const color=new THREE.Color().setRGB(pixels[index]/255,pixels[index+1]/255,pixels[index+2]/255,THREE.SRGBColorSpace).lerp(fallback,0.24);
            roots[type].push({x,z,color,seed:i});
        }
        const grassMaterial=new THREE.ShaderMaterial({uniforms:{uTime:clock,uNight:{value:environment.night?1:0}},vertexShader:grassVertex,fragmentShader:grassFragment,side:THREE.DoubleSide});
        const dummy=new THREE.Object3D();
        roots.forEach((items,type)=>{
            const grass=new THREE.InstancedMesh(blade(type),grassMaterial,items.length);
            items.forEach(({x,z,color,seed},index)=>{
                dummy.position.set(x,-GROUND,z);dummy.rotation.set(0,random(seed+304)*Math.PI*2,0);
                const length=(0.20+random(seed+110)*0.31)*(type===2?1.30:1);
                dummy.scale.set(0.7+random(seed+210)*0.7,length,1);dummy.updateMatrix();
                grass.setMatrixAt(index,dummy.matrix);grass.setColorAt(index,color);
            });
            grass.frustumCulled=false;grass.renderOrder=1;scene.add(grass);
        });
        resize(width,height);
        return true;
    }

    function resize(w,h){
        width=w;height=h;releaseFrame();lastTime=null;
        renderer.setSize(w,h,false);camera.aspect=w/h;
        // Exactly match object-fit: cover on narrow, wide and portrait windows.
        camera.fov=2*Math.atan(Math.tan(FOV*Math.PI/360)*Math.min(1,aspect/camera.aspect))*180/Math.PI;
        camera.updateProjectionMatrix();
    }
    function render(time){
        if(!scene||disposed||lastTime===time||gl.isContextLost())return;
        if(pending){const state=gl.clientWaitSync(pending,0,0);if(state===gl.TIMEOUT_EXPIRED)return;releaseFrame();if(state===gl.WAIT_FAILED)return;}
        clock.value=time;renderer.render(scene,camera);lastTime=time;
        pending=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
        canvas.dataset.time=String(time);canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.triangles=String(renderer.info.render.triangles);
    }
    function snapshot(){
        if(!scene||disposed||gl.isContextLost())return null;
        // WebGL normally discards its drawing buffer after compositing. Render
        // once here and copy in the same task so the outgoing scene cannot flash.
        gl.finish();releaseFrame();renderer.render(scene,camera);
        const still=document.createElement('canvas');still.width=canvas.width;still.height=canvas.height;
        still.getContext('2d').drawImage(canvas,0,0);
        return still;
    }
    return {setScene,resize,render,snapshot,available:()=>!disposed&&!gl.isContextLost(),dispose(){disposed=true;version++;clear();renderer.dispose();renderer.forceContextLoss();}};
}
