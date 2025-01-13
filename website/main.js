// Navigation hover effects
document.querySelectorAll(".nav-item").forEach((item, index) => {
  item.addEventListener("mouseenter", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const isMobile = window.innerWidth < 992;

    if (isMobile) {
      // Mobile animations (vertical)
      if (index === 0) {
        // Home
        navItems[1].classList.add("move-down");
        navItems[2].classList.add("move-down");
      } else if (index === 1) {
        // Art
        navItems[0].classList.add("move-up");
        navItems[2].classList.add("move-down");
      } else if (index === 2) {
        // Code
        navItems[0].classList.add("move-up");
        navItems[1].classList.add("move-up");
      }
    } else {
      // Desktop animations (horizontal)
      if (index === 0) {
        // Home
        navItems[1].classList.add("move-right");
        navItems[2].classList.add("move-right");
      } else if (index === 1) {
        // Art
        navItems[0].classList.add("move-left");
        navItems[2].classList.add("move-right");
      } else if (index === 2) {
        // Code
        navItems[0].classList.add("move-left");
        navItems[1].classList.add("move-left");
      }
    }
  });

  item.addEventListener("mouseleave", () => {
    document.querySelectorAll(".nav-item").forEach((navItem) => {
      navItem.classList.remove(
        "move-left",
        "move-right",
        "move-up",
        "move-down",
        "scale-up"
      );
    });
  });
});

// Also handle resize events to update animations
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    document.querySelectorAll(".nav-item").forEach((navItem) => {
      navItem.classList.remove(
        "move-left",
        "move-right",
        "move-up",
        "move-down",
        "scale-up"
      );
    });
  }, 250);
});

// Canvas setup
let canvas;

// Function to update header height CSS variable
function updateHeaderHeight() {
  const header = document.querySelector("header");
  const headerHeight = header.offsetHeight;
  document.documentElement.style.setProperty(
    "--header-height",
    `${headerHeight}px`
  );
}

function setup() {
  // Update header height before creating canvas
  updateHeaderHeight();

  // Create canvas inside the container
  const container = document.getElementById("canvas-container");
  canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent("canvas-container");

  // Initialize context menu
  const contextMenu = new ContextMenu();

  // Add playful label
  contextMenu.addLabel("Trying to inspect element are ya? LOL");

  // Add options with icons
  contextMenu.addOption("save", "Save Image", "download");
  contextMenu.addOption("fullscreen", "Toggle Fullscreen", "fullscreen");

  // Listen for option selection
  contextMenu.onOptionSelected.on((name, id) => {
    if (id === "save") {
      saveCanvas(canvas, "mountain-scene", "png");
    } else if (id === "fullscreen") {
      const fs = fullscreen();
      fullscreen(!fs);
    }
  });

  // let seed = random(0, 1000000);
  // print(seed);
  // randomSeed(seed);
  // randomSeed(421860); // Nice seed for mountain positions around river
  // randomSeed(225006.23873028957);

  // Set up sky
  skyBlueColor = color(135, 206, 235);
  sky = new Sky(skyBlueColor);

  ground = new Ground();

  // Mountain generation parameters
  const exclusionZoneWidth = 0.1; // Width of the exclusion zone on each side

  // Create mountains
  mountains = [];
  // Create mountains with random depths
  for (let i = 0; i < 60; i++) {
    let xfactor = random(0, 1);
    let depth = random(0, 0.5); // Random depth between 0 (closest) and 1 (farthest)

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

    let mountainX = xfactor * width;
    let mountainY = height / 2;
    let mountain = new Mountain(mountainX, mountainY);
    mountain.depth = depth; // Store depth directly on mountain object

    // Set size based on depth - 0.8 when depth is 0, 0.2 when depth is 0.5
    mountain.size = mountainSize;

    // Calculate color based on depth
    // Closer mountains are darker blue-gray, farther ones fade to sky blue
    let mountainColor = color(100);
    mountain.baseColor = lerpColor(mountainColor, skyBlueColor, depth);

    mountains.push(mountain);
  }

  // Create mountains with random depths
  for (let i = 0; i < 60; i++) {
    let xfactor = random(0.5, 0.7);
    let depth = random(0.5, 1);

    let mountainSize = map(depth, 0.5, 1, 0.2, 0.1);

    let mountainX = xfactor * width;
    let mountainY = height / 2;
    let mountain = new Mountain(mountainX, mountainY);
    mountain.depth = depth; // Store depth directly on mountain object

    // Set size based on depth - 0.8 when depth is 0, 0.2 when depth is 0.5
    mountain.size = mountainSize;

    // Calculate color based on depth
    // Closer mountains are darker blue-gray, farther ones fade to sky blue
    let mountainColor = color(100);
    mountain.baseColor = lerpColor(mountainColor, skyBlueColor, depth);

    mountains.push(mountain);
  }

  // Sort mountains by depth so farther ones render first
  mountains.sort((a, b) => b.depth - a.depth);
}

function draw() {
  background(skyBlueColor);

  sky.render();

  ground.renderBackground();

  // Calculate x and y offset based on mouse position
  const mouseXPercent = mouseX / width; // 0 to 1
  const mouseYPercent = mouseY / height; // 0 to 1

  // Render mountains with parallax effect
  for (let mountain of mountains) {
    push();
    // Calculate movement range based on depth
    // Closer mountains (depth=0) move -25 to 25
    // Farther mountains (depth=0.5) move -5 to 5
    let moveRange = 0;
    if (mountain.depth < 0.5) {
      moveRange = map(mountain.depth, 0, 0.5, 25, 5);
    } else {
      moveRange = map(mountain.depth, 0.5, 1, 5, 0);
    }

    // Move in opposite direction of mouse for both x and y
    const xOffset = map(mouseXPercent, 0, 1, moveRange, -moveRange);
    const yOffset = map(mouseYPercent, 0, 1, moveRange, -moveRange);

    translate(xOffset, yOffset);
    mountain.render();
    pop();
  }

  ground.renderForeground();
}

// Make canvas responsive
function windowResized() {
  updateHeaderHeight();
  const container = document.getElementById("canvas-container");
  resizeCanvas(container.offsetWidth, container.offsetHeight);

  sky.windowResized();
  ground.windowResized();
  for (let mountain of mountains) {
    mountain.windowResized();
  }
}

// Add event listener for when the page loads
window.addEventListener("load", updateHeaderHeight);
// Add event listener for when the window is resized
window.addEventListener("resize", updateHeaderHeight);
