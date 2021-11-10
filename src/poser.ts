import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Pose, POSE_CONNECTIONS, POSE_LANDMARKS, Results as PoseResults, VERSION } from "@mediapipe/pose"
import { Camera } from "@mediapipe/camera_utils";
import { observable, action, makeObservable, autorun } from "mobx";
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

export class Vector {
    private buffer = new ArrayBuffer(0);
    private len = 0;

    push(x: number) {
        if (this.len * 4 == this.buffer.byteLength) {
            let old_array = this.array;
            this.buffer = new ArrayBuffer(Math.max(this.buffer.byteLength * 2, 32));
            this.array.set(old_array);
        }

        new Float32Array(this.buffer, this.len * 4, 1)[0] = x;
        this.len += 1;
    }

    get array(): Float32Array {
        return new Float32Array(this.buffer, 0, this.len);
    }

    [Symbol.iterator]() {
        return this.array;
    }
}

export type LANDMARK_NAME = keyof typeof POSE_LANDMARKS;

export class LandmarkHistory {
    t = new Vector();
    x = new Vector();
    y = new Vector();
    z = new Vector();
    readonly name: LANDMARK_NAME;
    readonly stop: () => void;

    constructor(poser: Poser, name: LANDMARK_NAME) {
        makeObservable(this, {
            t: observable,
            x: observable,
            y: observable,
            z: observable,
        });
        this.name = name;
        this.stop = autorun(() => {
            if (poser.sample != null) {
                this.addSample(poser.sample);
            }
        });
    }

    addSample(s: Sample) {
        let lm = s.poseWorldLandmarks[POSE_LANDMARKS[this.name]];
        if (lm.visibility != null && lm.visibility > 0.5) {
            this.t.push(s.t);
            this.x.push(lm.x);
            this.y.push(lm.y);
            this.z.push(lm.z);
        }
    }
}

export interface Sample extends PoseResults {
    timestamp: Date;
    t: number;
}

export class Poser {
    every_ms: number;
    status: string = 'Loading';
    sample: Sample | null = null;

    pose: Pose;
    cam: Camera;
    display: PoseDisplay | null = null;

    private base_t: Date;

    constructor() {
        makeObservable(this, {
            status: observable,
            sample: observable,
            setStatus: action,
            setSample: action,
        });

        this.base_t = new Date();
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
            this.setSample(r);
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

    setSample(sample: PoseResults) {
        let t = new Date();
        this.sample = {
            ...sample,
            timestamp: t,
            t: (t.getTime() - this.base_t.getTime()) / 1000.,
        };
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
