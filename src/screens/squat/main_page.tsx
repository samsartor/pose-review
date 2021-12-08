import { Vector3 } from "@math.gl/core";
import { action, makeObservable, observable, computed } from "mobx";
import { observer } from "mobx-react";
import { Component, createRef } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { POSER, PoserCanvas } from "../../pose";
import { FuzzySimulation, Simulation, State } from "../../state";
import { StateView } from "../../stateview";
import { SQUAT_CONFIG } from "./config_data";

type VelocityDir = 'up' | 'down' | 'zero';

function velToVelDir(vel: Vector3): VelocityDir {
    const tolerance = 0.1;
    if (vel.z < -tolerance) {
        return 'down';
    } else if (vel.z > tolerance) {
        return 'up';
    } else {
        return 'zero';
    }
}

const TOL = 0.1;

let repTop = new State('none', 'top', 1 / 5);
repTop.to(1 / 10, (data) => {
    console.log(data.vel.LEFT_HIP.y);
    if (data.vel.LEFT_HIP.y + data.vel.RIGHT_HIP.y < -TOL) {
        return repDown;
    } else {
        return repTop;
    }
});
let repDown = new State('good', 'down', 1 / 15);
repDown.to(1 / 20, (data) => {
    if (data.vel.LEFT_HIP.y + data.vel.RIGHT_HIP.y > -0.05) {
        if (data.pos.LEFT_HIP.y < data.pos.LEFT_KNEE.y || data.pos.RIGHT_HIP.y < data.pos.RIGHT_KNEE.y) {
            return hipsBelow;
        } else {
            return hipsAbove;
        }
    } else {
        return repDown;
    }
});
let hipsAbove = new State('bad', 'hips above knees', 1 / 10);
hipsAbove.to(1 / 5, (data) => {
    if (data.vel.LEFT_HIP.y + data.vel.RIGHT_HIP.y > TOL) {
        return repUp;
    } else {
        return hipsAbove;
    }
});
let hipsBelow = new State('good', 'hips below knees', 1 / 10);
hipsBelow.to(1 / 5, (data) => {
    if (data.vel.LEFT_HIP.y + data.vel.RIGHT_HIP.y > TOL) {
        return repUp;
    } else {
        return hipsBelow;
    }
});
let repUp = new State('none', 'up', 1 / 5);
repUp.to(1 / 5, (data) => {
    if (data.vel.LEFT_HIP.y + data.vel.RIGHT_HIP.y < TOL) {
        return repTop;
    } else {
        return repUp;
    }
});
let repStates = new FuzzySimulation(repTop);

/**
 * This class functions as the primary use page for the portion of the
 * application dedicated to letting the user analyze their squats. This page is
 * responsible for:
 *
 * 1) Displaying the user with Pose Estimation data
 * 2) Providing immediate feedback in the form of "Good Lift" or "Bad Lift"
 * 3) Allowing the user to set the desired tempo for thier reps of the current
 *    set
 * 4) Providing the user the means to start and end the current analysis with
 *    "Start Set" and "Stop Set" buttons
 * 5) Displaying saved information of sets completed prior, and useful anyltics
 *
 */
@observer
export class MainPage extends Component {
    repCount = 0;
    hipAngle: 'wide' | 'moderate' | 'narrow';
    velocity: Vector3 = new Vector3();
    interval;

    constructor(props) {
        super(props);
        makeObservable(this, {
            repCount: observable,
            velocityDirection: computed,
            // hipAngle: observable,
            // depth: computed,
            evaluateRules: action,
        });
    }

    componentDidMount() {
        POSER.start();
        repStates.reset();
        POSER.addSimulation(repStates);
        this.interval = setInterval(() => this.evaluateRules(), 100); // 100 ms
    }

    evaluateRules() {
        let s = POSER.data.summarize(0.1, false);
        let newVelocity = s.vel.LEFT_HIP.clone().add(s.vel.RIGHT_HIP).scale(0.5);
        let newDir = velToVelDir(newVelocity);
        if (newDir == 'up' && this.velocityDirection != 'up') {
            this.repCount += 1;
        }
        this.velocity = newVelocity;
    }

    get velocityDirection(): VelocityDir {
        return velToVelDir(this.velocity);
    }

    componentWillUnmount() {
        POSER.removeSimulation(repStates);
        clearInterval(this.interval);
    }

    render() {
        return <Container>
            <PoserCanvas delay={0.1} />
            <StateView sim={repStates} />
            {this.velocityDirection} -- {this.repCount}
        </Container>;
    }
}
