const TARGET_WIDTH = 960;
const TARGET_HEIGHT = 720;

const CALLIBRATION_SIZE = 40;
const TARGET_SIZE = 10;

const ERROR_TOLERANCE = 5;

let video;
let poseNet;
let nose;
let loaded = false;
let started = false;
let calibrated = false;

const loadingDiv = document.getElementById("loading");
const infoDiv = document.getElementById("info");
const instructionSpan = document.getElementById("instruct");
const timeSpan = document.getElementById("time");
const distanceSpan = document.getElementById("distance");

const hideElement = (element) => {
  if (!element.classList.contains("hidden")) {
    element.classList.toggle("hidden");
  }
};

const showElement = (element) => {
  if (element.classList.contains("hidden")) {
    element.classList.toggle("hidden");
  }
};

const invisibleElement = (element) => {
    if (!element.classList.contains("invisible")) {
      element.classList.toggle("invisible");
    }
  };
  
  const visibleElement = (element) => {
    if (element.classList.contains("invisible")) {
      element.classList.toggle("invisible");
    }
  };

function setup() {
  let cnv = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
  cnv.parent("canvasContainer");
  video = createCapture(VIDEO);
  video.hide();

  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on("pose", getPose);
}

const modelLoaded = () => {
  loaded = true;
  hideElement(loadingDiv);
};

const getPose = (poses) => {
  if (poses.length > 0) {
    const p = poses[0].pose;
    if (p.score > 0.15 && p.nose && p.nose.confidence > 0.8) {
        nose = p.nose;
    }
  }
};

const drawPose = (nose) => {
    const { x, y } = nose;
    strokeWeight(0);
    fill(0, 0, 255);
    ellipse(x, y, 8);
};

const drawLevel = (level) => {

    for (let i=0; i < level.length - 1; i++) {
        strokeWeight(4);
        stroke(249, 212, 35);
        line(level[i].x, level[i].y, level[i+1].x, level[i+1].y);
    }
}

const drawPath = (record) => {
    for (let i=0; i < record.length - 1; i++) {
        strokeWeight(3);
        stroke(63, 184, 175);
        line(record[i].x, record[i].y, record[i+1].x, record[i+1].y);
    }
}

const drawTarget = (target, onTarget, size=TARGET_SIZE) => {
    strokeWeight(1);
    stroke(0, 0, 0);
    if ( onTarget ) {
        fill(42,214,157, 90);
    } else {
        fill(255,78,80, 90);
    }
    ellipse(target.x, target.y, size * 2);
}

let state = "callibrate";

let lastOutside = Date.now();

let level = 0;

let record = false;
let recordTime = Date.now();
let points = [];
let levelFinished = false;
let finishedTime = Date.now();

const newLevel = () => {
    record = false;
    points = [];
    levelFinished = false;
}

const distance = (a, b) => {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

const pathDifferences = (path, level) => {
    const distances = path.map(C => {
        const pds = [];
        for (let i=0; i < level.length - 1; i++) {
            const A = level[i];
            const B = level[i + 1];
            const numerator = Math.abs((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x));
            const denomator = Math.sqrt(distance(A,B));
            const output = numerator / denomator;
            if (isNaN(output)){
                console.log(A,B,C, numerator, denomator);
            }
            pds.push(numerator / denomator);
        }
        const smallestDistance = Math.max(pds.reduce((a,b) => a < b ? a : b, pds[0]) - ERROR_TOLERANCE, 0);
        if (isNaN(smallestDistance)){
            console.log(pds, ERROR_TOLERANCE);
        }
        return smallestDistance;
    });
    const finalValue = distances.reduce((a,b) => a + b, 0) / distances.length;
    if (isNaN(finalValue)) {
        console.log(distances);
    }
    return finalValue;
}

function draw() {
    // move image by the width of image to the right
    // then scale it by -1 in the x-axis to flip the image
    // draw video capture feed as image inside p5 canvas
    translate(TARGET_WIDTH, 0);
    scale(- TARGET_WIDTH / video.width, TARGET_HEIGHT / video.height);
    const frame = video.get();
    if (state != "reveal") {
        image(frame, 0, 0);   
    } else {
        clear();
    }

    if (!nose) {
        instructionSpan.innerHTML = "Locating your face!"
        return;
    }

    if (state != "reveal") {
        drawPose(nose);
    }

    if (state == "callibrate") {
        console.log("Callibrating");
        instructionSpan.innerHTML = "Make sure you can reach each of the outer targets. Hover over the center target for 3 seconds to start."
        callibrationPoints.forEach(p => {
            const d = distance(nose, p);
            const withinD = d < CALLIBRATION_SIZE ** 2;
            drawTarget(p, withinD, CALLIBRATION_SIZE);
        });
        const startDistance = distance(nose, startTarget);
        const withinStart = startDistance < TARGET_SIZE ** 2;
        if (!withinStart) {
            lastOutside = Date.now();
        } else {
            instructionSpan.innerHTML = `Starting in ${Math.ceil((lastOutside + 3000 - Date.now()) / 1000)}...`
        }
        drawTarget(startTarget, withinStart);
        if (lastOutside + 3000 < Date.now()) {
            state = "level";
            newLevel();
            level = 0;
        }
    } else if (state == "level") {
        drawLevel(levels[level]);

        if (levelFinished && finishedTime + 500 < Date.now()) {
            console.log("Level Finished");
            state = "reveal"
        } else {
            instructionSpan.innerHTML = "Move to the target circle. It will turn green when you are within it."

            const starter = levels[level][0];
            const distanceToStarter = distance(nose, starter);
            const withinStarter = distanceToStarter < TARGET_SIZE ** 2;
            if (!levelFinished && withinStarter) {
                if (!record) {
                    recordTime = Date.now();
                }
                record = true;
            }
            if (!record || recordTime + 500 > Date.now()) {
                drawTarget(starter, withinStarter);
            }

            if (record) {

                instructionSpan.innerHTML = "Follow the yellow line to the target."
                points.push({x:nose.x, y:nose.y});
            }

            const ender = levels[level][levels[level].length - 1];
            const distanceToEnder = distance(nose, ender);
            const withinEnder = distanceToEnder < TARGET_SIZE ** 2
            if (!levelFinished && withinEnder) {
                
                record = false;
                levelFinished = true;
                finishedTime = Date.now();
                console.log("done");
            }
            if (record || finishedTime + 500 > Date.now()) {
                drawTarget(ender, withinEnder);
            }
        }
    } else if (state == "reveal") {
        drawLevel(levels[level]);
        instructionSpan.innerHTML = `Check out your results. Next round starting in ${Math.ceil((finishedTime + 10500 - Date.now()) / 1000)}.`
        timeSpan.innerHTML = (finishedTime - recordTime) / 1000;
        const diffs = pathDifferences(points, levels[level]);
        console.log(diffs, points, levels[level]);
        if (isNaN(diffs)) {
            console.log(points, levels[level]);
        }
        distanceSpan.innerHTML = diffs;
        visibleElement(infoDiv);
        drawPath(points);
        if (finishedTime + 10500 < Date.now()) {
            invisibleElement(infoDiv);
            console.log("Next Level");
            state = "level";
            newLevel();
            level += 1;
            if (level == levels.length) {
                state = "callibrate";
            }
        }
    } else {
        state = "callibrate"
    }
  }
  