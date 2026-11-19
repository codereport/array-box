export const noise = `
    float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
    float gust(vec2 p,float t){float n=noise(p*.17-vec2(t*.15,t*.04));return .18+.72*smoothstep(.12,.87,.5+.5*sin(dot(p,vec2(.26,.10))-t*1.2+n*3.8));}
`;

export const landscapeVertex = `
    varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
export const landscapeFragment = `
    uniform sampler2D uArt;uniform sampler2D uRegions;uniform float uTime;uniform float uClouds;
    varying vec2 vUv;
    ${noise}
    void main(){
        vec3 regions=texture2D(uRegions,vUv).rgb;
        float wind=gust(vUv*vec2(42.,24.),uTime);
        vec2 leaves=vec2(sin(uTime*.94+vUv.y*14.),cos(uTime*.73+vUv.x*15.))*.0014*regions.b;
        vec2 meadow=vec2(wind-.5,sin(uTime*.84+vUv.x*10.)*.25)*.0018*regions.g;
        vec2 cloud=vec2(sin(uTime*.09+vUv.y*7.),cos(uTime*.07+vUv.x*6.))*.003*regions.r*uClouds;
        gl_FragColor=texture2D(uArt,clamp(vUv+leaves+meadow+cloud,.001,.999));
        #include <colorspace_fragment>
    }
`;

export const grassVertex = `
    uniform float uTime;varying vec3 vColor;varying vec2 vBlade;varying float vSeed;varying float vGust;
    ${noise}
    void main(){
        vec3 root=instanceMatrix[3].xyz;vec3 p=position;
        float seed=hash(root.xz*19.7),strength=gust(root.xz,uTime);
        float turn=(noise(root.xz*.1+uTime*.06)-.5)*.75;
        vec2 direction=vec2(cos(.38+turn),sin(.38+turn));
        float flutter=sin(uTime*(2.5+seed*2.)+seed*41.)*.035;
        float bend=p.y*p.y*(.10+strength*.52+flutter);
        vec3 world=(instanceMatrix*vec4(p,1.)).xyz;
        world.xz+=direction*bend*length(instanceMatrix[1].xyz);
        world.y-=p.y*strength*.10*length(instanceMatrix[1].xyz);
        vColor=instanceColor;vBlade=uv;vSeed=seed;vGust=strength;
        gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(world,1.);
    }
`;
export const grassFragment = `
    uniform float uNight;varying vec3 vColor;varying vec2 vBlade;varying float vSeed;varying float vGust;
    void main(){
        float vein=exp(-abs(vBlade.x-.5)*23.);
        float fiber=sin(vBlade.x*31.+vSeed*20.)*.028;
        vec3 color=vColor*mix(.65,1.10,smoothstep(0.,1.,vBlade.y));
        color*=.97+vein*.07+fiber+vGust*.05;
        color=mix(color,color*vec3(1.12,1.02,.79),smoothstep(.78,1.,vBlade.y)*vSeed*.4);
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
    }
`;

export const waterVertex = `
    uniform float uTime;uniform float uRiver;uniform mat4 uArtProjection;
    varying vec4 vSource;varying vec3 vWorld;
    void main(){
        vec3 p=position;vec3 world=(modelMatrix*vec4(p,1.)).xyz;
        world.y+=sin(world.x*.5+world.z*.3-uTime*.9)*mix(.065,.018,uRiver);
        world.y+=sin(world.z*.7+world.x*.2+uTime*.7)*mix(.025,.009,uRiver);
        vSource=uArtProjection*vec4(world,1.);vWorld=world;
        gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
    }
`;
export const waterFragment = `
    uniform sampler2D uArt;uniform sampler2D uRegions;uniform float uTime;uniform float uRiver;uniform float uNight;
    varying vec4 vSource;varying vec3 vWorld;
    ${noise}
    void main(){
        vec2 uv=vSource.xy/vSource.w*.5+.5;
        if(any(lessThan(uv,vec2(.001)))||any(greaterThan(uv,vec2(.999))))discard;
        float mask=texture2D(uRegions,uv).r;if(mask<.01)discard;
        vec3 original=texture2D(uArt,uv).rgb;
        // Leave a dry margin around banks, rocks and the existing breakers.
        // Both the displaced sample and its whole footprint must remain in water.
        vec2 margin=vec2(.005,.008);
        float edge=min(min(texture2D(uRegions,uv+vec2(margin.x,0.)).r,texture2D(uRegions,uv-vec2(margin.x,0.)).r),
                       min(texture2D(uRegions,uv+vec2(0.,margin.y)).r,texture2D(uRegions,uv-vec2(0.,margin.y)).r));
        edge=smoothstep(.90,1.,min(mask,edge));
        float low=min(original.r,min(original.g,original.b));
        float high=max(original.r,max(original.g,original.b));
        float foam=smoothstep(.25,.65,low)*(1.-smoothstep(.08,.30,high-low));
        float surface=edge*(1.-foam);
        vec2 p=vWorld.xz;float speed=mix(.24,.75,uRiver);
        vec2 moving=p-vec2(sin(p.y*.13)*.3,uTime*speed);
        vec2 ripple=vec2(sin(moving.y*1.8+noise(moving*.7)*3.),sin(moving.x*2.1+moving.y*.4));
        float nearWater=1.-smoothstep(20.,100.,distance(cameraPosition,vWorld));
        vec2 offset=ripple*vec2(.0014,.0009)*surface*nearWater;
        vec2 target=clamp(uv+offset,.001,.999);
        float safe=smoothstep(.90,1.,texture2D(uRegions,target).r);
        vec3 base=texture2D(uArt,mix(uv,target,safe)).rgb;
        float streak=noise(vec2(moving.x*1.6+sin(moving.y*.45)*.4,moving.y*4.));
        float glint=smoothstep(.55,.90,streak)*mix(.018,.035,uRiver);
        base+=vec3(glint*nearWater*surface*(1.-uNight*.65));
        gl_FragColor=vec4(base,smoothstep(.04,.75,mask));
        #include <colorspace_fragment>
    }
`;
