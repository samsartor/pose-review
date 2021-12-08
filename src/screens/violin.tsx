import { Vector3 } from "@math.gl/core";
import { action, computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import { Component, createRef, Ref } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { POSER, PoserCanvas } from "../pose";
import { Summary } from "../pose/base";
import { FuzzySimulation, signToState, Simulation, State } from "../state";
import { StateView } from "../stateview";

let up_dir = new State('good', 'up bow', 1 / 10);
let down_dir = new State('good', 'down bow', 1 / 10);
let unknown_dir = new State('none', 'unknown bowing', 1 / 5);
function dir_trans(data: Summary) {
    let diag_vel = data.vel['RIGHT_WRIST'].y + data.vel['RIGHT_WRIST'].x;
    return signToState(diag_vel, 0.1, up_dir, down_dir, unknown_dir);
}
up_dir.to(1 / 10, dir_trans);
down_dir.to(1 / 10, dir_trans);
unknown_dir.to(1 / 10, dir_trans);
let direction = new FuzzySimulation('Bow Direction', unknown_dir);

let level_high = new State('bad', 'left hand too high', 1 / 4);
let level_low = new State('bad', 'left hand too low', 1 / 4);
let level_correct = new State('good', 'left hand correct', 1 / 4);
function level_trans(data: Summary) {
    let arm_len = Math.abs(data.pos['LEFT_SHOULDER'].x - data.pos['LEFT_WRIST'].x);
    let height_diff = data.pos['LEFT_WRIST'].y - data.pos['LEFT_SHOULDER'].y;
    let slope = height_diff / arm_len;
    return signToState(slope - 0.1, 1 / 5, level_high, level_low, level_correct);
}
level_high.to(1 / 10, level_trans);
level_low.to(1 / 10, level_trans);
level_correct.to(1 / 10, level_trans);
let level = new FuzzySimulation('Bow Level', level_correct);
@observer
export class ViolinApp extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        POSER.start();
        direction.reset();
        POSER.addSimulation(direction);
        level.reset();
        POSER.addSimulation(level);
    }

    componentWillUnmount() {
        POSER.removeSimulation(direction);
        POSER.removeSimulation(level);
    }

    render() {
        return <Container className="my-4">
            <PoserCanvas delay={0.1} />
            <Row>
                <h2>Bows: {direction.count(up_dir)} up vs {direction.count(down_dir)} down</h2>
            </Row>
            <Row>
                <Col md="6">
                    <StateView sim={level} />
                </Col>
                <Col md="6">
                    <StateView sim={direction} />
                </Col>
            </Row>
        </Container >;
    }
}
