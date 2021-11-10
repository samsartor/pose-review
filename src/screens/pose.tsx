import { LANDMARK_NAME as LandmarkName, poser } from "../poser";
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
        let landmark = poser().history.get(name)!;
        this.plot = [
            {
                type: "scatter3d",
                x: landmark.x.array(),
                y: landmark.y.array(),
                z: landmark.z.array(),
                marker: {
                    size: 1,
                }
            }
        ];
    }

    updateTable() {
        this.table = [];
        if (poser().history != null) {
            for (let [name, landmark] of poser().history) {
                if (landmark.vis.last() < 0.5) {
                    continue;
                }

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
                    <th>{landmark.x.last().toFixed(3)}</th>
                    <th>{landmark.y.last().toFixed(3)}</th>
                    <th>{landmark.z.last().toFixed(3)}</th>
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
