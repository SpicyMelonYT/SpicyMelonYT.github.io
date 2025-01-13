class Mountain {
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

    const controlledMouseYPercent = (controlledMouseY - height / 2) / (height / 2); // -1 to 1
    const yOffset = -controlledMouseYPercent * 5; // 10 to -10 pixels
    const controlledMouseXPercent = (controlledMouseX - width / 2) / (width / 2); // -1 to 1
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
  }

  renderBackground() {
    push();
    noStroke();

    // Draw main ground
    fill(this.grassColor);
    rect(-50, height / 2, width + 100, height / 2 + 50);

    // Draw gradient from sky to grass with height based on mouse position
    const maxGradientHeight = 40;
    const gradientHeight = map(controlledMouseY, 0, height / 2, maxGradientHeight, 0);

    // Only draw gradient if there is height
    if (gradientHeight > 0) {
      for (let y = height / 2; y < height / 2 + gradientHeight; y++) {
        let inter = map(y, height / 2, height / 2 + gradientHeight, 0, 1);
        let gradientColor = lerpColor(this.skyColor, this.grassColor, inter);
        fill(gradientColor);
        rect(-50, y, width + 100, 1);
      }
    }

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

    pop();
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

    push();

    translate(0, offsetY);

    // Draw dirt
    fill(this.dirtColor);
    noStroke();
    rect(-50, height / 2, width + 100, height / 2 + 50);

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
    strokeWeight(4);

    translate(50 * horizontalParalaxFactor * 0.5, 0);
    for (let blade of this.grassBlades) {
      push();
      translate(
        map(blade.x, 0, width, -50, width + 50),
        blade.y + this.grassShadowOffset
      );
      beginShape();
      for (let point of blade.points) {
        vertex(point.x, point.y);
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
      for (let point of blade.points) {
        vertex(point.x, point.y);
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
    fill(lerpColor(this.leafColor, color(0), this.darkenTintFactor));
    ellipse(x, y, size, size * 0.8);
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
