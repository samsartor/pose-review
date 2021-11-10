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
        this.canvas.width = results.image.width;
        this.canvas.height = results.image.height;

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

export class Recorder implements Iterable<number> {
    private buffer: Float32Array;
    private start = 0;
    private len = 0;

    constructor(size: number) {
        this.buffer = new Float32Array(size);
    }

    push(x: number) {
        if (this.len < this.buffer.length) {
            this.buffer[this.len] = x;
            this.len++;
        } else {
            this.buffer[this.start] = x;
            this.start = (this.start + 1) % this.len;
        }
    }

    last(): number {
        let i = this.start;
        if (i == 0) {
            i = this.len;
        }
        if (i == 0) {
            throw Error('recorder is empty');
        }
        return this.buffer[i - 1];
    }

    array(): Float32Array {
        let out = new Float32Array(this.len);
        out.set(this.buffer.subarray(this.start, this.len));
        out.set(this.buffer.subarray(0, this.start), this.len - this.start);
        return out;
    }

    *[Symbol.iterator]() {
        for (let i = 0; i < this.len; i++) {
            yield this.buffer[(this.start + i) % this.len];
        }
    }
}

export type LANDMARK_NAME = keyof typeof POSE_LANDMARKS;
export let LANDMARK_NAMES = new Map<number, LANDMARK_NAME>();
for (let [name, index] of Object.entries(POSE_LANDMARKS)) {
    LANDMARK_NAMES.set(index, name as LANDMARK_NAME);
}

interface LandmarkRecorder {
    x: Recorder,
    y: Recorder,
    z: Recorder,
    vis: Recorder,
}

export interface Sample extends PoseResults {
    timestamp: Date;
    t: number;
}

export class Poser {
    every_ms: number;
    status: string = 'Loading';
    sample: Sample | null = null;
    history: Map<LANDMARK_NAME, LandmarkRecorder> = new Map();

    pose: Pose;
    cam: Camera;
    display: PoseDisplay | null = null;

    private history_len: number = 128;
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
        this.pose.onResults(r => this.setSample(r));
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

        if (this.sample.poseWorldLandmarks != null) {
            for (let [index, name] of LANDMARK_NAMES) {
                let into = this.history.get(name);
                if (into == null) {
                    into = {
                        x: new Recorder(this.history_len),
                        y: new Recorder(this.history_len),
                        z: new Recorder(this.history_len),
                        vis: new Recorder(this.history_len),
                    };
                    this.history.set(name, into);
                }
                let from = this.sample.poseWorldLandmarks[index];
                into.x.push(from.x);
                into.y.push(from.y);
                into.z.push(from.z);
                into.vis.push(from.visibility || 0);
            }
        }

        try {
            this.display!.update(this.sample)
        } catch (_) {
            this.display = null;
        }
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
