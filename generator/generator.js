var SimplexNoise = require('simplex-noise');
var fs = require('fs');

simplex = new SimplexNoise(Math.random);
var world = {
    camera: {
        position: [20, 5, 10],
        direction: [-.9, 0, -.5],
        up: [0, 1, 0]
    },
    models: null,
    light:{
        ambient: [0.15, 0.15, 0.15],
        point_lights: [
            {
                position: [20, 5, 10],
                color: [1.0, 1.0, 1.0]
            },
            {
                position: [5, 5, 7],
                color: [1.0, 1.0, 1.0]
            }
        ]
    }
}
var blocks = []

for (let x = 0; x < 6; x = x + .1)
{
    for (let z = 0; z < 6; z = z + .1)
    {
        let y = Math.abs(Math.round(simplex.noise2D(x, z) * 5))
        for (let i = 0; i < y+1; i++)
        {
            let height = y - i;
            let col = null;

            if (height < 2) {
                col = [.2, .2, .2]
            } else if (height < 3) {
                col = [.5, .2, .2]
            } else {
                col = [.1, .8, .05]
            }
            
            let block = {
                type: 'cube',
                shader: 'color',
                material: {
                    color: col,
                    specular: [1.0, 1.0, 1.0],
                    shininess: 16,
                },
                center: [x * 10, height, z * 10],
                size: [1, 1, 1],
            }

            blocks.push(block)
        }
    }
}

world.models = blocks;

fs.writeFileSync("world2.json", JSON.stringify(world, null, '\t'));
//console.log(world)