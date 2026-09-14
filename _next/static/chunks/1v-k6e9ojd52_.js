(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,54126,e=>{"use strict";var t=e.i(81107),a=e.i(27076),r=e.i(65654),o=e.i(22558);let f=class e extends r.Shader{constructor(t){super(t={...e.defaultOptions,...t}),this.enabled=!0,this._state=o.State.for2d(),this.blendMode=t.blendMode,this.padding=t.padding,"boolean"==typeof t.antialias?this.antialias=t.antialias?"on":"off":this.antialias=t.antialias,this.resolution=t.resolution,this.blendRequired=t.blendRequired,this.clipToViewport=t.clipToViewport,this.addResource("uTexture",0,1),t.blendRequired&&this.addResource("uBackTexture",0,3)}apply(e,t,a,r){e.applyFilter(this,t,a,r)}get blendMode(){return this._state.blendMode}set blendMode(e){this._state.blendMode=e}static from(r){let o,f,{gpu:s,gl:i,...n}=r;return s&&(o=a.GpuProgram.from(s)),i&&(f=t.GlProgram.from(i)),new e({gpuProgram:o,glProgram:f,...n})}};f.defaultOptions={blendMode:"normal",resolution:1,padding:0,antialias:"off",blendRequired:!1,clipToViewport:!0},e.s(["Filter",0,f])},35066,90532,e=>{"use strict";let t={name:"local-uniform-bit",vertex:{header:`

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
        `}},a={...t,vertex:{...t.vertex,header:t.vertex.header.replace("group(1)","group(2)")}},r={name:"local-uniform-bit",vertex:{header:`

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
        `}};e.s(["localUniformBit",0,t,"localUniformBitGl",0,r,"localUniformBitGroup2",0,a],35066);let o={name:"texture-bit",vertex:{header:`

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
        `}},f={name:"texture-bit",vertex:{header:`
            uniform mat3 uTextureMatrix;
        `,main:`
            uv = (uTextureMatrix * vec3(uv, 1.0)).xy;
        `},fragment:{header:`
        uniform sampler2D uTexture;


        `,main:`
            outColor = texture(uTexture, vUV);
        `}};e.s(["textureBit",0,o,"textureBitGl",0,f],90532)},35656,39391,e=>{"use strict";var t=e.i(85830),a=e.i(46820);e.s(["ensureAttributes",0,function(e,r){for(let a in e.attributes){let o=e.attributes[a],f=r[a];f?(o.format??(o.format=f.format),o.offset??(o.offset=f.offset),o.instance??(o.instance=f.instance)):(0,t.warn)(`Attribute ${a} is not present in the shader, but is present in the geometry. Unable to infer attribute details.`)}!function(e){let{buffers:t,attributes:r}=e,o={},f={};for(let e in t){let a=t[e];o[a.uid]=0,f[a.uid]=0}for(let e in r){let t=r[e];o[t.buffer.uid]+=(0,a.getAttributeInfoFromFormat)(t.format).stride}for(let e in r){let t=r[e];t.stride??(t.stride=o[t.buffer.uid]),t.start??(t.start=f[t.buffer.uid]),f[t.buffer.uid]+=(0,a.getAttributeInfoFromFormat)(t.format).stride}}(e)}],35656);var r=e.i(96108);let o=[];o[r.STENCIL_MODES.NONE]=void 0,o[r.STENCIL_MODES.DISABLED]={stencilWriteMask:0,stencilReadMask:0},o[r.STENCIL_MODES.RENDERING_MASK_ADD]={stencilFront:{compare:"equal",passOp:"increment-clamp"},stencilBack:{compare:"equal",passOp:"increment-clamp"}},o[r.STENCIL_MODES.RENDERING_MASK_REMOVE]={stencilFront:{compare:"equal",passOp:"decrement-clamp"},stencilBack:{compare:"equal",passOp:"decrement-clamp"}},o[r.STENCIL_MODES.MASK_ACTIVE]={stencilWriteMask:0,stencilFront:{compare:"equal",passOp:"keep"},stencilBack:{compare:"equal",passOp:"keep"}},o[r.STENCIL_MODES.INVERSE_MASK_ACTIVE]={stencilWriteMask:0,stencilFront:{compare:"not-equal",passOp:"keep"},stencilBack:{compare:"not-equal",passOp:"keep"}},e.s(["GpuStencilModesToPixi",0,o],39391)},28353,92715,62039,33156,87784,e=>{"use strict";var t=e.i(55364),a=e.i(85465),r=e.i(64957);e.s(["UboSystem",0,class{constructor(e){this._syncFunctionHash=Object.create(null),this._adaptor=e,this._systemCheck()}_systemCheck(){if(!(0,t.unsafeEvalSupported)())throw Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.")}ensureUniformGroup(e){let t=this.getUniformGroupData(e);e.buffer||(e.buffer=new a.Buffer({data:new Float32Array(t.layout.size/4),usage:r.BufferUsage.UNIFORM|r.BufferUsage.COPY_DST}))}getUniformGroupData(e){return this._syncFunctionHash[e._signature]||this._initUniformGroup(e)}_initUniformGroup(e){let t=e._signature,a=this._syncFunctionHash[t];if(!a){let r=Object.keys(e.uniformStructures).map(t=>e.uniformStructures[t]),o=this._adaptor.createUboElements(r),f=this._generateUboSync(o.uboElements);a=this._syncFunctionHash[t]={layout:o,syncFunction:f}}return this._syncFunctionHash[t]}_generateUboSync(e){return this._adaptor.generateUboSync(e)}syncUniformGroup(e,t,o){let f=this.getUniformGroupData(e);e.buffer||(e.buffer=new a.Buffer({data:new Float32Array(f.layout.size/4),usage:r.BufferUsage.UNIFORM|r.BufferUsage.COPY_DST}));let s=null;return t||(t=e.buffer.data,s=e.buffer.dataInt32),o||(o=0),f.syncFunction(e.uniforms,t,s,o),!0}updateUniformGroup(e){if(e.isStatic&&!e._dirtyId)return!1;e._dirtyId=0;let t=this.syncUniformGroup(e);return e.buffer.update(),t}destroy(){this._syncFunctionHash=null}}],28353);let o=[{type:"mat3x3<f32>",test:e=>void 0!==e.value.a,ubo:`
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
        `},{type:"vec4<f32>",test:e=>"vec4<f32>"===e.type&&1===e.size&&void 0!==e.value.width,ubo:`
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
        `},{type:"vec2<f32>",test:e=>"vec2<f32>"===e.type&&1===e.size&&void 0!==e.value.x,ubo:`
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
        `},{type:"vec4<f32>",test:e=>"vec4<f32>"===e.type&&1===e.size&&void 0!==e.value.red,ubo:`
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
        `},{type:"vec3<f32>",test:e=>"vec3<f32>"===e.type&&1===e.size&&void 0!==e.value.red,ubo:`
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
        `}];function f(e,t){return`
        for (let i = 0; i < ${e*t}; i++) {
            data[offset + (((i / ${e})|0) * 4) + (i % ${e})] = v[i];
        }
    `}e.s(["uniformParsers",0,o],92715),e.s(["compileBufferSync",0,function(e,t,a){let r=[`
        var v = null;
        var v2 = null;
        var t = 0;
        var index = 0;
        var name = null;
        var arrayOffset = null;
    `],f=0;for(let s=0;s<e.length;s++){let i=e[s],n=i.data.name,u=!1,v=0;for(let e=0;e<o.length;e++)if(o[e].test(i.data)){v=i.offset/4,r.push(`name = "${n}";`,`offset += ${v-f};`,o[e].ubo),u=!0;break}if(!u)if(i.data.size>1)v=i.offset/4,r.push(a(i,v-f));else{let e=t[i.data.type];v=i.offset/4,r.push(`
                    v = uv.${n};
                    offset += ${v-f};
                    ${e};
                `)}f=v}return Function("uv","data","dataInt32","offset",r.join("\n"))}],62039);let s={f32:`
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
        }`,"mat3x2<f32>":f(3,2),"mat4x2<f32>":f(4,2),"mat2x3<f32>":f(2,3),"mat4x3<f32>":f(4,3),"mat2x4<f32>":f(2,4),"mat3x4<f32>":f(3,4)},i={...s,"mat2x2<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];
    `};e.s(["uboSyncFunctionsSTD40",0,s,"uboSyncFunctionsWGSL",0,i],33156);var n=e.i(95932),u=e.i(24314);class v extends n.default{constructor({buffer:e,offset:t,size:a}){super(),this.uid=(0,u.uid)("buffer"),this._resourceType="bufferResource",this._touched=0,this._resourceId=(0,u.uid)("resource"),this._bufferResource=!0,this.destroyed=!1,this.buffer=e,this.offset=0|t,this.size=a,this.buffer.on("change",this.onBufferChange,this)}get _gcLastUsed(){return this.buffer?._gcLastUsed??-1}set _gcLastUsed(e){this.buffer&&(this.buffer._gcLastUsed=e)}onBufferChange(){this._resourceId=(0,u.uid)("resource"),this.emit("change",this)}destroy(e=!1){this.destroyed=!0,e&&this.buffer.destroy(),this.emit("change",this),this.buffer=null,this.removeAllListeners()}}e.s(["BufferResource",0,v],87784)}]);