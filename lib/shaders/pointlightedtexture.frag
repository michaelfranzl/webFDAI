#version 300 es

// Algorithm from PointLightedSphere_perFragment.js (c) 2012 matsuda and kanda
// See https://sites.google.com/site/webglbook/home/downloads
//
// Adapted by Michael Franzl
// 2022-02-13: Conversion to GLSL 300 es

precision lowp float;

uniform vec3 u_LightColor;
uniform vec3 u_LightPosition;
uniform vec3 u_AmbientLight;
uniform sampler2D u_tex;

in vec3 v_Normal;
in vec3 v_Position;
in vec2 v_TexCoord;

out vec4 fragColor;

void main() {
  vec4 color = texture(u_tex, v_TexCoord);
  vec3 normal = normalize(v_Normal);
  vec3 lightDirection = normalize(u_LightPosition - v_Position);
  float nDotL = max(dot(lightDirection, normal), 0.0);
  vec3 diffuse = u_LightColor * color.rgb * nDotL;
  vec3 ambient = u_AmbientLight * color.rgb;
  fragColor = vec4(diffuse + ambient, color.a);
}
