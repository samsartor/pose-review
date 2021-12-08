import { action, autorun, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import { Component, useEffect } from "react";
import { Alert, Row } from "react-bootstrap";
import { FuzzySimulation, Simulation, State } from "./state";

@observer
export class StateView extends Component<{ sim: Simulation }> {
    weightInfo: string[] | null = null;
    interval;

    constructor(props) {
        super(props);
        makeObservable(this, {
            updateInfo: action,
            weightInfo: observable,
        });
    }

    componentDidMount() {
        this.interval = setInterval(() => this.updateInfo(), 100);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    updateInfo() {
        if (this.props.sim instanceof FuzzySimulation) {
            this.weightInfo = [];
            for (let [state, { into, out }] of this.props.sim.weights) {
                this.weightInfo.push(`${state.name} = ${((into + out) * 100).toFixed(0)}%`);
            }
        } else {
            this.weightInfo = null;
        }
    }

    render() {
        let variant = 'secondary';
        if (this.props.sim.displayMode.status == 'good') {
            variant = 'success';
        } else if (this.props.sim.displayMode.status == 'bad') {
            variant = 'danger';
        }
        return <>
            <Alert variant={variant}>
                {this.props.sim.displayMode.name}
            </Alert>
            {this.weightInfo == null ? null : this.weightInfo.map(text => <p>{text}</p>)}
        </>;
    }
}
