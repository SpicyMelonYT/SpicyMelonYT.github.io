// Matter.js module aliases
const { Engine, World, Bodies, Body, Events, Composite } = Matter;

// Interactive objects configuration
const interactiveObjects = [
    { name: 'Art', link: 'website/art.html', color: '#FF6B6B' },
    { name: 'Code', link: 'website/code.html', color: '#4ECDC4' },
    { name: 'YouTube', link: 'https://youtube.com/@YourChannel', color: '#FF0000' },
    { name: 'GitHub', link: 'https://github.com/YourGithub', color: '#6e5494' }
];

const decorativeObjects = 6; // Number of non-interactive objects
const objectSize = 60; // Size of objects
let engine;
let world;
let objects = [];
let particles = [];
let canvas;

function setup() {
    // Create canvas inside canvas-container
    const container = document.getElementById('canvas-container');
    canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('canvas-container');

    // Initialize Matter.js engine
    engine = Engine.create();
    world = engine.world;
    engine.world.gravity.y = 0.5; // Reduced gravity for water-like effect

    // Create boundaries
    const ground = Bodies.rectangle(width/2, height + 30, width, 60, { isStatic: true });
    const leftWall = Bodies.rectangle(-30, height/2, 60, height, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 30, height/2, 60, height, { isStatic: true });
    Composite.add(world, [ground, leftWall, rightWall]);

    // Create interactive and decorative objects
    createObjects();

    // Start the engine
    Engine.run(engine);

    // Handle window resizing
    window.addEventListener('resize', windowResized);
}

function createObjects() {
    // Create interactive objects
    interactiveObjects.forEach((obj, index) => {
        const x = random(width * 0.2, width * 0.8);
        const y = random(-500, -100);
        const body = Bodies.circle(x, y, objectSize/2, {
            restitution: 0.6,
            friction: 0.1,
            density: 0.001,
            label: obj.name
        });
        objects.push({ body, ...obj });
        Composite.add(world, body);
    });

    // Create decorative objects
    for(let i = 0; i < decorativeObjects; i++) {
        const x = random(width * 0.2, width * 0.8);
        const y = random(-500, -100);
        const body = Bodies.circle(x, y, objectSize/2 * random(0.6, 1), {
            restitution: 0.6,
            friction: 0.1,
            density: 0.001,
            label: 'decorative'
        });
        objects.push({ body, color: '#666666', isDecorative: true });
        Composite.add(world, body);
    }
}

function draw() {
    background(26, 26, 26);
    
    // Draw objects
    objects.forEach(obj => {
        push();
        translate(obj.body.position.x, obj.body.position.y);
        rotate(obj.body.angle);
        fill(obj.color);
        noStroke();
        circle(0, 0, objectSize);
        if (!obj.isDecorative) {
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(16);
            text(obj.name, 0, 0);
        }
        pop();
    });

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    // Add particles randomly
    if (frameCount % 10 === 0) {
        objects.forEach(obj => {
            if (obj.body.velocity.y > 2) {
                createParticles(obj.body.position.x, obj.body.position.y, obj.color);
            }
        });
    }
}

function mousePressed() {
    // Check if clicked on any interactive object
    objects.forEach(obj => {
        if (!obj.isDecorative) {
            const d = dist(mouseX, mouseY, obj.body.position.x, obj.body.position.y);
            if (d < objectSize/2) {
                window.location.href = obj.link;
            }
        }
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 3; i++) {
        particles.push(new Particle(x, y, color));
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = 255;
        this.size = random(3, 8);
        this.vx = random(-2, 2);
        this.vy = random(-4, -2);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.alpha -= 5;
    }

    draw() {
        noStroke();
        fill(this.color + hex(this.alpha, 2));
        circle(this.x, this.y, this.size);
    }

    isDead() {
        return this.alpha <= 0;
    }
}

function windowResized() {
    const container = document.getElementById('canvas-container');
    resizeCanvas(container.offsetWidth, container.offsetHeight);
    // Update boundary positions
    Composite.clear(world, false);
    objects = [];
    particles = [];
    createObjects();
} 