import { autorun, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import { Component, useEffect } from "react";
import { Alert, Row } from "react-bootstrap";
import { Simulation, State } from "./state";

@observer
export class StateView extends Component<{ sim: Simulation }> {
    constructor(props) {
        super(props);
    }

    render() {
        let variant = 'secondary';
        if (this.props.sim.displayMode.status == 'good') {
            variant = 'success';
        } else if (this.props.sim.displayMode.status == 'bad') {
            variant = 'danger';
        }
        return <Alert variant={variant}>
            {this.props.sim.displayMode.name}
        </Alert>;
    }
}
