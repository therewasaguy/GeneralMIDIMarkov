    // <script language="javascript" type="text/javascript" src="./lib/require.js"></script> 
requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: '../',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        tone: '../Tone',
        // Transport: '../Tone/core/Transport'
    //     transport: '../../lib/Tone/core/Transport',
    }
});


// Start the main app logic.
requirejs(['tone/core/Transport.js'],
function   (Transport) {
  // window.Tone = Tone;
});

// requirejs(['../Tone/core/Transport.js'],
// function   (Transport) {

// });