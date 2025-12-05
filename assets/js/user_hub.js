// User Hub JavaScript - Tab Management and State Persistence
(function () {
    'use strict';

    // Get all tab buttons and content wrappers
    const tabButtons = document.querySelectorAll('.hub-tab');
    const tabContents = document.querySelectorAll('.tab-content-wrapper');

    // Function to switch tabs
    function switchTab(tabName) {
        // Remove active class from all tabs and content
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
        const selectedContent = document.getElementById(`${tabName}-tab`);

        if (selectedTab && selectedContent) {
            selectedTab.classList.add('active');
            selectedContent.classList.add('active');

            // Update URL without page reload
            const url = new URL(window.location);
            url.searchParams.set('tab', tabName);
            window.history.pushState({}, '', url);

            // Store in session storage
            sessionStorage.setItem('activeTab', tabName);

            // Trigger custom event for tab change
            window.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: tabName } }));
        }
    }

    // Attach click handlers to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'dashboard';
        switchTab(tab);
    });

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        let activeTab = urlParams.get('tab');

        // Fallback to session storage
        if (!activeTab) {
            activeTab = sessionStorage.getItem('activeTab');
        }

        // Default to dashboard
        if (!activeTab) {
            activeTab = 'dashboard';
        }

        switchTab(activeTab);
    });

    // Export switchTab function for external use
    window.userHub = {
        switchTab: switchTab
    };
})();

// Achievement Notification System
(function () {
    'use strict';

    let notificationQueue = [];
    let isShowingNotification = false;
    let soundEnabled = true;
    let reducedMotion = false;
    let notificationStyle = 'toast'; // 'toast' or 'modal'

    // Achievement sound (simple beep using Web Audio API)
    function playAchievementSound() {
        if (!soundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.warn('Could not play achievement sound:', e);
        }
    }

    // Confetti animation
    function createConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const confettiPieces = [];
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
        const confettiCount = 150;

        // Create confetti pieces
        for (let i = 0; i < confettiCount; i++) {
            confettiPieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                rotation: Math.random() * 360,
                speed: Math.random() * 3 + 2,
                size: Math.random() * 8 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                wobble: Math.random() * 2 - 1
            });
        }

        let animationId;
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            confettiPieces.forEach((piece, index) => {
                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate((piece.rotation * Math.PI) / 180);
                ctx.fillStyle = piece.color;
                ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
                ctx.restore();

                // Update position
                piece.y += piece.speed;
                piece.x += piece.wobble;
                piece.rotation += 5;

                // Remove if off screen
                if (piece.y > canvas.height) {
                    confettiPieces.splice(index, 1);
                }
            });

            if (confettiPieces.length > 0) {
                animationId = requestAnimationFrame(animate);
            }
        }

        animate();

        // Clean up after 5 seconds
        setTimeout(() => {
            if (animationId) {
                cancelAnimationFrame(animationId);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }, 5000);
    }

    // Show modal notification
    function showModal(achievement) {
        const modal = document.getElementById('achievement-modal');
        if (!modal) return;

        // Update modal content
        document.getElementById('modal-icon-emoji').textContent = achievement.icon || '🏆';
        document.getElementById('modal-name').textContent = achievement.name;
        document.getElementById('modal-description').textContent = achievement.description || 'Great job!';
        document.getElementById('modal-points').textContent = `+${achievement.points} XP`;

        // Play sound
        playAchievementSound();

        // Show modal
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('show');
            // Trigger confetti after modal appears
            if (!reducedMotion) {
                setTimeout(() => createConfetti(), 300);
            }
        }, 10);
    }

    // Close modal
    function closeModal() {
        const modal = document.getElementById('achievement-modal');
        if (!modal) return;

        modal.classList.remove('show');

        setTimeout(() => {
            modal.classList.add('hidden');
            // Clear confetti canvas
            const canvas = document.getElementById('confetti-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // Process next notification in queue
            isShowingNotification = false;
            processQueue();
        }, 300);
    }

    // Show toast notification
    function showToast(achievement) {
        const toast = document.getElementById('achievement-toast');
        if (!toast) return;

        // Update toast content
        document.getElementById('toast-icon-emoji').textContent = achievement.icon || '🏆';
        document.getElementById('toast-name').textContent = achievement.name;
        document.getElementById('toast-points').textContent = `+${achievement.points} XP`;

        // Play sound
        playAchievementSound();

        // Show toast
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('show'), 10);

        // Progress bar animation
        const progressBar = toast.querySelector('.toast-progress-bar');
        const duration = 4000; // 4 seconds

        if (progressBar) {
            progressBar.style.transitionDuration = `${duration}ms`;
            setTimeout(() => {
                progressBar.style.width = '100%';
            }, 10);
        }

        // Hide after duration
        setTimeout(() => {
            hideToast();
        }, duration);
    }

    // Hide toast notification
    function hideToast() {
        const toast = document.getElementById('achievement-toast');
        if (!toast) return;

        toast.classList.remove('show');

        setTimeout(() => {
            toast.classList.add('hidden');
            const progressBar = toast.querySelector('.toast-progress-bar');
            if (progressBar) {
                progressBar.style.transitionDuration = '0s';
                progressBar.style.width = '0%';
            }

            // Process next notification in queue
            isShowingNotification = false;
            processQueue();
        }, 500);
    }

    // Process notification queue
    function processQueue() {
        if (isShowingNotification || notificationQueue.length === 0) return;

        isShowingNotification = true;
        const achievement = notificationQueue.shift();

        // Check notification style preference
        if (notificationStyle === 'modal') {
            showModal(achievement);
        } else {
            showToast(achievement);
        }
    }

    // Add achievement to queue
    function queueAchievement(achievement) {
        notificationQueue.push(achievement);
        processQueue();
    }

    // Load user settings
    async function loadSettings() {
        try {
            const response = await fetch('/gamification/api/settings');
            if (response.ok) {
                const settings = await response.json();
                soundEnabled = settings.sound_effects_enabled !== false;
                reducedMotion = settings.reduced_motion === true;
                notificationStyle = settings.notification_style || 'toast';

                // Apply reduced motion to body
                if (reducedMotion) {
                    document.body.classList.add('reduced-motion');
                } else {
                    document.body.classList.remove('reduced-motion');
                }
            }
        } catch (e) {
            console.warn('Could not load settings:', e);
        }
    }

    // Listen for custom achievement events
    window.addEventListener('achievementUnlocked', (event) => {
        if (event.detail && event.detail.achievement) {
            queueAchievement(event.detail.achievement);
        }
    });

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        loadSettings();
    });

    // Export notification functions
    window.achievementNotifications = {
        queue: queueAchievement,
        updateSettings: loadSettings,
        closeModal: closeModal
    };
})();
