#version 300 es

precision highp float;

in vec3 vertex_position;
in vec3 vertex_normal;

uniform vec3 light_ambient;
uniform vec3 light_position;
uniform vec3 light_color;
uniform vec3 camera_position;

uniform float material_shininess; // n

uniform mat4 model_matrix;
uniform mat4 view_matrix;
uniform mat4 projection_matrix;

out vec3 ambient;
out vec3 diffuse;
out vec3 specular;

void main() {
    gl_Position = projection_matrix * view_matrix * model_matrix * vec4(vertex_position, 1.0);
    
    vec3 world_space = vec3(model_matrix * vec4(vertex_position, 1.0));
    vec3 light_direction = normalize(light_position - world_space);
    vec3 reflected_light_direction = vec3(2.0, 2.0, 2.0) * (normalize(vertex_normal) * light_direction) * (normalize(vertex_normal) - light_direction);
    
    ambient = light_ambient; 
    diffuse = light_color * max(dot(normalize(vertex_normal), light_direction), 0.0);
    specular = light_color * pow(max(dot(normalize(camera_position - world_space), normalize(reflected_light_direction)), 0.0), material_shininess);

    ambient = clamp(ambient, 0.0, 1.0);
    diffuse = clamp(diffuse, 0.0, 1.0);
    specular = clamp(specular, 0.0, 1.0);
}