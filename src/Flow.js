import * as dat from 'dat-gui';
import { makeNoise3D } from "open-simplex-noise";
import * as paper from 'paper';
import { saveAs } from 'file-saver';
import * as _ from 'lodash';
import Path from './Path.js'
import * as PVector from 'pvectorjs';

export default class Flow {

    constructor(canvas_id) {
        this.params = {
            r: 200,
            n_paths: 2000,
            n_steps: 60,
            step_size: 10,
            stroke_width: 1,
            scale: 100,
            seed: 1000,
            allow_intersect: true,
        }

        Number.prototype.map = function (in_min, in_max, out_min, out_max) {
            return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        }

        Number.prototype.clamp = function(min, max) {
            return Math.min(Math.max(this, min), max);
          };

        this.gui = new dat.GUI();
        this.canvas = document.getElementById(canvas_id);
        paper.setup(this.canvas);
        this.noise3D = makeNoise3D(Date.now());

        this.center = paper.view.center;

        this.init_gui();
        this.reset();
    }

    randomize() {
        this.noise3D = makeNoise3D(Date.now());
        this.reset()
    }

    reset() {
        paper.project.currentStyle = {
            strokeColor: '#00000055',
            strokeWidth: this.params.stroke_width,
            strokeCap: 'round',
            //fillColor: '#0000FF01'
        };
        paper.project.clear();

        this.draw();
    }

    random(min, max) {
        let r = Math.random()
        return r.map(0, 1, min, max)
    }

    draw() {

        // init
        this.paths = []
        for (let i = 0; i < this.params.n_paths; i++) {
            // init
            let o = new paper.Point(this.random(-this.params.r, this.params.r),
            this.random(-this.params.r, this.params.r))
            while (o.getDistance([0, 0]) > this.params.r) {
                o = new paper.Point(this.random(-this.params.r, this.params.r),
                this.random(-this.params.r, this.params.r))
            }
            let p1 = new Path(paper, this.center.clone().add(o))

            // move
            let dir, v
            for (let i = 0; i < this.params.n_steps; i++) {
                dir = this.noise3D(p1.lastVertex.x / this.params.scale, p1.lastVertex.y / this.params.scale, this.params.seed)
                dir = dir.map(-1, 1, 0, 2*Math.PI)
                dir = PVector.fromAngle(dir)
                dir.mult(this.params.step_size)
                v = p1.lastVertex.clone().add([dir.x, dir.y])

                if(!this.params.allow_intersect && this.paths.some(p => {
                    return p.path.intersects(p1.path)
                })) {
                    break
                }

                p1.move(v)
            }

            p1.path.smooth()
            this.paths.push(p1)
        }

        /* // add neighboring points
        let other, d1, d2
        this.paths.forEach((p, i) => {
            other = [...this.paths]
            other.splice(i, 1)
            other = other.sort((p1, p2) => {
                d1 = p.o.getDistance(p1.o)
                d2 = p.o.getDistance(p2.o)
                return d1 < d2 ? -1 : 1
            })
            p.neighbors = [...other.slice(0, this.params.n_neighbors)]
        })

        console.log(this.paths) */

        // move
        /* let x, y, dir, v
        for (let i = 0; i < this.params.n_steps; i++) {
            this.paths.forEach((p1, i1) => {
                if (!p1.neighbors.some(p2 => {
                    return p2 == p1 ? false : p2.path.intersects(p1.path) // most inefficient thing ever
                })) {
                    dir = this.noise3D(p1.lastVertex.x / this.params.scale, p1.lastVertex.y / this.params.scale, 0)
                    dir = dir.map(-1, 1, 0, 2*Math.PI)
                    dir = PVector.fromAngle(dir)
                    v = p1.lastVertex.clone().add([dir.x, dir.y])
                    p1.move(v)
                } else {
                    this.paths.splice(i1, 1)
                }
                
            })
        } */
        
        paper.view.draw();
    }

    init_gui() {
        /* this.gui.add(this.params, 'draw_original_path').onChange((value) => {
            this.path.visible = value
            paper.view.draw()
        }); */

        this.gui.add(this, 'randomize').name('Randomize');

        let flow = this.gui.addFolder('flow');

        flow.add(this.params, 'n_paths', 0, 3000).step(1).onFinishChange((value) => {
            this.params.n_paths = value
            this.reset()
        });

        flow.add(this.params, 'n_steps', 0, 300).step(1).onFinishChange((value) => {
            this.params.n_steps = value
            this.reset()
        });

        flow.add(this.params, 'step_size', 1, 50).onFinishChange((value) => {
            this.params.step_size = value
            this.reset()
        });

        flow.add(this.params, 'stroke_width', 1, 3).onFinishChange((value) => {
            this.params.stroke_width = value
            this.reset()
        });

        flow.add(this.params, 'scale', 1, 1000).onFinishChange((value) => {
            this.params.scale = value
            this.reset()
        });

        flow.open()

        this.gui.add(this.params, 'seed', 0, 2000).onFinishChange((value) => {
            this.params.seed = value
            this.reset()
        });

        /* this.gui.add(this.params, 'allow_intersect').name("allow_intersect (!)").onChange((value) => {
            this.params.allow_intersect = value
            this.reset()
        }); */

        this.gui.add(this, 'exportSVG').name('Export SVG');
        this.gui.add(this, 'exportSVG_no_overlap').name('SVG no overlap (slow)');
    }

    exportSVG_no_overlap() {
        this.params.allow_intersect = false;
        this.reset()

        var svg = paper.project.exportSVG({asString: true});
        var blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
        saveAs(blob, 'Flow' + JSON.stringify(this.params) + '.svg');

        this.params.allow_intersect = true;
    }

    exportSVG() {
        var svg = paper.project.exportSVG({asString: true});
        var blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
        saveAs(blob, 'Flow' + JSON.stringify(this.params) + '.svg');
    }
}