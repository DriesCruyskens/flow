import * as PVector from 'pvectorjs';

export default class Path {
    constructor(paper, o, scale) {
        this.scale = scale
        this.paper = paper
        this.path = new paper.Path()
        this.path.add(o)
        this.o = o
        //new paper.Shape.Circle(o, 1) // debug
        this.lastVertex = this.o
    }

    move(scale, seed, step_size) {
        
        let dir, v
        dir = Path.noise3D(this.lastVertex.x / scale, this.lastVertex.y / scale, seed)
        dir = dir.map(-1, 1, 0, 2*Math.PI)
        dir = PVector.fromAngle(dir)
        dir.mult(step_size)
        v = this.lastVertex.clone().add([dir.x, dir.y])

        this.path.add(v)
        this.lastVertex.set(v)
    }
}