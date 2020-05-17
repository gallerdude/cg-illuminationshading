class GlApp {
    constructor(canvas_id, width, height, scene) {
        this.canvas = document.getElementById(canvas_id);
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            alert('Unable to initialize WebGL 2. Your browser may not support it.');
        }

        this.shader = {                                   
            gouraud_color: null,                          
            gouraud_texture: null,                        
            phong_color: null,
            phong_texture: null
        };

        this.vertex_position_attrib = 0;                  
        this.vertex_normal_attrib = 1;                    
        this.vertex_texcoord_attrib = 2;                  

        this.projection_matrix = glMatrix.mat4.create();  
        this.view_matrix = glMatrix.mat4.create();        
        this.model_matrix = glMatrix.mat4.create();       

        this.vertex_array = {                             
            plane: null,                                  
            cube: null,
            sphere: null
        };

        this.scene = scene;                               
        this.algorithm = 'gouraud';                       


        let gouraud_color_vs = this.GetFile('shaders/gouraud_color.vert');
        let gouraud_color_fs = this.GetFile('shaders/gouraud_color.frag');
        let gouraud_texture_vs = this.GetFile('shaders/gouraud_texture.vert');
        let gouraud_texture_fs = this.GetFile('shaders/gouraud_texture.frag');
        let phong_color_vs = this.GetFile('shaders/phong_color.vert');
        let phong_color_fs = this.GetFile('shaders/phong_color.frag');
        let phong_texture_vs = this.GetFile('shaders/phong_texture.vert');
        let phong_texture_fs = this.GetFile('shaders/phong_texture.frag');
        let emissive_vs = this.GetFile('shaders/emissive.vert');
        let emissive_fs = this.GetFile('shaders/emissive.frag');

        Promise.all([gouraud_color_vs, gouraud_color_fs, gouraud_texture_vs, gouraud_texture_fs,
                     phong_color_vs, phong_color_fs, phong_texture_vs, phong_texture_fs,
                     emissive_vs, emissive_fs])
        .then((shaders) => this.LoadAllShaders(shaders))
        .catch((error) => this.GetFileError(error));
    }

    InitializeGlApp() {
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clearColor(0.8, 0.8, 0.8, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);

        this.vertex_array.plane = CreatePlaneVao(this.gl, this.vertex_position_attrib,
                                      this.vertex_normal_attrib, this.vertex_texcoord_attrib);
        this.vertex_array.cube = CreateCubeVao(this.gl, this.vertex_position_attrib,
                                     this.vertex_normal_attrib, this.vertex_texcoord_attrib);
        this.vertex_array.sphere = CreateSphereVao(this.gl, this.vertex_position_attrib,
                                       this.vertex_normal_attrib, this.vertex_texcoord_attrib);

        let fov = 45.0 * (Math.PI / 180.0);
        let aspect = this.canvas.width / this.canvas.height;
        glMatrix.mat4.perspective(this.projection_matrix, fov, aspect, 0.1, 100.0);

        let cam_pos = this.scene.camera.position;
        let cam_target = glMatrix.vec3.create();
        let cam_up = this.scene.camera.up;
        glMatrix.vec3.add(cam_target, cam_pos, this.scene.camera.direction);
        glMatrix.mat4.lookAt(this.view_matrix, cam_pos, cam_target, cam_up);

        this.Render();
    }

    InitializeTexture(image_url) {
         let texture = this.gl.createTexture();

         let image = new Image();
         image.crossOrigin = 'anonymous';
         image.addEventListener('load', (event) => {
             this.UpdateTexture(texture, image);
         }, false);
         image.src = image_url;
 
         return texture;
    }

    UpdateTexture(texture, image_element) {
    }

    Render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        for (let i = 0; i < this.scene.models.length; i ++) {
            let selected_shader = null;
            if (scene.models[i].shader === 'color' && this.algorithm === 'gouraud') selected_shader = 'gouraud_color';
            else if (scene.models[i].shader === 'color' && this.algorithm === 'phong') selected_shader = 'phong_color';
            else selected_shader = 'gouraud_color';

            this.gl.useProgram(this.shader[selected_shader].program);


            glMatrix.mat4.identity(this.model_matrix);
            glMatrix.mat4.translate(this.model_matrix, this.model_matrix, this.scene.models[i].center);
            glMatrix.mat4.rotateZ(this.model_matrix, this.model_matrix, this.scene.models[i].rotate_z);
            glMatrix.mat4.rotateY(this.model_matrix, this.model_matrix, this.scene.models[i].rotate_y);
            glMatrix.mat4.rotateX(this.model_matrix, this.model_matrix, this.scene.models[i].rotate_x);
            glMatrix.mat4.scale(this.model_matrix, this.model_matrix, this.scene.models[i].size);


            this.gl.uniform3fv(this.shader[selected_shader].uniform.material_color, this.scene.models[i].material.color);
            this.gl.uniformMatrix4fv(this.shader[selected_shader].uniform.projection_matrix, false, this.projection_matrix);
            this.gl.uniformMatrix4fv(this.shader[selected_shader].uniform.view_matrix, false, this.view_matrix);
            this.gl.uniformMatrix4fv(this.shader[selected_shader].uniform.model_matrix, false, this.model_matrix);


            this.gl.uniform3fv(this.shader[selected_shader].uniform.camera_position, this.scene.camera.position);
            this.gl.uniform1f(this.shader[selected_shader].uniform.material_shininess, this.scene.models[i].material.shininess);

            this.gl.uniform3fv(this.shader[selected_shader].uniform.material_specular, this.scene.models[i].material.specular);
            this.gl.uniform1i(this.shader[selected_shader].uniform.num_of_lights, this.scene.light.point_lights.length);

            let light_positions = [];
            let light_colors = [];

            this.scene.light.point_lights.forEach(point_light => {
                for(let i = 0; i < 3; i++) {
                    light_positions.push(point_light.position[i]);
                    light_colors.push(point_light.color[i]);
                }
            });

            this.gl.uniform3fv(this.shader[selected_shader].uniform["light_position[0]"], new Float32Array(light_positions));
            this.gl.uniform3fv(this.shader[selected_shader].uniform["light_color[0]"], new Float32Array(light_colors));

            if(scene.models[i].shader === 'texture') {
              var sampler_uniform = this.gl.getUniformLocation(this.shader[selected_shader].program, "image");
              this.gl.activeTexture(this.gl.TEXTURE0);
              this.gl.bindTexture(this.gl.TEXTURE_2D, scene.models[i].texture.id);
              this.gl.uniform2fv(this.shader[selected_shader].uniform.texture_scale, this.scene.models[i].texture.scale);
              this.gl.uniform1i(sampler_uniform, 0);
            }

            this.gl.bindVertexArray(this.vertex_array[this.scene.models[i].type]);
            this.gl.drawElements(this.gl.TRIANGLES, this.vertex_array[this.scene.models[i].type].face_index_count, this.gl.UNSIGNED_SHORT, 0);
            this.gl.bindVertexArray(null);
        }


        for (let i = 0; i < this.scene.light.point_lights.length; i ++) {
            this.gl.useProgram(this.shader['emissive'].program);

            glMatrix.mat4.identity(this.model_matrix);
            glMatrix.mat4.translate(this.model_matrix, this.model_matrix, this.scene.light.point_lights[i].position);
            glMatrix.mat4.scale(this.model_matrix, this.model_matrix, glMatrix.vec3.fromValues(0.1, 0.1, 0.1));

            this.gl.uniform3fv(this.shader['emissive'].uniform.material_color, this.scene.light.point_lights[i].color);
            this.gl.uniformMatrix4fv(this.shader['emissive'].uniform.projection_matrix, false, this.projection_matrix);
            this.gl.uniformMatrix4fv(this.shader['emissive'].uniform.view_matrix, false, this.view_matrix);
            this.gl.uniformMatrix4fv(this.shader['emissive'].uniform.model_matrix, false, this.model_matrix);

            this.gl.bindVertexArray(this.vertex_array['sphere']);
            this.gl.drawElements(this.gl.TRIANGLES, this.vertex_array['sphere'].face_index_count, this.gl.UNSIGNED_SHORT, 0);
            this.gl.bindVertexArray(null);
        }
    }

    UpdateScene(scene) {
        this.scene = scene;

        let cam_pos = this.scene.camera.position;
        let cam_target = glMatrix.vec3.create();
        let cam_up = this.scene.camera.up;
        glMatrix.vec3.add(cam_target, cam_pos, this.scene.camera.direction);
        glMatrix.mat4.lookAt(this.view_matrix, cam_pos, cam_target, cam_up);

        this.Render();
    }

    SetShadingAlgorithm(algorithm) {
        this.algorithm = algorithm;

        this.Render();
    }

    GetFile(url) {
        return new Promise((resolve, reject) => {
            let req = new XMLHttpRequest();
            req.onreadystatechange = function() {
                if (req.readyState === 4 && req.status === 200) {
                    resolve(req.response);
                }
                else if (req.readyState === 4) {
                    reject({url: req.responseURL, status: req.status});
                }
            };
            req.open('GET', url, true);
            req.send();
        });
    }

    GetFileError(error) {
        console.log('Error:', error);
    }

    LoadAllShaders(shaders) {
        this.LoadShader(shaders[0], shaders[1], 'gouraud_color');
        this.LoadShader(shaders[2], shaders[3], 'gouraud_texture');
        this.LoadShader(shaders[4], shaders[5], 'phong_color');
        this.LoadShader(shaders[6], shaders[7], 'phong_texture');
        this.LoadShader(shaders[8], shaders[9], 'emissive');

        this.InitializeGlApp();
    }

    LoadShader(vert_source, frag_source, program_name, has_texture) {
        let vertex_shader = this.CompileShader(vert_source, this.gl.VERTEX_SHADER);
        let fragment_shader = this.CompileShader(frag_source, this.gl.FRAGMENT_SHADER);

        let program = this.CreateShaderProgram(vertex_shader, fragment_shader);

        this.gl.bindAttribLocation(program, this.vertex_position_attrib, "vertex_position");
        this.gl.bindAttribLocation(program, this.vertex_normal_attrib, "vertex_normal");
        this.gl.bindAttribLocation(program, this.vertex_texcoord_attrib, 'vertex_texcoord');
        this.gl.bindAttribLocation(program, 0, "FragColor");

        this.LinkShaderProgram(program);

        let num_uniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        let uniform = {};
        let i;
        for (i = 0; i < num_uniforms; i++) {
            let info = this.gl.getActiveUniform(program, i);
            uniform[info.name] = this.gl.getUniformLocation(program, info.name);
        }

        this.shader[program_name] = {
            program: program,
            uniform: uniform
        }
    }

    CompileShader(source, type) {
        let shader = this.gl.createShader(type);

        this.gl.shaderSource(shader, source);

        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shader: " + this.gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    CreateShaderProgram(vertex_shader, fragment_shader) {
        let program = this.gl.createProgram();

        this.gl.attachShader(program, vertex_shader);
        this.gl.attachShader(program, fragment_shader);

        return program;
    }

    LinkShaderProgram(program) {
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            alert("An error occurred linking the shader program.");
        }
    }

}