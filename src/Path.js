import * as PVector from 'pvectorjs';

export default class Path {
    constructor(paper, origin) {
        this.paper = paper
        this.path = new paper.Path()
        this.path.add(origin)
        this.origin = origin
        //new paper.Shape.Circle(o, 1) // debug
        this.lastVertex = this.origin
    }

    move(seed, stepSize, scale1, scale2, scale3, fbm1_amp, fbm2_amp, fbm3_amp) {
        
        let dir, v, fbm3, fbm2
        // the direction of the new vertex depends on the noise value of the previous one
        
        fbm3 = Path.noise3D(this.lastVertex.x / scale3, this.lastVertex.y / scale3, fbm3_amp)
        fbm2 = Path.noise3D(this.lastVertex.x / scale2, this.lastVertex.y / scale2, fbm3*fbm2_amp)

        dir = Path.noise3D(this.lastVertex.x / scale1, this.lastVertex.y / scale1, fbm2*fbm1_amp + seed)
        dir = dir.map(Path.mapMin1, Path.mapMax1, Path.mapMin2, Path.mapMax2)
        dir = PVector.fromAngle(dir)
        dir.mult(stepSize)
        v = this.lastVertex.clone().add([dir.x, dir.y])

        this.path.add(v)
        this.lastVertex.set(v)
    }
}