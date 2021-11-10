import { POSE_LANDMARKS } from "@mediapipe/pose";
import { LandmarkHistory, LANDMARK_NAME, poser } from "../poser";
import Plot from 'react-plotly.js';
import { observer } from "mobx-react";
import { Component, createRef, useEffect } from "react";
import { Container, Table } from "react-bootstrap";
import { action, makeObservable, observable } from "mobx";

let LANDMARK_NAMES = new Map<number, LANDMARK_NAME>();
for (let [name, index] of Object.entries(POSE_LANDMARKS)) {
    LANDMARK_NAMES.set(index, name as LANDMARK_NAME);
}

@observer
export class PoseApp extends Component {
    canvas = createRef<HTMLCanvasElement>();
    history: LandmarkHistory | null = null;
    plot: Plotly.Data[] | null = null;

    constructor(props) {
        super(props);
        makeObservable(this, {
            history: observable,
            plot: observable,
            setLandmark: action,
            updatePlot: action,
        });
    }

    componentDidMount() {
        poser().setCanvas(this.canvas.current!);
    }

    updatePlot() {
        if (this.history == null) {
            this.plot = null;
        } else {
            this.plot = [
                {
                    type: "scatter3d",
                    x: this.history.x.array,
                    y: this.history.y.array,
                    z: this.history.z.array,
                }
            ];
        }
    }

    setLandmark(name: LANDMARK_NAME) {
        if (this.history != null) {
            if (this.history.name == name) {
                this.updatePlot();
                return;
            }
            this.history.stop();
        }
        this.history = new LandmarkHistory(poser(), name);
        this.updatePlot();
    }

    render() {
        return <Container>
            <h2>Pose Review</h2>
            <p>{poser().status}</p>
            <canvas width="1280px" height="720px" ref={this.canvas}></canvas>
            <h3>Visible Landmarks</h3>
            <Table>
                <thead>
                    <tr>
                        <th></th>
                        <th>X</th>
                        <th>Y</th>
                        <th>Z</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        poser().sample?.poseWorldLandmarks?.map(({ x, y, z, visibility }, index) => {
                            if (visibility != undefined && visibility > 0.5) {
                                return <tr onClick={() => this.setLandmark(LANDMARK_NAMES.get(index)!)}>
                                    <th>{LANDMARK_NAMES.get(index)}</th>
                                    <th>{x.toFixed(3)}</th>
                                    <th>{y.toFixed(3)}</th>
                                    <th>{z.toFixed(3)}</th>
                                </tr>;
                            }
                        })
                    }
                </tbody>
            </Table>
            {
                this.plot ? <>
                    <h3>Landmark History</h3>
                    <Plot data={this.plot} width="600" height="600" />
                </> : null
            }
        </Container>;
    }
}
