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
    i: -1
}];

// -1: Game hasn't started yet; 0: Player 1; 1: Player 2
let currentPlayer = -1;
let gameOver = -1;

let aiTurnStarted = -1;
let playerFinished = false;

// The data for how the ships should be generated
let shipData = [{
        width: 2,
        height: 1
    },
    {
        width: 3,
        height: 1
    },
    {
        width: 3,
        height: 1
    },
    {
        width: 4,
        height: 1
    },
    {
        width: 5,
        height: 1
    }
];

// Temporary data for dragging ships with the mouse
let dragStatus = {
    ship: undefined,
    dragging: false
}

function setup() {
    // Create a fullscreen canvas
    createCanvas(windowWidth, windowHeight);
    fullscreen();

    ships = generateRandomShipLayout(0);
    otherShips = generateRandomShipLayout(1);

    for (let x = 0; x < gridSize; x++) {
        fieldData.push([]);
        otherFieldData.push([]);
        for (let y = 0; y < gridSize; y++) {
            fieldData[x][y] = 0;
            otherFieldData[x][y] = 0;
        }
    }

}

function draw() {

    if (playerFinished && aiTurnStarted <= frameCount - 20) {
        playerFinished = false;
        aiAttack(0);
    }

    if (currentPlayer != -1) {
        gameOver = checkForGameOver();
        if (gameOver != -1) {
            console.log("PLAYER " + (gameOver + 1) + " GAME OVER");
            noLoop();
        }
    }

    // Blue background
    background(0, 90, 180);

    // Draw the field
    drawFields();

    // Draw the ships
    for (let ship of ships) {
        ship.draw();
    }
    /*for (let ship of otherShips) {
        ship.draw();
    }*/

    // Draw the data
    drawData();

    // Draw probability overlay

    let probabilityData = getHighestProbabilityCell(1);
    let gridCellSize = getGridCellSize();

    let highestColor = color(255, 0, 0);
    let lowestColor = color(0, 255, 0);

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            if (otherFieldData[x][y] != 0)
                continue;

            let coords = fieldCoordsToCanvasCoords(x, y, 1);

            textSize(10);
            strokeWeight(1);

            let currentColor = lerpColor(lowestColor, highestColor, pow(probabilityData.probabilityMap[x][y] / probabilityData.probability, 5));

            stroke(currentColor);
            fill(currentColor);

            rect(coords.x + 5, coords.y + 5, gridCellSize - 10, gridCellSize - 10);

            stroke(255);
            fill(255);

            text(round(probabilityData.probabilityMap[x][y] * 100, 1), coords.x + gridCellSize / 2, coords.y + gridCellSize / 2);
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
                x: floor(random(0, gridSize - (horizontal ? shipDataEntry.width : shipDataEntry.height))),
                y: floor(random(0, gridSize - (horizontal ? shipDataEntry.height : shipDataEntry.width)))
            };
            let bounds = {
                startX: position.x,
                startY: position.y,
                endX: position.x + (horizontal ? shipDataEntry.width : shipDataEntry.height),
                endY: position.y + (horizontal ? shipDataEntry.height : shipDataEntry.width)
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
        ships.push(new Ship(
            shipBoundary.startX,
            shipBoundary.startY,
            shipBoundary.endX - shipBoundary.startX,
            shipBoundary.endY - shipBoundary.startY,
            fieldIndex
        ));
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
    let newShipFieldCoords = canvasCoordsToFieldCoords(mouseX + dragStatus.ship.dragOffsetX, mouseY + dragStatus.ship.dragOffsetY);

    let newShipFieldBounds = {
        startX: newShipFieldCoords.x,
        startY: newShipFieldCoords.y,
        endX: newShipFieldCoords.x + dragStatus.ship.width,
        endY: newShipFieldCoords.y + dragStatus.ship.height
    }

    // Check if the ship would land in the field
    if (!isInFieldBounds(newShipFieldCoords.x, newShipFieldCoords.y) ||
        !isInFieldBounds(newShipFieldCoords.x + dragStatus.ship.width - 1, newShipFieldCoords.y) ||
        !isInFieldBounds(newShipFieldCoords.x, newShipFieldCoords.y + dragStatus.ship.height - 1) ||
        !isInFieldBounds(newShipFieldCoords.x + dragStatus.ship.width - 1, newShipFieldCoords.y + dragStatus.ship.height - 1))
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

    return leftEdge1 < rightEdge2 && rightEdge1 > leftEdge2 && bottomEdge1 < topEdge2 && topEdge1 > bottomEdge2;
}

// Checks if the coordinates are inside of the field
function isInFieldBounds(x, y) {
    return rectContains({
        startX: 0,
        startY: 0,
        endX: gridSize - 1,
        endY: gridSize - 1
    }, x, y);
}

function rectContains(bounds, x, y) {
    return bounds.startX <= x && bounds.startY <= y && bounds.endX >= x && bounds.endY >= y;
}

function rectContainsNoEdges(bounds, x, y) {
    return bounds.startX <= x && bounds.startY <= y && bounds.endX > x && bounds.endY > y;
}

function rotateAroundOrigin(px, py, angle) {
    let radians = (Math.PI / -180) * angle;
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);
    return {
        x: px * cos + py * sin,
        y: py * cos + px * sin
    };
}

//#endregion Geometry

//#region Canvas

function getOffset(fieldIndex) {
    let gridCellSize = getGridCellSize();

    let xOffset = (width - (gridCellSize * gridSize)) / 2;
    let yOffset = (height - (gridCellSize * gridSize)) / 2;

    if (fieldIndex == 0 || fieldIndex == undefined) {
        xOffset -= gridSize * gridCellSize / 2 + 50;
    } else {
        xOffset += gridSize * gridCellSize / 2 + 50;
    }

    return {
        x: xOffset,
        y: yOffset
    };
}

// Translates field coordinates to canvas coordinates
function fieldCoordsToCanvasCoords(x, y, fieldIndex) {
    let gridCellSize = getGridCellSize();
    let offset = getOffset(fieldIndex);

    return {
        x: x * gridCellSize + offset.x,
        y: y * gridCellSize + offset.y
    };
}

// Translates canvas coordinates to field coordinates
function canvasCoordsToFieldCoords(x, y, floorResult, fieldIndex) {
    let gridCellSize = getGridCellSize();
    let offset = getOffset(fieldIndex);

    return {
        x: floorResult ? floor((x - offset.x) / gridCellSize) : round((x - offset.x) / gridCellSize),
        y: floorResult ? floor((y - offset.y) / gridCellSize) : round((y - offset.y) / gridCellSize)
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