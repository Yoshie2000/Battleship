/// <reference path="p5.js" />

let gridSize = 10;

let ship = new Ship();

let dragStatus = {
    ship: undefined,
    dragging: false
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    fullscreen();
}

function draw() {
    background(0, 180, 255);

    drawField();

    ship.draw();
}

//#region Field

function drawField() {
    let gridCellSize = getGridCellSize();

    let xOffset = (width - (gridCellSize * gridSize)) / 2;
    let yOffset = (height - (gridCellSize * gridSize)) / 2;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {

            stroke(255);
            fill(255);
            strokeWeight(1);

            textAlign(CENTER, CENTER);
            textSize(gridCellSize * 0.75);

            if (y == 0) {
                text(x + 1, x * gridCellSize + xOffset + gridCellSize / 2, y * gridCellSize + yOffset - gridCellSize / 2);
            }
            if (x == 0) {
                text(getLetter(y + 1), x * gridCellSize + xOffset - gridCellSize / 2, y * gridCellSize + yOffset + gridCellSize / 2);
            }

            stroke(255);
            strokeWeight(5);
            noFill();

            rect(x * gridCellSize + xOffset, y * gridCellSize + yOffset, gridCellSize, gridCellSize);

        }
    }
}

//#endregion Field

//#region Mouse Interactions

function mouseClicked() {
    if (dragStatus.dragging) {
        stopDrag();
        return;
    }
    
    let shipCanvasBounds = ship.getCanvasBounds();
    if (rectContains(shipCanvasBounds, mouseX, mouseY)) {
        startDrag(ship, shipCanvasBounds);
    }
}

//#endregion Mouse Interactions

//#region Keyboard Interactions

function keyPressed() {
    if (dragStatus.dragging && (key == "r" || key == "R")) {
        dragStatus.ship.rotate();
    }
}

//#endregion Keyboard Interactions

//#region Ship Drag

function startDrag(ship, shipCanvasBounds) {
    let mouseOffsetX = shipCanvasBounds.startX - mouseX;
    let mouseOffsetY = shipCanvasBounds.startY - mouseY;

    dragStatus.dragging = true;
    dragStatus.ship = ship;
    ship.startDrag(mouseOffsetX, mouseOffsetY);
}

function stopDrag() {
    let newShipFieldCoords = canvasCoordsToFieldCoords(mouseX + dragStatus.ship.dragOffsetX, mouseY + dragStatus.ship.dragOffsetY);
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

//#region Geometry Calculations

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

//#region Canvas Calculations

function fieldCoordsToCanvasCoords(x, y) {
    let gridCellSize = getGridCellSize();

    let xOffset = (width - (gridCellSize * gridSize)) / 2;
    let yOffset = (height - (gridCellSize * gridSize)) / 2;

    return {
        x: x * gridCellSize + xOffset,
        y: y * gridCellSize + yOffset
    };
}

function canvasCoordsToFieldCoords(x, y, floorResult) {
    let gridCellSize = getGridCellSize();

    let xOffset = (width - (gridCellSize * gridSize)) / 2;
    let yOffset = (height - (gridCellSize * gridSize)) / 2;

    return {
        x: floorResult ? floor((x - xOffset) / gridCellSize) : round((x - xOffset) / gridCellSize),
        y: floorResult ? floor((y - yOffset) / gridCellSize) : round((y - yOffset) / gridCellSize)
    };
}

function getGridCellSize() {
    return (min(width, height) - 250) / gridSize;
}

function getLetter(index) {
    return String.fromCharCode(64 + index);
}

//#endregion Canvas Calculations