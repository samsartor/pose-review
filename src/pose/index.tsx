import { Pose, Results, VERSION } from "@mediapipe/pose"
import { Camera } from "@mediapipe/camera_utils";
import { observable, action, makeObservable, autorun } from "mobx";
import { PoseDisplay } from './display';
import { Recorder } from "./base";
import { Simulation } from "../state";
import { Component, createRef } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { observer } from "mobx-react";

export { Recorder, Sample, LandmarkName, LANDMARK_NAMES } from "./base";

export class Poser {
    every_ms: number;
    status: string = 'Off';
    ready: boolean = false;
    data: Recorder;

    pose: Pose | null = null;
    cam: Camera | null = null;
    display: PoseDisplay | null = null;
    video: HTMLVideoElement | null = null;

    sims: Set<Simulation> = new Set();

    private base_t: Date;
    private previous_timestep = 0;

    constructor() {
        this.base_t = new Date();
        this.data = new Recorder(30);
        makeObservable(this, {
            status: observable,
            ready: observable,
            data: observable.ref,
            sims: observable,
            start: action,
            setStatus: action,
            onResults: action,
            addSimulation: action,
            removeSimulation: action,
        });

    }

    start() {
        if (this.pose != null) {
            return;
        }

        this.setStatus('Loading', false);
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
        this.pose.onResults(r => this.onResults(r));
        this.pose.initialize()
            .then(() => {
                if (this.status == 'Loading') {
                    this.setStatus('Waiting', false)
                }
            })
            .catch(e => {
                this.setStatus(`Error while loading: ${e}`, true);
                console.error(e);
            });

        this.video = document.getElementById('camera')! as HTMLVideoElement;
        const camera = new Camera(this.video, {
            onFrame: async () => {
                await this.pose!.send({ image: this.video! });
            },
        });
        camera.start();
    }

    onResults(x: Results) {
        if (!this.ready) {
            this.setStatus('Running', true);
        }

        let timestamp = new Date();
        let t = (timestamp.getTime() - this.base_t.getTime()) / 1000.;
        if (x.poseLandmarks != null && x.poseWorldLandmarks != null) {
            this.data.push({
                timestamp,
                t,
                worldPose: x.poseWorldLandmarks,
                screenPose: x.poseLandmarks,
            });
        }

        if (this.display != null) {
            try {
                this.display.update(this.data, this.video!);
            } catch (e) {
                this.display = null;
            }
        }

        for (let sim of this.sims) {
            try {
                sim.step(this.data, t - this.previous_timestep);
            } catch (e) {
                console.trace('ERROR WHEN STEPPING:', e)
            }
        }
        this.previous_timestep = t;
    }

    setStatus(msg: string, ready: boolean) {
        this.status = msg;
        this.ready = ready;
    }

    setDisplay(canvas: HTMLCanvasElement, delay: number) {
        this.display = new PoseDisplay(canvas, delay);
    }

    addSimulation(sim: Simulation) {
        this.sims.add(sim);
    }

    removeSimulation(sim: Simulation) {
        this.sims.delete(sim);
    }
}

@observer
export class PoserCanvas extends Component<{ delay: number }> {
    canvas = createRef<HTMLCanvasElement>();


    constructor(props) {
        super(props);
        makeObservable(this, {
            canvas: observable.deep,
        });
        autorun(() => {
            if (this.canvas.current != null) {
                POSER.setDisplay(this.canvas.current, this.props.delay);
            }
        });
    }

    render() {
        return <Row className="justify-content-md-center">
            <Col sm="12" md="6" className="d-flex justify-content-md-center mb-4">{
                POSER.ready ?
                    <canvas className="border border-dark rounded" style={{ width: '100%', height: 'auto', padding: 0 }} ref={this.canvas}></canvas> :
                    <Spinner animation="border" className="mx-auto"></Spinner>
            }</Col>
        </Row>
    }
}

export let POSER = new Poser();
