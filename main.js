/// <reference path="p5.js" />

// How many grid cells per axis
let gridSize = 10;

// All the ships on player 1s field
let ships = [];

// All the ships on player 2s field
let otherShips = [];

// The field data
let fieldData = [];
let otherFieldData = [];

let attackData = [{
    x: -1,
    y: -1,
    i: -1,
}, ];

// -1: Game hasn't started yet; 0: Player 1; 1: Player 2
let currentPlayer = -1;
let gameOver = -1;

let aiTurnStarted = -1;
let playerFinished = false;
let aiVsAi = false;

let aiAlgorithm = "probability";

let showProbabilityOverlay = false;

// The data for how the ships should be generated
let shipData = [{
        width: 2,
        height: 1,
    },
    {
        width: 3,
        height: 1,
    },
    {
        width: 3,
        height: 1,
    },
    {
        width: 4,
        height: 1,
    },
    {
        width: 5,
        height: 1,
    },
];

let numberOfMovesStorage = [];

// Temporary data for dragging ships with the mouse
let dragStatus = {
    ship: undefined,
    dragging: false,
};

let waitAfterGameOver = false;

let defaultFont;

let buttons = [];

function preload() {
    defaultFont = loadFont("Roboto.ttf");
}

function setup() {
    // Create a fullscreen canvas
    createCanvas(windowWidth, windowHeight);
    fullscreen();

    textFont(defaultFont);

    buttons = [];
    buttons.push(new Button(aiVsAi ? "Player vs AI" : "AI vs AI", color(50, 50, 50), {startX: 10, startY: 10, endX: 110, endY: 50}, () => {
        aiVsAi = !aiVsAi;
        setup();
    }));
    buttons.push(new Button("Start the game", color(50, 50, 50), {startX: width / 2 - 75, endX: width / 2 + 75, startY: 80, endY: 120}, () => {
        if (currentPlayer == -1) {
            currentPlayer = 0;
        }
    }, () => currentPlayer == -1));
    buttons.push(new Button("Start a new game", color(50, 50, 50), {startX: width / 2 - 75, endX: width / 2 + 75, startY: 80, endY: 120}, () => {
        if (gameOver != -1) {
            currentPlayer = 0;
            gameOver = -1;
            setup();
        }
    }, () => gameOver != -1));
    buttons.push(new Button("Toggle probability overlay", color(50, 50, 50), {startX: width - 220, endX: width - 10, startY: 10, endY: 50}, () => {
        showProbabilityOverlay = !showProbabilityOverlay;
    }));

    buttons.push(new Button("Probability", color(50, 50, 50), {startX: 10, startY: height - 50, endX: 130, endY: height - 10}, () => {
        aiAlgorithm = "probability";
        setup();
    }));
    buttons.push(new Button("Random", color(50, 50, 50), {startX: 10, startY: height - 100, endX: 130, endY: height - 60}, () => {
        aiAlgorithm = "random";
        setup();
    }));

    ships = generateRandomShipLayout(0);
    otherShips = generateRandomShipLayout(1);

    if (aiVsAi) {
        currentPlayer = 0;
    }

    fieldData = [];
    otherFieldData = [];

    for (let x = 0; x < gridSize; x++) {
        fieldData.push([]);
        otherFieldData.push([]);
        for (let y = 0; y < gridSize; y++) {
            fieldData[x][y] = 0;
            otherFieldData[x][y] = 0;
        }
    }

    currentPlayer = -1;
    gameOver = -1;

    aiTurnStarted = -1;
    playerFinished = false;

    attackData = [{
        x: -1,
        y: -1,
        i: -1,
    }, ];

    waitAfterGameOver = false;

    frameRate(aiVsAi ? Infinity : 60);
}

function draw() {
    cursor("default");

    if (waitAfterGameOver) {
        noLoop();
        setup();
        loop();

        let lowest = Infinity;
        let highest = -Infinity;

        let totalNumberOfMoves = 0;
        for (let numberOfMovesStorageEntry of numberOfMovesStorage) {
            let numberOfMoves = numberOfMovesStorageEntry.player1.hasWon ? numberOfMovesStorageEntry.player1.numberOfMoves : numberOfMovesStorageEntry.player2.numberOfMoves;
            totalNumberOfMoves += numberOfMoves;

            if (numberOfMoves < lowest) {
                lowest = numberOfMoves;
            }
            if (numberOfMoves > highest) {
                highest = numberOfMoves;
            }
        }
        let averageNumberOfMoves = totalNumberOfMoves / numberOfMovesStorage.length;

        if (numberOfMovesStorage.length % 10 == 0)
            console.log("Average: " + round(averageNumberOfMoves, 1), "Games played: " + numberOfMovesStorage.length);
    }

    if ((playerFinished || aiVsAi) && aiTurnStarted <= frameCount - (aiVsAi ? 5 : 20)) {
        playerFinished = false;
        aiAttack((currentPlayer + 1) % 2);
    }

    if (currentPlayer != -1) {
        gameOver = checkForGameOver();
        if (gameOver != -1) {
            if (aiVsAi)
                waitAfterGameOver = true;
            numberOfMovesStorage.push({
                player1: {
                    numberOfMoves: getMoveCountOfPlayer(0),
                    hasWon: gameOver == 1,
                },
                player2: {
                    numberOfMoves: getMoveCountOfPlayer(1),
                    hasWon: gameOver == 0,
                },
            });
        }
    }
    
    // Blue background
    background(0, 90, 180);

    for (let button of buttons) {
        button.draw();
    }

    // Draw the field
    drawFields();

    // Draw the ships
    for (let ship of ships) {
        ship.draw();
    }
    for (let ship of otherShips) {
        ship.draw();
    }

    // Draw the data
    drawData();

    // Draw probability overlay
    if (gameOver == -1 && showProbabilityOverlay && !aiVsAi) {
        let probabilityData = getHighestProbabilityCell(1);
        let gridCellSize = getGridCellSize();

        let highestColor = color(255, 0, 255);
        let lowestColor = color(0, 255, 255);

        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                if (otherFieldData[x][y] != 0) continue;

                let coords = fieldCoordsToCanvasCoords(x, y, 1);

                textSize(10);
                strokeWeight(1);

                let lerpFactor = map(
                    probabilityData.probabilityMap[x][y],
                    probabilityData.lowestValue,
                    probabilityData.highestValue,
                    0,
                    1
                );
                let currentColor = lerpColor(
                    lowestColor,
                    highestColor,
                    pow(lerpFactor, 5)
                );

                stroke(currentColor);
                fill(currentColor);

                rect(coords.x + 5, coords.y + 5, gridCellSize - 10, gridCellSize - 10);
            }
        }
    }
}

//#region Generation

function generateRandomShipLayout(fieldIndex) {
    let shipBounds = [];

    for (let shipDataEntry of shipData) {
        while (true) {
            // Generate random ship bounds
            let horizontal = random(0, 1) > 0.5;

            let position = {
                x: floor(
                    random(
                        0,
                        gridSize - (horizontal ? shipDataEntry.width : shipDataEntry.height)
                    )
                ),
                y: floor(
                    random(
                        0,
                        gridSize - (horizontal ? shipDataEntry.height : shipDataEntry.width)
                    )
                ),
            };
            let bounds = {
                startX: position.x,
                startY: position.y,
                endX: position.x +
                    (horizontal ? shipDataEntry.width : shipDataEntry.height),
                endY: position.y +
                    (horizontal ? shipDataEntry.height : shipDataEntry.width),
            };

            // Check if the bounds collide with any other ship
            let collides = false;
            for (let otherShip of shipBounds) {
                if (boundsIntersect(bounds, otherShip)) {
                    collides = true;
                    break;
                }
            }

            if (!collides) {
                shipBounds.push(bounds);
                break;
            }
        }
    }

    // Generate the ship objects from the bounds
    let ships = [];
    for (let shipBoundary of shipBounds) {
        ships.push(
            new Ship(
                shipBoundary.startX,
                shipBoundary.startY,
                shipBoundary.endX - shipBoundary.startX,
                shipBoundary.endY - shipBoundary.startY,
                fieldIndex
            )
        );
    }

    return ships;
}

//#endregion Generation

//#region Ship Drag

function startDrag(ship, shipCanvasBounds) {
    // The offset from the top left of the ship
    let mouseOffsetX = shipCanvasBounds.startX - mouseX;
    let mouseOffsetY = shipCanvasBounds.startY - mouseY;

    dragStatus.dragging = true;
    dragStatus.ship = ship;
    ship.startDrag(mouseOffsetX, mouseOffsetY);
}

function stopDrag() {
    if (dragStatus.ship.rotateAnimation) {
        return;
    }

    // The bounds of the ship if dragging stopped now
    let newShipFieldCoords = canvasCoordsToFieldCoords(
        mouseX + dragStatus.ship.dragOffsetX,
        mouseY + dragStatus.ship.dragOffsetY
    );

    let newShipFieldBounds = {
        startX: newShipFieldCoords.x,
        startY: newShipFieldCoords.y,
        endX: newShipFieldCoords.x + dragStatus.ship.width,
        endY: newShipFieldCoords.y + dragStatus.ship.height,
    };

    // Check if the ship would land in the field
    if (!isInFieldBounds(newShipFieldCoords.x, newShipFieldCoords.y) ||
        !isInFieldBounds(
            newShipFieldCoords.x + dragStatus.ship.width - 1,
            newShipFieldCoords.y
        ) ||
        !isInFieldBounds(
            newShipFieldCoords.x,
            newShipFieldCoords.y + dragStatus.ship.height - 1
        ) ||
        !isInFieldBounds(
            newShipFieldCoords.x + dragStatus.ship.width - 1,
            newShipFieldCoords.y + dragStatus.ship.height - 1
        )
    )
        return;

    // Check if the ship collides with any other ships
    for (let otherShip of ships) {
        if (otherShip.dragging) {
            continue;
        }

        if (boundsIntersect(newShipFieldBounds, otherShip.getFieldBounds())) {
            return;
        }
    }

    dragStatus.dragging = false;
    dragStatus.ship.stopDrag(newShipFieldCoords);
    dragStatus.ship = undefined;
}

//#endregion Ship Drag

//#region Geometry

function boundsIntersect(bounds1, bounds2) {
    let topEdge1 = bounds1.endY;
    let rightEdge1 = bounds1.endX;
    let leftEdge1 = bounds1.startX;
    let bottomEdge1 = bounds1.startY;
    let topEdge2 = bounds2.endY;
    let rightEdge2 = bounds2.endX;
    let leftEdge2 = bounds2.startX;
    let bottomEdge2 = bounds2.startY;

    return (
        leftEdge1 < rightEdge2 &&
        rightEdge1 > leftEdge2 &&
        bottomEdge1 < topEdge2 &&
        topEdge1 > bottomEdge2
    );
}

// Checks if the coordinates are inside of the field
function isInFieldBounds(x, y) {
    return rectContains({
            startX: 0,
            startY: 0,
            endX: gridSize - 1,
            endY: gridSize - 1,
        },
        x,
        y
    );
}

function rectContains(bounds, x, y) {
    return (
        bounds.startX <= x &&
        bounds.startY <= y &&
        bounds.endX >= x &&
        bounds.endY >= y
    );
}

function rectContainsNoEdges(bounds, x, y) {
    return (
        bounds.startX <= x &&
        bounds.startY <= y &&
        bounds.endX > x &&
        bounds.endY > y
    );
}

function rotateAroundOrigin(px, py, angle) {
    let radians = (Math.PI / -180) * angle;
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);
    return {
        x: px * cos + py * sin,
        y: py * cos + px * sin,
    };
}

//#endregion Geometry

//#region Canvas

function getOffset(fieldIndex) {
    let gridCellSize = getGridCellSize();

    let xOffset = (width - gridCellSize * gridSize) / 2;
    let yOffset = (height - gridCellSize * gridSize) / 2;

    if (fieldIndex == 0 || fieldIndex == undefined) {
        xOffset -= (gridSize * gridCellSize) / 2 + 50;
    } else {
        xOffset += (gridSize * gridCellSize) / 2 + 50;
    }

    return {
        x: xOffset,
        y: yOffset,
    };
}

// Translates field coordinates to canvas coordinates
function fieldCoordsToCanvasCoords(x, y, fieldIndex) {
    let gridCellSize = getGridCellSize();
    let offset = getOffset(fieldIndex);

    return {
        x: x * gridCellSize + offset.x,
        y: y * gridCellSize + offset.y,
    };
}

// Translates canvas coordinates to field coordinates
function canvasCoordsToFieldCoords(x, y, floorResult, fieldIndex) {
    let gridCellSize = getGridCellSize();
    let offset = getOffset(fieldIndex);

    return {
        x: floorResult ?
            floor((x - offset.x) / gridCellSize) : round((x - offset.x) / gridCellSize),
        y: floorResult ?
            floor((y - offset.y) / gridCellSize) : round((y - offset.y) / gridCellSize),
    };
}

// Calculates the size of one grid cell
function getGridCellSize() {
    return (min(width, height) / 2 - 50) / gridSize;
}

// Returns the n-th letter of the alphabet (starting at 0)
function getLetter(index) {
    return String.fromCharCode(64 + index);
}

//#endregion Canvas Calculations

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function getMoveCountOfPlayer(playerIndex) {
    let movesOfPlayer = 0;
    for (let attackDataEntry of attackData) {
        if (attackDataEntry.i == 1 - playerIndex) {
            movesOfPlayer++;
        }
    }
    return movesOfPlayer;
}