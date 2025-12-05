// Animations Module for User Hub
(function () {
    'use strict';

    let reducedMotion = false;

    // Check for reduced motion preference
    function checkReducedMotion() {
        // Check system preference
        const systemPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Check user setting
        const bodyHasClass = document.body.classList.contains('reduced-motion');

        reducedMotion = systemPreference || bodyHasClass;
        return reducedMotion;
    }

    // Easing function for smooth animations
    function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    // Count-up animation for numbers
    function countUp(element, start, end, duration = 2000) {
        if (!element) return;

        // If reduced motion, just set the final value
        if (checkReducedMotion()) {
            element.textContent = end;
            return;
        }

        const startTime = performance.now();
        const difference = end - start;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);

            const current = Math.floor(start + (difference * easedProgress));
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = end; // Ensure we end on exact value
            }
        }

        requestAnimationFrame(update);
    }

    // Animate progress bar width
    function animateProgressBar(element, targetWidth, duration = 1500) {
        if (!element) return;

        // If reduced motion, just set the final width
        if (checkReducedMotion()) {
            element.style.width = targetWidth + '%';
            return;
        }

        element.style.width = '0%';

        setTimeout(() => {
            element.style.transition = `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            element.style.width = targetWidth + '%';
        }, 100);
    }

    // Animate all stat values on the page
    function animateStats() {
        const statValues = document.querySelectorAll('.stat-value');

        statValues.forEach((element, index) => {
            const finalValue = parseInt(element.textContent) || 0;

            // Stagger the animations slightly
            setTimeout(() => {
                countUp(element, 0, finalValue, 2000);
            }, index * 100);
        });
    }

    // Animate all progress bars on the page
    function animateProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar');

        progressBars.forEach((bar, index) => {
            // Get the current width from the style attribute
            const currentWidth = bar.style.width;
            const targetWidth = parseFloat(currentWidth);

            if (!isNaN(targetWidth)) {
                setTimeout(() => {
                    animateProgressBar(bar, targetWidth, 1500);
                }, index * 150);
            }
        });
    }

    // Initialize animations when DOM is ready
    function initAnimations() {
        // Check reduced motion on load
        checkReducedMotion();

        // Use Intersection Observer to trigger animations when visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    animateProgressBars();
                    observer.disconnect(); // Only animate once
                }
            });
        }, { threshold: 0.1 });

        // Observe the stats grid
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            observer.observe(statsGrid);
        }

        // Listen for tab changes to re-animate if needed
        window.addEventListener('tabChanged', (event) => {
            if (event.detail.tab === 'dashboard') {
                // Small delay to ensure tab content is visible
                setTimeout(() => {
                    animateStats();
                    animateProgressBars();
                }, 100);
            }
        });

        // Listen for reduced motion changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            reducedMotion = e.matches || document.body.classList.contains('reduced-motion');
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }

    // Export functions for external use
    window.hubAnimations = {
        countUp,
        animateProgressBar,
        animateStats,
        animateProgressBars,
        checkReducedMotion
    };
})();
