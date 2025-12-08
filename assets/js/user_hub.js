// User Hub Tab Navigation
(function () {
    'use strict';

    // Get all tab buttons and content wrappers
    const tabs = document.querySelectorAll('.hub-tab');
    const tabContents = document.querySelectorAll('.tab-content-wrapper');

    // Function to switch tabs
    function switchTab(tabName) {
        // Remove active class from all tabs
        tabs.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to selected tab
        const selectedTab = document.querySelector(`.hub-tab[data-tab="${tabName}"]`);
        const selectedContent = document.getElementById(`${tabName}-tab`);

        if (selectedTab && selectedContent) {
            selectedTab.classList.add('active');
            selectedContent.classList.add('active');

            // Dispatch custom event for animations.js to listen to
            window.dispatchEvent(new CustomEvent('tabChanged', {
                detail: { tab: tabName }
            }));
        }
    }

    // Initialize on DOM ready
    function init() {
        // Check URL parameter for initial tab
        const urlParams = new URLSearchParams(window.location.search);
        const initialTab = urlParams.get('tab');

        if (initialTab) {
            switchTab(initialTab);
        }

        // Add click listeners to tabs
        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);

                // Update URL without reload
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('tab', tabName);
                window.history.pushState({}, '', newUrl);
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
