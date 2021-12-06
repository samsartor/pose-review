import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";
import { LANDMARK_NAMES } from ".";
import { Recorder } from "./base";

function scaleZ(z: number) {
    return -0.3 * z + 0.5;
}

export class PoseDisplay {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    delay: number;

    constructor(canvas: HTMLCanvasElement, delay: number) {
        this.delay = delay;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    drawTrails(results: Recorder) {
        for (let name of LANDMARK_NAMES) {
            let xs = results.list(name, 'z', false);
            let ys = results.list(name, 'y', false);
            if (xs.length == 0) {
                return;
            }

            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = '#507aa1';
            this.ctx.beginPath();
            this.ctx.moveTo(-xs[0] * this.canvas.width, ys[0] * this.canvas.height);
            for (let i = 1; i < xs.length; i++) {
                this.ctx.lineTo(-xs[i] * this.canvas.width, ys[i] * this.canvas.height);
            }
            this.ctx.stroke();
        }
    }

    drawArrows(results: Recorder) {
        let w = this.canvas.width / 2;
        let h = this.canvas.height;
        for (let name of LANDMARK_NAMES) {
            try {
                let xs = results.fit(name, 'x', this.delay, false);
                let ys = results.fit(name, 'y', this.delay, false);
                let zs = results.fit(name, 'z', this.delay, false);

                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#c75c2a';
                this.ctx.beginPath();
                this.ctx.moveTo(xs.mean * w, ys.mean * h);
                this.ctx.lineTo((xs.mean + xs.slope) * w, (ys.mean + ys.slope) * h);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(scaleZ(zs.mean) * w + w, ys.mean * h);
                this.ctx.lineTo(scaleZ(zs.mean + zs.slope) * w + w, (ys.mean + ys.slope) * h);
                this.ctx.stroke();
            } catch { }
        }
    }

    drawConnectors(results: Recorder) {
        let w = this.canvas.width / 2;
        let h = this.canvas.height;
        let pos = results.last();
        if (pos == null) {
            return;
        }
        for (let [a, b] of POSE_CONNECTIONS) {
            let a_pos = pos.screenPose[a];
            let b_pos = pos.screenPose[b];
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = '#77ba43';
            this.ctx.beginPath();
            this.ctx.moveTo(a_pos.x * w, a_pos.y * h);
            this.ctx.lineTo(b_pos.x * w, b_pos.y * h);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(scaleZ(a_pos.z) * w + w, a_pos.y * h);
            this.ctx.lineTo(scaleZ(b_pos.z) * w + w, b_pos.y * h);
            this.ctx.stroke();
        }
    }

    update(results: Recorder, frame: HTMLVideoElement) {
        if (!document.contains(this.canvas)) {
            throw Error('canvas is unmounted');
        }
        this.canvas.width = 2 * frame.videoWidth;
        this.canvas.height = frame.videoHeight;

        if (!results) {
            // this.grid.updateLandmarks([]);
            return;
        }

        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //this.ctx.drawImage(results.segmentationMask, 0, 0,
        //  this.canvas.width, this.canvas.height);

        // Only overwrite existing pixels.
        this.ctx.globalCompositeOperation = 'source-in';
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Only overwrite missing pixels.
        this.ctx.globalCompositeOperation = 'destination-atop';
        this.ctx.drawImage(frame, 0, 0, this.canvas.width / 2, this.canvas.height);

        this.ctx.globalCompositeOperation = 'source-over';
        /*drawLandmarks(this.ctx, results.last()?.screenPose,
            { color: '#eb4034', lineWidth: 2 });*/
        // this.drawTrails(results);
        this.drawConnectors(results);
        this.drawArrows(results);
        this.ctx.restore();

        // this.grid.updateLandmarks(results.poseWorldLandmarks);
    }
}
