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

    // Initialize animations when DOM is ready
    function animateStats(context = document) {
        const statValues = context.querySelectorAll('.stat-value');
        statValues.forEach((el, idx) => {
            // Prevent re-animation
            if (el.classList.contains('animated')) return;

            const target = parseInt(el.getAttribute('data-target')) || 0;
            // Mark as animated immediately
            el.classList.add('animated');

            setTimeout(() => {
                countUp(el, 0, target, 2000);
            }, idx * 100);
        });
    }

    // Animate all progress bars on the page
    function animateProgressBars(context = document) {
        const progressBars = context.querySelectorAll('.progress-bar');

        progressBars.forEach((bar, index) => {
            // Check if already animated via a data attribute or class
            if (bar.classList.contains('animated')) return;

            // Get the current width from the style attribute or computed style
            // Note: For re-entrant animations, we might want to store target in data attribute
            // But here we rely on inline style width set by server template
            let targetWidth = parseFloat(bar.style.width);

            // If inline style is 0, check if we have a data-width? 
            // The template sets style="width: X%".

            if (!isNaN(targetWidth)) {
                bar.classList.add('animated');
                animateProgressBar(bar, targetWidth, 1500);
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
                    const grid = entry.target;
                    // Animate items within this grid
                    animateStats(grid);
                    animateProgressBars(grid);

                    // Stop observing this grid so it doesn't re-trigger
                    observer.unobserve(grid);
                    grid.classList.add('animating-complete');
                }
            });
        }, { threshold: 0.1 });

        // Observe ALL stats grids (dashboard and flashcards)
        const statsGrids = document.querySelectorAll('.stats-grid');
        statsGrids.forEach(grid => {
            observer.observe(grid);
            grid.classList.add('animating'); // Prep class
        });

        // Listen for tab changes - mostly as a backup for visibility changes that 
        // might not trigger intersection immediately in some edge cases, 
        // but with IntersectionObserver on all grids, this is less critical.
        // We removed the forced re-animation logic here to fix the glitch.
        window.addEventListener('tabChanged', (event) => {
            // We rely on the observer. If the tab change makes a grid visible,
            // the observer will fire.
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
