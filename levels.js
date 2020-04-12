// x -> RANGE: 640 - 0 -> CALLIBRATE 620 - 20 -> BOUND 600 - 40
// y -> RANGE: 0 - 480 -> CALLIBRATE 20 - 460 -> BOUND 40 - 440

const widthOffset = 20;

const ballSize = 40;

const ballSpeed = 3.33;

const paddleHeight = 20;
const paddleWidth = 200;

const upperPaddleY = 20 + paddleHeight;
const lowerPaddleY = 460 - paddleHeight;


const callibrationBars = [
    {
        start: 20,
        end: 40,
    },
    {
        start: 170,
        end: 190,
    },
    {
        start: 450,
        end: 470,
    },
    {
        start: 600,
        end: 620,
    },
];

const startBars = [
    {
        start: 235,
        end: 255,
    },
    {
        start: 385,
        end: 405,
    },
];