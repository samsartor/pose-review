import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";
import { LANDMARK_NAMES } from ".";
import { Recorder } from "./base";

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
            let xs = results.list(name, 'x', false);
            let ys = results.list(name, 'y', false);
            if (xs.length == 0) {
                return;
            }

            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = '#507aa1';
            this.ctx.beginPath();
            this.ctx.moveTo(xs[0] * this.canvas.width, ys[0] * this.canvas.height);
            for (let i = 1; i < xs.length; i++) {
                this.ctx.lineTo(xs[i] * this.canvas.width, ys[i] * this.canvas.height);
            }
            this.ctx.stroke();
        }
    }

    drawArrows(results: Recorder) {
        const DELAY = 0.2;

        for (let name of LANDMARK_NAMES) {
            try {
                let xs = results.fit(name, 'x', this.delay, false);
                let ys = results.fit(name, 'y', this.delay, false);

                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#c75c2a';
                this.ctx.beginPath();
                this.ctx.moveTo(xs.mean * this.canvas.width, ys.mean * this.canvas.height);
                this.ctx.lineTo((xs.mean + xs.slope) * this.canvas.width, (ys.mean + ys.slope) * this.canvas.height);
                this.ctx.stroke();
            } catch { }
        }
    }

    update(results: Recorder, frame: HTMLVideoElement) {
        if (!document.contains(this.canvas)) {
            throw Error('canvas is unmounted');
        }
        this.canvas.width = frame.videoWidth;
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
        this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);

        this.ctx.globalCompositeOperation = 'source-over';
        this.drawTrails(results);
        drawConnectors(this.ctx, results.last()?.screenPose, POSE_CONNECTIONS,
            { color: '#77ba43', lineWidth: 4 });
        this.drawArrows(results);
        drawLandmarks(this.ctx, results.last()?.screenPose,
            { color: '#eb4034', lineWidth: 2 });
        this.ctx.restore();

        // this.grid.updateLandmarks(results.poseWorldLandmarks);
    }
}
