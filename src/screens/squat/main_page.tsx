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

const TOL = 0.1;

let repTop = new State('none', 'top', 1 / 5);
repTop.to(1 / 10, (data) => {
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
let hipsAbove = new State('bad', 'hips above knees', 1 / 10, false);
hipsAbove.to(1 / 5, (data) => {
    return repUp;
});
let hipsBelow = new State('good', 'hips below knees', 1 / 10);
hipsBelow.to(1 / 5, (data) => {
    return repUp;
});
let repUp = new State('none', 'up', 1 / 5);
repUp.to(1 / 5, (data) => {
    if (data.vel.LEFT_HIP.y + data.vel.RIGHT_HIP.y < TOL) {
        return repTop;
    } else {
        return repUp;
    }
});

let fuzzyEcStates = new FuzzySimulation('Squats (fuzzy ec)', repTop);
let fuzzyRawStates = new FuzzySimulation('Squats (fuzzy raw)', repTop, false);
let ecStates = new Simulation('Squats', repTop);
let rawStates = new Simulation('Squats (raw)', repTop, false);
let sims = [ecStates];

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
    hipAngle: 'wide' | 'moderate' | 'narrow';
    selectedSim: Simulation | null = fuzzyRawStates;

    constructor(props) {
        super(props);
        makeObservable(this, {
            selectedSim: observable,
        });
    }

    componentDidMount() {
        POSER.start();
        POSER.clearLog();
        for (let sim of sims) {
            sim.reset();
            POSER.addSimulation(sim);
        }
    }

    componentWillUnmount() {
        for (let sim of sims) {
            POSER.removeSimulation(sim);
        }
    }

    render() {
        return <Container className="my-4">
            <PoserCanvas delay={0.1} />
            {
                sims.map((sim) => {
                    return <>
                        <h2>{sim.name} -- {sim.count(repUp)} reps</h2>
                        <StateView sim={sim} />
                    </>;
                })
            }
        </Container >;
    }
}
