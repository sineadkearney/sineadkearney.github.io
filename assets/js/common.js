// Set initial theme on page load
document.documentElement.setAttribute('data-bs-theme', 'light');
let currentTheme = 'light';

let user_is_auth = document.body.dataset.auth === "True";

let current_post_id = null;
let current_version_key = null;
let current_page_index = null;

let tooltipMap = new Map();
let currentVisibleTrigger = null;

function hideTooltip(trigger) {
  const { tooltip, tooltipEl } = tooltipMap.get(trigger) || {};
  if (!tooltip) return;

  tooltip.hide();
  if (tooltipEl) {
    tooltipEl.removeEventListener('mouseenter', () => clearHide(trigger));
    tooltipEl.removeEventListener('mouseleave', () => scheduleHide(trigger));
    tooltipMap.set(trigger, { ...tooltipMap.get(trigger), tooltipEl: null });
  }
  if (currentVisibleTrigger === trigger) {
    currentVisibleTrigger = null;
  }
}

function scheduleHide(trigger) {
  const timeoutId = setTimeout(() => hideTooltip(trigger), 500);
  tooltipMap.set(trigger, {
    ...tooltipMap.get(trigger),
    hideTimeout: timeoutId
  });
}

function clearHide(trigger) {
  const { hideTimeout } = tooltipMap.get(trigger) || {};
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
}

// Store mouse position
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Detect if user is on a mobile/touch device
function isMobileDevice() {
  return (
    'ontouchstart' in window ||
    // navigator.maxTouchPoints > 0 || # this is true for touch-screen laptops
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

function init_tooltips() {
  tooltipMap = new Map();
  const triggers = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const isMobile = isMobileDevice();

  // Define shared functions here - inside init_tooltips but outside forEach
  function showTooltip(trigger, tooltip) {
    // Clear any pending hide FIRST
    clearHide(trigger);

    // Hide the currently visible tooltip if it's not the same
    if (currentVisibleTrigger && currentVisibleTrigger !== trigger) {
      hideTooltip(currentVisibleTrigger);
    }

    if (tooltip._element == null) {
      return;
    }

    // Only show if not already showing
    if (!tooltip._element.classList.contains('show')) {
      tooltip.show();
    }

    const tooltipEl = document.querySelector('.tooltip');
    if (tooltipEl) {
      const icon = tooltipEl.querySelector('.tooltip-icon');
      if (icon) {
        icon.style.cursor = 'pointer';
      }
    }
    currentVisibleTrigger = trigger;

    setTimeout(function () {
      if (tooltipEl) {
        tooltipEl.addEventListener('mouseenter', () => clearHide(trigger));
        tooltipEl.addEventListener('mouseleave', () => scheduleHide(trigger));
        tooltipMap.set(trigger, {
          ...tooltipMap.get(trigger),
          tooltipEl
        });
      }
    }, 0);
  }

  function handleMouseMove(trigger, tooltip) {
    if (tooltip._element && tooltip._element.classList.contains('show')) {
      clearHide(trigger);
      tooltip.update();
    }
  }
  // Now iterate through triggers
  // Now iterate through triggers
  triggers.forEach(function (trigger) {
    const tooltip = new bootstrap.Tooltip(trigger, {
      html: true,
      trigger: 'manual',
      offset: [0, 5],
      boundary: 'viewport'
    });

    tooltipMap.set(trigger, { tooltip, tooltipEl: null, hideTimeout: null });

    trigger.addEventListener('mouseenter', () => showTooltip(trigger, tooltip));
    trigger.addEventListener('mouseleave', () => scheduleHide(trigger));

    // Update position to follow the specific line being hovered
    trigger.addEventListener('mousemove', (e) => {
      // 1. Visibility check: ensure this is the active tooltip
      if (currentVisibleTrigger !== trigger) return;

      const rects = Array.from(trigger.getClientRects());
      let activeRect = null;
      let activeRectIndex = -1;

      // 1. Try strict containment first
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top && e.clientY <= r.bottom) {
          activeRect = r;
          activeRectIndex = i;
          break;
        }
      }

      // 2. If no strict containment (e.g. gap between lines), find closest vertically
      if (!activeRect && rects.length > 0) {
        let minDistance = Infinity;

        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          const distTop = Math.abs(e.clientY - r.top);
          const distBottom = Math.abs(e.clientY - r.bottom);

          // Favor horizontal overlap
          const inX = e.clientX >= r.left && e.clientX <= r.right;

          if (inX) {
            const dist = Math.min(distTop, distBottom);
            if (dist < minDistance) {
              minDistance = dist;
              activeRect = r;
              activeRectIndex = i;
            }
          }
        }
      }

      // 3. Update Popper reference
      if (activeRect) {
        const instance = bootstrap.Tooltip.getInstance(trigger);
        const popperInstance = instance ? instance._popper : null;

        if (popperInstance) {
          if (trigger.dataset.activeRectIndex !== String(activeRectIndex)) {
            trigger.dataset.activeRectIndex = String(activeRectIndex);

            const virtualElement = {
              getBoundingClientRect: () => activeRect,
              contextElement: trigger
            };

            popperInstance.state.elements.reference = virtualElement;
            popperInstance.update();
          }
        }
      }
    });
  });

  if (!document.body.dataset.tooltipClickListenerAdded) {
    document.body.addEventListener('click', handleTooltipIconClick);
    document.body.dataset.tooltipClickListenerAdded = 'true';
  }
}

// function enable_popovers(){
//     document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
//         new bootstrap.Popover(el);
//     });
// }


document.addEventListener('DOMContentLoaded', function () {
  // MUST be called AFTER the content has been set
  init_tooltips();
  // enable_popovers();

  if (!window.location.pathname.startsWith('/post/')) {
    current_post_id = null;
    current_version_key = null;
    current_page_index = null;
  }
});

function reinitializeTooltips() {
  console.log('reinitializeTooltips');

  // Hide any currently visible tooltips first
  if (currentVisibleTrigger) {
    hideTooltip(currentVisibleTrigger);
  }

  // Dispose ALL tooltips from the map
  for (const [trigger, data] of tooltipMap.entries()) {
    const { tooltip } = data;
    if (tooltip) {
      tooltip.dispose();
    }
  }

  // Remove any orphaned tooltip elements from DOM
  document.querySelectorAll('.tooltip').forEach(el => el.remove());

  // Clear the map
  tooltipMap.clear();

  // Reset current visible trigger
  currentVisibleTrigger = null;

  // Wait for stylesheet to load before reinitializing
  setTimeout(() => {
    init_tooltips();
  }, 400);
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
(function () {
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
  document.addEventListener('DOMContentLoaded', function () {
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

        // Reinitialize tooltips
        if (typeof reinitializeTooltips === 'function') {
          reinitializeTooltips();
        }
      });
    });
  });
})();

// Font size control
(function () {
  const minSize = 100;
  const maxSize = 150;
  const step = 15;

  const originalFontSize = 100;
  const savedFontSize = parseInt(localStorage.getItem('fontSize')) || 100;
  applyFontSize(savedFontSize);

  function applyFontSize(percentage) {
    const baseFontSize = 16;
    const newSize = (baseFontSize * percentage) / 100;
    document.documentElement.style.fontSize = newSize + 'px';
    localStorage.setItem('fontSize', percentage);
  }

  function getCurrentFontSize() {
    return parseInt(localStorage.getItem('fontSize')) || 100;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('font-reset')?.addEventListener('click', () => {
      applyFontSize(originalFontSize);
    });

    document.getElementById('font-increase')?.addEventListener('click', () => {
      applyFontSize(originalFontSize + step);
    });

    document.getElementById('font-increase-big')?.addEventListener('click', () => {
      applyFontSize(originalFontSize + step + step);
    });
  });
})();

function handleTooltipIconClick(e) {
  if (!e.target.classList.contains('tooltip-icon')) return;

  const tooltipEl = e.target.closest('.tooltip');
  if (!tooltipEl) return;

  const english = tooltipEl.innerText;

  let trigger = null;
  for (const [t, data] of tooltipMap.entries()) {
    const describedby = t.getAttribute('aria-describedby');
    if (describedby && tooltipEl.id === describedby) {
      trigger = t;
      break;
    }
  }

  if (trigger) {
    hideTooltip(trigger);
    $('#suggestIrish').text(trigger.innerText);
    $('#suggestEnglish').text(english);
    $('#suggestInput').val('');
    $('#suggestError').addClass('d-none');

    const modal = new bootstrap.Modal(document.getElementById('suggestModal'));
    modal.show();
  }
}

function send_suggested_translation() {
  const suggestion = $('#suggestInput').val();
  if (suggestion == null || suggestion == "") {
    $('#suggestError').removeClass('d-none');
    return;
  }
  $('#suggestError').addClass('d-none');
  close_translation_modal();

  const data = {
    suggestion: suggestion,
    irish: $('#suggestIrish').text(),
    english: $('#suggestEnglish').text(),
    current_post_id: current_post_id,
    current_version_key: current_version_key,
    current_page_index: current_page_index,
    path: window.location.pathname
  }

  fetch("/api/send_suggested_translation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        toastEl.classList.add('text-bg-success');
        toastEl.classList.remove('text-bg-danger');
        toastEl.querySelector(".toast-body").textContent = "Suggestion received!";
        toast.show();
      } else {
        toastEl.classList.remove('text-bg-success');
        toastEl.classList.add('text-bg-danger');
        toastEl.querySelector(".toast-body").textContent = "An error occured while sending your suggestion";
        toast.show();
      }
    })
    .catch(() => {
      toastEl.classList.remove('text-bg-success');
      toastEl.classList.add('text-bg-danger');
      toastEl.querySelector(".toast-body").textContent = "Server error.";
      toast.show();
    });
}

function close_translation_modal() {
  const modalElement = document.getElementById('suggestModal');
  const modalInstance = bootstrap.Modal.getInstance(modalElement);
  modalInstance.hide();
}

// used in footer
const toastEl = document.getElementById("main_toast");
const toast = new bootstrap.Toast(toastEl);
// Store current bookmark to delete
let currentDeleteButton = null;