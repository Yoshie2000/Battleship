/// <reference path="p5.js" />

// How many grid cells per axis
let gridSize = 10;

// All the ships on the field
let ships = [];

// Temporary data for dragging ships with the mouse
let dragStatus = {
    ship: undefined,
    dragging: false
}

function setup() {
    // Create a fullscreen canvas
    createCanvas(windowWidth, windowHeight);
    fullscreen();

    ships = generateRandomShipLayout();
}

function draw() {
    // Blue background
    background(0, 180, 255);

    // Draw the field
    drawField();

    // Draw the ships
    for (let ship of ships) {
        ship.draw();
    }
}

//#region Generation

function generateRandomShipLayout() {
    let shipData = [
        {
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
            shipBoundary.endY - shipBoundary.startY
        ));
    }

    return ships;
}

//#endregion Generation

//#region Field

function drawField() {
    let gridCellSize = getGridCellSize();

    // The offset from the top left of the browser window
    let xOffset = (width - (gridCellSize * gridSize)) / 2;
    let yOffset = (height - (gridCellSize * gridSize)) / 2;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {

            // White, thin stroke
            stroke(255);
            fill(255);
            strokeWeight(1);

            // Text configuration
            textAlign(CENTER, CENTER);
            textSize(gridCellSize * 0.75);

            // Draw the horizontal text (1 2 3 4 .. gridSize)
            if (y == 0) {
                text(x + 1, x * gridCellSize + xOffset + gridCellSize / 2, y * gridCellSize + yOffset - gridCellSize / 2);
            }
            // Draw the vertical text (A B C D .. alphabet(gridSize))
            if (x == 0) {
                text(getLetter(y + 1), x * gridCellSize + xOffset - gridCellSize / 2, y * gridCellSize + yOffset + gridCellSize / 2);
            }

            // White, thicker stroke, no fill for the grid
            stroke(255);
            strokeWeight(5);
            noFill();

            rect(x * gridCellSize + xOffset, y * gridCellSize + yOffset, gridCellSize, gridCellSize);

        }
    }
}

//#endregion Field

//#region Mouse

function mouseClicked() {
    // When in drag mode, try to exit
    if (dragStatus.dragging) {
        stopDrag();
        return;
    }
    
    // If the cursor is above a ship, start dragging it
    for (let ship of ships) {
        let shipCanvasBounds = ship.getCanvasBounds();
        if (rectContains(shipCanvasBounds, mouseX, mouseY)) {
            startDrag(ship, shipCanvasBounds);
        }
    }
}

//#endregion Mouse Interactions

//#region Keyboard

function keyPressed() {
    // Rotate the current dragged ship when "R" is pressed
    if (dragStatus.dragging && (key == "r" || key == "R")) {
        dragStatus.ship.rotate();
    }
}

//#endregion Keyboard Interactions

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
    // The bounds of the ship if dragging stopped now
    let newShipFieldCoords = canvasCoordsToFieldCoords(mouseX + dragStatus.ship.dragOffsetX, mouseY + dragStatus.ship.dragOffsetY);

    let newShipFieldBounds = {
        startX: newShipFieldCoords.x,
        startY: newShipFieldCoords.y,
        endX: newShipFieldCoords.x + dragStatus.ship.width,
        endY: newShipFieldCoords.y + dragStatus.ship.height
    }
    
    // Check if the ship would land in the field
    if (!isInFieldBounds(newShipFieldCoords.x, newShipFieldCoords.y)
        || !isInFieldBounds(newShipFieldCoords.x + dragStatus.ship.width - 1, newShipFieldCoords.y)
        || !isInFieldBounds(newShipFieldCoords.x, newShipFieldCoords.y + dragStatus.ship.height - 1)
        || !isInFieldBounds(newShipFieldCoords.x + dragStatus.ship.width - 1, newShipFieldCoords.y + dragStatus.ship.height - 1))
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

//#endregion Geometry Calculations

//#region Canvas

// Translates field coordinates to canvas coordinates
function fieldCoordsToCanvasCoords(x, y) {
    let gridCellSize = getGridCellSize();

    let xOffset = (width - (gridCellSize * gridSize)) / 2;
    let yOffset = (height - (gridCellSize * gridSize)) / 2;

    return {
        x: x * gridCellSize + xOffset,
        y: y * gridCellSize + yOffset
    };
}

// Translates canvas coordinates to field coordinates
function canvasCoordsToFieldCoords(x, y, floorResult) {
    let gridCellSize = getGridCellSize();

    let xOffset = (width - (gridCellSize * gridSize)) / 2;
    let yOffset = (height - (gridCellSize * gridSize)) / 2;

    return {
        x: floorResult ? floor((x - xOffset) / gridCellSize) : round((x - xOffset) / gridCellSize),
        y: floorResult ? floor((y - yOffset) / gridCellSize) : round((y - yOffset) / gridCellSize)
    };
}

// Calculates the size of one grid cell
function getGridCellSize() {
    return (min(width, height) - 250) / gridSize;
}

// Returns the n-th letter of the alphabet (starting at 0)
function getLetter(index) {
    return String.fromCharCode(64 + index);
}

//#endregion Canvas Calculations