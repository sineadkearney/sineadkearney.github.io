// Set initial theme on page load
document.documentElement.setAttribute('data-bs-theme', 'light');
let currentTheme = 'light';

function init_tooltips(){
    // Initialize ALL tooltips after content is set
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        new bootstrap.Tooltip(el);
    });
}

function enable_popovers(){
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
        new bootstrap.Popover(el);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // MUST be called AFTER the content has been set
    init_tooltips();
    enable_popovers();
  });

// Theme switcher
document.querySelectorAll('[data-bs-theme-value]').forEach(button => {
    button.addEventListener('click', () => {
        const theme = button.getAttribute('data-bs-theme-value');
        currentTheme = theme;
        const themeMap = {
            light: 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/flatly/bootstrap.min.css',
            dark: 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/darkly/bootstrap.min.css'
        };

        const link = document.querySelector('link[rel="stylesheet"]');
        if (link && themeMap[theme]) {
            link.href = themeMap[theme];
            document.documentElement.setAttribute('data-bs-theme', theme);
            
            // Reinitialize all tooltips with new theme
            reinitializeTooltips();
        }
    });
});

// Function to reinitialize tooltips
function reinitializeTooltips() {
    // Dispose ALL tooltips on the page
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        const tooltip = bootstrap.Tooltip.getInstance(el);
        if (tooltip) {
            tooltip.dispose();
        }
    });
    
    // Reinitialize ALL tooltips on the page
    setTimeout(() => {
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
            new bootstrap.Tooltip(el);
        });
    }, 100);
}

document.querySelectorAll('.dropdown-submenu .dropdown-toggle').forEach(function (element) {
    element.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      let submenu = this.nextElementSibling;
      if (submenu) submenu.classList.toggle('show');
    });
  });

  // Theme persistence
(function() {
    // Load saved theme on page load
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    
    // Update stylesheet based on saved theme
    const themeMap = {
      light: 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/flatly/bootstrap.min.css',
      dark: 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/darkly/bootstrap.min.css'
    };
    
    const link = document.querySelector('link[rel="stylesheet"][href*="bootswatch"]');
    if (link && themeMap[savedTheme]) {
      link.href = themeMap[savedTheme];
    }
    
    // Theme switcher buttons
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('[data-bs-theme-value]').forEach(button => {
        button.addEventListener('click', () => {
          const theme = button.getAttribute('data-bs-theme-value');
          
          // Update stylesheet
          const link = document.querySelector('link[rel="stylesheet"][href*="bootswatch"]');
          if (link && themeMap[theme]) {
            link.href = themeMap[theme];
          }
          
          // Update data attribute
          document.documentElement.setAttribute('data-bs-theme', theme);
          
          // Save to localStorage
          localStorage.setItem('theme', theme);
          
          // Reinitialize tooltips if the function exists
          if (typeof reinitializeTooltips === 'function') {
            reinitializeTooltips();
          }
        });
      });
    });
  })();

  // Font size control (simpler version with 10% steps)
(function() {
    const minSize = 100;
    const maxSize = 150;
    const step = 15;
    
    // Load saved font size on page load
    const originalFontSize = 100;
    const savedFontSize = parseInt(localStorage.getItem('fontSize')) || 100;
    applyFontSize(savedFontSize);
    
    function applyFontSize(percentage) {
      const baseFontSize = 16; // Base font size in pixels
      const newSize = (baseFontSize * percentage) / 100;
      document.documentElement.style.fontSize = newSize + 'px';
      localStorage.setItem('fontSize', percentage);
    }
    
    function getCurrentFontSize() {
      return parseInt(localStorage.getItem('fontSize')) || 100;
    }
    
    document.addEventListener('DOMContentLoaded', function() {

    //   document.getElementById('font-decrease')?.addEventListener('click', () => {
    //     const currentSize = getCurrentFontSize();
    //     if (currentSize > minSize) {
    //       applyFontSize(currentSize - step);
    //     }
    //   });
      
      document.getElementById('font-reset')?.addEventListener('click', () => {
        applyFontSize(originalFontSize);
      });
      
    //   document.getElementById('font-increase')?.addEventListener('click', () => {
    //     const currentSize = getCurrentFontSize();
    //     if (currentSize < maxSize) {
    //       applyFontSize(currentSize + step);
    //     }
    //   });

      document.getElementById('font-increase')?.addEventListener('click', () => {
        applyFontSize(originalFontSize + step);
      });

      document.getElementById('font-increase-big')?.addEventListener('click', () => {
        applyFontSize(originalFontSize + step + step);
      });
    });
  })();