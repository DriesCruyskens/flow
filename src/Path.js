import * as paper from 'paper';

export default class Path {
    constructor(paper, o) {
        this.paper = paper
        this.path = new paper.Path()
        this.path.add(o)
        this.o = o
        //new paper.Shape.Circle(o, 1) // debug
        this.lastVertex = this.o
    }

    move(v) {
        this.path.add(v)
        this.lastVertex.set(v)
    }
}