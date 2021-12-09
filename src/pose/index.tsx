import { Pose, Results, VERSION } from "@mediapipe/pose"
import { Camera } from "@mediapipe/camera_utils";
import { observable, action, makeObservable, autorun, IReactionDisposer } from "mobx";
import { PoseDisplay } from './display';
import { Recorder, SimLogger } from "./base";
import { Simulation } from "../state";
import { Component, createRef } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { observer } from "mobx-react";

export { Recorder, Sample, LandmarkName, LANDMARK_NAMES } from "./base";

export class Poser implements SimLogger {
    every_ms: number;
    status: string = 'Off';
    ready: boolean = false;
    data: Recorder;

    pose: Pose | null = null;
    cam: Camera | null = null;
    display: PoseDisplay | null = null;
    video: HTMLVideoElement | null = null;

    sims: Set<Simulation> = new Set();

    logs: string[];
    logging: boolean;

    private base_t: Date;
    private previous_timestep = 0;

    constructor() {
        this.base_t = new Date();
        this.data = new Recorder(30);
        this.clearLog();
        makeObservable(this, {
            status: observable,
            ready: observable,
            data: observable.ref,
            sims: observable,
            logging: observable,
            start: action,
            setStatus: action,
            onResults: action,
            addSimulation: action,
            removeSimulation: action,
            toggleLog: action,
            clearLog: action,
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

        let dt = t - this.previous_timestep;
        this.previous_timestep = t;
        for (let sim of this.sims) {
            try {
                sim.step(this.data, dt, this);
            } catch (e) {
                console.trace('ERROR WHEN STEPPING:', e)
            }
        }
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

    toggleLog() {
        this.logging = !this.logging;
    }

    clearLog() {
        this.logging = false;
        this.logs = ['t,sim,state,weight,count\n'];
    }

    log(sim, state, weight, count) {
        if (this.logging) {
            this.logs.push(`${this.previous_timestep.toFixed(4)},${sim},${state},${weight.toFixed(4)},${count}\n`);
        }
    }

    downloadLog() {
        let blob = new Blob(this.logs, { type: 'text/csv;charset=utf-8;' });
        let link = document.createElement('a');
        let url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'log.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

@observer
export class PoserCanvas extends Component<{ delay: number }> {
    canvas: HTMLCanvasElement | null = null;
    dispose: IReactionDisposer | null = null;

    constructor(props) {
        super(props);
        makeObservable(this, {
            canvas: observable,
            setCanvas: action,
        })
    }

    componentDidMount() {
        this.dispose = autorun(() => {
            if (this.canvas != null) {
                POSER.setDisplay(this.canvas, this.props.delay);
            }
        });
    }

    componentWillUnmount() {
        if (this.dispose != null) {
            this.dispose();
        }
    }

    setCanvas(canvas: HTMLCanvasElement | null) {
        this.canvas = canvas;
    }

    render() {
        return <Row className="justify-content-md-center">
            <Col sm="12" md="6" className="d-flex justify-content-md-center mb-4">{
                POSER.ready ?
                    <canvas className="border border-dark rounded" style={{ width: '100%', height: 'auto', padding: 0 }} ref={c => this.setCanvas(c)}></canvas> :
                    <Spinner animation="border" className="mx-auto"></Spinner>
            }</Col>
        </Row>
    }
}

export let POSER = new Poser();
