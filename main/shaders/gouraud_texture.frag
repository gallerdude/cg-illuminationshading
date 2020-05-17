#version 300 es

precision mediump float;

in vec3 ambient;
in vec3 diffuse;
in vec3 specular;
in vec2 frag_texcoord;

uniform vec3 material_color;    // Ka and Kd
uniform vec3 material_specular; // Ks
uniform sampler2D image;        // use in conjunction with Ka and Kd

out vec4 FragColor;

void main() {
    vec3 a = material_color * ambient;
    vec3 d = material_color * diffuse;
    vec3 s = material_specular * specular;

    FragColor = vec4(a+d+s, 1.0) * texture(image, frag_texcoord);
}
