import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Pose, POSE_CONNECTIONS, Results as PoseResults, VERSION } from "@mediapipe/pose"
import { Camera } from "@mediapipe/camera_utils";
import { observable, action, makeObservable } from "mobx";

class PoseDisplay {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    update(results: PoseResults) {
        if (!document.contains(this.canvas)) {
            throw Error('canvas is unmounted');
        }

        if (!results.poseLandmarks) {
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
        this.ctx.drawImage(
            results.image, 0, 0, this.canvas.width, this.canvas.height);

        this.ctx.globalCompositeOperation = 'source-over';
        drawConnectors(this.ctx, results.poseLandmarks, POSE_CONNECTIONS,
            { color: '#00FF00', lineWidth: 4 });
        drawLandmarks(this.ctx, results.poseLandmarks,
            { color: '#FF0000', lineWidth: 2 });
        this.ctx.restore();

        // this.grid.updateLandmarks(results.poseWorldLandmarks);
    }
}

// Mediapipe needs to be able to find all of these files. By importing them here
// with `require(..)` we make sure parcel crates URLs for them.
/*
const POSE_FILES = {
    'pose_landmark_full.tflite': require('url:@mediapipe/pose/pose_landmark_full.tflite'),
    'pose_landmark_heavy.tflite': require('url:@mediapipe/pose/pose_landmark_heavy.tflite'),
    'pose_landmark_lite.tflite': require('url:@mediapipe/pose/pose_landmark_lite.tflite'),
    'pose_solution_packed_assets_loader.js': require('url:@mediapipe/pose/pose_solution_packed_assets_loader.js'),
    'pose_solution_packed_assets.data': require('url:@mediapipe/pose/pose_solution_packed_assets.data'),
    'pose_solution_simd_wasm_bin.data': require('url:@mediapipe/pose/pose_solution_simd_wasm_bin.data'),
    'pose_solution_simd_wasm_bin.js': require('url:@mediapipe/pose/pose_solution_simd_wasm_bin.js'),
    'pose_solution_simd_wasm_bin.wasm': require('url:@mediapipe/pose/pose_solution_simd_wasm_bin.wasm'),
    'pose_solution_wasm_bin.js': require('url:@mediapipe/pose/pose_solution_wasm_bin.js'),
    'pose_solution_wasm_bin.wasm': require('url:@mediapipe/pose/pose_solution_wasm_bin.wasm'),
    'pose_web.binarypb': require('url:@mediapipe/pose/pose_web.binarypb'),
};
*/


export class Poser {
    pose: Pose;
    cam: Camera;
    display: PoseDisplay | null = null;
    status: string = 'Loading';

    constructor() {
        makeObservable(this, {
            status: observable,
            setStatus: action,
        });

        this.pose = new Pose({
            // locateFile: path => POSE_FILES[path],
            locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${VERSION}/${file}`,
        });

        this.pose.setOptions({
            modelComplexity: 2,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        this.pose.onResults(r => {
            try {
                this.display!.update(r)
            } catch (_) {
                this.display = null;
            }
        });
        this.pose.initialize()
            .then(() => this.setStatus('Loaded'))
            .catch(e => {
                this.setStatus(`Error while loading: ${e}`);
                console.error(e);
            });

        let video = document.getElementById('camera') as HTMLVideoElement;
        const camera = new Camera(video, {
            onFrame: async () => {
                await this.pose.send({ image: video });
            },
            width: 1280,
            height: 720
        });
        camera.start();
    }

    setStatus(msg: string) {
        this.status = msg;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.display = new PoseDisplay(canvas);
    }
}

let POSER: Poser | null;

export function poser(): Poser {
    if (POSER == null) {
        POSER = new Poser();
    }
    return POSER;
}
