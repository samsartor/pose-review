import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";
import { Recorder } from "./base";

export class PoseDisplay {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
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
        drawConnectors(this.ctx, results.last()?.normedPose, POSE_CONNECTIONS,
            { color: '#00FF00', lineWidth: 4 });
        drawLandmarks(this.ctx, results.last()?.normedPose,
            { color: '#FF0000', lineWidth: 2 });
        this.ctx.restore();

        // this.grid.updateLandmarks(results.poseWorldLandmarks);
    }
}
