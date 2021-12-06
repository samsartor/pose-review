import { Component } from "react";
import { Button, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

export class LandingPage extends Component {
    render() {
        return <Container className="my-4">
            <h1>Automating Expert Guidance with Pose Estimation</h1>
            Get started with a demo:
            <Row>
                <Link to="/violin" className="mt-3">
                    <Button size='lg'>Violin Posture</Button>
                </Link>
            </Row>
            <Row>
                <Link to="/squat/start_page" className="mt-3">
                    <Button size='lg'>Powerlifting</Button>
                </Link>
            </Row>
            <Row>
                <Link to="/debug" className="mt-3">
                    <Button size='lg' variant='light'>Debug</Button>
                </Link>
            </Row>
        </Container>;
    }
}
