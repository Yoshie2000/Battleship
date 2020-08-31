class Button {

    constructor(text, col, bounds, click, supposedToBeShown) {
        this.text = text;
        this.col = col;
        this.bounds = bounds;
        this.click = click;

        this.supposedToBeShown = supposedToBeShown;

        this.wasPressedLastFrame = false;
        this.createdFrame = frameCount;
    }

    draw() {

        if (this.supposedToBeShown && !this.supposedToBeShown())
            return;

        stroke(this.col);
        fill(this.col);
        strokeWeight(1);

        rect(this.bounds.startX, this.bounds.startY, this.bounds.endX - this.bounds.startX, this.bounds.endY - this.bounds.startY);

        stroke(255);
        fill(255);
        textSize((this.bounds.endY - this.bounds.startY) / 2.5);
        textAlign(CENTER, CENTER);
        text(this.text, this.bounds.startX + (this.bounds.endX - this.bounds.startX) / 2, this.bounds.startY + (this.bounds.endY - this.bounds.startY) / 2 - 2);

        if (rectContains(this.bounds, mouseX, mouseY) && this.createdFrame <= frameCount - 20) {
            cursor("pointer");

            if (mouseIsPressed && !this.wasPressedLastFrame) {
                this.click();
                this.wasPressedLastFrame = true;
            } else if (!mouseIsPressed) {
                this.wasPressedLastFrame = false;
            }
        }

    }

}