import { LandmarkName, LANDMARK_NAMES, POSER, PoserCanvas } from "../pose";
import Plot from 'react-plotly.js';
import { observer } from "mobx-react";
import { Component, ReactElement } from "react";
import { Container, Table, Button, Form, Row, Col } from "react-bootstrap";
import { action, autorun, makeObservable, observable } from "mobx";
import RangeSlider from "react-bootstrap-range-slider";
import { RadioGroup, Radio } from "react-radio-group";


@observer
export class DebugApp extends Component {
    table: ReactElement[] = [];
    plot: Plotly.Data[] | null = null;
    delay: number = 0.1;
    errorCorrection: boolean = true;
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
            setErrorCorrection: action,
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
        this.updateTable();
        this.interval = setInterval(() => this.updateTable(), 100);
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
        try {
            let data = POSER.data.summarize(0.1, true, this.errorCorrection);
            for (let name of LANDMARK_NAMES) {
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
                    <th>{data.pos[name].x.toFixed(3)}</th>
                    <th>{data.pos[name].y.toFixed(3)}</th>
                    <th>{data.pos[name].z.toFixed(3)}</th>
                    <th>{data.vel[name].x.toFixed(3)}</th>
                    <th>{data.vel[name].y.toFixed(3)}</th>
                    <th>{data.vel[name].z.toFixed(3)}</th>
                </tr>);
            }
        } catch {
            this.table = [];
        }
    }

    setDelay(delay: number | string) {
        if (typeof delay == 'string') {
            delay = parseFloat(delay.replace('s', ''))
        }
        this.delay = delay;
    }

    setErrorCorrection(ec: boolean) {
        this.errorCorrection = ec;
    }

    render() {
        return <Container className="my-4">
            <PoserCanvas delay={this.delay} />
            <Form style={{ "maxWidth": "500px" }} >
                <Form.Group>
                    <Row>
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
                    </Row>
                </Form.Group>
                <Row className="mt-2">
                    <RadioGroup name="stance" selectedValue={this.errorCorrection ? 1 : 0} onChange={v => this.setErrorCorrection(v != 0)}>
                        <Form.Check type="radio" as={Radio} value={1} label="Linear Fit (Error Correcting)" />
                        <Form.Check type="radio" as={Radio} value={0} label="Raw Difference" />
                    </RadioGroup>
                </Row>
            </Form>
            <h3 className="mt-4">Visible Landmarks</h3>
            <Table responsive="md">
                <thead>
                    <tr>
                        <th></th>
                        <th>X</th>
                        <th>Y</th>
                        <th>Z</th>
                        <th>X'</th>
                        <th>Y'</th>
                        <th>Z'</th>
                    </tr>
                </thead>
                <tbody>{this.table}</tbody>
            </Table>
            {
                this.plot ?
                    <>
                        <h3 className="mt-4">Landmark History</h3>
                        <Row className="justify-content-md-center">
                            <Col sm="12" md="6">
                                <Plot data={this.plot} width="600" height="600" style={{ width: '100%', height: 'auto' }} />
                            </Col>
                        </Row>
                    </>
                    : null
            }
        </Container >;
    }
}
