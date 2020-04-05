// x -> RANGE: 640 - 0 -> CALLIBRATE 620 - 20 -> BOUND 600 - 40
// y -> RANGE: 0 - 480 -> CALLIBRATE 20 - 460 -> BOUND 40 - 440

const callibrationPoints = [
    {
        x: 620,
        y: 20,
    },
    {
        x: 20,
        y: 20,
    },
    {
        x: 20,
        y: 460,
    },
    {
        x: 620,
        y: 460,
    },
];

const startTarget = {
    x: 320,
    y: 240,
};

const levels = [
// LEVEL 1
    [
        {
            x: 600,
            y: 240,
        },
        {
            x: 40,
            y: 240,
        },
    ],
// LEVEL 2
    [
        {
            x: 600,
            y: 170,
        },
        {
            x: 488,
            y: 170,
        },
        {
            x: 376,
            y: 340,
        },
        {
            x: 264,
            y: 340,
        },
        {
            x: 152,
            y: 170,
        },
        {
            x: 40,
            y: 170,
        },
    ],
// LEVEL 3
    [
        {
            x: 600,
            y: 40,
        },
        {
            x: 420,
            y: 310,
        },
        {
            x: 220,
            y: 310,
        },
        {
            x: 420,
            y: 170,
        },
        {
            x: 220,
            y: 170,
        },
        {
            x: 40,
            y: 440,
        },
    ],
];

// x -> RANGE: 640 - 0 -> CALLIBRATE 620 - 20 -> BOUND 600 - 40
// y -> RANGE: 0 - 480 -> CALLIBRATE 20 - 460 -> BOUND 40 - 440