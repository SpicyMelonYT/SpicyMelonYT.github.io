// Canvas Animation
class ParticleAnimation {
    constructor() {
        this.canvas = document.getElementById('animationCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mousePosition = { x: 0, y: 0 };
        
        this.resizeCanvas();
        this.setupEventListeners();
        this.createParticles();
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.x = e.clientX - rect.left;
            this.mousePosition.y = e.clientY - rect.top;
        });
    }

    createParticles() {
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 1,
                speedX: Math.random() * 2 - 1,
                speedY: Math.random() * 2 - 1,
                color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Bounce off walls
            if (particle.x < 0 || particle.x > this.canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.speedY *= -1;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();

            // Connect particles near mouse
            const dx = this.mousePosition.x - particle.x;
            const dy = this.mousePosition.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - distance / 100)})`;
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(this.mousePosition.x, this.mousePosition.y);
                this.ctx.stroke();
            }
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Portfolio Data
const artworks = [
    // Add your artwork data here
    // Example: { title: 'Artwork 1', image: 'path/to/image.jpg', description: 'Description' }
];

const codeProjects = [
    // Add your coding projects here
    // Example: { title: 'Project 1', description: 'Description', technologies: ['HTML', 'CSS'], github: 'url' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Start particle animation
    new ParticleAnimation();

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Add scroll animation for sections
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section-padding').forEach(section => {
        observer.observe(section);
    });
}); 