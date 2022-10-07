import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
testSupport([
    { client: 'Chrome' },
]);
function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
    if (!isSupported) {
        alert(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
            `is not well supported at this time, expect some flakiness while we improve our code.`);
    }
}
console.log(window); //windowはcodepenのものくさい？？いや、名称がcodepenなだけかも
const controls = window;
//console.log(window.FPS())
//console.log("controls: ", controls); //windowと同一
const LandmarkGrid = window.LandmarkGrid;
const drawingUtils = window;
const mpPose = window;
const options = {
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}/${file}`;
    }
};

// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
const grid = new LandmarkGrid(landmarkContainer, {
    connectionColor: 0xCCCCCC,
    definedColors: [{ name: 'LEFT', value: 0xffa500 }, { name: 'RIGHT', value: 0x00ffff }],
    range: 2,
    fitToGrid: true,
    labelSuffix: 'm',
    landmarkSize: 2,
    numCellsPerAxis: 4,
    showHidden: false,
    centered: true,
});
let activeEffect = 'mask';
let recStatus = false;
let currentRecData = [];
let currentRecWorldData = [];
let recStartTime = 0;
let enableSaveLocal = true;
let enable2DRec = false;
let enable3DRec = true;
let prevTime = 0;
let prevTime_w = 0;

function fetchPost(sendingObj){

    let sendingStr = JSON.stringify(sendingObj);
    console.log(sendingStr);
    console.log(sendingStr.length);

    const fetch_options = {
        method: 'POST',
        body: sendingStr,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    fetch('http://192.168.1.28:3000', fetch_options)
    .then(res => res.json())
    .then(res => console.log(res))
    .catch((error) => {
        console.error('Error: ', error);
    });

}

function postRecordedData() {

    //send those 3 in one json data.
    //console.log(currentRecData);
    //console.log(mpPose.POSE_CONNECTIONS);
    //console.log(mpPose.POSE_LANDMARKS);

    let dstr = Date();
    let idx = dstr.indexOf(":");
    let title = dstr.slice(4, idx + 6);

    /*
    let sendingObj = {
        title: title+"_2D",
        millisec_from_1970_1_1: Date.now(),
        motion_data: currentRecData,
        pose_landmarks: mpPose.POSE_LANDMARKS,
        pose_connections: mpPose.POSE_CONNECTIONS
    };
    
    let sendingObj_w = {
        title: title+"_3D",
        millisec_from_1970_1_1: Date.now(),
        motion_data: currentRecWorldData,
        pose_landmarks: mpPose.POSE_LANDMARKS,
        pose_connections: mpPose.POSE_CONNECTIONS
    };
    */

    if (enableSaveLocal && enable2DRec && enable3DRec) {
        // code for saving local file. file name = datetime.
        let savingObj = {
            title: title,
            millisec_from_1970_1_1: Date.now(),
            motion_data_2D: currentRecData,
            motion_data_3D: currentRecWorldData,            
            pose_landmarks: mpPose.POSE_LANDMARKS,
            pose_connections: mpPose.POSE_CONNECTIONS
        };

        const fileName = "MotionData_"+title+".json";
        const data = JSON.stringify(savingObj);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = "data:text/plain," + encodeURIComponent(data);
        //`data:application/json;charset=utf-8,${JSON.stringify(data)}`
        link.click();
        console.log("hello");

    }

    if (enableSaveLocal && enable2DRec && !enable3DRec) {
        // code for saving local file. file name = datetime.
        let savingObj = {
            title: title,
            millisec_from_1970_1_1: Date.now(),
            motion_data_2D: currentRecData,
            //motion_data_3D: currentRecWorldData,            
            pose_landmarks: mpPose.POSE_LANDMARKS,
            pose_connections: mpPose.POSE_CONNECTIONS
        };

        const fileName = "MotionData_"+title+".json";
        const data = JSON.stringify(savingObj);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = "data:text/plain," + encodeURIComponent(data);
        //`data:application/json;charset=utf-8,${JSON.stringify(data)}`
        link.click();
        console.log("hello");

    }

    if (enableSaveLocal && !enable2DRec && enable3DRec) {
        // code for saving local file. file name = datetime.
        let savingObj = {
            title: title,
            millisec_from_1970_1_1: Date.now(),
            //motion_data_2D: currentRecData,
            motion_data_3D: currentRecWorldData,            
            pose_landmarks: mpPose.POSE_LANDMARKS,
            pose_connections: mpPose.POSE_CONNECTIONS
        };

        const fileName = "MotionData_"+title+".json";
        const data = JSON.stringify(savingObj);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = "data:text/plain," + encodeURIComponent(data);
        //`data:application/json;charset=utf-8,${JSON.stringify(data)}`
        link.click();
        console.log("hello");

    }

    //fetchPost(sendingObj);                //公園通りクラシックスで一時カット
    //fetchPost(sendingObj_w);              //公園通りクラシックスで一時カット
}

function onResults(results) {
    //console.log(results);     //この中にはposeLandmarksとposeWorldLandmarksがあってYesの時だけsegmentationMaskがあった。
    //タイムスタンプはどこだ？
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays. ここでsaveしたコンテクストがrestore時に上にかぶさってくる。これでオーバーレイできるということらしい。
    // https://html5.litten.com/understanding-save-and-restore-for-the-canvas-context/
    //canvasCtx.save(); //canvasElement.getContext('2d');  このコード⇩だと、大丈夫みたい。なくても。そもそもオーバーレイない。
    //canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    //console.log(results.segmentationMask);    //booleanじゃない。存在はしてそうだった。
    if (results.segmentationMask) {
        //console.log('hello')  //helloでない。何変更しても変わらないのはこのせいだ。ここ読まれてない。
        canvasCtx.drawImage(//ここコメントアウトしても何も変わらないのだが。何書いてるんだろう。
        results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
        //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        // Only overwrite existing pixels.
        if (activeEffect === 'mask' || activeEffect === 'both') {
            canvasCtx.globalCompositeOperation = 'source-in'; //オーバーラップ時の色の混ぜ方。
            //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
            // This can be a color or a texture or whatever...
            canvasCtx.fillStyle = '#00FF007F'; //緑？
            //canvasCtx.fillStyle = '#FFFF007F';    //試しに変えてみた？何も変わらない。
            //canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        else {
            canvasCtx.globalCompositeOperation = 'source-out';
            canvasCtx.fillStyle = '#0000FF7F'; //青？
            //canvasCtx.fillStyle = '#FF00007F'; //変更してみた？変わった場所がわからん。
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        // Only overwrite missing pixels.
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.globalCompositeOperation = 'source-over';
    }
    else {
        //ここ消したら背景のビデオ映像が消えた！
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }
    if (results.poseLandmarks) {
        //console.log('hello2')
        //ここは読まれてる。detectしていれば。
        //const drawingUtils = window;と上の方に書いてある。
        drawingUtils.drawConnectors(//繋いでる線が消える。
        canvasCtx, results.poseLandmarks, mpPose.POSE_CONNECTIONS, { visibilityMin: 0.65, color: 'white' });
        //console.log(results.poseLandmarks)            //タイムスタンプない

        let t = Date.now()-recStartTime;
        if (t > prevTime + 15) {
            let r = results.poseLandmarks;
            let tof = {
                timeOfFrame: t,
            };
            r.push(tof);                  //取り急ぎdate.now()で。
            
            if (recStatus) currentRecData.push(r);
            prevTime = t;
        }
        drawingUtils.drawLandmarks(//顔の左半分のトラック情報のオレンジ色の点がきえた
        canvasCtx, Object.values(mpPose.POSE_LANDMARKS_LEFT)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
        drawingUtils.drawLandmarks(//右半分
        canvasCtx, Object.values(mpPose.POSE_LANDMARKS_RIGHT)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
        drawingUtils.drawLandmarks(//コメントアウトで顔の真ん中の点とか消える。
        canvasCtx, Object.values(mpPose.POSE_LANDMARKS_NEUTRAL)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'white' });
    }
    //canvasCtx.restore();
    if (results.poseWorldLandmarks) {
        //console.log(results.poseWorldLandmarks);        //タイムスタンプ入ってない？
        let t = Date.now()-recStartTime;
        //console.log("t: ", t);
        //console.log("prevTime_w: ", prevTime_w)
        if (t > prevTime_w + 15) {
            let r = results.poseWorldLandmarks;
            let tof = {
                timeOfFrame: t,
            };
            r.push(tof);                  //取り急ぎdate.now()で。
            //console.log(r);

            if (recStatus) currentRecWorldData.push(r);
            prevTime_w = t;
        }

        grid.updateLandmarks(results.poseWorldLandmarks, mpPose.POSE_CONNECTIONS, [
            { list: Object.values(mpPose.POSE_LANDMARKS_LEFT), color: 'LEFT' },
            { list: Object.values(mpPose.POSE_LANDMARKS_RIGHT), color: 'RIGHT' },
        ]);
    }
    else {
        grid.updateLandmarks([]);
    }
}
//ここからがメインコードか？
const pose = new mpPose.Pose(options);      //mpPose = window、このoptionsの中にmediapipeライブラリ　へのリンクが入っている。　
pose.onResults(onResults);
console.log(pose);  // Ybという謎のものが帰ってきている。windowの中のPoseの中だからか。
//こっからしたコンパネ
// Present a control panel through which the user can manipulate the solution
// options.

let prevEnableRec = false;

new controls //あたらしいwindowをつくっている。windowの中にsliderとか入ってる。
    .ControlPanel(controlsElement, {        //controlsElementがHTMLのコンパネエリア。
    selfieMode: false,
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    effect: 'background',
    enableRec: false,
    enableRec2D: false,
    enableRec3D: true,
    saveLocalFile: true,
})
    .add([
    //new controls.StaticText({ title: 'MediaPipe Pose' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onSourceChanged: () => {
            // Resets because this model gives better results when reset between
            // source changes.
            pose.reset();
        },
        onFrame: async (input, size) => {       //
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            canvasElement.width = width;
            canvasElement.height = height;
            await pose.send({ image: input });      //ここで送ってる！
        },
    }),
    new controls.Slider({
        title: 'Model Complexity',
        field: 'modelComplexity',
        discrete: ['Lite', 'Full', 'Heavy'],
    }),
    new controls.Toggle({ title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
    new controls.Toggle({ title: 'Enable Segmentation', field: 'enableSegmentation' }),
    new controls.Toggle({ title: 'Smooth Segmentation', field: 'smoothSegmentation' }),
    new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Effect',
        field: 'effect',
        discrete: { 'background': 'Background', 'mask': 'Foreground' },
    }),
    new controls.Toggle({ title: 'Recording', field: 'enableRec' }),
    new controls.Toggle({ title: 'Rec 2D', field: 'enableRec2D' }),
    new controls.Toggle({ title: 'Rec 3D', field: 'enableRec3D' }),
    new controls.Toggle({ title: 'Save Local', field: 'saveLocalFile' }),
])
    .on(x => {
    const options = x;      //x、すなはちoptionsが、上記の変数です
    videoElement.classList.toggle('selfie', options.selfieMode);
    //console.log(options.selfieMode);        //true/false!
    //console.log(options.enableRec);         //true/false!

    if (!prevEnableRec && options.enableRec) {
        console.log("yes! rec turns on!");
        recStatus = true;
        currentRecData = [];
        recStartTime = Date.now();
        prevTime = 0;
        prevTime_w = 0;
    } else if (prevEnableRec && !options.enableRec){
        console.log("yes!, rec turns off!");
        recStatus = false;
        postRecordedData();
    } else {
        console.log("rec status is the same");
    }
    prevEnableRec = options.enableRec;
    //console.log(controls.enableRec);        //Undefined
    enableSaveLocal = options.saveLocalFile;

    enable2DRec = options.enableRec2D;
    enable3DRec = options.enableRec3D;

    activeEffect = x['effect'];
    pose.setOptions(options);
})
