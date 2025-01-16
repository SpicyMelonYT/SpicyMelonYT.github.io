// Modal CSS
const modalStyles = `
    .media-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .media-modal.show {
        display: block;
        opacity: 1;
    }

    .media-container {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .media-modal img {
        position: absolute;
        transform-origin: center;
        cursor: move;
        user-select: none;
        -webkit-user-select: none;
        max-width: none;
        max-height: none;
    }

    .media-modal video {
        max-width: 90%;
        max-height: 90vh;
        width: auto;
        height: auto;
        border-radius: 8px;
    }

    .media-title {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        background: rgba(0, 0, 0, 0.7);
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 1.1em;
        z-index: 1002;
    }
`;

// Modal HTML template
const modalTemplate = `
    <div class="modal fade" id="mediaModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
            <div class="modal-content bg-dark">
                <div class="modal-header border-0">
                    <div class="btn-group">
                        <button type="button" class="btn btn-dark zoom-out" title="Zoom Out">
                            <i class="bi bi-zoom-out"></i>
                        </button>
                        <button type="button" class="btn btn-dark zoom-in" title="Zoom In">
                            <i class="bi bi-zoom-in"></i>
                        </button>
                        <button type="button" class="btn btn-dark zoom-fit" title="Fit to Screen">
                            <i class="bi bi-arrows-angle-contract"></i>
                        </button>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="media-container">
                        <!-- Media content will be inserted here -->
                    </div>
                    <button type="button" class="modal-nav-arrow modal-nav-prev">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                    <button type="button" class="modal-nav-arrow modal-nav-next">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
`;

// Modal functionality
class MediaModal {
    constructor() {
        this.scale = 1;
        this.panning = false;
        this.pointX = 0;
        this.pointY = 0;
        this.start = { x: 0, y: 0 };
        this.currentGalleryThumbnails = [];
        this.currentMediaIndex = 0;

        this.initialize();
    }

    initialize() {
        // Add styles
        const styleSheet = document.createElement("style");
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);

        // Add modal HTML
        document.body.insertAdjacentHTML('beforeend', modalTemplate);

        // Initialize elements
        this.modalElement = document.getElementById('mediaModal');
        this.modal = new bootstrap.Modal(this.modalElement);
        this.mediaContainer = this.modalElement.querySelector('.media-container');
        this.zoomInBtn = this.modalElement.querySelector('.zoom-in');
        this.zoomOutBtn = this.modalElement.querySelector('.zoom-out');
        this.zoomFitBtn = this.modalElement.querySelector('.zoom-fit');

        this.setupEventListeners();
    }

    setTransform(element) {
        element.style.transform = `translate(-50%, -50%) translate(${this.pointX}px, ${this.pointY}px) scale(${this.scale})`;
    }

    fitImageToView(img) {
        // Get container and image dimensions
        const containerWidth = this.mediaContainer.clientWidth;
        const containerHeight = this.mediaContainer.clientHeight;
        const imageWidth = img.naturalWidth;
        const imageHeight = img.naturalHeight;

        // Calculate ratios
        const containerRatio = containerWidth / containerHeight;
        const imageRatio = imageWidth / imageHeight;

        // Calculate scale to fit 90% of container while maintaining aspect ratio
        if (imageRatio > containerRatio) {
            // Image is wider relative to container
            this.scale = (containerWidth * 0.9) / imageWidth;
        } else {
            // Image is taller relative to container
            this.scale = (containerHeight * 0.9) / imageHeight;
        }

        // Since the image is positioned at 50%, we don't need additional offsets
        this.pointX = 0;
        this.pointY = 0;
        
        this.setTransform(img);
    }

    showMedia(mediaType, src, thumbnailElement = null) {
        if (thumbnailElement) {
            const galleryContainer = thumbnailElement.closest('.grid-item');
            this.currentGalleryThumbnails = Array.from(galleryContainer.querySelectorAll('.thumbnail-container img'));
            this.currentMediaIndex = this.currentGalleryThumbnails.indexOf(thumbnailElement);

            const modalDialog = this.modalElement.querySelector('.modal-dialog');
            if (this.currentGalleryThumbnails.length <= 1) {
                modalDialog.classList.add('single-item');
            } else {
                modalDialog.classList.remove('single-item');
            }
        }

        this.mediaContainer.innerHTML = '';
        this.scale = 1;
        this.pointX = 0;
        this.pointY = 0;

        // Create and add title
        const oldTitle = this.modalElement.querySelector('.media-title');
        if (oldTitle) oldTitle.remove();

        const title = document.createElement('div');
        title.className = 'media-title';
        
        // Use title from dataset if available, otherwise format filename
        let titleText;
        if (thumbnailElement && thumbnailElement.dataset.title) {
            titleText = thumbnailElement.dataset.title;
        } else {
            const filename = src.split('/').pop().split('?')[0]; // Remove path and query params
            titleText = filename
                .replace(/\.[^/.]+$/, '') // Remove file extension
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        title.textContent = titleText;
        this.modalElement.appendChild(title);

        if (mediaType === 'video') {
            // Hide zoom controls for videos
            this.modalElement.querySelector('.btn-group').style.display = 'none';

            if (src.includes('youtu.be/') || src.includes('youtube.com/')) {
                // Convert YouTube URL to embed URL
                const videoId = src.includes('youtu.be/') 
                    ? src.split('youtu.be/')[1].split('?')[0]
                    : src.split('v=')[1].split('&')[0];
                
                const iframe = document.createElement('iframe');
                iframe.className = 'w-100 h-auto';
                iframe.style.maxWidth = '90%';
                iframe.style.maxHeight = '90vh';
                iframe.style.aspectRatio = '16/9';
                iframe.src = `https://www.youtube.com/embed/${videoId}`;
                iframe.title = 'YouTube video player';
                iframe.frameBorder = '0';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                
                this.mediaContainer.appendChild(iframe);
            } else {
                // Handle regular video files
                const video = document.createElement('video');
                video.className = 'w-100 h-auto';
                video.controls = true;
                video.autoplay = true;
                video.style.maxWidth = '90%';
                video.style.maxHeight = '90vh';
                video.src = src;
                this.mediaContainer.appendChild(video);
            }
            
            if (!this.modal._isShown) {
                this.modal.show();
            }
        } else {
            const img = document.createElement('img');
            img.style.opacity = '0';
            img.style.position = 'absolute';
            img.style.maxWidth = 'none';
            img.style.maxHeight = 'none';
            img.style.left = '50%';
            img.style.top = '50%';
            this.mediaContainer.appendChild(img);
            this.modalElement.querySelector('.btn-group').style.display = 'flex';

            img.onload = () => {
                if (!this.modal._isShown) {
                    this.modal.show();
                }
                this.fitImageToView(img);
                requestAnimationFrame(() => {
                    img.style.transition = 'opacity 0.3s ease';
                    img.style.opacity = '1';
                });
            };
            img.src = src;
        }
    }

    navigateMedia(direction) {
        if (this.currentGalleryThumbnails.length <= 1) return;

        let newIndex = this.currentMediaIndex;
        if (direction === 'prev') {
            newIndex = (this.currentMediaIndex - 1 + this.currentGalleryThumbnails.length) % this.currentGalleryThumbnails.length;
        } else {
            newIndex = (this.currentMediaIndex + 1) % this.currentGalleryThumbnails.length;
        }

        const newThumbnail = this.currentGalleryThumbnails[newIndex];
        const mediaType = newThumbnail.dataset.mediaType;
        const videoSrc = newThumbnail.dataset.videoSrc;
        
        this.showMedia(mediaType, mediaType === 'video' ? videoSrc : newThumbnail.src, newThumbnail);
    }

    setupEventListeners() {
        // Modal events
        this.modalElement.addEventListener('shown.bs.modal', () => {
            const img = this.mediaContainer.querySelector('img');
            if (img && img.complete) {
                this.fitImageToView(img);
                requestAnimationFrame(() => {
                    img.style.transition = 'opacity 0.3s ease';
                    img.style.opacity = '1';
                });
            }
        });

        this.modalElement.addEventListener('hidden.bs.modal', () => {
            const video = this.mediaContainer.querySelector('video');
            if (video) {
                video.pause();
                video.src = '';
            }
            this.mediaContainer.innerHTML = '';
        });

        // Pan functionality
        this.mediaContainer.addEventListener('mousedown', (e) => {
            const img = this.mediaContainer.querySelector('img');
            if (!img) return;
            e.preventDefault();
            this.start = { x: e.clientX - this.pointX, y: e.clientY - this.pointY };
            this.panning = true;
            img.style.cursor = 'grabbing';
        });

        this.mediaContainer.addEventListener('mousemove', (e) => {
            const img = this.mediaContainer.querySelector('img');
            if (!img || !this.panning) return;
            e.preventDefault();
            this.pointX = e.clientX - this.start.x;
            this.pointY = e.clientY - this.start.y;
            this.setTransform(img);
        });

        const endPanning = () => {
            const img = this.mediaContainer.querySelector('img');
            if (!img) return;
            this.panning = false;
            img.style.cursor = 'move';
        };

        this.mediaContainer.addEventListener('mouseup', endPanning);
        this.mediaContainer.addEventListener('mouseleave', endPanning);

        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.handleZoom(1.2));
        this.zoomOutBtn.addEventListener('click', () => this.handleZoom(0.8));
        this.zoomFitBtn.addEventListener('click', () => {
            const img = this.mediaContainer.querySelector('img');
            if (img) this.fitImageToView(img);
        });

        // Mouse wheel zoom
        this.mediaContainer.addEventListener('wheel', (e) => {
            const img = this.mediaContainer.querySelector('img');
            if (!img) return;
            e.preventDefault();
            
            const rect = img.getBoundingClientRect();
            const imgCenterX = rect.left + rect.width / 2;
            const imgCenterY = rect.top + rect.height / 2;
            const mouseX = e.clientX - imgCenterX;
            const mouseY = e.clientY - imgCenterY;

            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.min(Math.max(this.scale * delta, 0.5), 3);
            
            this.pointX += mouseX * (1 - delta);
            this.pointY += mouseY * (1 - delta);
            
            this.scale = newScale;
            this.setTransform(img);
        }, { passive: false });

        // Navigation
        this.modalElement.querySelector('.modal-nav-prev').addEventListener('click', () => this.navigateMedia('prev'));
        this.modalElement.querySelector('.modal-nav-next').addEventListener('click', () => this.navigateMedia('next'));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.modal._isShown) return;
            
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigateMedia(e.key === 'ArrowLeft' ? 'prev' : 'next');
            }
        });

        // Thumbnail click handler
        document.addEventListener('click', (e) => {
            const thumbnail = e.target.closest('.thumbnail-container img');
            if (thumbnail) {
                const mediaType = thumbnail.dataset.mediaType;
                const videoSrc = thumbnail.dataset.videoSrc;
                this.showMedia(mediaType, mediaType === 'video' ? videoSrc : thumbnail.src, thumbnail);
            }
        });
    }

    handleZoom(factor) {
        const img = this.mediaContainer.querySelector('img');
        if (!img) return;
        
        const containerWidth = this.mediaContainer.clientWidth;
        const containerHeight = this.mediaContainer.clientHeight;
        const viewCenterX = containerWidth / 2;
        const viewCenterY = containerHeight / 2;
        
        const imageX = (viewCenterX - this.pointX) / this.scale;
        const imageY = (viewCenterY - this.pointY) / this.scale;
        
        const newScale = Math.min(Math.max(this.scale * factor, 0.5), 3);
        
        this.pointX = viewCenterX - imageX * newScale;
        this.pointY = viewCenterY - imageY * newScale;
        
        this.scale = newScale;
        this.setTransform(img);
    }
}

// Initialize modal
function initializeModal() {
    window.mediaModal = new MediaModal();
} 