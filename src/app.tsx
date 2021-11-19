import { render } from "react-dom";
import { Nav } from "react-bootstrap";
import { BrowserRouter, NavLink } from "react-router-dom";
import { Routes, Route } from "react-router";
import { Todos, TodoApp } from "./screens/todos";
import { PoseApp } from "./screens/pose";
import { ViolinApp } from "./screens/violin";
import { SquatAppManager } from "./screens/squat/squat_app_manager";
import { Component } from "react";
import { observer } from "mobx-react";
import { POSER } from "./pose";
import { StartPage } from "./screens/squat/start_page";
import { EasyConfigPage } from "./screens/squat/easy_config_page";
import { AdvancedConfigPage } from "./screens/squat/advanced_config_page";
import { MainPage } from "./screens/squat/main_page";

const todos = new Todos();
let basename = '/';
if (location.origin.endsWith('samsartor.com')) {
    basename = '/pose-review';
}

@observer
class App extends Component {
    render() {
        return <BrowserRouter basename={basename}>
            <Nav as="ul">
                <Nav.Item as="li">
                    <Nav.Link as={NavLink} to="/">Pose</Nav.Link>
                </Nav.Item>
                <Nav.Item as="li">
                    <Nav.Link as={NavLink} to="/violin">Violin</Nav.Link>
                </Nav.Item>
                <Nav.Item as="li">
                    <Nav.Link as={NavLink} to="/squat/start_page">Squat</Nav.Link>
                </Nav.Item>
                <Nav.Item as="li">
                    <Nav.Link as={NavLink} to="/todos">TODO</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link disabled>Status: {POSER.status}</Nav.Link>
                </Nav.Item>
            </Nav>
            <Routes>
                <Route path="/" element={<PoseApp />} />
                <Route path="/todos" element={<TodoApp todos={todos} />} />
                <Route path="/violin" element={<ViolinApp />} />
                {/* <Route path="/squat" element={<SquatAppManager />} /> */}
                <Route path="/squat/start_page" element={<StartPage />} />
                <Route path="/squat/easy_config" element={<EasyConfigPage />} />
                <Route path="/squat/advanced_config" element={<AdvancedConfigPage />} />
                <Route path="/squat/main_page" element={<MainPage />} />
            </Routes>
        </BrowserRouter>;
    }
}

render(<App />, document.getElementById('app'));
