// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2020 Michael Karl Franzl <public.michael@franzl.name> */

import { Matrix4 } from './lib/cuon-matrix.js';

class WebFDAI extends HTMLElement {
  constructor() {
    super();

    this.roll = 0;
    this.yaw = 0;
    this.pitch = 0;

    this.rollRate = 0;
    this.yawRate = 0;
    this.pitchRate = 0;

    this.rollError = 0;
    this.yawError = 0;
    this.pitchError = 0;
  }

  connectedCallback() {
    const root = this.attachShadow({ mode: 'open' });

    const styleElement = document.createElement('link');
    const styleHref = new URL('./assets/style.css', import.meta.url).href;
    styleElement.setAttribute('rel', 'stylesheet');
    styleElement.setAttribute('href', styleHref);
    root.appendChild(styleElement);

    this.canvas = document.createElement('canvas');
    this.canvas.width = 380;
    this.canvas.height = 380;
    this.canvas.id = 'webgl';

    const gl = this.canvas.getContext('webgl2');
    if (!gl) throw new Error('Failed to get the rendering context for WebGL');
    this.gl = gl;
    root.appendChild(this.canvas);

    this.layers = [];
    for (let i = 0; i < 10; i++) {
      const layer = document.createElement('div');
      layer.className = 'layer';
      layer.id = `layer${i}`;
      this.layers[i] = layer;
      root.appendChild(layer);
    }

    WebFDAI.loadAssets()
      .then(([vertexShader, fragmentShader, eightballTexture]) => {
        const program = createProgram(gl, vertexShader, fragmentShader);
        if (!program) throw new Error('Failed to intialize shaders.');
        gl.useProgram(program);
        gl.program = program;

        this.uniforms = {
          modelMatrix: gl.getUniformLocation(gl.program, 'u_ModelMatrix'),
          mvpMatrix: gl.getUniformLocation(gl.program, 'u_MvpMatrix'),
          normalMatrix: gl.getUniformLocation(gl.program, 'u_NormalMatrix'),
          lightColor: gl.getUniformLocation(gl.program, 'u_LightColor'),
          lightPosition: gl.getUniformLocation(gl.program, 'u_LightPosition'),
          ambientLight: gl.getUniformLocation(gl.program, 'u_AmbientLight'),
          sampler: gl.getUniformLocation(gl.program, 'u_Sampler'),
        };

        gl.uniform3f(this.uniforms.lightColor, 1.1, 1.1, 1.1);
        gl.uniform3f(this.uniforms.lightPosition, 0.5, -0.5, 2.1);
        gl.uniform3f(this.uniforms.ambientLight, 0.2, 0.2, 0.2);

        const texture = WebFDAI.initTexture(gl, eightballTexture);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.uniforms.sampler, 0);

        this.numVertices = WebFDAI.createSphere(gl);
        this.vpMatrix = (new Matrix4())
          .setPerspective(20, this.canvas.width / this.canvas.height, 1, 10)
          .lookAt(0, 0, 9.5, 0, 0, 0, 0, 1, 0);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.enable(gl.DEPTH_TEST);

        this.render();
        this.dispatchEvent(new Event('ready'));
      });
  }

  render() {
    this.layers[1].style.rotate = `${this.roll / 2 / Math.PI * 360}deg`;

    this.layers[2].style['margin-left'] = `${this.rollError * 45}px`;
    this.layers[3].style['margin-top'] = `${-this.pitchError * 45}px`;
    this.layers[4].style['margin-left'] = `${this.yawError * 45}px`;

    this.layers[6].style['margin-left'] = `${this.rollRate * 60}px`;
    this.layers[7].style['margin-top'] = `${-this.pitchRate * 60}px`;
    this.layers[8].style['margin-left'] = `${this.yawRate * 60}px`;

    const modelMatrix = (new Matrix4())
      .rotate(this.roll / 2 / Math.PI * 360,   0, 0, 1)
      .rotate(this.yaw / 2 / Math.PI * 360,    0, 1, 0)
      .rotate(this.pitch / 2 / Math.PI * 360,  1, 0, 0);

    const mvpMatrix = (new Matrix4(this.vpMatrix))
      .multiply(modelMatrix);

    const normalMatrix = (new Matrix4())
      .setInverseOf(modelMatrix)
      .transpose();

    const { gl } = this;
    this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix.elements);
    this.gl.uniformMatrix4fv(this.uniforms.mvpMatrix, false, mvpMatrix.elements);
    this.gl.uniformMatrix4fv(this.uniforms.normalMatrix, false, normalMatrix.elements);
    this.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.gl.drawElements(gl.TRIANGLES, this.numVertices, gl.UNSIGNED_SHORT, 0);
  }

  static loadAssets() {
    return Promise.all([
      fetch(new URL('./lib/shaders/pointlightedtexture.vert', import.meta.url))
        .then((response) => response.text()),

      fetch(new URL('./lib/shaders/pointlightedtexture.frag', import.meta.url))
        .then((response) => response.text()),

      new Promise((resolve) => {
        const texture = new Image();
        texture.onload = () => resolve(texture);
        texture.src = new URL('./assets/eightball_texture.png', import.meta.url);
      }),
    ]);
  }

  /*
   * Algorithm from PointLightedSphere_perFragment.js
   * See https://sites.google.com/site/webglbook/home/downloads
   * Adapted by Michael Franzl
   */
  static createSphere(gl) {
    const divisions = 24;

    let i; let ai; let si; let ci;
    let j; let aj; let sj; let cj;
    let p1; let p2;

    const positions = [];
    const texcoords = [];
    const indices = [];

    for (j = 0; j <= divisions; j++) {
      aj = j * Math.PI / divisions;
      sj = Math.sin(aj);
      cj = Math.cos(aj);
      for (i = 0; i <= divisions; i++) {
        ai = i * 2 * Math.PI / divisions;
        si = Math.sin(ai);
        ci = Math.cos(ai);

        positions.push(si * sj);  // X
        positions.push(cj);       // Y
        positions.push(ci * sj);  // Z

        texcoords.push(i / divisions);  // S
        texcoords.push(j / divisions);  // T
      }
    }

    for (j = 0; j < divisions; j++) {
      for (i = 0; i < divisions; i++) {
        p1 = j * (divisions + 1) + i;
        p2 = p1 + (divisions + 1);

        indices.push(p1);
        indices.push(p2);
        indices.push(p1 + 1);

        indices.push(p1 + 1);
        indices.push(p2);
        indices.push(p2 + 1);
      }
    }

    WebFDAI.initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3);
    WebFDAI.initArrayBuffer(gl, 'a_TexCoord', new Float32Array(texcoords), gl.FLOAT, 2);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const indexBuffer = gl.createBuffer();
    if (!indexBuffer) throw new Error('Failed to create the buffer object');

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return indices.length;
  }

  static initArrayBuffer(gl, attributeName, data, type, num) {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Failed to create the buffer object');

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const location = gl.getAttribLocation(gl.program, attributeName);
    if (location < 0) throw new Error(`Failed to get the storage location of ${attributeName}`);

    gl.vertexAttribPointer(location, num, type, false, 0, 0);
    gl.enableVertexAttribArray(location);
  }

  static initTexture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }
}

customElements.define('web-fdai', WebFDAI);

function createProgram(gl, vShaderSource, fShaderSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vShaderSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fShaderSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    throw new Error(`Failed to link program: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error(`Failed to compile shader: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}
