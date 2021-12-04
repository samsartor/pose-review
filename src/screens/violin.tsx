import { Vector3 } from "@math.gl/core";
import { action, computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import { Component, createRef, Ref } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { POSER } from "../pose";
import { signToState, Simulation, State } from "../state";

function makeBowSim(): Simulation {
    let sim = new Simulation();
    let up_bow = new State('good', 'up bow');
    let down_bow = new State('good', 'down bow');
    let unknown = new State('warn', 'unknown');
    unknown.start();
    sim.connect({
        from: [up_bow, down_bow, unknown],
        to(data) {
            return signToState(data.vel['RIGHT_WRIST'].y, down_bow, up_bow, unknown);
        },
        delay: 0.05,
    });
    return sim;
}

@observer
export class ViolinApp extends Component {
    interval;
    angle: number = 0.;
    canvas = createRef<HTMLCanvasElement>();
    sim = makeBowSim();
    currentState: string = 'none';
    measures: Array<[string, number]> = [];

    constructor(props) {
        super(props);
        makeObservable(this, {
            angle: observable,
            currentState: observable,
            measures: observable,
            angleDeg: computed,
            update: action,
        });
    }

    componentDidMount() {
        POSER.start();
        this.interval = setInterval(() => this.update(), 10);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    update() {
        try {
            let s = POSER.data.summarize(0.1, false);

            this.sim.step(s, 0.01);
            this.currentState = this.sim.mode.name;
            this.measures = [];
            for (let state of this.sim.states) {
                this.measures.push([state.name, state.measure]);
            }

            let upper = s.pos.RIGHT_ELBOW.clone().subtract(s.pos.RIGHT_SHOULDER);
            let lower = s.pos.RIGHT_WRIST.clone().subtract(s.pos.RIGHT_ELBOW);
            let norm = upper.clone().cross(lower);
            this.angle = norm.angle(s.vel.RIGHT_WRIST);

            let c = this.canvas.current!.getContext('2d')!;
            let line = (a: Vector3, b: Vector3, s: string) => {
                c.save();
                c.translate(100, 100);
                c.scale(100, 100);
                c.lineWidth = 1 / 20;
                c.strokeStyle = s;
                c.beginPath();
                c.moveTo(a.x, a.y);
                c.lineTo(b.x, b.y);
                c.stroke();
                c.restore();

                c.save();
                c.translate(300, 100);
                c.scale(100, 100);
                c.lineWidth = 1 / 20;
                c.strokeStyle = s;
                c.beginPath();
                c.moveTo(a.x, a.z);
                c.lineTo(b.x, b.z);
                c.stroke();
                c.restore();

                c.save();
                c.translate(500, 100);
                c.scale(100, 100);
                c.lineWidth = 1 / 20;
                c.strokeStyle = s;
                c.beginPath();
                c.moveTo(a.y, a.z);
                c.lineTo(b.y, b.z);
                c.stroke();
                c.restore();
            };

            c.clearRect(0, 0, 600, 200);
            line(new Vector3(0, 0, 0), upper.clone().scale(-2), 'red');
            line(new Vector3(0, 0, 0), lower.clone().scale(2), 'blue');
            //line(new Vector3(0, 0, 0), norm.clone().normalize().scale(0.5), 'orange');
            line(new Vector3(0, 0, 0), s.vel.RIGHT_WRIST, 'green');
        } catch (e) {
            console.warn(e);
        }
    }

    get angleDeg(): number {
        return this.angle / Math.PI * 180 - 90;
    }

    render() {
        return <Container>
            <p>Angle = {this.angleDeg.toFixed(1)}°</p>
            <p>State = {this.currentState}</p>
            {
                this.measures.map(([name, measure]) => <p>{name} = {measure.toFixed(2)}</p>)
            }
            <Row className="justify-content-md-center">
                <Col sm="12" md="6">
                    <canvas style={{ width: '100%', height: 'auto' }} width="600" height="200" ref={this.canvas} />
                </Col>
            </Row>
        </Container>;
    }
}
