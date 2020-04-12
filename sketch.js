const TARGET_WIDTH = 960;
const TARGET_HEIGHT = 720;

const CALLIBRATION_SIZE = 40;
const TARGET_SIZE = 10;

const ERROR_TOLERANCE = 5;

let video;
let poseNet;
let shoulders;
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

let xAxis;
let yAxis;

function setup() {
  let cnv = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
  cnv.parent("canvasContainer");
  video = createCapture(VIDEO);
  video.hide();

  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on("pose", getPose);

  xAxis = createVector(1,0);
  yAxis = createVector(0,1);
}

const modelLoaded = () => {
  loaded = true;
  hideElement(loadingDiv);
};

const getPose = (poses) => {
  if (poses.length > 0) {
    shoulders = poses[0].pose.keypoints.filter(kp => {
        return (kp.part == "leftShoulder" || kp.part == "rightShoulder") && kp.score > 0.5;
    });
  } else {
    shoulders = undefined;
  }
};

function drawPose() {
    if (shoulders.length == 2) {
        const x1 = shoulders[0].position.x;
        const y1 = shoulders[0].position.y;
        const x2 = shoulders[1].position.x;
        const y2 = shoulders[1].position.y;
        stroke(0,0,0);
        strokeWeight(4);
        line(x1, y1, x2, y2);
    }

    shoulders.forEach(kp => {
        const {x ,y} = kp.position;
        stroke(0,0,0);
        strokeWeight(2);
        fill(255, 0, 0);
        ellipse(x, y, 8);
    });
};

let state = "callibrate";
let reps = 0;
let ballPosition;
let velocity;
let gameOver = false;
let nextRound;

const newGame = () => {
    reps = 0;
    ballPosition = createVector(320, 240);
    // velocity = p5.Vector.random2D();
    velocity = createVector(0.8, 0.6);
    velocity.mult(ballSpeed);
    gameOver = false;
}

let lastCallibratedCorrectly = Date.now();
function callibration() {

    let instructions = "<b>Callibrating</b> - ";

    const frame = video.get();
    image(frame, 0, 0);   

    if (shoulders) {
        drawPose();
        if (shoulders.length == 2) {
            const distance = Math.abs(shoulders[0].position.x - shoulders[1].position.x);
            if (distance < 130) {
                instructions += "You're too far back. Take a step closer."
            } else if (distance > 170) {
                instructions += "You're too close. Take a step back."
            } else {
                instructions += "Make sure you can align yourself with the red bars."
            }
        } else {
            instructions += "Locating your body."
        }
    } else {
        instructions += "Locating your body."
    }

    instructions += "<br>";

    callibrationBars.forEach(bar => {
        strokeWeight(1);
        if (shoulders && shoulders.some(s => bar.start <= s.position.x && s.position.x <= bar.end)) {
            fill(0,111,60, 20);
        } else {
            fill(191,33,47, 20);
        }
        rect(bar.start, video.height * 0, bar.end - bar.start, video.height);
    });

    startBars.forEach(bar => {
        strokeWeight(1);
        if (shoulders && shoulders.some(s => bar.start <= s.position.x && s.position.x <= bar.end)) {
            fill(0,111,60, 20);
        } else {
            fill(249,167,62, 20);
            lastCallibratedCorrectly = Date.now();
        }
        rect(bar.start, video.height * 0, bar.end - bar.start, video.height);
    });

    const now = Date.now();
    if (lastCallibratedCorrectly + 3000 < now) {
        newGame();
        state = "play";
    } else {
        if (now - lastCallibratedCorrectly > 500) {
            instructions += `Starting in ${3 - Math.floor((now - lastCallibratedCorrectly) / 1000)}`;
        } else {
            instructions += "When ready, hover over middle bars for 3 seconds.";
        }
    }

    instructionSpan.innerHTML = instructions;
}


let center = 320;
function playGame() {

    noStroke();
    const frame = video.get();
    image(frame, 0, 0);
    fill(0, 0, 0);
    rect(0, 0, widthOffset, video.height);
    rect(video.width - widthOffset, 0, widthOffset, video.height);
    stroke(1);
    if (!shoulders) {
        return;
    }

    // Draw ball
    stroke(0, 0, 0);
    strokeWeight(1);
    fill(39,179,118, 80);
    ellipse(ballPosition.x, ballPosition.y, ballSize);

    // Draw paddles
    if (shoulders.length == 2) {
        center = (shoulders[0].position.x + shoulders[1].position.x) / 2
        console.log(center);
    }
    stroke(0, 0, 0);
    strokeWeight(1);
    fill(38,75,150, 80);
    rect(center - paddleWidth / 2, upperPaddleY, paddleWidth,  - paddleHeight);
    rect(center - paddleWidth / 2, lowerPaddleY, paddleWidth, paddleHeight);

    // Update ball
    ballPosition.add(velocity);

    const leftBound = widthOffset + ballSize / 2;
    if (ballPosition.x <= leftBound) {
        const difference = leftBound - ballPosition.x;
        velocity.set(-velocity.x, velocity.y);
        ballPosition.set(leftBound + difference, ballPosition.y);
    }

    const rightBound = video.width - widthOffset - ballSize / 2;
    if (ballPosition.x >= rightBound) {
        const difference = ballPosition.x - rightBound;
        velocity.set(-velocity.x, velocity.y);
        ballPosition.set(rightBound - difference, ballPosition.y);
    }

    const canPaddleBounce = Math.abs(center - ballPosition.x) <= paddleWidth / 2;

    const upperBound = upperPaddleY + ballSize / 2;
    if (ballPosition.y <= upperBound) {
        if (canPaddleBounce && !gameOver) {
        const difference = upperBound - ballPosition.y;
        velocity.set(velocity.x + Math.random() - 0.5, -velocity.y);
        velocity.normalize();
        velocity.mult(ballSpeed);
        ballPosition.set(ballPosition.x + Math.random(), upperBound + difference);
        reps += 1;
        } else {
            gameOver = true;
        }
    }

    const lowerBound = lowerPaddleY - ballSize / 2;
    if (ballPosition.y >= lowerBound) {
        if (canPaddleBounce && !gameOver) {
            const difference = ballPosition.y - lowerBound;
            velocity.set(velocity.x + Math.random() - 0.5, -velocity.y);
            velocity.normalize();
            velocity.mult(ballSpeed);
            ballPosition.set(ballPosition.x, lowerBound - difference);
            reps += 1;
        } else {
            gameOver = true;
        }
    }
    console.log(gameOver);

    // Check lose
    if (gameOver && (ballPosition.y < 0 + ballSize / 2 || ballPosition.y > video.height - ballSize / 2)) {
        goToReveal();
    }
}

function goToReveal() {
    nextRound = Date.now() + 5000;
    state = "reveal";
}

function showReveal() {
    const score =  `GAME OVER\n  ${reps} bounces`
    scale(-1, 1);
    translate(-video.width, 0);
    fill(38,75,150);
    textSize(50);
    text(score, 320 - 200, 240 - 150, 400, 300);
    console.log(nextRound);
    instructionSpan.innerHTML = `New game in ${Math.ceil((nextRound - Date.now() )/1000)} seconds.`

    if (Date.now() > nextRound) {
        state = "callibrate";
    }
}

let debug = false;

function draw() {
    // move image by the width of image to the right
    // then scale it by -1 in the x-axis to flip the image
    // draw video capture feed as image inside p5 canvas
    clear();
    instructionSpan.innerHTML = "";
    translate(TARGET_WIDTH, 0);
    scale(- TARGET_WIDTH / video.width, TARGET_HEIGHT / video.height);

    if (debug) {
        goToReveal();
        reps = 50;
        debug = false;
    }

    console.log("state: ", state);
    if (state == "callibrate") {
        callibration();
    } else if (state == "play") {
        playGame();
    } else if (state == "reveal") {
        showReveal();
    } else {
        state = "callibrate"
    }
}
  