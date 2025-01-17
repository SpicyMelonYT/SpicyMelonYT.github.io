class ProjectLoader {
  constructor(type) {
    this.type = type; // 'art' or 'code'
    this.projects = new Map();
    this.orderedProjects = [];
    this.gridSize = 4; // Number of columns in the grid
    this.baseUnit = 300; // Base size of a 1x1 grid unit in pixels
    this.gap = 20; // Gap between items
    this.loadingImages = new Map(); // Track loading state of images
    this.imageObserver = null;
    this.setupImageObserver();

    // Bind methods that will be used as event handlers
    this.handleResize = this.handleResize.bind(this);
  }

  setupImageObserver() {
    // Create IntersectionObserver for lazy loading
    this.imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const container = img.closest('.thumbnail-container');
          
          // Start loading the full image
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }

          // Stop observing once loaded
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading images 50px before they come into view
      threshold: 0.1
    });
  }

  loadProjects() {
    const projectData = this.type === "art" ? ART_PROJECTS : CODE_PROJECTS;
    this.orderedProjects = projectData.order;
    for (const [id, data] of Object.entries(projectData.data)) {
      this.projects.set(id, data);
    }

    // Add resize listener after loading projects
    window.addEventListener("resize", this.handleResize);
  }

  handleResize() {
    if (this.resizeTimeout) {
      window.cancelAnimationFrame(this.resizeTimeout);
    }

    this.resizeTimeout = window.requestAnimationFrame(() => {
      // Add transition class to all grid items before updating layout
      document.querySelectorAll(".grid-item").forEach((item) => {
        item.classList.add("layout-transition");
      });

      // Update grid layout
      this.renderProjects();

      // Update gallery layouts
      document.querySelectorAll(".art-gallery").forEach((gallery) => {
        const images = Array.from(gallery.querySelectorAll("img"));
        if (images.length === 0) return;

        const galleryRect = gallery.getBoundingClientRect();
        if (galleryRect.width <= 0 || galleryRect.height <= 0) return;

        const layouts = this.calculateFreeformLayout(
          images,
          galleryRect.width,
          galleryRect.height
        );
        this.applyLayouts(images, layouts, false);
      });

      // Remove transition class after animations complete
      setTimeout(() => {
        document.querySelectorAll(".grid-item").forEach((item) => {
          item.classList.remove("layout-transition");
        });
      }, 250); // Slightly longer than transition duration
    });
  }

  cleanup() {
    // Remove resize listener when needed (e.g., when navigating away)
    window.removeEventListener("resize", this.handleResize);
    
    // Disconnect the observer
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
  }

  renderProjects() {
    const grid = document.querySelector(".grid");
    const gridContainer = document.querySelector(".grid-container");
    const footer = document.querySelector(".footer");

    // Remove the footer hide/show logic and just ensure it's visible
    if (footer && footer.style.visibility === "hidden") {
      footer.style.visibility = "visible";
    }

    grid.style.position = "relative";
    grid.style.width = "100%";

    // Calculate actual unit size based on container width
    const containerWidth = grid.offsetWidth;

    // Adjust grid size based on viewport width
    if (containerWidth < 576) {
      this.gridSize = 1; // Mobile: 1 column
    } else if (containerWidth < 768) {
      this.gridSize = 2; // Tablet: 2 columns
    } else if (containerWidth < 992) {
      this.gridSize = 3; // Small desktop: 3 columns
    } else {
      this.gridSize = 4; // Large desktop: 4 columns
    }

    const unitWidth =
      (containerWidth - (this.gridSize - 1) * this.gap) / this.gridSize;

    // Create grid representation
    let gridMap = Array(50)
      .fill(0)
      .map(() => Array(this.gridSize).fill(false));

    // First pass: calculate total height needed
    let maxRow = 0;
    this.orderedProjects.forEach((projectId) => {
      const project = this.projects.get(projectId);
      if (!project) return;

      const adjustedSize = this.getAdjustedSize(project.size);
      const position = this.findPosition(gridMap, adjustedSize);
      if (position) {
        this.markPosition(gridMap, position, adjustedSize);
        maxRow = Math.max(maxRow, position.row + adjustedSize.height);
      }
    });

    // Set container height
    const totalHeight = maxRow * (unitWidth + this.gap);
    gridContainer.style.minHeight = `${totalHeight}px`;
    grid.style.height = `${totalHeight}px`;

    // Clear grid for actual rendering
    gridMap = Array(50)
      .fill(0)
      .map(() => Array(this.gridSize).fill(false));

    // Second pass: update or create elements
    this.orderedProjects.forEach((projectId) => {
      const project = this.projects.get(projectId);
      if (!project) return;

      const adjustedSize = this.getAdjustedSize(project.size);
      const position = this.findPosition(gridMap, adjustedSize);
      if (!position) return;

      // Try to find existing element
      let element = grid.querySelector(`[data-project-id="${projectId}"]`);

      if (element) {
        // Update existing element
        const width =
          adjustedSize.width * unitWidth + (adjustedSize.width - 1) * this.gap;
        const height =
          adjustedSize.height * unitWidth +
          (adjustedSize.height - 1) * this.gap;
        const left = position.col * (unitWidth + this.gap);
        const top = position.row * (unitWidth + this.gap);

        Object.assign(element.style, {
          width: width + "px",
          height: height + "px",
          left: left + "px",
          top: top + "px",
        });
      } else {
        // Create new element if it doesn't exist
        element = this.createProjectElement(
          project,
          projectId,
          position,
          unitWidth,
          adjustedSize
        );
        element.setAttribute("data-project-id", projectId);
        grid.appendChild(element);
      }

      this.markPosition(gridMap, position, adjustedSize);
    });

    // Remove any elements that shouldn't be there anymore
    const validIds = new Set(this.orderedProjects);
    grid.querySelectorAll(".grid-item").forEach((element) => {
      const id = element.getAttribute("data-project-id");
      if (!validIds.has(id)) {
        element.remove();
      }
    });

    // The footer will remain visible throughout resizing
  }

  getAdjustedSize(originalSize) {
    // Adjust size for smaller screens
    if (this.gridSize === 1) {
      // On mobile, everything is full width
      return { width: 1, height: originalSize.height };
    } else if (this.gridSize === 2 && originalSize.width > 1) {
      // On tablet, limit width to 2 columns
      return { width: 2, height: originalSize.height };
    }
    return originalSize;
  }

  findPosition(gridMap, size) {
    for (let row = 0; row < gridMap.length - size.height; row++) {
      for (let col = 0; col <= this.gridSize - size.width; col++) {
        if (this.canPlaceItem(gridMap, { row, col }, size)) {
          return { row, col };
        }
      }
    }
    return null;
  }

  canPlaceItem(gridMap, position, size) {
    for (let r = 0; r < size.height; r++) {
      for (let c = 0; c < size.width; c++) {
        if (gridMap[position.row + r][position.col + c]) {
          return false;
        }
      }
    }
    return true;
  }

  markPosition(gridMap, position, size) {
    for (let r = 0; r < size.height; r++) {
      for (let c = 0; c < size.width; c++) {
        gridMap[position.row + r][position.col + c] = true;
      }
    }
  }

  createProjectElement(project, projectId, position, unitWidth, adjustedSize) {
    const element = document.createElement("div");
    element.className = "grid-item";

    // Calculate dimensions using adjusted size
    const width =
      adjustedSize.width * unitWidth + (adjustedSize.width - 1) * this.gap;
    const height =
      adjustedSize.height * unitWidth + (adjustedSize.height - 1) * this.gap;
    const left = position.col * (unitWidth + this.gap);
    const top = position.row * (unitWidth + this.gap);

    // Apply positioning and sizing
    Object.assign(element.style, {
      position: "absolute",
      width: width + "px",
      height: height + "px",
      left: left + "px",
      top: top + "px",
    });

    // Set custom properties for colors if they exist
    if (project.primaryColor) {
      element.style.setProperty("--primary-color", project.primaryColor);
    }
    if (project.secondaryColor) {
      element.style.setProperty("--secondary-color", project.secondaryColor);
    }
    if (project.backgroundColor) {
      element.style.setProperty("--bg-color", project.backgroundColor);
      element.style.backgroundColor = project.backgroundColor;
    }

    // Create HTML based on project type
    element.innerHTML =
      this.type === "art"
        ? this.createArtProjectHTML(project, projectId)
        : this.createCodeProjectHTML(project, projectId);

    return element;
  }

  createArtProjectHTML(project, projectId) {
    const html = `
            <div class="grid-item-content h-100 ${
              project.links && project.links.length > 0 ? "has-project-link" : ""
            }" id="${projectId}">
                <h3 class="grid-item-title">
                    <i class="bi bi-palette"></i>
                    ${project.title}
                    ${project.date ? `<span class="project-date">${project.date}</span>` : ''}
                </h3>
                <p class="code-text">${project.description}</p>
                ${
                  project.thumbnails && project.thumbnails.length > 0
                    ? `
                    <div class="code-gallery">
                        ${project.thumbnails
                          .map(
                            (thumbnail, index) => `
                            <div class="thumbnail-container">
                                <img 
                                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                                    data-src="../projects/art/${thumbnail.image}" 
                                    alt="${project.title} Thumbnail" 
                                    class="code-thumbnail"
                                    width="300"
                                    height="200"
                                    data-media-type="${thumbnail.video ? 'video' : 'image'}"
                                    ${thumbnail.video ? `data-video-src="../projects/art/${thumbnail.video}"` : ''}
                                    ${thumbnail.title ? `data-title="${thumbnail.title}"` : ''}
                                    style="background: rgba(0,0,0,0.1);"
                                >
                                ${thumbnail.video ? `
                                <div class="video-indicator">
                                    <i class="bi bi-play-circle-fill"></i>
                                </div>
                                ` : ''}
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
                <div class="tags">
                    ${project.tags
                      .map((tag) => `<span class="tech-badge">${tag}</span>`)
                      .join("")}
                </div>
                ${
                  project.links && project.links.length > 0
                    ? `
                    <div class="project-links">
                        ${project.links
                          .map(
                            (link) => `
                            <a href="${link.url}" target="_blank">
                                <i class="bi bi-${link.icon}"></i>
                                ${link.text}
                            </a>
                        `
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
            </div>
        `;

    // Initialize gallery with requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      const container = document.querySelector(`#${projectId}`);
      this.initializeGallery(container, projectId);
    });

    return html;
  }

  calculateFreeformLayout(images, containerWidth, containerHeight) {
    // Ensure minimum container dimensions
    containerWidth = Math.max(containerWidth, 100);
    containerHeight = Math.max(containerHeight, 100);

    const GAP = 8;
    const PADDING = GAP / 2;

    // Adjust container dimensions for padding
    const availableWidth = containerWidth - (PADDING * 2);
    const availableHeight = containerHeight - (PADDING * 2);

    // Get image data with aspect ratios
    const imageData = images.map(img => ({
      aspectRatio: img.naturalWidth / img.naturalHeight || 1.5, // Fallback ratio if image not loaded
      width: img.naturalWidth,
      height: img.naturalHeight
    }));

    const numImages = images.length;

    // Single image layout
    if (numImages === 1) {
      const img = imageData[0];
      let width = availableWidth;
      let height = width / img.aspectRatio;

      if (height > availableHeight) {
        height = availableHeight;
        width = height * img.aspectRatio;
      }

      return [{
        width,
        height,
        x: PADDING + (availableWidth - width) / 2,
        y: PADDING + (availableHeight - height) / 2
      }];
    }

    // Two images layout
    if (numImages === 2) {
      const totalAspectRatio = imageData.reduce((sum, img) => sum + img.aspectRatio, 0);
      const isHorizontal = availableWidth / availableHeight > totalAspectRatio / 2;

      if (isHorizontal) {
        // Side by side layout
        const totalWidth = availableWidth - GAP;
        const ratio = imageData[0].aspectRatio / totalAspectRatio;
        const width1 = totalWidth * ratio;
        const width2 = totalWidth - width1;

        const height1 = Math.min(availableHeight, width1 / imageData[0].aspectRatio);
        const height2 = Math.min(availableHeight, width2 / imageData[1].aspectRatio);
        const maxHeight = Math.min(availableHeight, Math.max(height1, height2));

        return [
          {
            width: width1,
            height: height1,
            x: PADDING,
            y: PADDING + (maxHeight - height1) / 2
          },
          {
            width: width2,
            height: height2,
            x: PADDING + width1 + GAP,
            y: PADDING + (maxHeight - height2) / 2
          }
        ];
      } else {
        // Stacked vertically
        const totalHeight = availableHeight - GAP;
        const ratio = imageData[0].height / (imageData[0].height + imageData[1].height);
        const height1 = totalHeight * ratio;
        const height2 = totalHeight - height1;

        const width1 = Math.min(availableWidth, height1 * imageData[0].aspectRatio);
        const width2 = Math.min(availableWidth, height2 * imageData[1].aspectRatio);

        return [
          {
            width: width1,
            height: height1,
            x: PADDING + (availableWidth - width1) / 2,
            y: PADDING
          },
          {
            width: width2,
            height: height2,
            x: PADDING + (availableWidth - width2) / 2,
            y: PADDING + height1 + GAP
          }
        ];
      }
    }

    // Three or more images: optimized grid layout
    const containerRatio = availableWidth / availableHeight;
    const cols = containerRatio > 1 
      ? Math.ceil(Math.sqrt(numImages * containerRatio))
      : Math.ceil(Math.sqrt(numImages));
    const rows = Math.ceil(numImages / cols);

    // Calculate base cell dimensions
    const cellWidth = (availableWidth - (GAP * (cols - 1))) / cols;
    const cellHeight = (availableHeight - (GAP * (rows - 1))) / rows;

    // Create initial grid layout
    const layouts = imageData.map((img, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;

      // Calculate dimensions maintaining aspect ratio
      let width = cellWidth;
      let height = width / img.aspectRatio;

      if (height > cellHeight) {
        height = cellHeight;
        width = height * img.aspectRatio;
      }

      return {
        width,
        height,
        x: PADDING + (col * (cellWidth + GAP)) + ((cellWidth - width) / 2),
        y: PADDING + (row * (cellHeight + GAP)) + ((cellHeight - height) / 2)
      };
    });

    // Optimize last row if it's not full
    const lastRowStart = Math.floor((numImages - 1) / cols) * cols;
    const lastRowCount = numImages - lastRowStart;

    if (lastRowCount < cols) {
      const lastRowLayouts = layouts.slice(lastRowStart);
      const totalWidth = lastRowLayouts.reduce((sum, layout) => sum + layout.width, 0) 
        + (GAP * (lastRowCount - 1));
      
      // Only scale if the total width is greater than available width
      if (totalWidth > availableWidth) {
        const scale = availableWidth / totalWidth;
        
        let x = PADDING;
        lastRowLayouts.forEach(layout => {
          layout.width *= scale;
          layout.height *= scale;
          layout.x = x;
          x += layout.width + GAP;
        });
      } else {
        // Center the last row
        const offset = (availableWidth - totalWidth) / 2;
        let x = PADDING + offset;
        lastRowLayouts.forEach(layout => {
          layout.x = x;
          x += layout.width + GAP;
        });
      }
    }

    return layouts;
  }

  createCodeProjectHTML(project, projectId) {
    const html = `
            <div class="grid-item-content h-100 ${
              project.links && project.links.length > 0 ? "has-project-link" : ""
            }" id="${projectId}">
                <h3 class="grid-item-title">
                    <i class="bi bi-code-slash"></i>
                    ${project.title}
                    ${project.date ? `<span class="project-date">${project.date}</span>` : ''}
                </h3>
                <p class="code-text">${project.description}</p>
                ${
                  project.thumbnails && project.thumbnails.length > 0
                    ? `
                    <div class="code-gallery">
                        ${project.thumbnails
                          .map(
                            (thumbnail) => `
                            <div class="thumbnail-container">
                                <img 
                                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                                    data-src="../projects/code/${thumbnail.image}" 
                                    alt="${project.title} Thumbnail" 
                                    class="code-thumbnail"
                                    width="300"
                                    height="200"
                                    data-media-type="${thumbnail.video ? 'video' : 'image'}"
                                    ${thumbnail.video ? `data-video-src="../projects/code/${thumbnail.video}"` : ''}
                                    ${thumbnail.title ? `data-title="${thumbnail.title}"` : ''}
                                    style="background: rgba(0,0,0,0.1);"
                                >
                                ${thumbnail.video ? `
                                <div class="video-indicator">
                                    <i class="bi bi-play-circle-fill"></i>
                                </div>
                                ` : ''}
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
                <div class="tags">
                    ${project.tags
                      .map((tag) => `<span class="tech-badge">${tag}</span>`)
                      .join("")}
                </div>
                ${
                  project.links && project.links.length > 0
                    ? `
                <div class="project-links">
                    ${project.links
                      .map(
                        (link) => `
                        <a href="${link.url}" target="_blank">
                            <i class="bi bi-${link.icon}"></i>
                            ${link.text}
                        </a>
                    `
                      )
                      .join("")}
                </div>
                `
                    : ""
                }
            </div>
        `;

    // Initialize gallery with requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      const container = document.querySelector(`#${projectId}`);
      this.initializeGallery(container, projectId);
    });

    return html;
  }

  // New method to handle layout application
  applyLayouts(images, layouts, isInitialLoad = false) {
    images.forEach((img, i) => {
      const layout = layouts[i];
      // Get the container instead of working with the image directly
      const container = img.closest('.thumbnail-container');
      if (!container) return;

      if (isInitialLoad) {
        // Initial load: Set position without transition
        Object.assign(container.style, {
          position: "absolute",
          left: layout.x + "px",
          top: layout.y + "px",
          width: layout.width + "px",
          height: layout.height + "px",
        });

        // Force a reflow before adding loaded class
        container.offsetHeight;
        container.classList.add("loaded");
      } else {
        // Resize: Only update position and size
        container.classList.add("layout-transition");
        Object.assign(container.style, {
          position: "absolute",
          left: layout.x + "px",
          top: layout.y + "px",
          width: layout.width + "px",
          height: layout.height + "px",
        });
      }
    });
  }

  initializeGallery(container, projectId) {
    if (!container) return;

    // Calculate content height
    const title = container.querySelector(".grid-item-title");
    const text = container.querySelector(".code-text");
    const contentTop = title.offsetHeight + text.offsetHeight + 30;

    // Set the custom property
    container.style.setProperty("--content-top", contentTop + "px");

    const gallery = container.querySelector(".code-gallery");
    if (!gallery) return;

    const images = Array.from(gallery.querySelectorAll("img"));
    if (images.length === 0) return;

    // Get gallery dimensions
    const galleryRect = gallery.getBoundingClientRect();
    const galleryWidth = galleryRect.width;
    const galleryHeight = galleryRect.height;

    if (galleryWidth <= 0 || galleryHeight <= 0) return;

    // Apply initial placeholder layout
    const placeholderLayouts = this.calculatePlaceholderLayout(
      images.length,
      galleryWidth,
      galleryHeight
    );
    this.applyLayouts(images, placeholderLayouts, true);

    // Start observing images for lazy loading
    images.forEach(img => {
      if (img.dataset.src) {
        this.imageObserver.observe(img);
      }
    });

    // Set up layout recalculation for when images load
    let loadedCount = 0;
    const totalImages = images.length;

    images.forEach((img, index) => {
      const uniqueId = `${projectId}-${index}`;
      if (this.loadingImages.has(uniqueId)) return;

      this.loadingImages.set(uniqueId, true);

      const handleLoad = () => {
        this.loadingImages.delete(uniqueId);
        loadedCount++;

        // Only recalculate layout when all images are loaded
        if (loadedCount === totalImages) {
          requestAnimationFrame(() => {
            const layouts = this.calculateFreeformLayout(
              images,
              galleryWidth,
              galleryHeight
            );
            this.applyLayouts(images, layouts, false);
          });
        }
      };

      if (img.complete) {
        handleLoad();
      } else {
        img.addEventListener('load', handleLoad, { once: true });
        img.addEventListener('error', handleLoad, { once: true });
      }
    });
  }

  calculatePlaceholderLayout(count, containerWidth, containerHeight) {
    const layouts = [];
    const GAP = 8;
    const PADDING = GAP / 2;
    
    // Use a simple grid layout for placeholders
    const cols = count <= 2 ? 1 : 2;
    const rows = Math.ceil(count / cols);
    
    const cellWidth = (containerWidth - (cols + 1) * GAP) / cols;
    const cellHeight = (containerHeight - (rows + 1) * GAP) / rows;
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      layouts.push({
        width: cellWidth,
        height: cellHeight,
        x: PADDING + col * (cellWidth + GAP),
        y: PADDING + row * (cellHeight + GAP)
      });
    }
    
    return layouts;
  }
}
