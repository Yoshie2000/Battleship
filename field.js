function drawData() {
    let gridCellSize = getGridCellSize();

    for (let i = 0; i < 2; i++) {

        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {

                let offset = fieldCoordsToCanvasCoords(x, y, i);

                let cellData = i == 0 ? fieldData[x][y] : otherFieldData[x][y];

                if (cellData == 1) {
                    stroke(0, 255, 255);
                    strokeWeight(10);
                    point(offset.x + gridCellSize / 2, offset.y + gridCellSize / 2);
                } else if (cellData == 2) {
                    stroke(255, 50, 50);
                    strokeWeight(5);
                    line(offset.x + gridCellSize / 4, offset.y + gridCellSize / 4, offset.x + gridCellSize * 3 / 4, offset.y + gridCellSize * 3 / 4);
                    line(offset.x + gridCellSize / 4, offset.y + gridCellSize * 3 / 4, offset.x + gridCellSize * 3 / 4, offset.y + gridCellSize / 4);
                }

            }
        }

    }

}

function drawFields() {
    let gridCellSize = getGridCellSize();

    // White, thin stroke
    stroke(255);
    fill(255);
    strokeWeight(1);

    // Text configuration
    textAlign(CENTER, CENTER);
    textSize(25);

    if (gameOver == 0) {
        text("You lost! What a shame...", width / 2, 50);
    } else if (gameOver == 1) {
        text("You won! Congratulations!", width / 2, 50);
    } else if (currentPlayer == -1) {
        text("You're Player 1. You can move your ships around as you like and rotate them with 'R'", width / 2, 50);
    } else if (currentPlayer == 0) {
        text("It is your turn. Click on any spot on your enemy field to shoot at it", width / 2, 50);
    } else if (currentPlayer == 1) {
        text("Your enemy is currently choosing his move...", width / 2, 50);
    }
    textSize(20);
    text("AI Mode:", 70, height - 160);
    text(aiAlgorithm.substring(0, 1).toUpperCase() + aiAlgorithm.substring(1, aiAlgorithm.length), 70, height - 130);

    for (let i = 0; i < 2; i++) {

        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {

                let offset = fieldCoordsToCanvasCoords(x, y, i);

                // White, thin stroke
                stroke(255);
                fill(255);
                strokeWeight(1);

                // Text configuration
                textAlign(CENTER, CENTER);
                textSize(gridCellSize * 0.75);

                // Draw the horizontal text (1 2 3 4 .. gridSize)
                if (y == 0) {
                    text(x + 1, offset.x + gridCellSize / 2, offset.y - gridCellSize / 2);

                    if (x == floor(gridSize / 2)) {
                        let movesOfPlayer = getMoveCountOfPlayer(i);

                        if (currentPlayer == -1) {
                            text(`Player ${i + 1}`, offset.x, offset.y - gridCellSize * 2);
                        } else {
                            text(`Player ${i + 1} (${movesOfPlayer} moves)`, offset.x, offset.y - gridCellSize * 2);
                        }
                    }

                }
                // Draw the vertical text (A B C D .. alphabet(gridSize))
                if (x == 0) {
                    text(getLetter(y + 1), offset.x - gridCellSize / 2, offset.y + gridCellSize / 2);
                }

                // White, thicker stroke, no fill for the grid
                stroke(255);
                strokeWeight(5);
                noFill();

                rect(offset.x, offset.y, gridCellSize, gridCellSize);
            }
        }

    }

}