class LinkButton {
    constructor(x, y, width, height, text, icon, link, backgroundColor = 'primary', textColor = 'light', depth = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.icon = icon;
        this.link = link;
        this.backgroundColor = backgroundColor;
        this.textColor = textColor;
        this.depth = depth;
        this.isHovered = false;
        this.isPressed = false;
        
        // Store factors for resize
        this.startXFactor = x / width;
        this.startYFactor = y / height;

        // Create the button element
        this.element = document.createElement('button');
        this.element.className = `btn btn-${backgroundColor} position-absolute`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.transition = 'filter 0.2s, scale 0.2s';
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.gap = '8px';
        this.element.style.zIndex = '100';
        this.element.style.padding = '0';
        this.element.style.fontSize = '14px';
        this.element.style.fontWeight = '500';
        this.element.style.letterSpacing = '0.5px';
        this.element.style.border = 'none';
        this.element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

        // Add icon if provided
        if (icon) {
            const iconElement = document.createElement('i');
            iconElement.className = `bi bi-${icon}`;
            iconElement.style.fontSize = '16px';
            this.element.appendChild(iconElement);
        }

        // Add text
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        textSpan.className = `text-${textColor}`;
        this.element.appendChild(textSpan);

        // Add hover and press effects
        this.element.addEventListener('mouseenter', () => {
            this.isHovered = true;
            this.element.style.filter = 'brightness(1.2)';
            this.updateScale();
        });

        this.element.addEventListener('mouseleave', () => {
            this.isHovered = false;
            this.element.style.filter = 'brightness(1)';
            this.updateScale();
        });

        this.element.addEventListener('mousedown', () => {
            this.isPressed = true;
            this.element.style.filter = 'brightness(0.8)';
            this.updateScale();
        });

        this.element.addEventListener('mouseup', () => {
            this.isPressed = false;
            this.element.style.filter = this.isHovered ? 'brightness(1.2)' : 'brightness(1)';
            this.updateScale();
        });

        // Add click handler directly to button
        this.element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.link) {
                if (this.link.endsWith('.html')) {
                    window.location.href = this.link;
                } else {
                    const a = document.createElement('a');
                    a.href = this.link;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            }
        });

        // Add to canvas container
        const container = document.getElementById('canvas-container');
        container.appendChild(this.element);
    }

    updateScale() {
        const scale = this.isPressed ? 0.95 : (this.isHovered ? 1.05 : 1);
        this.element.style.scale = scale;
    }

    windowResized() {
        this.x = this.startXFactor * width;
        this.y = this.startYFactor * height;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    resetState() {
        this.isHovered = false;
        this.isPressed = false;
        this.element.style.filter = 'brightness(1)';
        this.updateScale();
    }

    render() {
        // Calculate parallax movement
        const horizontalParalaxFactor = map(controlledMouseX, 0, width, 1, -1);
        const verticalParalaxFactor = (controlledMouseY - height/2) / (height/2);
        
        const verticalMoveRange = map(this.depth, 0, 1, 40, 0);
        const horizontalMoveRange = 50;
        
        const xOffset = horizontalMoveRange * horizontalParalaxFactor * 0.5;
        const yOffset = -verticalParalaxFactor * verticalMoveRange;

        // Only handle parallax movement in transform
        this.element.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
    }

    isMouseOver() {
        const rect = this.element.getBoundingClientRect();
        return mouseX >= rect.left && mouseX <= rect.right && 
               mouseY >= rect.top && mouseY <= rect.bottom;
    }

    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

class LinkButtonManager {
    constructor() {
        this.buttons = [];
        this.lastClickTime = 0;

        // Add window focus event listener
        window.addEventListener('focus', () => this.resetAllButtonStates());
    }

    resetAllButtonStates() {
        for (let button of this.buttons) {
            button.resetState();
        }
    }

    clearAllButtons() {
        for (let button of this.buttons) {
            button.remove();
        }
        this.buttons = [];
    }

    addButton(x, y, width, height, text, icon, link, backgroundColor = 'primary', textColor = 'light', depth = 0) {
        const button = new LinkButton(x, y, width, height, text, icon, link, backgroundColor, textColor, depth);
        this.buttons.push(button);
        return button;
    }

    windowResized() {
        // First remove all existing buttons
        this.clearAllButtons();
    }

    render() {
        for (let button of this.buttons) {
            button.render();
        }
    }
}

// Create global instance
let linkButtonManager = new LinkButtonManager(); 