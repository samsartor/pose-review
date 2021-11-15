import { LandmarkName, LANDMARK_NAMES, POSER } from "../pose";
import Plot from 'react-plotly.js';
import { observer } from "mobx-react";
import { Component, createRef, ReactElement } from "react";
import { Container, Table, Button, Form, Row, Col } from "react-bootstrap";
import { action, autorun, makeObservable, observable } from "mobx";
import RangeSlider from "react-bootstrap-range-slider";


@observer
export class PoseApp extends Component {
    canvas = createRef<HTMLCanvasElement>();
    table: ReactElement[] = [];
    plot: Plotly.Data[] | null = null;
    delay: number = 0.1;
    interval;

    constructor(props) {
        super(props);
        makeObservable(this, {
            plot: observable,
            table: observable,
            delay: observable,
            updatePlot: action,
            updateTable: action,
            setDelay: action,
        });
        autorun(() => {
            let delay = this.delay;
            let display = POSER.display;
            if (display != null) {
                display.delay = delay;
            }
        });
    }

    componentDidMount() {
        POSER.start();
        POSER.setDisplay(this.canvas.current!, this.delay);
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
                x: POSER.data.list(name, 'x'),
                y: POSER.data.list(name, 'y'),
                z: POSER.data.list(name, 'z'),
                marker: {
                    size: 1,
                }
            }
        ];
    }

    updateTable() {
        this.table = [];
        let data = POSER.data.last();
        if (data != null) {
            for (let [index, landmark] of data.worldPose.entries()) {
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

    setDelay(delay: number | string) {
        if (typeof delay == 'string') {
            delay = parseFloat(delay.replace('s', ''))
        }
        this.delay = delay;
    }

    render() {
        return <Container>
            <canvas ref={this.canvas}></canvas>
            <Form style={{ "maxWidth": "500px" }} >
                <Form.Group as={Row}>
                    <Form.Label column sm="3">
                        Motion delay =
                    </Form.Label>
                    <Col sm="6">
                        <RangeSlider
                            value={Math.log2(this.delay)}
                            min={-6}
                            max={1}
                            step={0.5}
                            tooltip="off"
                            onChange={(_, v) => this.setDelay(Math.pow(2, v))}
                        />
                    </Col>
                    <Col sm="3">
                        <Form.Control value={this.delay.toFixed(3) + 's'} readOnly={true} />
                    </Col>
                </Form.Group>
            </Form>
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
        </Container >;
    }
}
