Hyper QB Web UI Project - Summer 2024

To run locally:
1. Install node.js and npm
2. Install electron
  *npm install electron --save-dev*
3. Install all dependencies 
  *npm install*
4. Run the app
  *npm start*
5. On run a folder is created on the users desktop with the input files and output  files

To build an executable and fix permissions:
1. *npm run dist*
2. Open the dmg file and move to applications
3. Go to applications folder and open a terminal at HyperQB_Download folder
4. Run *sudo xattr -rd com.apple.quarantine /Applications/HyperQB_Download.app*
5. Enter your password and then open the app regularly


Structure of the folders:
assets: contains the logos for links to github/TARTwebsite/linkedin/twitter
bin: the binaries for genqbf/HyperRust/quabs
dist: not included on github but will be made on *npm run dist* and will contain the distributable
mini: contains examples for HyperRust
nusmv: needed to run the HyperRust binary
outputs: where the HyperRust HQ.qcir output is placed
test: test files for genqbf/quabs HQ.qcir output placed here
index: UI design and function
main: backend handling the input and running binaries
package-lock: dependencies for Node.js
package: change version # here and include necessary files
preload: bridge between renderer and main
style: UI design
