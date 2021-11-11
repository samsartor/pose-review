import { LandmarkName, LANDMARK_NAMES, poser } from "../pose";
import Plot from 'react-plotly.js';
import { observer } from "mobx-react";
import { Component, createRef, ReactElement } from "react";
import { Container, Table, Button } from "react-bootstrap";
import { action, makeObservable, observable } from "mobx";


@observer
export class PoseApp extends Component {
    canvas = createRef<HTMLCanvasElement>();
    table: ReactElement[] = [];
    plot: Plotly.Data[] | null = null;
    interval;

    constructor(props) {
        super(props);
        makeObservable(this, {
            plot: observable,
            table: observable,
            updatePlot: action,
            updateTable: action,
        });
    }

    componentDidMount() {
        poser().setCanvas(this.canvas.current!);
        this.updateTable();
        this.interval = setInterval(() => this.updateTable(), 500);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    updatePlot(name: LandmarkName) {
        this.plot = [
            {
                type: "scatter3d",
                x: poser().data.list(name, 'x'),
                y: poser().data.list(name, 'y'),
                z: poser().data.list(name, 'z'),
                marker: {
                    size: 1,
                }
            }
        ];
    }

    updateTable() {
        this.table = [];
        let data = poser().data.last();
        if (data != null) {
            for (let [index, landmark] of data.pose.entries()) {
                if (landmark.visibility == null || landmark.visibility < 0.5) {
                    continue;
                }

                let name = LANDMARK_NAMES[index];
                this.table.push(<tr key={name}>
                    <th>
                        {name}
                        <Button
                            className="mx-3 my-auto"
                            variant="secondary"
                            size="sm"
                            onClick={() => this.updatePlot(name)}>
                            plot
                        </Button>
                    </th>
                    <th>{landmark.x.toFixed(3)}</th>
                    <th>{landmark.y.toFixed(3)}</th>
                    <th>{landmark.z.toFixed(3)}</th>
                </tr>);
            }
        }
    }

    render() {
        return <Container>
            <h2>Pose Review</h2>
            <p>{poser().status}</p>
            <canvas ref={this.canvas}></canvas>
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
                <tbody>{this.table}</tbody>
            </Table>
            {
                this.plot ?
                    <>
                        <h3>Landmark History</h3>
                        <Plot data={this.plot} width="600" height="600" />
                    </>
                    : null
            }
        </Container>;
    }
}
