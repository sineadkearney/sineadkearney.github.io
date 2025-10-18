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