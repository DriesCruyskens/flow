import * as dat from 'dat-gui';
import { makeNoise3D } from "open-simplex-noise";
import * as paper from 'paper';
import { saveAs } from 'file-saver';
import * as _ from 'lodash';
import Path from './Path.js'


export default class Flow {

    constructor(canvas_id) {
        this.params = {
            r: 200,
            n_paths: 2000,
            n_steps: 106,
            step_size: 5,
            stroke_width: 1,
            scale: 100,
            seed: 1000,
            allow_intersect: true,
            map_min1: -1,
            map_max1: 1,
            map_min2: 0,
            map_max2: 2*Math.PI,
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
        // make the noise available as a static variable 
        Path.noise3D = this.noise3D
        Path.map_min1 = this.params.map_min1
        Path.map_max1 = this.params.map_max1
        Path.map_min2 = this.params.map_min2
        Path.map_max2 = this.params.map_max2

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

        // initialize n_paths and move them n_steps (one at a time)
        // stop drawing path is intersection is detected and not allowed
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
            for (let i = 0; i < this.params.n_steps; i++) {
                p1.move(this.params.scale, this.params.seed, this.params.step_size)
                if(!this.params.allow_intersect && this.paths.some(p => {
                    return p.path.hitTest(p1.lastVertex)
                    //return p.path.intersects(p1.path) // still too much overlap, hittest is better
                })) {
                    break
                }
            }
            p1.path.smooth()
            this.paths.push(p1)
        }
        
        paper.view.draw();
    }

    init_gui() {
        this.gui.add(this, 'randomize').name('Randomize');

        let map = this.gui.addFolder('map');

        map.add(this.params, 'map_min1',-1, 1).onFinishChange((value) => {
            this.params.map_min1 = value
            Path.map_min1 = this.params.map_min1
            Path.map_max1 = this.params.map_max1
            Path.map_min2 = this.params.map_min2
            Path.map_max2 = this.params.map_max2
            this.reset()
        });

        map.add(this.params, 'map_max1',-1, 1).onFinishChange((value) => {
            this.params.map_max1 = value
            Path.map_min1 = this.params.map_min1
            Path.map_max1 = this.params.map_max1
            Path.map_min2 = this.params.map_min2
            Path.map_max2 = this.params.map_max2
            this.reset()
        });

        map.add(this.params, 'map_min2', -2*Math.PI, 2*Math.PI).onFinishChange((value) => {
            this.params.map_min2 = value
            Path.map_min1 = this.params.map_min1
            Path.map_max1 = this.params.map_max1
            Path.map_min2 = this.params.map_min2
            Path.map_max2 = this.params.map_max2
            this.reset()
        });

        map.add(this.params, 'map_max2', -2*Math.PI, 2*Math.PI).onFinishChange((value) => {
            this.params.map_max2 = value
            Path.map_min1 = this.params.map_min1
            Path.map_max1 = this.params.map_max1
            Path.map_min2 = this.params.map_min2
            Path.map_max2 = this.params.map_max2
            this.reset()
        });

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

        this.gui.add(this.params, 'allow_intersect').name("allow_intersect (!)").onChange((value) => {
            this.params.allow_intersect = value
            this.reset()
        });

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