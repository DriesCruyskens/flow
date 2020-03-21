import * as PVector from 'pvectorjs';

export default class Path {
    constructor(paper, origin, scale) {
        this.scale = scale
        this.paper = paper
        this.path = new paper.Path()
        this.path.add(origin)
        this.origin = origin
        //new paper.Shape.Circle(o, 1) // debug
        this.lastVertex = this.origin
    }

    move(scale, seed, step_size) {
        
        let dir, v
        dir = Path.noise3D(this.lastVertex.x / scale, this.lastVertex.y / scale, seed)
        dir = dir.map(Path.map_min1, Path.map_max1, Path.map_min2, Path.map_max2)
        dir = PVector.fromAngle(dir)
        dir.mult(step_size)
        v = this.lastVertex.clone().add([dir.x, dir.y])

        this.path.add(v)
        this.lastVertex.set(v)
    }
}