# Building

1. Instal [Node.js](https://nodejs.org/en/download/) if it is not already installed.

2. Run the installer

3. Verify the installation with the following commands:
   - `node -v`
   - `npm -v`

4. Install the [`yarn` package manager](https://yarnpkg.com/):
   - `npm install -g yarn`

5. Clone the git repository to the desired location:
   - `git clone https://github.com/samsartor/pose-review.git`

6. Enter cloned repository

7. Run `yarn install`
   - If you have a windows machine, you may run into difficulty with your ExecutionPolicy. If you do, run:
     - `Get-ExecutionPolicy`
     
     This will tell you the system's current configuration (call it '<RESULT>'). To run "yarn install", you will likely have to run:
     - `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
     
     Aftwerwards, you may switch it back to the previous configuration, if desired, with:
     - `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy <RESULT>`
     
     **NOTE:** you will need a RemoteSigned ExecutionPolicy for the next command as well, so returning the ExectionPolicy to the prior configuration should be done after step 8.

8. Run `yarn start`

9. Copy the produced link and paste it in your web browser to run the application.
