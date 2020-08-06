/// <reference path="p5.js" />

// How many grid cells per axis
let gridSize = 10;

// All the ships on the field
let ship = new Ship();

// Temporary data for dragging ships with the mouse
let dragStatus = {
    ship: undefined,
    dragging: false
}

function setup() {
    // Create a fullscreen canvas
    createCanvas(windowWidth, windowHeight);
    fullscreen();
}

function draw() {
    // Blue background
    background(0, 180, 255);

    // Draw the field
    drawField();

    // Draw the ships
    ship.draw();
}

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
    let shipCanvasBounds = ship.getCanvasBounds();
    if (rectContains(shipCanvasBounds, mouseX, mouseY)) {
        startDrag(ship, shipCanvasBounds);
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
    
    // Check if the ship would land in the field
    if (!isInFieldBounds(newShipFieldCoords.x, newShipFieldCoords.y)
        || !isInFieldBounds(newShipFieldCoords.x + dragStatus.ship.width - 1, newShipFieldCoords.y)
        || !isInFieldBounds(newShipFieldCoords.x, newShipFieldCoords.y + dragStatus.ship.height - 1)
        || !isInFieldBounds(newShipFieldCoords.x + dragStatus.ship.width - 1, newShipFieldCoords.y + dragStatus.ship.height - 1))
        return;

    dragStatus.dragging = false;
    dragStatus.ship.stopDrag(newShipFieldCoords);
    dragStatus.ship = undefined;
}

//#endregion Ship Drag

//#region Geometry

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