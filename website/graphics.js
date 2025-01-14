class Mountain {
  static mountains = [];
  static skyBlueColor;

  static initialize(skyBlueColor) {
    this.skyBlueColor = skyBlueColor;
    this.mountains = [];
    this.generateMountains();
    // Sort mountains by depth so farther ones render first
    this.mountains.sort((a, b) => b.depth - a.depth);
  }

  static generateMountains() {
    // Mountain generation parameters
    const exclusionZoneWidth = 0.1; // Width of the exclusion zone on each side

    // Create closer mountains (depth 0-0.5)
    for (let i = 0; i < 60; i++) {
      let xfactor = random(0, 1);
      let depth = random(0, 0.5);

      // Calculate the exclusion center point based on depth using two segments
      let exclusionCenter;
      if (depth <= 0.25) {
        // First segment: depth 0 to 0.25
        exclusionCenter = map(depth, 0, 0.25, 0.7, 0.65);
      } else {
        // Second segment: depth 0.25 to 0.5
        exclusionCenter = map(depth, 0.25, 0.5, 0.7, 0.5);
      }

      // Calculate mountain properties
      let mountainSize = map(depth, 0, 0.5, 0.8, 0.2);
      let mountainBaseWidth = 150; // Base width before scaling
      let scaledWidth = mountainBaseWidth * mountainSize;

      // Calculate mountain edges in normalized space (0 to 1)
      let leftEdge = xfactor - scaledWidth / width / 2;
      let rightEdge = xfactor + scaledWidth / width / 2;

      // Skip if either edge intersects with exclusion zone
      if (
        abs(leftEdge - exclusionCenter) < exclusionZoneWidth ||
        abs(rightEdge - exclusionCenter) < exclusionZoneWidth ||
        (leftEdge < exclusionCenter && rightEdge > exclusionCenter)
      ) {
        continue;
      }

      this.createMountain(xfactor, depth, mountainSize);
    }

    // Create farther mountains (depth 0.5-1)
    for (let i = 0; i < 60; i++) {
      let xfactor = random(0.4, 0.8);
      let depth = random(0.5, 1);
      let mountainSize = map(depth, 0.5, 1, 0.2, 0.1);
      this.createMountain(xfactor, depth, mountainSize);
    }
  }

  static createMountain(xfactor, depth, mountainSize) {
    let mountainX = xfactor * width;
    let mountainY = height / 2;
    let mountain = new Mountain(mountainX, mountainY);
    mountain.depth = depth;
    mountain.size = mountainSize;

    // Calculate color based on depth
    // Closer mountains are darker blue-gray, farther ones fade to sky blue
    let mountainColor = color(80, 90, 100);
    mountain.baseColor = lerpColor(mountainColor, this.skyBlueColor, depth);

    this.mountains.push(mountain);
  }

  static renderAll() {
    const controlledMouseXPercent = controlledMouseX / width;
    const controlledMouseYPercent = controlledMouseY / height;

    for (let mountain of this.mountains) {
      push();
      // Calculate movement range based on depth
      let moveRange = 0;
      if (mountain.depth < 0.5) {
        moveRange = map(mountain.depth, 0, 0.5, 25, 5);
      } else {
        moveRange = map(mountain.depth, 0.5, 1, 5, 0);
      }

      // Move in opposite direction of mouse for both x and y
      const xOffset = map(controlledMouseXPercent, 0, 1, moveRange, -moveRange);
      const yOffset = map(controlledMouseYPercent, 0, 1, moveRange, -moveRange);

      translate(xOffset, yOffset);
      mountain.render();
      pop();
    }
  }

  static windowResized() {
    for (let mountain of this.mountains) {
      mountain.windowResized();
    }
  }

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.startWidth = width;
    this.startHeight = height;
    this.size = random(0.8, 1.2);
    this.peakCount = floor(random(1, 6));
    this.peakSpread = random(5, 50);
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

  windowResized() {
    this.x = (this.startX / this.startWidth) * width;
    this.y = (this.startY / this.startHeight) * height;
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
          tapered: true,
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

  windowResized() {}

  render() {
    push();
    const bandHeight = height / 2 / 5; // Divide upper half into 5 bands

    const controlledMouseYPercent =
      (controlledMouseY - height / 2) / (height / 2); // -1 to 1
    const yOffset = -controlledMouseYPercent * 5; // 10 to -10 pixels
    const controlledMouseXPercent =
      (controlledMouseX - width / 2) / (width / 2); // -1 to 1
    const xOffset = -controlledMouseXPercent * 5; // 10 to -10 pixels

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
          this.thinBandMovement *
          segments[j].direction *
          segments[j].speed *
          (this.thinBands.length + 1 - i);
        segments[j].right +=
          this.thinBandMovement *
          segments[j].direction *
          segments[j].speed *
          (this.thinBands.length + 1 - i);

        if (
          (segments[j].left > 1 && segments[j].right > 1) ||
          (segments[j].left < 0 && segments[j].right < 0)
        ) {
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
      const currentThickness = tapered
        ? thickness * sin(lerp(0, PI, (t - startT) / (endT - startT)))
        : thickness;
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
      const currentThickness = tapered
        ? thickness * sin(lerp(0, PI, (t - startT) / (endT - startT)))
        : thickness;
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
    this.dirtColor = color(105, 53, 14);
    this.darkDirtColor = color(84, 42, 10);
    this.darkerDirtColor = color(64, 31, 6);

    this.grassColor = color(66, 140, 45);
    this.grassShadowColor = lerpColor(this.dirtColor, color(0), 0.2);
    this.grassShadowOffset = 13;

    this.skyColor = color(135, 206, 235);
    this.riverColor = color(29, 134, 224);
    this.middleRiverColor = color(22, 119, 201);
    this.riverSpeed = 0.026;
    this.scalar = 10;
    this.wiggle = 5;

    this.edgeRiverPoints = [];
    this.edgeRiverPoints.push({ x: width * 0.5, y: height / 2, z: 0.5 });
    this.edgeRiverPoints.push({ x: width * 0.65, y: height / 2 + 5, z: 0.425 });
    this.edgeRiverPoints.push({ x: width * 0.7, y: height / 2 + 10, z: 0.375 });
    this.edgeRiverPoints.push({ x: width * 0.75, y: height / 2 + 20, z: 0.25 });
    this.edgeRiverPoints.push({ x: width * 0.85, y: height / 2 + 40, z: 0 });
    this.edgeRiverPoints.push({ x: width * 0.6, y: height / 2 + 40, z: 0 });
    this.edgeRiverPoints.push({ x: width * 0.65, y: height / 2 + 32, z: 0.1 });
    this.edgeRiverPoints.push({ x: width * 0.65, y: height / 2 + 20, z: 0.25 });
    this.edgeRiverPoints.push({
      x: width * 0.62,
      y: height / 2 + 10,
      z: 0.375,
    });

    this.middleEdgeRiverPoints = [];
    this.middleEdgeRiverPoints.push({ x: width * 0.5, y: height / 2, z: 0.5 });
    this.middleEdgeRiverPoints.push({
      x: width * 0.63,
      y: height / 2 + 5,
      z: 0.425,
    });
    this.middleEdgeRiverPoints.push({
      x: width * 0.68,
      y: height / 2 + 10,
      z: 0.375,
    });
    this.middleEdgeRiverPoints.push({
      x: width * 0.72,
      y: height / 2 + 20,
      z: 0.25,
    });
    this.middleEdgeRiverPoints.push({
      x: width * 0.825,
      y: height / 2 + 40,
      z: 0,
    });
    this.middleEdgeRiverPoints.push({
      x: width * 0.625,
      y: height / 2 + 40,
      z: 0,
    });
    this.middleEdgeRiverPoints.push({
      x: width * 0.66,
      y: height / 2 + 37,
      z: 0.0375,
    });
    this.middleEdgeRiverPoints.push({
      x: width * 0.66,
      y: height / 2 + 20,
      z: 0.25,
    });
    this.middleEdgeRiverPoints.push({
      x: width * 0.65,
      y: height / 2 + 15,
      z: 0.3,
    });
    this.middleEdgeRiverPoints.push({
      x: width * 0.63,
      y: height / 2 + 8,
      z: 0.4,
    });

    let spread = 0.02;

    this.faceRiverPoints = [];
    const N = 30; // Number of points per side

    // Right side points
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = width * (0.85 + spread * lerp(0, 0.7, t));
      const y = lerp(height / 2, height + 50, t);
      this.faceRiverPoints.push({ x, y });
    }

    // Left side points in reverse order
    for (let i = N - 1; i >= 0; i--) {
      const t = i / (N - 1);
      const x = width * (0.6 - spread * lerp(0, 0.7, t));
      const y = lerp(height / 2, height + 50, t);
      this.faceRiverPoints.push({ x, y });
    }

    this.middleFaceRiverPoints = [];

    // Right side points
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = width * (0.825 + spread * lerp(0, 0.7, t));
      const y = lerp(height / 2, height + 50, t);
      this.middleFaceRiverPoints.push({ x, y });
    }

    // Left side points in reverse order
    for (let i = N - 1; i >= 0; i--) {
      const t = i / (N - 1);
      const x = width * (0.625 - spread * lerp(0, 0.7, t));
      const y = lerp(height / 2, height + 50, t);
      this.middleFaceRiverPoints.push({ x, y });
    }

    for (let point of this.edgeRiverPoints) {
      point.startXFactor = point.x / width;
      point.startYFactor = point.y / height;
    }

    for (let point of this.middleEdgeRiverPoints) {
      point.startXFactor = point.x / width;
      point.startYFactor = point.y / height;
    }

    for (let point of this.faceRiverPoints) {
      point.startXFactor = point.x / width;
      point.startYFactor = point.y / height;
    }

    for (let point of this.middleFaceRiverPoints) {
      point.startXFactor = point.x / width;
      point.startYFactor = point.y / height;
    }

    this.grassEdgePoints = [];
    this.grassEdgePoints.push({ x: width, y: height / 2 });
    this.grassEdgePoints.push({ x: 0, y: height / 2 });
    this.grassWaveResolution = 100;
    this.grassWaveAmplitude = 20;
    this.grassWaveFrequency = 10;
    this.grassWaveOffset = 30;
    for (let i = 0; i <= this.grassWaveResolution; i++) {
      //sin wave
      let factor = i / this.grassWaveResolution;
      let offset =
        (sin(factor * TAU * this.grassWaveFrequency) * 0.5 + 0.5) *
          this.grassWaveAmplitude +
        this.grassWaveOffset;
      this.grassEdgePoints.push({
        x: (i / this.grassWaveResolution) * width,
        y: height / 2 + offset,
      });
    }

    for (let point of this.grassEdgePoints) {
      point.startXFactor = point.x / width;
      point.startYFactor = point.y / height;
    }

    // Grass Blades
    this.bladeThickness = 15;
    this.bladeThicknessOffsetRange = 5;
    this.bladeLength = 50;
    this.bladeLengthOffsetRange = 20;
    this.bladeCurveMaximum = 60;
    this.partingCurveStrength = 30;
    this.partingPoint = 0.712;
    this.partingWidth = 0.12;
    this.partingBlendDistance = 0.25;
    this.clumpSpread = 0.01;
    this.bladeClumpParting = 0.5;
    this.clumpPositionRandomness = 0.01;

    this.grassBlades = [];
    // Phase 1: Generate blade metadata
    const bladesPerClump = 3;
    const numClumps = 45; // Adjust this number to control density

    for (let i = 0; i < numClumps; i++) {
      // Calculate evenly spaced base position with random offset
      let baseFactor = i / (numClumps - 1); // 0 to 1 evenly spaced
      baseFactor = constrain(
        baseFactor +
          random(-this.clumpPositionRandomness, this.clumpPositionRandomness),
        0,
        1
      );

      if (abs(baseFactor - this.partingPoint) < this.partingWidth) {
        continue;
      }

      // Generate clump of blades
      let clumpBlades = [];
      for (let j = 0; j < bladesPerClump; j++) {
        let factor = constrain(
          baseFactor + random(-this.clumpSpread, this.clumpSpread),
          0,
          1
        );
        let bladeLength =
          this.bladeLength +
          random(-this.bladeLengthOffsetRange, this.bladeLengthOffsetRange);
        let bladeThickness =
          this.bladeThickness +
          random(
            -this.bladeThicknessOffsetRange,
            this.bladeThicknessOffsetRange
          );
        let offset =
          (sin(factor * TAU * this.grassWaveFrequency) * 0.5 + 0.5) *
            this.grassWaveAmplitude +
          this.grassWaveOffset;

        clumpBlades.push({
          x: factor * width,
          y: height / 2 + offset - 5,
          points: [],
          baseRotationAngle: random(-1, 1) * this.bladeCurveMaximum,
          bladeLength: bladeLength,
          bladeThickness: bladeThickness,
          factor: factor,
          clumpIndex: j,
        });
      }
      this.grassBlades.push(...clumpBlades);
    }

    // Phase 2: Smooth curve values based on proximity
    const smoothingRadius = 50; // Pixels
    let tempCurves = new Array(this.grassBlades.length).fill(0);
    let weights = new Array(this.grassBlades.length).fill(0);

    // Calculate smoothed curves
    for (let i = 0; i < this.grassBlades.length; i++) {
      const blade1 = this.grassBlades[i];
      for (let j = 0; j < this.grassBlades.length; j++) {
        const blade2 = this.grassBlades[j];
        const distance = dist(blade1.x, blade1.y, blade2.x, blade2.y);
        if (distance < smoothingRadius) {
          const weight = 1 - distance / smoothingRadius;
          tempCurves[i] += blade2.baseRotationAngle * weight;
          weights[i] += weight;
        }
      }
    }

    // Apply smoothed values
    for (let i = 0; i < this.grassBlades.length; i++) {
      if (weights[i] > 0) {
        this.grassBlades[i].baseRotationAngle = tempCurves[i] / weights[i];
      }
    }

    // Calculate mean and standard deviation of original angles
    let sum = 0;
    let sumSq = 0;
    for (let blade of this.grassBlades) {
      sum += blade.baseRotationAngle;
      sumSq += blade.baseRotationAngle * blade.baseRotationAngle;
    }
    const n = this.grassBlades.length;
    const mean = sum / n;
    const originalStdDev = sqrt(sumSq / n - mean * mean);

    // Calculate new mean and std dev after smoothing
    sum = 0;
    sumSq = 0;
    for (let blade of this.grassBlades) {
      sum += blade.baseRotationAngle;
      sumSq += blade.baseRotationAngle * blade.baseRotationAngle;
    }
    const newMean = sum / n;
    const newStdDev = sqrt(sumSq / n - newMean * newMean);

    // Normalize back to original variation
    const scaleFactor = originalStdDev / newStdDev;
    for (let blade of this.grassBlades) {
      blade.baseRotationAngle =
        (blade.baseRotationAngle - newMean) * scaleFactor + mean;
    }

    // Apply clump parting - make outer blades bend away from middle
    for (let i = 0; i < this.grassBlades.length; i += bladesPerClump) {
      const clump = this.grassBlades.slice(i, i + bladesPerClump);
      if (clump.length === bladesPerClump) {
        // First blade bends left
        clump[0].baseRotationAngle -=
          this.bladeCurveMaximum * this.bladeClumpParting;
        // Third blade bends right
        clump[2].baseRotationAngle +=
          this.bladeCurveMaximum * this.bladeClumpParting;
      }
    }

    // Phase 3: Generate blade points with smoothed, normalized curves
    for (let blade of this.grassBlades) {
      const factor = blade.factor;
      const baseRotationAngle = blade.baseRotationAngle;

      // Calculate parting effect
      const partingPoint = this.partingPoint;
      const partingWidth = this.partingWidth;
      const partingBlendDistance = this.partingBlendDistance;

      let finalRotationAngle;
      if (factor < partingPoint - partingWidth) {
        const distance = abs(factor - (partingPoint - partingWidth));
        if (distance < partingBlendDistance) {
          const blend = constrain(distance / partingBlendDistance, 0, 1);
          finalRotationAngle = lerp(
            this.partingCurveStrength,
            baseRotationAngle,
            blend
          );
        } else {
          finalRotationAngle = baseRotationAngle;
        }
      } else if (factor > partingPoint + partingWidth) {
        const distance = abs(factor - (partingPoint + partingWidth));
        if (distance < partingBlendDistance) {
          const blend = constrain(distance / partingBlendDistance, 0, 1);
          finalRotationAngle = lerp(
            -this.partingCurveStrength,
            baseRotationAngle,
            blend
          );
        } else {
          finalRotationAngle = baseRotationAngle;
        }
      }

      const maxRotationAngle = (finalRotationAngle * PI) / 180;
      const N = 4;

      let points = [];
      points.push({ x: blade.bladeThickness * 0.5, y: 0 });
      points.push({ x: -blade.bladeThickness * 0.5, y: 0 });

      for (let i = 1; i < N; i++) {
        const t = i / N;
        const rotationAngle = maxRotationAngle * t;
        const baseX = lerp(-blade.bladeThickness * 0.5, 0, t);
        const baseY = lerp(0, blade.bladeLength, t);
        points.push({
          x: baseX * cos(rotationAngle) - baseY * sin(rotationAngle),
          y: baseX * sin(rotationAngle) + baseY * cos(rotationAngle),
        });
      }

      const baseX = 0;
      const baseY = blade.bladeLength;
      points.push({
        x: baseX * cos(maxRotationAngle) - baseY * sin(maxRotationAngle),
        y: baseX * sin(maxRotationAngle) + baseY * cos(maxRotationAngle),
      });

      for (let i = N - 1; i > 0; i--) {
        const t = i / N;
        const rotationAngle = maxRotationAngle * t;
        const baseX = lerp(blade.bladeThickness * 0.5, 0, t);
        const baseY = lerp(0, blade.bladeLength, t);
        points.push({
          x: baseX * cos(rotationAngle) - baseY * sin(rotationAngle),
          y: baseX * sin(rotationAngle) + baseY * cos(rotationAngle),
        });
      }

      blade.points = points;
    }

    for (let blade of this.grassBlades) {
      blade.startXFactor = blade.x / width;
      blade.startYFactor = blade.y / height;
    }

    // Water mist puffs
    this.mistPuffs = [];
    const puffCount = 6; // Reduced from 8
    const baseSize = random(50, 100);

    // Bottom row - at the base of the river
    for (let i = 0; i < puffCount; i++) {
      let t = i / (puffCount - 1);
      let x = lerp(width * 0.6, width * 0.85, t);
      let y = height + 40; // Bottom of river where it flows off cliff

      this.mistPuffs.push({
        x: x,
        y: y,
        size: baseSize * random(1.5, 2.5) * random(1.0, 1.2), // At least base size, up to 20% larger
        noiseOffset: random(1000),
        startXFactor: x / width,
        startYFactor: y / height,
        row: 0,
      });
    }

    // Top row - staggered and one less puff
    const spacing = (width * 0.85 - width * 0.6) / (puffCount - 1);
    for (let i = 0; i < puffCount - 1; i++) {
      let t = (i + 0.5) / (puffCount - 1); // Offset by 0.5 spacing
      let x = lerp(width * 0.6, width * 0.85, t);
      let y = height - 20; // 60px above bottom row

      this.mistPuffs.push({
        x: x,
        y: y,
        size: baseSize * random(1.5, 2.5) * random(1.0, 1.2), // At least base size, up to 20% larger
        noiseOffset: random(1000),
        startXFactor: x / width,
        startYFactor: y / height,
        row: 1,
      });
    }

    // Dynamic mist particle system
    this.dynamicMistParticles = [];
    this.lastParticleSpawnTime = 0;

    // Particle system parameters
    this.particleSpawnRate = 3.5; // Doubled from 1.75 particles per second
    this.particleSpawnAccumulator = 0;

    // Particle parameters
    this.particleParams = {
      lifetimeRange: [2.5, 4], // seconds
      initialSizeRange: [40, 60],
      finalSize: 20,
      initialAlphaRange: [180, 220],
      finalAlpha: 0,
      velocityXRange: [-30/width, 30/width], // Convert to relative velocities
      velocityYRange: [-100/height, -150/height], // Convert to relative velocities
      gravity: 98, // pixels per second squared
      spawnAreaPadding: 20 // padding around static mist puffs for spawn area
    };

    // Modify noise parameters for grass blade movement
    this.grassNoiseScalar = 0.02; // Even smaller scale for more variation between blades
    this.grassNoiseStrength = 45; // Much stronger movement
    this.grassNoiseSpeed = 0.0002; // Much slower speed
    this.grassNoiseSecondary = 0.01; // Smaller secondary noise scale
    this.grassNoiseSecondarySpeed = 0.0004; // Slower secondary movement
    this.grassNoiseSecondaryStrength = 25; // Stronger secondary movement

    // Add noise parameters for leaf movement
    this.leafNoiseScalar = 0.15; // High scalar for more variation between clusters
    this.leafNoiseStrength = 15; // Strength of movement
    this.leafNoiseSpeed = 0.0003; // Slow speed for natural movement
    this.leafNoiseSecondary = 0.08; // Secondary movement scalar
    this.leafNoiseSecondarySpeed = 0.0005; // Different speed for secondary movement
    this.leafNoiseSecondaryStrength = 8; // Secondary movement strength

    // Calculate a unique factor for this tree based on its position
    this.treeFactor = this.isLeft ? 0.2 : 0.8; // Different base values for left/right trees
    this.treeFactor += random(-0.1, 0.1); // Add some randomness
  }

  renderBackground() {
    push();
    noStroke();

    // Draw main ground
    fill(this.grassColor);
    rect(-50, height / 2, width + 100, height / 2 + 50);

    let verticalParalaxFactor = map(controlledMouseY, 0, height / 2, 0, 1);
    let horizontalParalaxFactor = map(controlledMouseX, 0, width, 1, -1);

    noStroke();
    fill(this.riverColor);
    beginShape();
    for (let point of this.edgeRiverPoints) {
        vertex(
            point.x + 50 * horizontalParalaxFactor * map(point.z, 0.5, 0, 0, 0.5),
            lerp(point.y, height / 2, verticalParalaxFactor)
        );
    }
    endShape(CLOSE);

    noStroke();
    fill(this.middleRiverColor);
    beginShape();
    for (let point of this.middleEdgeRiverPoints) {
        vertex(
            point.x + 50 * horizontalParalaxFactor * map(point.z, 0.5, 0, 0, 0.5),
            lerp(point.y, height / 2, verticalParalaxFactor)
        );
    }
    endShape(CLOSE);

    // Draw transparent sky gradient overlay
    const maxGradientHeight = 40;
    const gradientHeight = map(
        controlledMouseY,
        0,
        height / 2,
        maxGradientHeight,
        0
    );

    // Only draw gradient if there is height
    if (gradientHeight > 0) {
        for (let y = height / 2; y < height / 2 + gradientHeight; y++) {
            let inter = map(y, height / 2, height / 2 + gradientHeight, 0, 1);
            // Create semi-transparent sky color with alpha based on interpolation
            let skyColorWithAlpha = color(
                red(this.skyColor),
                green(this.skyColor),
                blue(this.skyColor),
                map(inter, 0, 1, 180, 0) // Alpha goes from 180 to 0
            );
            fill(skyColorWithAlpha);
            rect(-50, y, width + 100, 1);
        }
    }

    pop();
  }

  updateDynamicMistParticles(deltaTime) {
    // Update spawn accumulator
    this.particleSpawnAccumulator += deltaTime * this.particleSpawnRate;

    // Spawn new particles
    while (this.particleSpawnAccumulator >= 1) {
      this.spawnDynamicMistParticle();
      this.particleSpawnAccumulator--;
    }

    // Update existing particles
    for (let i = this.dynamicMistParticles.length - 1; i >= 0; i--) {
      const particle = this.dynamicMistParticles[i];

      // Update age
      particle.age += deltaTime;

      // Remove dead particles
      if (particle.age >= particle.maxAge) {
        this.dynamicMistParticles.splice(i, 1);
        continue;
      }

      // Calculate wind influence using noise
      const noiseX = noise(
        particle.xFactor * 0.01,
        particle.yFactor * 0.01,
        accumulatedTime * 0.0003
      );
      const windVelocityFactor = (noiseX * 2 - 1) * 60 / width; // Convert to relative velocity
      const gustInfluence = abs(controlledWind) * 2; // Use gust strength as multiplier

      // Add wind force to velocity instead of replacing it
      particle.velocityXFactor += windVelocityFactor * (1 + gustInfluence) * deltaTime;

      // Update position based on velocity (already in relative coordinates)
      particle.xFactor += particle.velocityXFactor * deltaTime;
      particle.yFactor += particle.velocityYFactor * deltaTime;

      // Apply gravity (convert to relative coordinates)
      particle.velocityYFactor += (this.particleParams.gravity / height) * deltaTime;

      // Calculate life progress (0 to 1)
      const lifeProgress = particle.age / particle.maxAge;

      // Update size and alpha based on life progress
      particle.currentSize = lerp(
        particle.initialSize,
        this.particleParams.finalSize,
        lifeProgress
      );
      particle.currentAlpha = lerp(
        particle.initialAlpha,
        this.particleParams.finalAlpha,
        lifeProgress
      );
    }
  }

  spawnDynamicMistParticle() {
    // Pick a random static mist puff as spawn reference
    const referencePuff = random(this.mistPuffs);

    // Calculate spawn position with random offset within puff area
    // Convert the random offset to relative coordinates by dividing by width/height
    const spawnXFactor = referencePuff.startXFactor + random(-referencePuff.size/4, referencePuff.size/4) / width;
    const spawnYFactor = referencePuff.startYFactor + random(-referencePuff.size/4, referencePuff.size/4) / height;

    // Determine which side of the river we're on using relative position
    const riverCenterFactor = 0.725; // This was previously width * 0.725
    const spawnSide = spawnXFactor < riverCenterFactor ? -1 : 1; // -1 for left, 1 for right

    // Calculate initial outward velocity (convert to relative velocity)
    // Reduced speeds to more reasonable levels while keeping splash behavior
    const baseOutwardSpeed = random(60, 100) / width; // Reduced from (300, 400)
    const randomSpread = random(-40, 40) / width; // Reduced from (-120, 120)
    const initialVelocityXFactor = spawnSide * baseOutwardSpeed + randomSpread;

    // Calculate upward velocity based on position
    // Particles closer to river center get more upward velocity
    const distanceFromCenter = abs(spawnXFactor - riverCenterFactor);
    const upwardVelocityFactor = map(distanceFromCenter, 0, 0.125, 1, 0.6); // More upward velocity near center
    const baseUpwardVelocity = random(-160, -200) / height;
    const finalUpwardVelocity = baseUpwardVelocity * upwardVelocityFactor;

    // Create new particle with relative coordinates
    const particle = {
      xFactor: spawnXFactor,
      yFactor: spawnYFactor,
      age: 0,
      maxAge: random(...this.particleParams.lifetimeRange),
      initialSize: random(...this.particleParams.initialSizeRange),
      initialAlpha: random(...this.particleParams.initialAlphaRange),
      velocityXFactor: initialVelocityXFactor,
      velocityYFactor: finalUpwardVelocity,
      currentSize: 0,
      currentAlpha: 0,
      noiseOffset: random(1000) // Unique noise offset for each particle
    };

    // Set initial size and alpha
    particle.currentSize = particle.initialSize;
    particle.currentAlpha = particle.initialAlpha;

    this.dynamicMistParticles.push(particle);
  }

  renderForeground() {
    push();
    noStroke();

    // Calculate movement based on mouse position with doubled strength
    const offsetY = map(controlledMouseY, 0, height, 40, -40); // Doubled from 20 to 40
    const offsetX = map(controlledMouseX, 0, width, 40, -40); // Added horizontal movement

    // Apply translation for movement
    translate(offsetX, offsetY);

    pop();

    let horizontalParalaxFactor = map(controlledMouseX, 0, width, 1, -1);
    let verticalParalaxFactor = map(controlledMouseY, 0, height, 1, -1);
    push();

    translate(0, offsetY);

    // Draw dirt bands
    const extraHeight = 50; // Extra height below screen
    const totalHeight = height - height / 2 + extraHeight; // Height from middle to bottom plus extra
    const firstBandHeight = totalHeight * 0.4; // 40% of total
    const secondBandHeight = totalHeight * 0.3; // 30% of total
    const thirdBandHeight = totalHeight * 0.3; // 30% of total
    const thinBandHeight = 10;

    // Draw main bands in order from back to front
    noStroke();

    // Third (bottom/darker) band
    fill(this.darkerDirtColor);
    stroke(this.darkerDirtColor);
    strokeWeight(1);
    rect(
      -50,
      height / 2 + firstBandHeight + secondBandHeight,
      width + 100,
      thirdBandHeight
    );

    // Second (middle/dark) band
    fill(this.darkDirtColor);
    stroke(this.darkDirtColor);
    strokeWeight(1);
    rect(-50, height / 2 + firstBandHeight, width + 100, secondBandHeight);

    // First (top/dirt) band
    fill(this.dirtColor);
    stroke(this.dirtColor);
    strokeWeight(1);
    rect(-50, height / 2 + 2, width + 100, firstBandHeight - 2);

    // Draw thin bands - each positioned 10px above its source layer's top edge
    noStroke();

    // Thin band from darker layer (between darker and dark)
    fill(this.darkerDirtColor);
    stroke(this.darkerDirtColor);
    strokeWeight(1);
    rect(
      -50,
      height / 2 + firstBandHeight + secondBandHeight - thinBandHeight * 2,
      width + 100,
      thinBandHeight
    );

    // Thin band from dark layer (between dark and dirt)
    fill(this.darkDirtColor);
    stroke(this.darkDirtColor);
    strokeWeight(1);
    rect(
      -50,
      height / 2 + firstBandHeight - thinBandHeight * 2,
      width + 100,
      thinBandHeight
    );

    // Draw grass edge shadow
    fill(this.grassShadowColor);
    stroke(this.grassShadowColor);
    strokeWeight(1);
    beginShape();
    for (let point of this.grassEdgePoints) {
      vertex(
        map(point.x, 0, width, -50, width + 50) +
          50 * horizontalParalaxFactor * 0.5,
        point.y + this.grassShadowOffset
      );
    }
    endShape(CLOSE);

    // Draw grass blades shadow
    push();
    noStroke();

    translate(50 * horizontalParalaxFactor * 0.5, 0);
    for (let blade of this.grassBlades) {
      push();
      translate(
        map(blade.x, 0, width, -50, width + 50),
        blade.y + this.grassShadowOffset
      );

      // Draw outer shadow (outline effect)
      fill(this.grassShadowColor);
      beginShape();
      for (let i = 0; i < blade.points.length; i++) {
        const point = blade.points[i];
        const uv = point.y / blade.bladeLength;

        const noiseVal =
          noise(
            blade.factor * this.grassNoiseScalar * 100 + controlledWind,
            uv * this.grassNoiseScalar + blade.factor * 20,
            accumulatedTime * this.grassNoiseSpeed
          ) *
            2 -
          1;

        const secondaryNoise =
          noise(
            blade.factor * this.grassNoiseSecondary * 150 +
              controlledWind +
              1000,
            uv * this.grassNoiseSecondary * 2,
            accumulatedTime * this.grassNoiseSecondarySpeed + 2000
          ) *
            2 -
          1;

        const uvPower = pow(uv, 1.8);
        const totalOffset =
          noiseVal * this.grassNoiseStrength * uvPower +
          secondaryNoise * this.grassNoiseSecondaryStrength * uvPower;

        // Add outline thickness
        const outlineThickness = 4;
        const angle = atan2(point.y, point.x);
        const dx = cos(angle) * outlineThickness;
        const dy = sin(angle) * outlineThickness;

        vertex(point.x + totalOffset + dx, point.y + dy);
      }
      endShape(CLOSE);

      // Draw inner shadow
      fill(this.grassShadowColor);
      beginShape();
      for (let i = 0; i < blade.points.length; i++) {
        const point = blade.points[i];
        const uv = point.y / blade.bladeLength;

        const noiseVal =
          noise(
            blade.factor * this.grassNoiseScalar * 100 + controlledWind,
            uv * this.grassNoiseScalar + blade.factor * 20,
            accumulatedTime * this.grassNoiseSpeed
          ) *
            2 -
          1;

        const secondaryNoise =
          noise(
            blade.factor * this.grassNoiseSecondary * 150 +
              controlledWind +
              1000,
            uv * this.grassNoiseSecondary * 2,
            accumulatedTime * this.grassNoiseSecondarySpeed + 2000
          ) *
            2 -
          1;

        const uvPower = pow(uv, 1.8);
        const totalOffset =
          noiseVal * this.grassNoiseStrength * uvPower +
          secondaryNoise * this.grassNoiseSecondaryStrength * uvPower;

        vertex(point.x + totalOffset, point.y);
      }
      endShape(CLOSE);
      pop();
    }
    pop();

    // Draw grass edge
    fill(this.grassColor);
    stroke(this.grassColor);
    strokeWeight(1);
    beginShape();
    for (let point of this.grassEdgePoints) {
      vertex(
        map(point.x, 0, width, -50, width + 50) +
          50 * horizontalParalaxFactor * 0.5,
        point.y
      );
    }
    endShape(CLOSE);

    // Draw grass blades
    push();
    translate(50 * horizontalParalaxFactor * 0.5, 0);
    for (let blade of this.grassBlades) {
      push();
      translate(map(blade.x, 0, width, -50, width + 50), blade.y);
      beginShape();
      for (let i = 0; i < blade.points.length; i++) {
        const point = blade.points[i];
        // Calculate UV coordinate (0 at base, 1 at tip)
        const uv = point.y / blade.bladeLength;

        // Primary wind movement - use blade.factor for horizontal variation
        const noiseVal =
          noise(
            blade.factor * this.grassNoiseScalar * 100 + controlledWind,
            uv * this.grassNoiseScalar + blade.factor * 20,
            accumulatedTime * this.grassNoiseSpeed
          ) *
            2 -
          1;

        // Secondary wind movement - different frequency
        const secondaryNoise =
          noise(
            blade.factor * this.grassNoiseSecondary * 150 +
              controlledWind +
              1000,
            uv * this.grassNoiseSecondary * 2,
            accumulatedTime * this.grassNoiseSecondarySpeed + 2000
          ) *
            2 -
          1;

        // Combine movements with enhanced UV-based influence
        const uvPower = pow(uv, 1.8); // More dramatic tip movement
        const totalOffset =
          noiseVal * this.grassNoiseStrength * uvPower +
          secondaryNoise * this.grassNoiseSecondaryStrength * uvPower;

        vertex(point.x + totalOffset, point.y);
      }
      endShape(CLOSE);
      pop();
    }
    pop();

    pop();
    push();

    translate(0, offsetY);

    stroke(this.riverColor);
    strokeWeight(1);
    fill(this.riverColor);
    beginShape();
    for (let point of this.faceRiverPoints) {
      let nx =
        noise(
          point.startXFactor * this.scalar,
          pow(map(point.startYFactor, 0.5, 1, 1, 0), 2) * this.scalar +
            accumulatedTime * this.riverSpeed
        ) *
          2 -
        1;
      vertex(
        point.x + 50 * horizontalParalaxFactor * 0.5 + nx * this.wiggle,
        point.y
      );
    }
    endShape(CLOSE);

    stroke(this.middleRiverColor);
    strokeWeight(1);
    fill(this.middleRiverColor);
    beginShape();

    for (let point of this.middleFaceRiverPoints) {
      let nx =
        noise(
          point.startXFactor * this.scalar + 1,
          pow(map(point.startYFactor, 0.5, 1, 1, 0), 2) * this.scalar +
            accumulatedTime * this.riverSpeed
        ) *
          2 -
        1;
      vertex(
        point.x + 50 * horizontalParalaxFactor * 0.5 + nx * this.wiggle,
        point.y
      );
    }
    endShape(CLOSE);

    // River edge reflection
    push();
    translate(50 * horizontalParalaxFactor * 0.5, 0);
    fill(255, 255, 255, 50); // Semi-transparent white
    stroke(255, 255, 255, 50);
    strokeWeight(1);

    beginShape();

    // Bottom points with noise
    const steps = 100;
    const dropHeight = 400; // Maximum drop distance
    let leftEdge = 0.6;
    let rightEdge = 0.85;

    // Top left and right points
    vertex(width * leftEdge, height / 2);
    vertex(width * rightEdge, height / 2);

    leftEdge += 0.005;
    rightEdge -= 0.005;

    for (let i = 0; i <= steps; i++) {
      let t = i / steps;
      let x = lerp(width * rightEdge, width * leftEdge, t);
      let xFactor = x / width;

      // Use power operation to bias noise towards 0
      let n = noise(xFactor * 1000 + accumulatedTime * 0.005);
      n = pow(n, 10);
      n = constrain(n, 0, 0.1);

      vertex(x, height / 2 + dropHeight * n + 1);
    }
    endShape(CLOSE);
    pop();
    // Render mist puffs
    noStroke();
    fill(255, 255, 255, 200); // White with some transparency

    for (let puff of this.mistPuffs) {
      push();
      // Basic noise movement
      let nx = noise(puff.noiseOffset + accumulatedTime * 0.001) * 10;
      let ny = noise(puff.noiseOffset + 1000 + accumulatedTime * 0.001) * 10;

      // Horizontal movement based on noise
      const baseNoiseX = noise(
        puff.noiseOffset * 0.1 + accumulatedTime * 0.0003
      );
      const velocityX = (baseNoiseX * 2 - 1) * 15; // Convert 0-1 to -1,1 and scale

      // Add gust influence to velocity
      const gustInfluence = abs(controlledWind) * 2; // Use absolute value as a multiplier
      const finalVelocityX = velocityX * (1 + gustInfluence);

      translate(
        puff.x + finalVelocityX + 50 * horizontalParalaxFactor * 0.5,
        puff.y + ny
      );

      ellipse(0, 0, puff.size, puff.size * 0.8);
      pop();
    }

    // Render dynamic mist particles
    for (const particle of this.dynamicMistParticles) {
      push();
      noStroke();
      fill(255, 255, 255, particle.currentAlpha);
      // Convert relative coordinates to absolute positions during rendering
      const x = particle.xFactor * width + 50 * horizontalParalaxFactor * 0.5;
      const y = particle.yFactor * height;
      ellipse(
        x,
        y,
        particle.currentSize,
        particle.currentSize * 0.8
      );
      pop();
    }

    pop();
  }

  windowResized() {
    for (let point of this.edgeRiverPoints) {
      point.x = point.startXFactor * width;
      point.y = point.startYFactor * height;
    }

    for (let point of this.middleEdgeRiverPoints) {
      point.x = point.startXFactor * width;
      point.y = point.startYFactor * height;
    }

    for (let point of this.faceRiverPoints) {
      point.x = point.startXFactor * width;
      point.y = point.startYFactor * height;
    }

    for (let point of this.middleFaceRiverPoints) {
      point.x = point.startXFactor * width;
      point.y = point.startYFactor * height;
    }

    for (let point of this.grassEdgePoints) {
      point.x = point.startXFactor * width;
      point.y = point.startYFactor * height;
    }

    for (let blade of this.grassBlades) {
      blade.x = blade.startXFactor * width;
      blade.y = blade.startYFactor * height;
    }

    for (let puff of this.mistPuffs) {
      puff.x = puff.startXFactor * width;
      puff.y = puff.startYFactor * height;
    }
  }
}

class Tree {
  constructor(
    positionOffset,
    scaleFactor,
    verticalDepth,
    darkenTintFactor,
    isLeft
  ) {
    this.positionOffset = positionOffset;
    this.scaleFactor = scaleFactor;
    this.verticalDepth = verticalDepth;
    this.darkenTintFactor = darkenTintFactor;
    this.isLeft = isLeft;
    this.horizontalDepth = 0; // For parallax movement
    this.height = random(150, 200);
    this.trunkWidth = 30;
    this.baseWidth = 60;
    this.leafColor = color(66, 140, 45);
    this.trunkColor = color(101, 67, 33);

    // Leaf sizes
    this.mainLeafSize = 180; // Main cluster size
    this.sideLeafSize = random(80, 100); // Random size for each side cluster
    this.branchLeafSize = 80; // Branch tip size

    // Initialize position
    this.updatePosition();

    // Define connection points (as percentages up the tree)
    this.connectionPoints = [0.4, 0.55, 0.7, 0.85];

    // Track which connection points are used for each side
    this.usedLeftPoints = new Set();
    this.usedRightPoints = new Set();

    // Generate branches
    this.branches = [];

    // Generate 1-2 branches for left side
    let leftBranchCount = floor(random(1, 3));
    for (let i = 0; i < leftBranchCount; i++) {
      // Get available connection points
      let availablePoints = this.connectionPoints.filter(
        (p) => !this.usedLeftPoints.has(p)
      );
      // Randomly select one
      let connectionPoint =
        availablePoints[floor(random(availablePoints.length))];
      // Mark it as used
      this.usedLeftPoints.add(connectionPoint);
      // Generate branch at this height
      this.generateBranch(-1, connectionPoint * this.height);
    }

    // Generate 1-2 branches for right side
    let rightBranchCount = floor(random(1, 3));
    for (let i = 0; i < rightBranchCount; i++) {
      // Get available connection points
      let availablePoints = this.connectionPoints.filter(
        (p) => !this.usedRightPoints.has(p)
      );
      // Randomly select one
      let connectionPoint =
        availablePoints[floor(random(availablePoints.length))];
      // Mark it as used
      this.usedRightPoints.add(connectionPoint);
      // Generate branch at this height
      this.generateBranch(1, connectionPoint * this.height);
    }

    // Generate leaf clusters
    this.generateLeafClusters();

    // Add noise parameters for leaf movement
    this.leafNoiseScalar = 0.15; // High scalar for more variation between clusters
    this.leafNoiseStrength = 15; // Strength of movement
    this.leafNoiseSpeed = 0.0003; // Slow speed for natural movement
    this.leafNoiseSecondary = 0.08; // Secondary movement scalar
    this.leafNoiseSecondarySpeed = 0.0005; // Different speed for secondary movement
    this.leafNoiseSecondaryStrength = 8; // Secondary movement strength

    // Calculate a unique factor for this tree based on its position
    this.treeFactor = this.isLeft ? 0.2 : 0.8; // Different base values for left/right trees
    this.treeFactor += random(-0.1, 0.1); // Add some randomness
  }

  generateLeafClusters() {
    this.leafClusters = {
      main: {
        x: 0,
        y: -this.height,
        size: this.mainLeafSize,
      },
      side: [],
      branchTips: [],
    };

    // Generate 5 side clusters
    const sideCount = 5;

    // For the main ellipse: width = mainLeafSize, height = mainLeafSize * 0.8
    const mainRadiusX = this.mainLeafSize / 2;
    const mainRadiusY = (this.mainLeafSize * 0.8) / 2;

    // Calculate positions for left, right, and bottom sides
    const positions = [];

    // Add left and right positions
    for (let t = 0.25; t <= 0.75; t += 0.125) {
      // From top quarter to bottom quarter
      // Left side
      let y = mainRadiusY * cos(t * PI);
      let x =
        -mainRadiusX * Math.sqrt(1 - (y * y) / (mainRadiusY * mainRadiusY));
      positions.push({ x, y });

      // Right side
      x = mainRadiusX * Math.sqrt(1 - (y * y) / (mainRadiusY * mainRadiusY));
      positions.push({ x, y });
    }

    // Add bottom positions
    for (let t = 0.25; t <= 0.75; t += 0.125) {
      // From left quarter to right quarter
      let x = mainRadiusX * cos((t + 0.5) * PI); // Offset by PI/2 to start from bottom
      let y =
        mainRadiusY * Math.sqrt(1 - (x * x) / (mainRadiusX * mainRadiusX));
      positions.push({ x, y });
    }

    // Shuffle all positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Take first 5 positions
    positions.slice(0, sideCount).forEach((pos) => {
      this.leafClusters.side.push({
        x: pos.x,
        y: pos.y - this.height, // Offset by tree height
        size: random(80, 100), // Random size for each cluster
      });
    });

    // Generate branch tip clusters
    for (let branch of this.branches) {
      // Get the last point of the branch (tip)
      let tipIndex = branch.points.length - 2; // -2 to get the top point
      let tipPoint = branch.points[tipIndex];

      this.leafClusters.branchTips.push({
        x: tipPoint.x * branch.direction,
        y: tipPoint.y - branch.startHeight,
        size: this.branchLeafSize,
      });
    }
  }

  generateBranch(direction, startHeight) {
    // Random length between 1.5 and 3 times trunk width
    let length = random(this.trunkWidth * 1.5, this.trunkWidth * 3);

    // Random width proportional to length but thicker (1.5x)
    let width = map(
      length,
      this.trunkWidth * 1.5,
      this.trunkWidth * 3,
      this.trunkWidth * 0.3,
      this.trunkWidth * 0.45
    );

    // Number of segments
    const segmentCount = 10;

    // Calculate points for top and bottom edges
    let points = [];
    for (let j = 0; j <= segmentCount; j++) {
      let x = (j / segmentCount) * length;
      points.push({
        x: x,
        y: -width / 2, // Top point
        isTop: true,
      });
      points.push({
        x: x,
        y: width / 2, // Bottom point
        isTop: false,
      });
    }

    // Determine bend point (around 25-35% from end)
    let bendIndex = floor(random(segmentCount * 0.65, segmentCount * 0.75));

    // Calculate rotation angles
    let baseAngle = random(-40, -20); // Both sides use negative angles to go up
    let tipAngle = random(-100, -70); // Both sides curve up more at tip

    // Apply rotations
    for (let j = 0; j < points.length; j += 2) {
      let segment = floor(j / 2);
      let point = points[j];
      let bottomPoint = points[j + 1];

      // Base rotation for all points
      let angle = baseAngle * (PI / 180);
      let x = point.x * cos(angle) - point.y * sin(angle);
      let y = point.x * sin(angle) + point.y * cos(angle);
      point.x = x;
      point.y = y;

      x = bottomPoint.x * cos(angle) - bottomPoint.y * sin(angle);
      y = bottomPoint.x * sin(angle) + bottomPoint.y * cos(angle);
      bottomPoint.x = x;
      bottomPoint.y = y;

      // Additional rotation for points after bend
      if (segment >= bendIndex) {
        // Calculate rotation around the top point of the bend
        let bendPoint = points[bendIndex * 2];
        let additionalAngle = (tipAngle - baseAngle) * (PI / 180);

        // Translate to origin (bend point)
        x = point.x - bendPoint.x;
        y = point.y - bendPoint.y;

        // Rotate
        let newX = x * cos(additionalAngle) - y * sin(additionalAngle);
        let newY = x * sin(additionalAngle) + y * cos(additionalAngle);

        // Translate back
        point.x = newX + bendPoint.x;
        point.y = newY + bendPoint.y;

        // Same for bottom point
        x = bottomPoint.x - bendPoint.x;
        y = bottomPoint.y - bendPoint.y;

        newX = x * cos(additionalAngle) - y * sin(additionalAngle);
        newY = x * sin(additionalAngle) + y * cos(additionalAngle);

        bottomPoint.x = newX + bendPoint.x;
        bottomPoint.y = newY + bendPoint.y;
      }
    }

    // After all rotations are applied, smooth the points
    let smoothedPoints = [];
    const smoothingPasses = 6; // Increased from 3 to 6 passes
    const smoothingFactor = 0.75; // Increased from 0.5 to 0.75 for stronger smoothing

    // Initialize smoothedPoints with current points
    for (let point of points) {
      smoothedPoints.push({
        x: point.x,
        y: point.y,
        isTop: point.isTop,
      });
    }

    // Apply multiple passes of smoothing
    for (let pass = 0; pass < smoothingPasses; pass++) {
      // Smooth top edge
      for (let i = 2; i < points.length - 2; i += 2) {
        let prev2 = smoothedPoints[i - 2];
        let prev = smoothedPoints[i];
        let current = smoothedPoints[i];
        let next = smoothedPoints[i + 2];

        // Calculate smoothed position
        let smoothX = (prev2.x + prev.x + current.x + next.x) / 4;
        let smoothY = (prev2.y + prev.y + current.y + next.y) / 4;

        // Interpolate between original and smoothed position
        smoothedPoints[i].x = lerp(current.x, smoothX, smoothingFactor);
        smoothedPoints[i].y = lerp(current.y, smoothY, smoothingFactor);

        // Calculate and maintain thickness by adjusting bottom point
        let dx = smoothedPoints[i].x - points[i].x;
        let dy = smoothedPoints[i].y - points[i].y;

        // Move bottom point by same delta to maintain thickness
        smoothedPoints[i + 1].x = points[i + 1].x + dx;
        smoothedPoints[i + 1].y = points[i + 1].y + dy;
      }

      // Keep first and last points fixed to maintain length
      smoothedPoints[0] = points[0];
      smoothedPoints[1] = points[1];
      smoothedPoints[points.length - 2] = points[points.length - 2];
      smoothedPoints[points.length - 1] = points[points.length - 1];
    }

    // Replace original points with smoothed points
    points = smoothedPoints;

    this.branches.push({
      startHeight,
      direction,
      points,
    });
  }

  updatePosition() {
    const padding = random(10, 20);
    this.x = this.isLeft
      ? padding + this.baseWidth / 2
      : width - (padding + this.baseWidth / 2);
    this.y = height / 2;

    // Store factors for resize
    this.startXFactor = this.x / width;
    this.startYFactor = this.y / height;
  }

  windowResized() {
    this.x = this.startXFactor * width;
    this.y = this.startYFactor * height;
  }

  renderLeafCluster(x, y, size) {
    // Calculate world position for noise sampling
    const worldX = (this.x + x * this.scaleFactor) / width;
    const worldY = (this.y + y * this.scaleFactor) / height;

    // Primary wind movement
    const noiseVal =
      noise(
        worldX * this.leafNoiseScalar * 100 +
          this.treeFactor * 50 +
          controlledWind,
        worldY * this.leafNoiseScalar * 100,
        accumulatedTime * this.leafNoiseSpeed
      ) *
        2 -
      1;

    // Secondary wind movement
    const secondaryNoise =
      noise(
        worldX * this.leafNoiseSecondary * 150 +
          this.treeFactor * 80 +
          controlledWind +
          1000,
        worldY * this.leafNoiseSecondary * 150,
        accumulatedTime * this.leafNoiseSecondarySpeed + 2000
      ) *
        2 -
      1;

    // Calculate offsets
    const xOffset =
      noiseVal * this.leafNoiseStrength +
      secondaryNoise * this.leafNoiseSecondaryStrength;

    const yOffset =
      noiseVal * this.leafNoiseStrength * 0.5 +
      secondaryNoise * this.leafNoiseSecondaryStrength * 0.5;

    fill(lerpColor(this.leafColor, color(0), this.darkenTintFactor));
    ellipse(x + xOffset, y + yOffset, size, size * 0.8);
  }

  render() {
    push();
    translate(this.x + this.positionOffset * (this.isLeft ? -1 : 1), this.y);
    scale(this.scaleFactor);

    // Draw trunk
    fill(lerpColor(this.trunkColor, color(0), this.darkenTintFactor));
    noStroke();

    beginShape();
    // Start at bottom left with wider base
    vertex(-this.baseWidth / 2, 0);

    // Left side curve going up - more triangular base
    bezierVertex(
      -this.baseWidth / 2,
      -this.height * 0.05, // Control point 1 - closer to base
      -this.trunkWidth / 2,
      -this.height * 0.15, // Control point 2
      -this.trunkWidth / 2,
      -this.height * 0.2 // Anchor point - starts trunk earlier
    );

    // Left side tapering to top
    bezierVertex(
      -this.trunkWidth / 2,
      -this.height * 0.6, // Control point 1
      -this.trunkWidth / 4,
      -this.height * 0.8, // Control point 2
      0,
      -this.height // Top point
    );

    // Right side tapering down
    bezierVertex(
      this.trunkWidth / 4,
      -this.height * 0.8, // Control point 1
      this.trunkWidth / 2,
      -this.height * 0.6, // Control point 2
      this.trunkWidth / 2,
      -this.height * 0.2 // Anchor point - matches left side
    );

    // Right side base curve - more triangular
    bezierVertex(
      this.trunkWidth / 2,
      -this.height * 0.15, // Control point 1
      this.baseWidth / 2,
      -this.height * 0.05, // Control point 2 - closer to base
      this.baseWidth / 2,
      0 // Bottom right point
    );

    endShape(CLOSE);

    // Draw branches
    for (let branch of this.branches) {
      push();
      translate(0, -branch.startHeight);

      fill(lerpColor(this.trunkColor, color(0), this.darkenTintFactor));
      noStroke();

      beginShape();
      // Draw all top points
      for (let i = 0; i < branch.points.length; i += 2) {
        vertex(branch.points[i].x * branch.direction, branch.points[i].y);
      }
      // Draw all bottom points in reverse
      for (let i = branch.points.length - 1; i >= 0; i -= 2) {
        vertex(branch.points[i].x * branch.direction, branch.points[i].y);
      }
      endShape(CLOSE);

      pop();
    }

    // Draw leaf clusters
    noStroke();

    // Draw main cluster
    this.renderLeafCluster(
      this.leafClusters.main.x,
      this.leafClusters.main.y,
      this.leafClusters.main.size
    );

    // Draw side clusters
    for (let cluster of this.leafClusters.side) {
      this.renderLeafCluster(cluster.x, cluster.y, cluster.size);
    }

    // Draw branch tip clusters
    for (let cluster of this.leafClusters.branchTips) {
      this.renderLeafCluster(cluster.x, cluster.y, cluster.size);
    }

    pop();
  }
}

class Cloud {
  static clouds = [];
  static skyBlueColor;

  static initialize(skyBlueColor) {
    this.skyBlueColor = skyBlueColor;
    this.clouds = [];
    this.generateClouds();
    // Sort clouds by depth so farther ones render first
    this.clouds.sort((a, b) => b.depth - a.depth);
  }

  static generateClouds() {
    // Grid parameters
    const horizontalCells = 20;
    const depthCells = 10;
    const spawnChance = 0.33; // 33% chance to spawn a cloud

    // Position variation amounts
    const horizontalVariation = (1.0 / horizontalCells) * 0.5; // Half a cell width
    const depthVariation = (0.7 / depthCells) * 0.5; // Half a cell depth

    // Iterate through grid
    for (let i = 0; i < horizontalCells; i++) {
      for (let j = 0; j < depthCells; j++) {
        // Only spawn cloud with 33% chance
        if (random() < spawnChance) {
          // Calculate base position in grid
          let baseXFactor = map(i, 0, horizontalCells - 1, 0, 1);
          let baseDepth = map(j, 0, depthCells - 1, 0.3, 1);

          // Add random variation to position
          let xfactor = constrain(
            baseXFactor + random(-horizontalVariation, horizontalVariation),
            0,
            1
          );
          let depth = constrain(
            baseDepth + random(-depthVariation, depthVariation),
            0.3,
            1
          );

          // Calculate size based on depth
          let cloudSize = map(depth, 0.3, 1, 0.8, 0.2);

          this.createCloud(xfactor, depth, cloudSize);
        }
      }
    }

    // Sort clouds by depth so farther ones render first
    this.clouds.sort((a, b) => b.depth - a.depth);
  }

  static createCloud(xfactor, depth, cloudSize) {
    let cloudX = xfactor * width;

    // First, get a random base height between 0.1 and 0.3 (higher in sky)
    let baseHeightFactor = random(0.1, 0.3);

    // Then lerp this position towards horizon (height/2) based on depth
    // Deeper clouds (closer to 1) will be pulled more towards the horizon
    let horizonFactor = map(depth, 0.3, 1, 0.1, 0.8); // How much to pull towards horizon
    let heightFactor = lerp(baseHeightFactor, 0.5, horizonFactor);

    let cloudY = height * heightFactor;
    let cloud = new Cloud(cloudX, cloudY);
    cloud.depth = depth;
    cloud.size = cloudSize;

    // Calculate color based on depth
    // Closer clouds are more opaque white, farther ones fade to sky color
    let cloudColor = color(255, 255, 255, map(depth, 0.3, 1, 200, 100));
    cloud.baseColor = cloudColor;

    this.clouds.push(cloud);
  }

  static renderAll() {
    const controlledMouseXPercent = controlledMouseX / width;
    const controlledMouseYPercent = controlledMouseY / height;

    for (let cloud of this.clouds) {
      push();
      // Calculate movement range based on depth
      let moveRange = 0;
      if (cloud.depth < 0.65) {
        // First segment: depth 0.3 to 0.65 maps to 15 to 5
        moveRange = map(cloud.depth, 0.3, 0.65, 15, 5);
      } else {
        // Second segment: depth 0.65 to 1 maps to 5 to 0
        moveRange = map(cloud.depth, 0.65, 1, 5, 0);
      }

      // Move in opposite direction of mouse for both x and y
      const xOffset = map(controlledMouseXPercent, 0, 1, moveRange, -moveRange);
      // Use same movement range for vertical as horizontal since depth starts at 0.3
      const yOffset = map(controlledMouseYPercent, 0, 1, moveRange, -moveRange);

      translate(xOffset, yOffset);
      cloud.render();
      pop();
    }
  }

  static windowResized() {
    for (let cloud of this.clouds) {
      cloud.windowResized();
    }
  }

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.startWidth = width;
    this.startHeight = height;
    this.size = 1;
    this.baseColor = color(255);

    // Cloud shape parameters
    this.puffCount = floor(random(3, 6));
    this.puffs = [];

    // Generate cloud puffs with larger sizes
    let totalWidth = random(150, 300);
    let baseHeight = random(60, 120);

    for (let i = 0; i < this.puffCount; i++) {
      // Calculate horizontal position
      let puffX = map(
        i,
        0,
        this.puffCount - 1,
        -totalWidth / 2,
        totalWidth / 2
      );

      // Calculate vertical position using a parabolic arch
      // Convert i to range -1 to 1 for parabola calculation
      let t = map(i, 0, this.puffCount - 1, -1, 1);
      // y = -x^2 creates an upward arch, scaled by baseHeight/4
      let archHeight = -(t * t) + 1; // Will be 0 at edges, 1 in middle
      let puffY = -archHeight * (baseHeight / 3); // Negative because y goes up

      // Calculate size - larger in middle
      let sizeFactor = map(abs(t), 0, 1, 1.2, 0.8); // 1.2 in middle, 0.8 at edges
      let puffSize = baseHeight * sizeFactor;

      // Add some randomness to positions
      puffX += random(-20, 20);
      puffY += random(-10, 10);

      this.puffs.push({
        x: puffX,
        y: puffY,
        size: puffSize,
        noiseOffset: random(1000), // For movement
      });
    }
  }

  windowResized() {
    this.x = (this.startX / this.startWidth) * width;
    this.y = (this.startY / this.startHeight) * height;
  }

  render() {
    push();
    translate(this.x, this.y);
    scale(this.size);

    noStroke();

    // Add movement to each puff
    for (let puff of this.puffs) {
      // Basic noise movement
      let moveX = noise(puff.noiseOffset + accumulatedTime * 0.0001) * 10;
      let moveY = noise(puff.noiseOffset + 1000 + accumulatedTime * 0.0001) * 5;

      // Add wind influence
      const baseNoiseX = noise(
        puff.noiseOffset * 0.1 + accumulatedTime * 0.0003
      );
      const velocityX = (baseNoiseX * 2 - 1) * 15; // Convert 0-1 to -15,15

      // Add gust influence to velocity
      const gustInfluence = abs(controlledWind) * 2; // Use absolute value as multiplier
      const finalVelocityX = velocityX * (1 + gustInfluence);

      fill(this.baseColor);
      ellipse(
        puff.x + moveX + finalVelocityX,
        puff.y + moveY,
        puff.size,
        puff.size * 0.8
      );
    }

    pop();
  }
}
