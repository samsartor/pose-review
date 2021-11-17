import { observer } from "mobx-react";
import { Component } from "react";

/**
 * This class functions as the advanced configuration page for the portion of 
 * the application dedicated to letting the user analyze their squats. This 
 * page is responsible for:
 * 
 * 1) Displaying the necessary conditions to be met prior to beginning anlysis
 * 2) Allowing the user to upload images meeting the condition requirements
 * 3) Running the pose estimator on uploaded images, displaying the result, and
 *    deriving relevant information from them, which will in turn be used to 
 *    provide a return value to the SquatAppManager to indicate the appropriate
 *    squat stance for the user.
 * 4) Allowing the user to "fix" any incorrectly placed relevent points 
 *    provided by the pose estimator
 * 5) Displaying the relevent information derived from the pose estimator for
 *    the user to see
 * 6) Allowing the user to re-select images in the case that they are 
 *    unsatisfied with the results
 * 7) Providing a button to start the application when all conditions are met
 * 
 */
@observer
export class AdvancedConfigPage extends Component {
    


}