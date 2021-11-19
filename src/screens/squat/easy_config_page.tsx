import { observer } from "mobx-react";
import { Component } from "react";
import { Button, Container, InputGroup, Form } from "react-bootstrap";
import { RadioGroup, Radio } from "react-radio-group";
import { Link } from "react-router-dom";
import { SQUAT_CONFIG } from "./config_data";

/**
 * This class functions as the easy configuration page for the portion of the
 * application dedicated to letting the user analyze their squats. This page is
 * intended to provide an easy and streamlined setup, and ist therefore
 * responsible for only:
 *
 * 1) Asking if the user prefers a wide, moderate, or narrow stance
 * 2) Allowing the user to start the application once a preffered stance is
 *    selected
 *
 */
@observer
export class EasyConfigPage extends Component {
    render() {
        return <Container>
            <Form.Label>Stance</Form.Label>
            <RadioGroup name="stance" selectedValue={SQUAT_CONFIG.stance} onChange={v => SQUAT_CONFIG.setStance(v)}>
                <Form.Check type="radio" as={Radio} value="wide" label="Wide"/>
                <Form.Check type="radio" as={Radio} value="moderate" label="Moderate"/>
                <Form.Check type="radio" as={Radio} value="narrow" label="Narrow" />
            </RadioGroup>
            <Link to='/squat/main_page'>
                <Button size='lg'>Start</Button>
            </Link>
        </Container>;
    }
}
