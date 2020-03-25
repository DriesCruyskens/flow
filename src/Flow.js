import * as dat from 'dat-gui';
import { makeNoise3D } from "open-simplex-noise";
import * as paper from 'paper';
import { saveAs } from 'file-saver';
import * as _ from 'lodash';
import Path from './Path.js'


export default class Flow {

    constructor(canvasId) {
        this.params = {
            r: 200,
            nPaths: 2000,
            nSteps: 17,
            stepSize: 5,
            strokeWidth: 1.5,
            scale: 100,
            seed: 1000,
            allowIntersect: true,
            mapMin1: -1,
            mapMax1: 1,
            mapMin2: 0,
            mapMax2: 2*Math.PI,
        }

        Number.prototype.map = function (inMin, inMax, outMin, outMax) {
            return (this - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
        }

        Number.prototype.clamp = function(min, max) {
            return Math.min(Math.max(this, min), max);
          };

        this.gui = new dat.GUI();
        this.canvas = document.getElementById(canvasId);
        paper.setup(this.canvas);
        this.noise3D = makeNoise3D(Date.now());
        
        // make the noise available as a static variable inside path
        Path.noise3D = this.noise3D;
        this.mapToPath();

        this.center = paper.view.center;

        this.initGUI();
        this.reset();
    }

    // make map parameters available as static variable inside Path
    mapToPath() {
        Path.mapMin1 = this.params.mapMin1;
        Path.mapMax1 = this.params.mapMax1;
        Path.mapMin2 = this.params.mapMin2;
        Path.mapMax2 = this.params.mapMax2;
    }

    randomize() {
        this.noise3D = makeNoise3D(Date.now());
        this.reset();
    }

    reset() {
        paper.project.currentStyle = {
            strokeColor: '#00000055',
            strokeWidth: this.params.strokeWidth,
            strokeCap: 'round',
            //fillColor: '#0000FF01'
        };
        paper.project.clear();

        // make map parameters available as static variable inside Path
        this.mapToPath()

        this.draw();
    }

    random(min, max) {
        let r = Math.random();
        return r.map(0, 1, min, max);
    }

    draw() {

        // initialize nPaths and move them nSteps (one at a time)
        // stop drawing path is intersection is detected and not allowed
        this.paths = [];
        for (let i = 0; i < this.params.nPaths; i++) {
            // init
            let o; // starting point (origin)
            do {
                o = new paper.Point(this.random(-this.params.r, this.params.r),
                this.random(-this.params.r, this.params.r));
            }
            while (o.getDistance([0, 0]) > this.params.r) {
                
            }
            let p1 = new Path(paper, this.center.clone().add(o));

            // move
            for (let i = 0; i < this.params.nSteps; i++) {
                p1.move(this.params.scale, this.params.seed, this.params.stepSize)
                if(!this.params.allowIntersect && this.paths.some(p => {
                    return p.path.hitTest(p1.lastVertex);
                    //return p.path.intersects(p1.path); // still too much overlap, hittest is better
                })) {
                    break
                }
            }

            // smooth path
            p1.path.smooth();
            // add to array for future paths to be hittest against
            this.paths.push(p1);
        }
        
        paper.view.draw();
    }

    initGUI() {
        this.gui.add(this, 'randomize').name('Randomize');

        let map = this.gui.addFolder('map');

        map.add(this.params, 'mapMin1',-1, 1).onFinishChange((value) => {
            this.params.mapMin1 = value;
            this.reset();
        });

        map.add(this.params, 'mapMax1',-1, 1).onFinishChange((value) => {
            this.params.mapMax1 = value;
            this.reset();
        });

        map.add(this.params, 'mapMin2', -2*Math.PI, 2*Math.PI).onFinishChange((value) => {
            this.params.mapMin2 = value;
            this.reset();
        });

        map.add(this.params, 'mapMax2', -2*Math.PI, 2*Math.PI).onFinishChange((value) => {
            this.params.mapMax2 = value;
            this.reset();
        });

        let flow = this.gui.addFolder('flow');

        flow.add(this.params, 'nPaths', 0, 3000).step(1).onFinishChange((value) => {
            this.params.nPaths = value;
            this.reset();
        });

        flow.add(this.params, 'nSteps', 0, 300).step(1).onFinishChange((value) => {
            this.params.nSteps = value;
            this.reset();
        });

        flow.add(this.params, 'stepSize', 1, 50).onFinishChange((value) => {
            this.params.stepSize = value;
            this.reset();
        });

        flow.add(this.params, 'strokeWidth', 1, 3).onFinishChange((value) => {
            this.params.strokeWidth = value;
            this.reset();
        });

        flow.add(this.params, 'scale', 1, 1000).onFinishChange((value) => {
            this.params.scale = value;
            this.reset();
        });

        flow.open();

        this.gui.add(this.params, 'seed', 0, 2000).onFinishChange((value) => {
            this.params.seed = value;
            this.reset();
        });

        this.gui.add(this.params, 'allowIntersect').name("allowIntersect (!)").onChange((value) => {
            this.params.allowIntersect = value;
            this.reset();
        });

        this.gui.add(this, 'exportSVG').name('Export SVG');
        this.gui.add(this, 'exportSVGNoOverlap').name('SVG 4 plot (!)');
    }

    exportSVGNoOverlap() {
        this.params.allowIntersect = false;
        this.reset();

        var svg = paper.project.exportSVG({asString: true});
        var blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
        saveAs(blob, 'Flow' + JSON.stringify(this.params) + '.svg');

        this.params.allowIntersect = true;
    }

    exportSVG() {
        var svg = paper.project.exportSVG({asString: true});
        var blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
        saveAs(blob, 'Flow' + JSON.stringify(this.params) + '.svg');
    }
}