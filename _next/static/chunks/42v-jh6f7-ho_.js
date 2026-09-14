(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,54126,t=>{"use strict";var e=t.i(81107),a=t.i(27076),r=t.i(65654),o=t.i(22558);let s=class t extends r.Shader{constructor(e){super(e={...t.defaultOptions,...e}),this.enabled=!0,this._state=o.State.for2d(),this.blendMode=e.blendMode,this.padding=e.padding,"boolean"==typeof e.antialias?this.antialias=e.antialias?"on":"off":this.antialias=e.antialias,this.resolution=e.resolution,this.blendRequired=e.blendRequired,this.clipToViewport=e.clipToViewport,this.addResource("uTexture",0,1),e.blendRequired&&this.addResource("uBackTexture",0,3)}apply(t,e,a,r){t.applyFilter(this,e,a,r)}get blendMode(){return this._state.blendMode}set blendMode(t){this._state.blendMode=t}static from(r){let o,s,{gpu:i,gl:f,...n}=r;return i&&(o=a.GpuProgram.from(i)),f&&(s=e.GlProgram.from(f)),new t({gpuProgram:o,glProgram:s,...n})}};s.defaultOptions={blendMode:"normal",resolution:1,padding:0,antialias:"off",blendRequired:!1,clipToViewport:!0},t.s(["Filter",0,s])},35066,90532,t=>{"use strict";let e={name:"local-uniform-bit",vertex:{header:`

            struct LocalUniforms {
                uTransformMatrix:mat3x3<f32>,
                uColor:vec4<f32>,
                uRound:f32,
            }

            @group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `,main:`
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `,end:`
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `}},a={...e,vertex:{...e.vertex,header:e.vertex.header.replace("group(1)","group(2)")}},r={name:"local-uniform-bit",vertex:{header:`

            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `,main:`
            vColor *= uColor;
            modelMatrix = uTransformMatrix;
        `,end:`
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `}};t.s(["localUniformBit",0,e,"localUniformBitGl",0,r,"localUniformBitGroup2",0,a],35066);let o={name:"texture-bit",vertex:{header:`

        struct TextureUniforms {
            uTextureMatrix:mat3x3<f32>,
        }

        @group(2) @binding(2) var<uniform> textureUniforms : TextureUniforms;
        `,main:`
            uv = (textureUniforms.uTextureMatrix * vec3(uv, 1.0)).xy;
        `},fragment:{header:`
            @group(2) @binding(0) var uTexture: texture_2d<f32>;
            @group(2) @binding(1) var uSampler: sampler;


        `,main:`
            outColor = textureSample(uTexture, uSampler, vUV);
        `}},s={name:"texture-bit",vertex:{header:`
            uniform mat3 uTextureMatrix;
        `,main:`
            uv = (uTextureMatrix * vec3(uv, 1.0)).xy;
        `},fragment:{header:`
        uniform sampler2D uTexture;


        `,main:`
            outColor = texture(uTexture, vUV);
        `}};t.s(["textureBit",0,o,"textureBitGl",0,s],90532)},35656,39391,t=>{"use strict";var e=t.i(85830),a=t.i(46820);t.s(["ensureAttributes",0,function(t,r){for(let a in t.attributes){let o=t.attributes[a],s=r[a];s?(o.format??(o.format=s.format),o.offset??(o.offset=s.offset),o.instance??(o.instance=s.instance)):(0,e.warn)(`Attribute ${a} is not present in the shader, but is present in the geometry. Unable to infer attribute details.`)}!function(t){let{buffers:e,attributes:r}=t,o={},s={};for(let t in e){let a=e[t];o[a.uid]=0,s[a.uid]=0}for(let t in r){let e=r[t];o[e.buffer.uid]+=(0,a.getAttributeInfoFromFormat)(e.format).stride}for(let t in r){let e=r[t];e.stride??(e.stride=o[e.buffer.uid]),e.start??(e.start=s[e.buffer.uid]),s[e.buffer.uid]+=(0,a.getAttributeInfoFromFormat)(e.format).stride}}(t)}],35656);var r=t.i(96108);let o=[];o[r.STENCIL_MODES.NONE]=void 0,o[r.STENCIL_MODES.DISABLED]={stencilWriteMask:0,stencilReadMask:0},o[r.STENCIL_MODES.RENDERING_MASK_ADD]={stencilFront:{compare:"equal",passOp:"increment-clamp"},stencilBack:{compare:"equal",passOp:"increment-clamp"}},o[r.STENCIL_MODES.RENDERING_MASK_REMOVE]={stencilFront:{compare:"equal",passOp:"decrement-clamp"},stencilBack:{compare:"equal",passOp:"decrement-clamp"}},o[r.STENCIL_MODES.MASK_ACTIVE]={stencilWriteMask:0,stencilFront:{compare:"equal",passOp:"keep"},stencilBack:{compare:"equal",passOp:"keep"}},o[r.STENCIL_MODES.INVERSE_MASK_ACTIVE]={stencilWriteMask:0,stencilFront:{compare:"not-equal",passOp:"keep"},stencilBack:{compare:"not-equal",passOp:"keep"}},t.s(["GpuStencilModesToPixi",0,o],39391)},28353,92715,62039,33156,87784,t=>{"use strict";var e=t.i(55364),a=t.i(85465),r=t.i(64957);t.s(["UboSystem",0,class{constructor(t){this._syncFunctionHash=Object.create(null),this._adaptor=t,this._systemCheck()}_systemCheck(){if(!(0,e.unsafeEvalSupported)())throw Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.")}ensureUniformGroup(t){let e=this.getUniformGroupData(t);t.buffer||(t.buffer=new a.Buffer({data:new Float32Array(e.layout.size/4),usage:r.BufferUsage.UNIFORM|r.BufferUsage.COPY_DST}))}getUniformGroupData(t){return this._syncFunctionHash[t._signature]||this._initUniformGroup(t)}_initUniformGroup(t){let e=t._signature,a=this._syncFunctionHash[e];if(!a){let r=Object.keys(t.uniformStructures).map(e=>t.uniformStructures[e]),o=this._adaptor.createUboElements(r),s=this._generateUboSync(o.uboElements);a=this._syncFunctionHash[e]={layout:o,syncFunction:s}}return this._syncFunctionHash[e]}_generateUboSync(t){return this._adaptor.generateUboSync(t)}syncUniformGroup(t,e,o){let s=this.getUniformGroupData(t);t.buffer||(t.buffer=new a.Buffer({data:new Float32Array(s.layout.size/4),usage:r.BufferUsage.UNIFORM|r.BufferUsage.COPY_DST}));let i=null;return e||(e=t.buffer.data,i=t.buffer.dataInt32),o||(o=0),s.syncFunction(t.uniforms,e,i,o),!0}updateUniformGroup(t){if(t.isStatic&&!t._dirtyId)return!1;t._dirtyId=0;let e=this.syncUniformGroup(t);return t.buffer.update(),e}destroy(){this._syncFunctionHash=null}}],28353);let o=[{type:"mat3x3<f32>",test:t=>void 0!==t.value.a,ubo:`
            var matrix = uv[name].toArray(true);
            data[offset] = matrix[0];
            data[offset + 1] = matrix[1];
            data[offset + 2] = matrix[2];
            data[offset + 4] = matrix[3];
            data[offset + 5] = matrix[4];
            data[offset + 6] = matrix[5];
            data[offset + 8] = matrix[6];
            data[offset + 9] = matrix[7];
            data[offset + 10] = matrix[8];
        `,uniform:`
            gl.uniformMatrix3fv(ud[name].location, false, uv[name].toArray(true));
        `},{type:"vec4<f32>",test:t=>"vec4<f32>"===t.type&&1===t.size&&void 0!==t.value.width,ubo:`
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
            data[offset + 2] = v.width;
            data[offset + 3] = v.height;
        `,uniform:`
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height) {
                cv[0] = v.x;
                cv[1] = v.y;
                cv[2] = v.width;
                cv[3] = v.height;
                gl.uniform4f(ud[name].location, v.x, v.y, v.width, v.height);
            }
        `},{type:"vec2<f32>",test:t=>"vec2<f32>"===t.type&&1===t.size&&void 0!==t.value.x,ubo:`
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
        `,uniform:`
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y) {
                cv[0] = v.x;
                cv[1] = v.y;
                gl.uniform2f(ud[name].location, v.x, v.y);
            }
        `},{type:"vec4<f32>",test:t=>"vec4<f32>"===t.type&&1===t.size&&void 0!==t.value.red,ubo:`
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
            data[offset + 3] = v.alpha;
        `,uniform:`
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.alpha) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                cv[3] = v.alpha;
                gl.uniform4f(ud[name].location, v.red, v.green, v.blue, v.alpha);
            }
        `},{type:"vec3<f32>",test:t=>"vec3<f32>"===t.type&&1===t.size&&void 0!==t.value.red,ubo:`
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
        `,uniform:`
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                gl.uniform3f(ud[name].location, v.red, v.green, v.blue);
            }
        `}];function s(t,e){return`
        for (let i = 0; i < ${t*e}; i++) {
            data[offset + (((i / ${t})|0) * 4) + (i % ${t})] = v[i];
        }
    `}t.s(["uniformParsers",0,o],92715),t.s(["compileBufferSync",0,function(t,e,a){let r=[`
        var v = null;
        var v2 = null;
        var t = 0;
        var index = 0;
        var name = null;
        var arrayOffset = null;
    `],s=0;for(let i=0;i<t.length;i++){let f=t[i],n=f.data.name,u=!1,v=0;for(let t=0;t<o.length;t++)if(o[t].test(f.data)){v=f.offset/4,r.push(`name = "${n}";`,`offset += ${v-s};`,o[t].ubo),u=!0;break}if(!u)if(f.data.size>1)v=f.offset/4,r.push(a(f,v-s));else{let t=e[f.data.type];v=f.offset/4,r.push(`
                    v = uv.${n};
                    offset += ${v-s};
                    ${t};
                `)}s=v}return Function("uv","data","dataInt32","offset",r.join("\n"))}],62039);let i={f32:`
        data[offset] = v;`,i32:`
        dataInt32[offset] = v;`,u32:`
        dataInt32[offset] = v;`,"vec2<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];`,"vec3<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];`,"vec4<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];`,"vec2<i32>":`
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];`,"vec3<i32>":`
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];`,"vec4<i32>":`
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];
        dataInt32[offset + 3] = v[3];`,"vec2<u32>":`
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];`,"vec3<u32>":`
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];`,"vec4<u32>":`
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];
        dataInt32[offset + 3] = v[3];`,"mat2x2<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 4] = v[2];
        data[offset + 5] = v[3];`,"mat3x3<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 4] = v[3];
        data[offset + 5] = v[4];
        data[offset + 6] = v[5];
        data[offset + 8] = v[6];
        data[offset + 9] = v[7];
        data[offset + 10] = v[8];`,"mat4x4<f32>":`
        for (let i = 0; i < 16; i++) {
            data[offset + i] = v[i];
        }`,"mat3x2<f32>":s(3,2),"mat4x2<f32>":s(4,2),"mat2x3<f32>":s(2,3),"mat4x3<f32>":s(4,3),"mat2x4<f32>":s(2,4),"mat3x4<f32>":s(3,4)},f={...i,"mat2x2<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];
    `};t.s(["uboSyncFunctionsSTD40",0,i,"uboSyncFunctionsWGSL",0,f],33156);var n=t.i(95932),u=t.i(24314);class v extends n.default{constructor({buffer:t,offset:e,size:a}){super(),this.uid=(0,u.uid)("buffer"),this._resourceType="bufferResource",this._touched=0,this._resourceId=(0,u.uid)("resource"),this._bufferResource=!0,this.destroyed=!1,this.buffer=t,this.offset=0|e,this.size=a,this.buffer.on("change",this.onBufferChange,this)}get _gcLastUsed(){return this.buffer?._gcLastUsed??-1}set _gcLastUsed(t){this.buffer&&(this.buffer._gcLastUsed=t)}onBufferChange(){this._resourceId=(0,u.uid)("resource"),this.emit("change",this)}destroy(t=!1){this.destroyed=!0,t&&this.buffer.destroy(),this.emit("change",this),this.buffer=null,this.removeAllListeners()}}t.s(["BufferResource",0,v],87784)},81735,t=>{"use strict";var e=t.i(27402),a=t.i(61411),r=t.i(48446);let o=new class{constructor(t){this._canvasPool=Object.create(null),this.canvasOptions=t||{},this.enableFullScreen=!1}_createCanvasAndContext(t,a){let r=e.DOMAdapter.get().createCanvas();r.width=t,r.height=a;let o=r.getContext("2d");return{canvas:r,context:o}}getOptimalCanvasAndContext(t,e,r=1){t=Math.ceil(t*r-1e-6),e=Math.ceil(e*r-1e-6),t=(0,a.nextPow2)(t),e=(0,a.nextPow2)(e);let o=(t<<17)+(e<<1);this._canvasPool[o]||(this._canvasPool[o]=[]);let s=this._canvasPool[o].pop();return s||(s=this._createCanvasAndContext(t,e)),s}returnCanvasAndContext(t){let{width:e,height:a}=t.canvas,r=(e<<17)+(a<<1);t.context.resetTransform(),t.context.clearRect(0,0,e,a),this._canvasPool[r].push(t)}clear(){this._canvasPool={}}};r.GlobalResourceRegistry.register(o),t.s(["CanvasPool",0,o])}]);