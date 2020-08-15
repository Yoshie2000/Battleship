//#region Mouse

function mouseClicked() {

    // Current player can attack
    if (currentPlayer == 0) {
        let otherFieldCoords = canvasCoordsToFieldCoords(mouseX, mouseY, true, 1);

        if (isInFieldBounds(otherFieldCoords.x, otherFieldCoords.y)) {
            shootCell(otherFieldCoords.x, otherFieldCoords.y, 1);
        }

    }

    // Don't allow dragging once the game starts
    if (currentPlayer != -1) {
        return;
    }

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

//#endregion Mouse

//#region Keyboard

function keyPressed() {
    // Rotate the current dragged ship when "R" is pressed
    if (dragStatus.dragging && (key == "r" || key == "R")) {
        dragStatus.ship.rotate();
    } else if (keyCode == ENTER && currentPlayer == -1) {
        currentPlayer = 0;
    }
}

//#endregion Keyboard