class Mountain {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(0.8, 1.2);
    this.peakCount = floor(random(1, 6));
    this.peakSpread = random(5, 30);
    this.mountainWidth = random(100, 200);
    this.mountainHeight = random(25, 250);
    this.minPointHeight = 5;
    this.baseColor = color(100);

    this.initialize();
  }

  initialize() {
    // Pre-calculate random points
    this.leftSteps = floor(random(3, 6));
    this.rightSteps = floor(random(3, 6));

    // Store left side points
    this.leftPoints = [];
    for (let i = 1; i < this.leftSteps; i++) {
      const t = i / this.leftSteps;
      const x = lerp(-this.mountainWidth, 0, t);
      const baseY = lerp(-this.minPointHeight, -this.mountainHeight, t);
      // Reduce spread near the corners using easeInOut
      const spreadFactor = sin(t * PI); // Goes from 0 to 1 to 0
      const spread = this.peakSpread * spreadFactor;
      // Ensure y value is at least -minPointHeight
      const randomSpread = random(-spread, spread);
      const y = min(baseY + randomSpread, -this.minPointHeight);
      this.leftPoints.push({ x, y });
    }

    // Store middle peak offset
    // Ensure middle peak doesn't go above mountainHeight
    this.middlePeakOffset = constrain(
      random(-this.peakSpread, this.peakSpread),
      -this.mountainHeight,
      -this.minPointHeight
    );

    // Store right side points
    this.rightPoints = [];
    for (let i = 1; i < this.rightSteps; i++) {
      const t = i / this.rightSteps;
      const x = lerp(0, this.mountainWidth, t);
      const baseY = lerp(-this.mountainHeight, -this.minPointHeight, t);
      // Reduce spread near the corners using easeInOut
      const spreadFactor = sin((1 - t) * PI); // Goes from 1 to 0
      const spread = this.peakSpread * spreadFactor;
      // Ensure y value is at least -minPointHeight
      const randomSpread = random(-spread, spread);
      const y = min(baseY + randomSpread, -this.minPointHeight);
      this.rightPoints.push({ x, y });
    }
  }

  render() {
    push();
    translate(this.x, this.y);
    scale(this.size);

    noStroke();
    fill(this.baseColor);
    // Base shape
    beginShape();
    vertex(-this.mountainWidth, 0);

    // Left side points
    for (let point of this.leftPoints) {
      vertex(point.x, point.y);
    }

    // Middle peak
    vertex(0, -this.mountainHeight + this.middlePeakOffset);

    // Right side points
    for (let point of this.rightPoints) {
      vertex(point.x, point.y);
    }

    vertex(this.mountainWidth, 0);
    endShape(CLOSE);

    // Snow peak

    // shadows

    pop();
  }
}

class Sky {
  constructor(skyBlueColor = color(135, 206, 235)) {
    this.darkPurple = color(48, 25, 52);
    this.darkBlue = color(25, 25, 112);
    this.midBlue = color(65, 105, 225);
    this.skyBlueColor = skyBlueColor;
    this.lightBlue = lerpColor(this.midBlue, this.skyBlueColor, 0.5);
    this.vertCount = 25;
    this.thinBandHeight = 10;
    this.thinBandMovement = 0.0005;
    this.thinBandColors = [
      this.darkPurple,
      this.darkBlue,
      this.midBlue,
      this.lightBlue,
      this.skyBlueColor,
    ];

    this.thinBands = [];
    for (let i = 0; i < 4; i++) {
      let segmentCount = floor(random(10, 15));
      let segments = [];
      for (let j = 0; j < segmentCount; j++) {
        let factor = random(0.5, 1);
        let y = floor(random(0, 41) / 10) * 10;
        segments.push({
          color: this.thinBandColors[i],
          factor: factor,
          y: y,
          left: 0,
          right: 1,
          disabled: false,
          direction: i % 2 === 0 ? 1 : -1,
          speed: 1 - (y / 40) * 0.9,
          tapered: true
        });
      }
      this.thinBands.push(segments);
    }

    // Normalize factors to sum to 1
    for (let i = 0; i < this.thinBands.length; i++) {
      let segments = this.thinBands[i];
      let totalFactor = 0;
      for (let j = 0; j < segments.length; j++) {
        totalFactor += segments[j].factor;
      }
      for (let j = 0; j < segments.length; j++) {
        segments[j].factor = segments[j].factor / totalFactor;
      }
    }

    // Calculate cumulative factors
    for (let i = 0; i < this.thinBands.length; i++) {
      let runningFactor = 0;
      let segments = this.thinBands[i];
      for (let j = 0; j < segments.length; j++) {
        let tempFactor = segments[j].factor;
        segments[j].factor += runningFactor;
        runningFactor += tempFactor;
      }
    }

    // Set left and right values
    for (let i = 0; i < this.thinBands.length; i++) {
      let segments = this.thinBands[i];
      for (let j = 0; j < segments.length; j++) {
        if (j === 0) {
          segments[j].left = 0;
          segments[j].right = (segments[j].factor + segments[j + 1].factor) / 2;
        } else if (j === segments.length - 1) {
          segments[j].left = (segments[j - 1].factor + segments[j].factor) / 2;
          segments[j].right = 1;
        } else {
          segments[j].left = (segments[j - 1].factor + segments[j].factor) / 2;
          segments[j].right = (segments[j].factor + segments[j + 1].factor) / 2;
        }
      }
    }

    // Make some segments disabled
    for (let i = 0; i < this.thinBands.length; i++) {
      let segments = this.thinBands[i];
      for (let j = 0; j < segments.length; j++) {
        if (random(1) < 0.6) {
          segments[j].disabled = true;
          segments[j].left += 0.05;
          segments[j].right -= 0.05;
        }
      }
    }
  }

  render() {
    push();
    const bandHeight = height / 2 / 5; // Divide upper half into 5 bands

    const mouseYPercent = (mouseY - height / 2) / (height / 2); // -1 to 1
    const yOffset = -mouseYPercent * 5; // 10 to -10 pixels
    const mouseXPercent = (mouseX - width / 2) / (width / 2); // -1 to 1
    const xOffset = -mouseXPercent * 5; // 10 to -10 pixels

    translate(xOffset, yOffset);

    noStroke();

    this.drawCurvedBand(0 - 25, bandHeight + 50, this.darkPurple);
    this.drawCurvedBand(bandHeight, bandHeight, this.darkBlue);
    this.drawCurvedBand(bandHeight * 2, bandHeight, this.midBlue);
    this.drawCurvedBand(bandHeight * 3, bandHeight, this.lightBlue);
    this.drawCurvedBand(bandHeight * 4, bandHeight, this.skyBlueColor);

    // segments
    this.drawCurvedBandSegment(
      bandHeight - bandHeight / 2 + this.thinBandHeight * 0.5 + 10,
      10,
      this.thinBandHeight,
      this.darkPurple,
      0,
      1
    );

    this.drawCurvedBandSegment(
      bandHeight * 2 - bandHeight / 2 + this.thinBandHeight * 0.5 + 10,
      10,
      this.thinBandHeight,
      this.darkBlue,
      0,
      1
    );

    this.drawCurvedBandSegment(
      bandHeight * 3 - bandHeight / 2 + this.thinBandHeight * 0.5 + 10,
      10,
      this.thinBandHeight,
      this.midBlue,
      0,
      1
    );

    this.drawCurvedBandSegment(
      bandHeight * 4 - bandHeight / 2 + this.thinBandHeight * 0.5 + 10,
      10,
      this.thinBandHeight,
      this.lightBlue,
      0,
      1
    );

    for (let i = 0; i < this.thinBands.length; i++) {
      let segments = this.thinBands[i];
      for (let j = 0; j < segments.length; j++) {
        if (!segments[j].disabled) {
          this.drawCurvedBandSegment(
            bandHeight * (i + 1) -
              bandHeight / 2 +
              this.thinBandHeight * 0.5 +
              10 +
              20 +
              segments[j].y,
            this.thinBandHeight,
            5,
            segments[j].color,
            segments[j].left,
            segments[j].right,
            segments[j].tapered
          );
        }

        segments[j].left +=
          this.thinBandMovement * segments[j].direction * segments[j].speed * (this.thinBands.length + 1 - i);
        segments[j].right +=
          this.thinBandMovement * segments[j].direction * segments[j].speed * (this.thinBands.length + 1 - i);

        if ((segments[j].left > 1 && segments[j].right > 1) || (segments[j].left < 0 && segments[j].right < 0)) {
          let delta = segments[j].right - segments[j].left;
          if (segments[j].direction > 0) {
            segments[j].left = -delta;
            segments[j].right = 0;
          } else {
            segments[j].left = 1;
            segments[j].right = 1 + delta;
          }
        }
      }
    }

    pop();
  }

  drawCurvedBandSegment(
    yStart,
    bandHeight,
    thickness,
    bandColor,
    startT = 0,
    endT = 1,
    tapered = false
  ) {
    stroke(bandColor);
    strokeWeight(1);
    fill(bandColor);
    beginShape();

    const largerWidth = width + 200;
    const xOffset = -100;

    const centerY = yStart;

    // Starting point
    const startX = lerp(xOffset, largerWidth + xOffset, startT);
    const startYOffset = sin(startT * PI) * 50;
    const startThickness = tapered ? 0 : thickness;
    vertex(startX, centerY - startThickness / 2 - startYOffset);

    // Top curve - use more vertices for smoother curve
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = lerp(startT, endT, i / steps);
      const x = lerp(xOffset, largerWidth + xOffset, t);
      const yOffset = sin(t * PI) * 50;
      const currentThickness = tapered ? 
        thickness * sin(lerp(0, PI, (t - startT) / (endT - startT))) :
        thickness;
      vertex(x, centerY - currentThickness / 2 - yOffset);
    }

    // End point top
    const endX = lerp(xOffset, largerWidth + xOffset, endT);
    const endYOffset = sin(endT * PI) * 50;
    const endThickness = tapered ? 0 : thickness;
    vertex(endX, centerY - endThickness / 2 - endYOffset);

    // Bottom curve matches top curve but offset by thickness
    for (let i = steps; i >= 0; i--) {
      const t = lerp(startT, endT, i / steps);
      const x = lerp(xOffset, largerWidth + xOffset, t);
      const yOffset = sin(t * PI) * 50;
      const currentThickness = tapered ?
        thickness * sin(lerp(0, PI, (t - startT) / (endT - startT))) :
        thickness;
      vertex(x, centerY + currentThickness / 2 - yOffset);
    }

    endShape(CLOSE);
  }

  drawCurvedBand(yStart, bandHeight, bandColor) {
    this.drawCurvedBandSegment(yStart, bandHeight, bandHeight, bandColor, 0, 1);
  }
}

class Ground {
  constructor() {
    this.grassColor = color(74, 117, 43);
    this.dirtColor = color(139, 69, 19);
    this.skyColor = color(135, 206, 235);
  }

  renderBackground() {
    push();
    noStroke();

    // Draw main ground
    fill(this.grassColor);
    rect(-50, height / 2, width + 100, height / 2 + 50);

    // Draw gradient from sky to grass with height based on mouse position
    const maxGradientHeight = 40;
    const gradientHeight = map(mouseY, 0, height / 2, maxGradientHeight, 0);

    // Only draw gradient if there is height
    if (gradientHeight > 0) {
      for (let y = height / 2; y < height / 2 + gradientHeight; y++) {
        let inter = map(y, height / 2, height / 2 + gradientHeight, 0, 1);
        let gradientColor = lerpColor(this.skyColor, this.grassColor, inter);
        fill(gradientColor);
        rect(-50, y, width + 100, 1);
      }
    }

    pop();
  }

  renderForeground() {
    push();
    noStroke();

    // Calculate movement based on mouse position with doubled strength
    const offsetY = map(mouseY, 0, height, 40, -40); // Doubled from 20 to 40
    const offsetX = map(mouseX, 0, width, 40, -40); // Added horizontal movement

    // Apply translation for movement
    translate(offsetX, offsetY);

    fill(this.grassColor);
    rect(-50, height / 2, width + 100, height / 2 + 50);

    pop();
  }
}
