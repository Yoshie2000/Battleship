class Ship {

    // Set up the variables
    constructor() {
        this.width = 1;
        this.height = 3;

        this.fieldX = 5;
        this.fieldY = 2;

        this.onField = false;
        this.dragging = false;

        this.canvasX = 100;
        this.canvasY = 100;

        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
    }

    //#region Drawing

    draw() {
        // Make the ship follow the mouse while dragging
        if (this.dragging) {
            this.canvasX = mouseX;
            this.canvasY = mouseY;
        }

        let gridCellSize = getGridCellSize();

        for (let shipTileX = this.fieldX; shipTileX < this.fieldX + this.width; shipTileX++) {
            for (let shipTileY = this.fieldY; shipTileY < this.fieldY + this.height; shipTileY++) {
                // When dragging, follow the mouse and take the offset into account; otherwise stay at the current tile
                let canvasCoords = this.dragging ? 
                    {
                        x: this.canvasX + this.dragOffsetX + (shipTileX - this.fieldX) * gridCellSize,
                        y: this.canvasY + this.dragOffsetY + (shipTileY - this.fieldY) * gridCellSize
                    }
                    : fieldCoordsToCanvasCoords(shipTileX, shipTileY);

                // Black boxes for each ship tile
                stroke(0);
                strokeWeight(1);
                fill(0);

                rect(canvasCoords.x, canvasCoords.y, gridCellSize, gridCellSize);

            }
        }
    }

    //#endregion Drawing

    //#region Dragging

    startDrag(dragOffsetX, dragOffsetY) {
        this.dragging = true;
        this.dragOffsetX = dragOffsetX;
        this.dragOffsetY = dragOffsetY;
    }

    stopDrag(newFieldCoords) {
        this.dragging = false;
        this.fieldX = newFieldCoords.x;
        this.fieldY = newFieldCoords.y;
    }

    //#endregion Dragging

    //#region Geometry

    rotate() {
        // Store the old width and height
        let oldWidth = this.width;
        let oldHeight = this.height;

        // Switch width and height around
        this.width = oldHeight;
        this.height = oldWidth;

        // Calculate the ratio between the drag offset and width / height
        let dragOffsetRatioX = this.dragOffsetX / oldWidth;
        let dragOffsetRatioY = this.dragOffsetY / oldHeight;

        // Apply that ratio to the updated width and height
        this.dragOffsetX = this.width * dragOffsetRatioX;
        this.dragOffsetY = this.height * dragOffsetRatioY;
    }

    getFieldBounds() {
        // The rectangle of the ship inside the field
        return {
            startX: this.fieldX,
            startY: this.fieldY,
            endX: this.fieldX + this.width,
            endY: this.fieldY + this.height
        }
    }

    getCanvasBounds() {
        let canvasCoords = fieldCoordsToCanvasCoords(this.fieldX, this.fieldY);
        let gridCellSize = getGridCellSize();

        // The rectangle of the ship inside the canvas
        return {
            startX: canvasCoords.x,
            startY: canvasCoords.y,
            endX: canvasCoords.x + gridCellSize * this.width,
            endY: canvasCoords.y + gridCellSize * this.height
        }
    }

    //#endregion Geometry

}