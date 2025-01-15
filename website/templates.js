// Templates for header and footer
const templates = {
    header: () => `
        <div class="container">
            <a class="navbar-brand fw-bold" href="index.html">
                <span class="text-danger">Spicy</span>Melon<span class="text-secondary author-name">&nbsp;-&nbsp;&nbsp;Matthew Sanchez</span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="index.html">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="art.html">Art</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="code.html">Code</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="reel.html">Reel</a>
                    </li>
                </ul>
            </div>
        </div>
    `,

    footer: () => `
        <div class="container py-4">
            <div class="row g-4">
                <div class="col-md-4">
                    <h5 class="mb-3 text-danger">About Me</h5>
                    <p class="text-light">Creative developer passionate about art and code. Exploring the intersection of technology and creativity.</p>
                </div>
                <div class="col-md-4">
                    <h5 class="mb-3 text-danger">Quick Links</h5>
                    <ul class="list-unstyled">
                        <li><a href="art.html" class="text-light text-decoration-none">Art Portfolio</a></li>
                        <li><a href="code.html" class="text-light text-decoration-none">Code Projects</a></li>
                    </ul>
                </div>
                <div class="col-md-4">
                    <h5 class="mb-3 text-danger">Connect</h5>
                    <div class="social-links">
                        <a href="#" class="text-light me-3"><i class="bi bi-youtube"></i></a>
                        <a href="#" class="text-light me-3"><i class="bi bi-twitter-x"></i></a>
                        <a href="#" class="text-light me-3"><i class="bi bi-github"></i></a>
                        <a href="#" class="text-light"><i class="bi bi-envelope"></i></a>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-12 text-center text-light">
                    <small>&copy; <span id="copyright-year"></span> SpicyMelon. All rights reserved.</small>
                </div>
            </div>
        </div>
    `,

    // Function to set active nav link based on current page
    setActiveNavLink: () => {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkText = link.textContent.toLowerCase();
            const pageName = linkText === 'home' ? 'index' : linkText;
            if (currentPath.toLowerCase().endsWith(`${pageName}.html`)) {
                link.classList.add('active');
            }
        });
    }
};

// Function to initialize templates
function initializeTemplates() {
    // Insert header
    const header = document.querySelector('header');
    if (header) {
        header.innerHTML = templates.header();
    }

    // Insert footer
    const footer = document.querySelector('footer');
    if (footer) {
        footer.innerHTML = templates.footer();
    }

    // Set active nav link
    templates.setActiveNavLink();

    // Set copyright year
    const copyrightYear = document.getElementById('copyright-year');
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }
} 