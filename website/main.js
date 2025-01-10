// Navigation hover effects
document.querySelectorAll('.nav-item').forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
        const navItems = document.querySelectorAll('.nav-item');
        const isMobile = window.innerWidth < 992;
        
        if (isMobile) {
            // Mobile animations (vertical)
            if (index === 0) { // Home
                navItems[1].classList.add('move-down');
                navItems[2].classList.add('move-down');
            } else if (index === 1) { // Art
                navItems[0].classList.add('move-up');
                navItems[2].classList.add('move-down');
            } else if (index === 2) { // Code
                navItems[0].classList.add('move-up');
                navItems[1].classList.add('move-up');
            }
        } else {
            // Desktop animations (horizontal)
            if (index === 0) { // Home
                navItems[1].classList.add('move-right');
                navItems[2].classList.add('move-right');
            } else if (index === 1) { // Art
                navItems[0].classList.add('move-left');
                navItems[2].classList.add('move-right');
            } else if (index === 2) { // Code
                navItems[0].classList.add('move-left');
                navItems[1].classList.add('move-left');
            }
        }
    });

    item.addEventListener('mouseleave', () => {
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.classList.remove('move-left', 'move-right', 'move-up', 'move-down', 'scale-up');
        });
    });
});

// Also handle resize events to update animations
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.classList.remove('move-left', 'move-right', 'move-up', 'move-down', 'scale-up');
        });
    }, 250);
});

// Canvas setup
let canvas;

// Function to update header height CSS variable
function updateHeaderHeight() {
    const header = document.querySelector('header');
    const headerHeight = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
}

function setup() {
    // Update header height before creating canvas
    updateHeaderHeight();
    
    // Create canvas inside the container
    const container = document.getElementById('canvas-container');
    canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('canvas-container');
    
    // Set up any initial states
    background(33); // #212121 in decimal
}

function draw() {
    // Clear background
    background(33); // #212121 in decimal
    
    // Add some simple animation
    let time = millis() * 0.001;
    for(let i = 0; i < 5; i++) {
        let x = width/2 + cos(time + i) * 100;
        let y = height/2 + sin(time + i) * 100;
        
        fill(255, 100, 100);
        noStroke();
        ellipse(x, y, 30, 30);
    }
}

// Make canvas responsive
function windowResized() {
    updateHeaderHeight();
    const container = document.getElementById('canvas-container');
    resizeCanvas(container.offsetWidth, container.offsetHeight);
}

// Add event listener for when the page loads
window.addEventListener('load', updateHeaderHeight);
// Add event listener for when the window is resized
window.addEventListener('resize', updateHeaderHeight);
