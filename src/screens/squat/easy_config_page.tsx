import { observer } from "mobx-react";
import { Component } from "react";
import { Button, InputGroup } from "react-bootstrap";
import { Link } from "react-router-dom";

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
        return <>
            <InputGroup>
                <InputGroup.Radio>Wide</InputGroup.Radio>
                <InputGroup.Radio>Moderate</InputGroup.Radio>
                <InputGroup.Radio>Narrow</InputGroup.Radio>
            </InputGroup>
        </>;
    }
}
