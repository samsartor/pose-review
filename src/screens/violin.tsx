import { Vector3 } from "@math.gl/core";
import { action, computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import { Component, createRef, Ref } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { POSER } from "../pose";
import { signToState, Simulation, State } from "../state";

let direction = new Simulation();
let up_dir = new State('good', 'up bow');
let down_dir = new State('good', 'down bow');
let unknown_dir = new State('warn', 'unknown bowing');
direction.connect({
    from: [up_dir, down_dir, unknown_dir],
    to(data) {
        let diag_vel = data.vel['RIGHT_WRIST'].y - data.vel['RIGHT_WRIST'].x;
        return signToState(diag_vel, down_dir, up_dir, unknown_dir);
    },
    delay: 0.05,
});

let level = new Simulation();
let level_high = new State('bad', 'left hand too high');
let level_low = new State('bad', 'left hand too low');
let level_correct = new State('good', 'left hand correct');
level.connect({
    from: [level_high, level_low, level_correct],
    to(data) {
        let arm_len = Math.abs(data.pos['LEFT_SHOULDER'].x - data.pos['LEFT_WRIST'].x);
        let height_diff = data.pos['LEFT_WRIST'].y - data.pos['LEFT_SHOULDER'].y;
        let slope = height_diff / arm_len;
        return signToState(slope - 0.1, level_low, level_high, level_correct, 0.1);
    },
    delay: 0.2,
});

@observer
export class ViolinApp extends Component {
    interval;
    angle: number = 0.;
    canvas = createRef<HTMLCanvasElement>();
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
        direction.reset();
        unknown_dir.start();
        POSER.addSimulation(direction);
        level.reset();
        level_correct.start();
        POSER.addSimulation(level);
        this.interval = setInterval(() => this.update(), 10);
    }

    componentWillUnmount() {
        POSER.removeSimulation(direction);
        POSER.removeSimulation(level);
        clearInterval(this.interval);
    }

    update() {
        try {
            let s = POSER.data.summarize(0.1, false);

            this.currentState = `${level.mode.name} + ${direction.mode.name}`
            this.measures = [];
            for (let state of level.states) {
                this.measures.push([state.name, state.measure]);
            }
            for (let state of direction.states) {
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
