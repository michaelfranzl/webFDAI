#version 300 es

// Algorithm from PointLightedSphere_perFragment.js (c) 2012 matsuda and kanda
// See https://sites.google.com/site/webglbook/home/downloads
//
// Adapted by Michael Franzl:
// 2022-02-13: Conversion to GLSL 300 es

precision lowp float;

uniform mat4 u_MvpMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;

in vec4 a_Position;
in vec2 a_TexCoord;

out vec3 v_Normal;
out vec3 v_Position;
out vec2 v_TexCoord;

void main() {
  gl_Position = u_MvpMatrix * a_Position;
  v_Position = vec3(u_ModelMatrix * a_Position);
  v_Normal = normalize(vec3(u_NormalMatrix * a_Position));
  v_TexCoord = a_TexCoord;
}
