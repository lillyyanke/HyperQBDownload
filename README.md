Hyper QB Web UI Project - Summer 2024

To run locally:
1. Install node.js and npm
2. Install electron
  *npm install electron --save-dev*
3. Install all dependencies 
  *npm install*
4. Run the app
  *npm start*

To build and executable and fix permissions:
1. *npm run dist*
2. Open the dmg file and move to applications
3. Go to applications folder and open a terminal at HyperQB_Download folder
4. Run *sudo xattr -rd com.apple.quarantine /Applications/HyperQB_Download.app*
5. Enter your password and then open the app regularly