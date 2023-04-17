(function(Scratch) {
    'use strict';
    if (!Scratch.extensions.unsandboxed) {
      throw new Error('This Hello World example must run unsandboxed');
    }
    const vm = Scratch.vm;
    const renderer = vm.renderer;
    const gl = renderer._gl;
    const canvas = renderer.canvas;

    var vertexShaderCode = `
      attribute vec4 a_position;
      attribute vec2 a_texcoord;

      varying vec2 v_texcoord;
      varying vec4 vColor;
      
      void main() {
      	gl_Position = vec4(a_position.x, a_position.y, a_position.z, 1);
      v_texcoord = a_texcoord;
      vColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `
  
    var aaa = 
    `
      precision mediump float;
      
      varying vec2 v_texcoord;
      varying vec4 vColor;      
      uniform sampler2D u_texture;
      uniform float _Time;
      uniform vec2 _BlockSize;
      uniform float _Amplitude;
      uniform vec2 direction_r ;
      uniform vec2 direction_g ;
      uniform vec2 direction_b ;
      float randomNoise(vec2 seed)
      {
          return fract(sin(dot(seed *_Time , vec2(17.13, 3.71))) * 43758.5453123);
      }
      void main() {

        float ColorR = texture2D(u_texture,v_texcoord + normalize( direction_r )*0.01).r ;
        float ColorG = texture2D(u_texture,v_texcoord + normalize( direction_g )*0.01).g;
        float ColorB = texture2D(u_texture,v_texcoord + normalize( direction_b )*0.01).b;
        gl_FragColor=vec4(ColorR,ColorG,ColorB,1.0);

      }
    `
    var fragmentShaderCode = 
    `
      precision mediump float;
      
      varying vec2 v_texcoord;
      varying vec4 vColor;      
      uniform sampler2D u_texture;
      uniform float _Time;
      uniform vec2 _BlockSize;
      uniform float _Amplitude;
      float randomNoise(vec2 seed)
      {
          return fract(sin(dot(seed *_Time , vec2(17.13, 3.71))) * 43758.5453123);
      }
      void main() {
        float block = randomNoise(floor(v_texcoord * _BlockSize));
        float displaceNoise = pow(block, 8.0) * pow(block, 3.0);
        float ColorR = texture2D(u_texture,v_texcoord).r;
        float ColorG = texture2D(u_texture,v_texcoord + vec2(displaceNoise * _Amplitude * randomNoise(vec2(7)),0.0)).g;
        float ColorB = texture2D(u_texture,v_texcoord - vec2(displaceNoise * _Amplitude * randomNoise(vec2(13)),0.0)).b;
        gl_FragColor=vec4(ColorR,ColorG,ColorB,1.0);

      }
    `
  
    var quadPositions = [
      -1, -1,
      -1, 1,
      1, -1,
      1, -1,
      -1, 1,
      1, 1,
    ];
  
    var quadCoords = [
      0, 0,
      0, 1,
      1, 0,
      1, 0,
      0, 1,
      1, 1,
    ];
  

  

    /**
     * Draw all current drawables and present the frame on the canvas.
     */
    const createshader = function(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
          return shader;
        }
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
      }
      const createProgram = function(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
          return program;
        }
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
      }
      var drawframebuffer = null
      var drawtex = null
      var drawprogram = createProgram(gl,createshader(gl,gl.VERTEX_SHADER,vertexShaderCode),createshader(gl,gl.FRAGMENT_SHADER,fragmentShaderCode))
      const positionLocation = gl.getAttribLocation(drawprogram, 'a_position');
      const texcoordLocation = gl.getAttribLocation(drawprogram, 'a_texcoord');
      const textureLocation = gl.getUniformLocation(drawprogram, 'u_texture');
      const BlockSizeLocation = gl.getUniformLocation(drawprogram, '_BlockSize');
      const AmplitudeLocation = gl.getUniformLocation(drawprogram, '_Amplitude');
      const TimeLocation = gl.getUniformLocation(drawprogram, '_Time');
      const direction_rLocation = gl.getUniformLocation(drawprogram, 'direction_r');
      const direction_gLocation = gl.getUniformLocation(drawprogram, 'direction_g');
      const direction_bLocation = gl.getUniformLocation(drawprogram, 'direction_b');
    // lookup uniforms
    /*
    const matrixLocation = gl.getUniformLocation(drawprogram, 'u_matrix');
    const projectionLocation = gl.getUniformLocation(drawprogram, 'u_projectionMatrix');
    */

    var quadPositionBuffer 
  

  
    var quadTexCoordBuffer



    const bindFramebufferInfo = function(gl, framebufferInfo, target) {
        target = target || gl.FRAMEBUFFER;
        gl.bindFramebuffer(target, framebufferInfo ? framebufferInfo.framebuffer : null);
      }
    const createFramebuffer =function(gl, attachments, width, height, target) {
        target = target || gl.FRAMEBUFFER;
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(target, framebuffer);
        attachments.forEach(function(attachment) {
          gl.framebufferTexture2D(
              target, attachment.attachment, attachment.texTarget, attachment.texture, attachment.level);
        });
        const status = gl.checkFramebufferStatus(target);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          return null;
        }
        return {
          framebuffer: framebuffer,
          attachments: attachments,
          width: width,
          height: height,
        };
      }
    const draw = (function(){
          if (!this.dirty) {
              return;
          }
          this.dirty = false;
          if(drawtex==null){
            drawtex= gl.createTexture() 
            gl.bindTexture(gl.TEXTURE_2D, drawtex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);

            
          }
          if(quadTexCoordBuffer==null){
            quadTexCoordBuffer=gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, quadTexCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadCoords), gl.STATIC_DRAW);
          }
          if(quadPositionBuffer==null){
              quadPositionBuffer = gl.createBuffer();
              gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadPositions), gl.STATIC_DRAW);
          }
          if(drawframebuffer==null)
          {
            drawframebuffer = createFramebuffer(gl, 
              [
                {
                  attachment:gl.COLOR_ATTACHMENT0,
                  texTarget:gl.TEXTURE_2D,
                  texture:drawtex,
                  level:0
                }
              ],
            canvas.width,
            canvas.height
            )
            
          }
          bindFramebufferInfo(gl, drawframebuffer); //modified
          this._doExitDrawRegion();
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
          gl.clearColor(...this._backgroundColor4f);
          gl.clear(gl.COLOR_BUFFER_BIT);
          this._drawThese(this._drawList, 'default', this._projection, {
              framebufferWidth: gl.canvas.width,
              framebufferHeight: gl.canvas.height
          });
          if (this._snapshotCallbacks.length > 0) {
              const snapshot = gl.canvas.toDataURL();
              this._snapshotCallbacks.forEach(cb => cb(snapshot));
              this._snapshotCallbacks = [];
          }
          bindFramebufferInfo(gl, null); //modified
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
          gl.clearColor(...this._backgroundColor4f);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.bindTexture(gl.TEXTURE_2D, drawtex);

          gl.useProgram(drawprogram);

          gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
          gl.enableVertexAttribArray(positionLocation);
          gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, quadTexCoordBuffer);
          gl.enableVertexAttribArray(texcoordLocation);
          gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

          // Tell the shader to get the texture from texture unit 0
          gl.uniform1i(textureLocation, drawtex);
          gl.uniform2fv(BlockSizeLocation, [8, 8]);
          gl.uniform2fv(direction_rLocation, [1.0, 0.0]);
          gl.uniform2fv(direction_gLocation, [0.4, 1.0 ]);
          gl.uniform2fv(direction_bLocation, [ -0.7, -0.3]);
          // draw the quad (2 triangles, 6 vertices)
          gl.drawArrays(gl.TRIANGLES, 0, 6);

      }).bind(renderer);

    renderer.draw=draw;
    class HelloWorld {
      getInfo() {
        return {
          id: 'effect',
          name: 'Effect',
          blocks: [
            {
              opcode: 'hello',
              text: 'uniform1f [X] [Y]',
              blockType: Scratch.BlockType.COMMAND,
              arguments: {
                X: {
                    type: Scratch.ArgumentType.NUMBER,
                    defaultValue: 0.1
                },
                Y: {
                  type: Scratch.ArgumentType.NUMBER,
                  defaultValue: 0
              }
            },
            }
          ]
        };
      }
      hello({X,Y}) {
        gl.uniform1f(AmplitudeLocation, X);
        gl.uniform1f(TimeLocation, Y);

      }
    }
    Scratch.extensions.register(new HelloWorld());
  })(Scratch);
  