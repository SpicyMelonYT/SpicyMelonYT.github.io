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

let controlledWind = 0;
let windVelocity = 0;
let nextGustTime = 0;
let gustDuration = 3000; // Fixed 3 second gust
let timeBetweenGusts = 0;
let isGusting = false;

function setup() {
  controlledMouseX = mouseX;
  controlledMouseY = mouseY;

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

  accumulatedTime = 0;

  // Set up sky
  skyBlueColor = color(135, 206, 235);
  sky = new Sky(skyBlueColor);

  ground = new Ground();

  // Initialize clouds and mountains
  Cloud.initialize(skyBlueColor);
  Mountain.initialize(skyBlueColor);

  // Create trees
  trees = [
    new Tree(-40, 1, -0.3, 0, true),
    new Tree(50, 1.2, -0.4, 0.1, true),
    new Tree(-40, 1, -0.3, 0, false),
    new Tree(50, 1.2, -0.4, 0.1, false),
  ];

  // Initialize link buttons
  const buttonWidth = 150;
  const buttonHeight = 40;
  const buttonSpacing = 20;
  const startY = height * 0.5 - buttonHeight * 7;

  linkButtonManager.addButton(width * 0.72 - buttonWidth/2, startY, buttonWidth, buttonHeight, "Art", "palette", "art.html", "danger", "light");
  linkButtonManager.addButton(width * 0.72 - buttonWidth/2, startY + buttonHeight + buttonSpacing, buttonWidth, buttonHeight, "Code", "code-slash", "code.html", "danger", "light");
  linkButtonManager.addButton(width * 0.72 - buttonWidth/2, startY + (buttonHeight + buttonSpacing) * 2, buttonWidth, buttonHeight, "YouTube", "youtube", "https://www.youtube.com/@SpicyMelonYT", "danger", "light");
  linkButtonManager.addButton(width * 0.72 - buttonWidth/2, startY + (buttonHeight + buttonSpacing) * 3, buttonWidth, buttonHeight, "GitHub", "github", "https://github.com/SpicyMelonYT", "danger", "light");
}

function draw() {
  background(skyBlueColor);

  controlledMouseX = mouseX;
  controlledMouseY = mouseY;

  if (controlledMouseX < 0) {
    controlledMouseX = 0;
  }
  if (controlledMouseY < 0) {
    controlledMouseY = 0;
  }
  if (controlledMouseX > width) {
    controlledMouseX = width;
  }
  if (controlledMouseY > height) {
    controlledMouseY = height;
  }

  accumulatedTime += deltaTime;

  sky.render();

  ground.renderBackground();

  // Render clouds before mountains
  Cloud.renderAll();
  Mountain.renderAll();

  // Calculate x and y offset based on mouse position
  const controlledMouseXPercent = controlledMouseX / width; // 0 to 1
  const controlledMouseYPercent = controlledMouseY / height; // 0 to 1

  // Render trees with parallax effect
  for (let tree of trees) {
    push();
    // Use horizontalDepth for x movement
    const moveRange = map(tree.horizontalDepth, 0, 0.5, 25, 5);
    const xOffset = map(controlledMouseXPercent, 0, 1, moveRange, -moveRange);
    // Use verticalDepth for y movement
    const yMoveRange = map(tree.verticalDepth, -0.1, 0.5, 25, 5);
    const yOffset = map(controlledMouseYPercent, 0, 1, yMoveRange, -yMoveRange);
    translate(xOffset, yOffset);
    tree.render();
    pop();
  }

  // Update dynamic mist particles
  ground.updateDynamicMistParticles(deltaTime / 1000); // Convert deltaTime to seconds

  ground.renderForeground();

  // Render link buttons on top of everything
  linkButtonManager.render();

  // Update wind system
  const currentTime = millis();
  
  // Check if it's time for a new gust
  if (!isGusting && currentTime > nextGustTime) {
    isGusting = true;
    gustDuration = 3000; // Fixed 3 second duration
    // Target velocity between 0.8 and 1.44
    windVelocity = random(0.8, 1.44);
    // Set end time for this gust
    nextGustTime = currentTime + gustDuration;
  }
  
  // During gust, increase controlledWind
  if (isGusting) {
    if (currentTime < nextGustTime) {
      // Calculate progress through the gust (0 to 1)
      const gustProgress = (currentTime - (nextGustTime - gustDuration)) / gustDuration;
      
      // Create a smooth bell curve using sine
      const smoothStrength = sin(gustProgress * PI);
      
      // Apply the smooth strength to control the wind
      controlledWind = windVelocity * smoothStrength;
      
    } else {
      // End of gust
      isGusting = false;
      windVelocity = 0;
      controlledWind = 0;
      // Set next gust time (3 to 8 seconds from now)
      timeBetweenGusts = random(3000, 8000);
      nextGustTime = currentTime + timeBetweenGusts;
    }
  }
}

// Make canvas responsive
function windowResized() {
  updateHeaderHeight();
  const container = document.getElementById("canvas-container");
  resizeCanvas(container.offsetWidth, container.offsetHeight);

  sky.windowResized();
  ground.windowResized();
  Cloud.windowResized();
  Mountain.windowResized();
  for (let tree of trees) {
    tree.windowResized();
  }

  // Clear existing buttons
  linkButtonManager.windowResized();
  
  // Recreate buttons with new positions
  const buttonWidth = 150;
  const buttonHeight = 40;
  const buttonSpacing = 20;
  const startY = height * 0.5 - buttonHeight * 7;

  linkButtonManager.addButton(width * 0.72 - buttonWidth/2, startY, buttonWidth, buttonHeight, "Art", "palette", "art.html", "danger", "light");
  linkButtonManager.addButton(width * 0.72 - buttonWidth/2, startY + buttonHeight + buttonSpacing, buttonWidth, buttonHeight, "Code", "code-slash", "code.html", "danger", "light");
  linkButtonManager.addButton(width * 0.72 - buttonWidth/2, startY + (buttonHeight + buttonSpacing) * 2, buttonWidth, buttonHeight, "YouTube", "youtube", "https://youtube.com/@SpicyMelon", "danger", "light");
  linkButtonManager.addButton(width * 0.72 - buttonWidth/2, startY + (buttonHeight + buttonSpacing) * 3, buttonWidth, buttonHeight, "GitHub", "github", "https://github.com/SpicyMelon", "danger", "light");
}

// Add event listener for when the page loads
window.addEventListener("load", updateHeaderHeight);
// Add event listener for when the window is resized
window.addEventListener("resize", updateHeaderHeight);
