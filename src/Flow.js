import * as dat from 'dat-gui';
import { makeNoise3D } from "open-simplex-noise";
import * as paper from 'paper';
import { saveAs } from 'file-saver';
import * as _ from 'lodash';

export default class Flow {

    constructor(canvas_id) {
        this.params = {
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
            strokeColor: 'black',
            //fillColor: '#0000FF01'
        };
        
        paper.project.clear();
        this.draw();
    }

    draw() {
        
        paper.view.draw();
    }

    init_gui() {
        /* this.gui.add(this.params, 'draw_original_path').onChange((value) => {
            this.path.visible = value
            paper.view.draw()
        }); */

        this.gui.add(this, 'randomize').name('Randomize');

        let seis = this.gui.addFolder('seis');

        this.gui.add(this, 'exportSVG').name('Export SVG');
    }

    exportSVG() {
        var svg = paper.project.exportSVG({asString: true});
        var blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
        saveAs(blob, 'Seis' + JSON.stringify(this.params) + '.svg');
    }
}