import { Vector3 } from "@math.gl/core";
import { action, makeObservable, observable, computed } from "mobx";
import { observer } from "mobx-react";
import { Component, createRef } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { POSER, PoserCanvas } from "../../pose";
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
        this.interval = setInterval(() => this.evaluateRules(), 100); // 100 ms
    }

    evaluateRules() {
        let s = POSER.data.summarize(0.1, false);
        let newVelocity = s.vel.LEFT_HIP.clone().add(s.vel.RIGHT_HIP).scale(0.5);
        console.log(newVelocity);
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
        clearInterval(this.interval);
    }

    render() {
        return <Container>
            <PoserCanvas delay={0.1} />
            {this.velocityDirection} -- {this.repCount}
        </Container>;
    }
}
