import { observer } from "mobx-react";
import { Component } from "react";
import { StartPage } from "./start_page";
import { EasyConfigPage } from "./easy_config_page";
import { AdvancedConfigPage } from "./advanced_config_page";
import { MainPage } from "./main_page";
import { Button } from "react-bootstrap";


/**
 * This class manages the portion of the application dedicated to letting the
 * user analyze their squats. The primary function of this class is to act as a
 * container for persistent data, and to act as a screen manager that changes
 * what the user sees as appropriate.
 * 
 * The manager avoids requiring a copious number of pages from being created
 * seperately.
 */
@observer
export class SquatAppManager extends Component {
    // Make StartPage, display it, and store the result of the operation (easy
    // or advanced)

    // start_page = new start_page
    // display start_page
    // easy_or_advanced = result of start_page

    
    // Make EasyConfigPage or AdvancedConfigPage, display it, and store the
    // results (appropriate/desired squat stance width) respectively

    // config_page = (easy) ? easy_config_page : advanced_config_page
    // display config_page
    // stance_width = result of config_page


    // Make and display MainPage

    // main_page = new main_page
    // display main_page
    render() {

        return (
            <><Button as="input" type="submit" value="Easy Config" />{' '} <Button as="input" type="submit" value="Advanced Config" /></>
        );
    }
}