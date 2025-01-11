class ContextMenu {
    constructor() {
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'context-menu';
        this.menuElement.style.display = 'none';
        document.body.appendChild(this.menuElement);
        
        this.options = new Map();
        this.onOptionSelected = new Event();
        
        // Close menu on clicking outside
        document.addEventListener('click', () => this.hide());
        
        // Prevent default context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.show(e.clientX, e.clientY);
        });
    }
    
    addLabel(text) {
        const label = document.createElement('div');
        label.className = 'context-menu-label';
        label.textContent = text;
        this.menuElement.appendChild(label);
    }
    
    addOption(id, name, icon = null) {
        const option = document.createElement('div');
        option.className = 'context-menu-option';
        
        if (icon) {
            const iconElement = document.createElement('i');
            iconElement.className = `bi bi-${icon}`;
            option.appendChild(iconElement);
        }
        
        const textElement = document.createElement('span');
        textElement.textContent = name;
        option.appendChild(textElement);
        
        option.addEventListener('click', () => {
            this.onOptionSelected.trigger(name, id);
            this.hide();
        });
        
        this.options.set(id, { element: option, name, icon });
        this.menuElement.appendChild(option);
    }
    
    addDivider() {
        const divider = document.createElement('div');
        divider.className = 'context-menu-divider';
        this.menuElement.appendChild(divider);
    }
    
    removeOption(id) {
        const option = this.options.get(id);
        if (option) {
            this.menuElement.removeChild(option.element);
            this.options.delete(id);
        }
    }
    
    show(x, y) {
        this.menuElement.style.display = 'block';
        this.menuElement.style.left = `${x}px`;
        this.menuElement.style.top = `${y}px`;
        
        // Ensure menu stays within viewport
        const rect = this.menuElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (rect.right > viewportWidth) {
            this.menuElement.style.left = `${x - rect.width}px`;
        }
        
        if (rect.bottom > viewportHeight) {
            this.menuElement.style.top = `${y - rect.height}px`;
        }
    }
    
    hide() {
        this.menuElement.style.display = 'none';
    }
} 