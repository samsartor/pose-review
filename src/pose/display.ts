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

    drawLandmarks(results: Recorder) {
        let w = this.canvas.width / 2;
        let h = this.canvas.height;
        let poss = results.last();
        if (poss == null) {
            return;
        }
        for (let pos of poss.screenPose) {
            this.ctx.lineWidth = 0;
            this.ctx.fillStyle = '#589fcc';
            this.ctx.beginPath();
            this.ctx.arc(pos.x * w, pos.y * h, 5, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(scaleZ(pos.z) * w + w, pos.y * h, 5, 0, 2 * Math.PI);
            this.ctx.fill();
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

        // Draw the video
        this.ctx.globalCompositeOperation = 'destination-atop';
        this.ctx.drawImage(frame, 0, 0, this.canvas.width / 2, this.canvas.height);

        // Draw pose estimation
        this.ctx.globalCompositeOperation = 'source-over';
        this.drawConnectors(results);
        this.drawLandmarks(results);
        this.drawArrows(results);
        this.ctx.restore();
    }
}
