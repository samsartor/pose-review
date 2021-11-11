import { Pose, Results, VERSION } from "@mediapipe/pose"
import { Camera } from "@mediapipe/camera_utils";
import { observable, action, makeObservable } from "mobx";
import { PoseDisplay } from './display';
import { Recorder } from "./base";

export { Recorder, Sample, LandmarkName, LANDMARK_NAMES } from "./base";

export class Poser {
    every_ms: number;
    status: string = 'Loading';
    data: Recorder;

    pose: Pose;
    cam: Camera;
    display: PoseDisplay | null = null;
    video: HTMLVideoElement;

    private base_t: Date;

    constructor() {
        this.base_t = new Date();
        this.data = new Recorder(128);
        this.pose = new Pose({
            // locateFile: path => POSE_FILES[path],
            locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${VERSION}/${file}`,
        });

        makeObservable(this, {
            status: observable,
            data: observable.ref,
            setStatus: action,
            onResults: action,
        });

        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        this.pose.onResults(r => this.onResults(r));
        this.pose.initialize()
            .then(() => {
                if (this.status == 'Loading') {
                    this.setStatus('Connecting')
                }
            })
            .catch(e => {
                this.setStatus(`Error while loading: ${e}`);
                console.error(e);
            });

        this.video = document.getElementById('camera')! as HTMLVideoElement;
        const camera = new Camera(this.video, {
            onFrame: async () => {
                await this.pose.send({ image: this.video });
            },
        });
        camera.start();
    }

    onResults(x: Results) {
        if (this.status != 'Running') {
            this.setStatus('Running');
        }

        let timestamp = new Date();
        let t = (timestamp.getTime() - this.base_t.getTime()) / 1000.;
        if (x.poseLandmarks != null && x.poseWorldLandmarks != null) {
            this.data.push({
                timestamp,
                t,
                pose: x.poseWorldLandmarks,
                normedPose: x.poseLandmarks,
            });
        }

        if (this.display != null) {
            try {
                this.display.update(this.data, this.video);
            } catch (e) {
                this.display = null;
            }
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
