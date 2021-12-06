import { observer } from "mobx-react";
import { Component } from "react";
import { Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

/**
 * A class that literally just contains the necessities to ask the user if
 * they'd like to do an easy setup or advanced setup
 */
@observer
export class StartPage extends Component {
    render() {
        return <Container>
            <Link to="/squat/easy_config">
                <Button size='lg'>Easy Config</Button>
            </Link>
            <Link to="/squat/advanced_config">
                <Button size='lg'>Advanced Config</Button>
            </Link>
        </Container>;
    }
}
