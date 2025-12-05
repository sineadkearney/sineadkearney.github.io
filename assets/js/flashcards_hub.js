// Flashcards Hub Integration - Study Management and Animations
(function () {
    'use strict';

    // State management
    let currentView = 'stats'; // 'stats', 'study', or 'manage'
    let cards = [];
    let currentIndex = 0;
    let currentCard = null;
    let audioCache = new Map();
    let reducedMotion = false;
    let useFlipAnimation = true; // true = flip, false = fade

    // Check for reduced motion preference
    function checkReducedMotion() {
        const systemPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const bodyHasClass = document.body.classList.contains('reduced-motion');
        reducedMotion = systemPreference || bodyHasClass;
        return reducedMotion;
    }

    // View switching with animations
    function switchView(fromView, toView) {
        checkReducedMotion();

        const fromElement = document.getElementById(`flashcards-${fromView}-view`);
        const toElement = document.getElementById(`flashcards-${toView}-view`);

        if (!fromElement || !toElement) return;

        // Fade out animation
        fromElement.classList.add('fade-out');

        const transitionDuration = reducedMotion ? 0 : 300;

        setTimeout(() => {
            fromElement.classList.add('hidden');
            fromElement.classList.remove('fade-out');
            toElement.classList.remove('hidden');

            // Trigger fade in
            setTimeout(() => {
                toElement.classList.add('fade-in');
                setTimeout(() => {
                    toElement.classList.remove('fade-in');
                }, transitionDuration);
            }, 10);
        }, transitionDuration);

        currentView = toView;
    }

    // Show study mode
    async function showStudyMode() {
        // Load due cards
        await loadDueCards();

        if (cards.length === 0) {
            alert('No cards due for review! Add some cards first.');
            return;
        }

        switchView(currentView, 'study');
        currentIndex = 0;
        showCard();
    }

    // Show stats view
    function showStatsView() {
        switchView(currentView, 'stats');
        // Reload stats if needed
        loadStats();
    }

    // Show manage view
    function showManageView() {
        switchView(currentView, 'manage');
        loadCards();
    }

    // API: Load due cards
    async function loadDueCards() {
        try {
            const response = await fetch('/api/cards/due');
            cards = await response.json();
            return cards;
        } catch (error) {
            console.error('Failed to load due cards:', error);
            cards = [];
            return [];
        }
    }

    // API: Load all cards
    async function loadCards() {
        try {
            const response = await fetch('/api/cards');
            const allCards = await response.json();

            const list = document.getElementById('cardsList');
            if (!list) return;

            if (allCards.length === 0) {
                list.innerHTML = '<p style="color: #718096; text-align: center; padding: 40px;">No cards yet. Add some to get started!</p>';
                return;
            }

            list.innerHTML = allCards.map(card => `
                <div class="flashcard-item" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: white; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.2s ease;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <strong style="font-size: 18px;">${card.irish}</strong>
                            <span style="color: #a0aec0;">→</span>
                            <span style="font-size: 16px;">${card.english}</span>
                            ${card.has_audio ? `
                                <span class="speaker-icon enabled" onclick="window.flashcardsHub.playCardAudio('${card.irish}', '${card.english}', this)" style="font-size: 14px; padding: 4px 8px; cursor: pointer;">
                                    <i class="fa-solid fa-volume-high"></i>
                                </span>
                            ` : ''}
                        </div>
                        <small style="color: #718096;">
                            Reviews: ${card.total_reviews} | 
                            Accuracy: ${card.accuracy}% | 
                            Interval: ${card.interval}d
                        </small>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="window.flashcardsHub.deleteCard(${card.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load cards:', error);
        }
    }

    // API: Load stats
    async function loadStats() {
        // Stats are already rendered in the template from server-side
        // No API call needed - values are already in the DOM
        return;
    }

    // Show current card
    function showCard() {
        if (currentIndex >= cards.length) {
            showCompletionScreen();
            return;
        }

        currentCard = cards[currentIndex];

        // Update progress
        const progressEl = document.getElementById('study-progress');
        if (progressEl) {
            progressEl.textContent = `Card ${currentIndex + 1} of ${cards.length}`;
        }

        // Update card content
        const questionEl = document.getElementById('study-question');
        const answerEl = document.getElementById('study-answer');
        const cardInner = document.getElementById('study-card-inner');

        if (questionEl) questionEl.textContent = currentCard.irish;
        // Don't set answer text yet - will be set when revealed

        // Reset card state
        if (cardInner) {
            cardInner.classList.remove('flipped', 'revealed');

            // Apply current animation mode
            if (useFlipAnimation) {
                cardInner.classList.add('mode-flip');
                cardInner.classList.remove('mode-fade');
            } else {
                cardInner.classList.add('mode-fade');
                cardInner.classList.remove('mode-flip');
            }
        }

        // Show/hide buttons
        document.getElementById('reveal-btn')?.classList.remove('hidden');
        document.getElementById('rating-btns')?.classList.add('hidden');

        // Update audio icon
        const audioIcon = document.getElementById('study-audio-icon');
        if (audioIcon) {
            if (currentCard.has_audio) {
                audioIcon.classList.remove('disabled');
                audioIcon.classList.add('enabled');
                // Preload audio
                preloadAudio(currentCard);
            } else {
                audioIcon.classList.add('disabled');
                audioIcon.classList.remove('enabled');
            }
        }
    }

    // Show completion screen
    function showCompletionScreen() {
        const cardDisplay = document.getElementById('study-card-display');
        if (!cardDisplay) return;

        cardDisplay.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <div style="font-size: 80px; margin-bottom: 20px;">🎉</div>
                <h2 style="color: #48bb78; margin-bottom: 15px;">Study Session Complete!</h2>
                <p style="color: #718096; margin-bottom: 30px;">Great job! You reviewed ${cards.length} card${cards.length > 1 ? 's' : ''}.</p>
                <button class="btn btn-primary btn-lg" onclick="window.flashcardsHub.showStatsView()">
                    <i class="fas fa-check"></i> Finish
                </button>
            </div>
        `;

        // Trigger confetti if not reduced motion
        if (!reducedMotion && window.confetti) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    // Reveal answer with flip or fade animation
    function revealAnswer() {
        const cardInner = document.getElementById('study-card-inner');
        const answerEl = document.getElementById('study-answer');

        // Set answer text BEFORE starting animation
        if (answerEl && currentCard) {
            answerEl.textContent = currentCard.english;
        }

        if (cardInner) {
            // Just add 'revealed' class - CSS handles the rest based on mode class
            cardInner.classList.add('revealed');
        }

        document.getElementById('reveal-btn')?.classList.add('hidden');
        document.getElementById('rating-btns')?.classList.remove('hidden');
    }

    // Rate card
    async function rateCard(quality) {
        if (!currentCard) return;

        try {
            await fetch(`/api/cards/${currentCard.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quality })
            });

            // If "Again", add card back to queue
            if (quality === 0) {
                cards.push(currentCard);
            }

            currentIndex++;
            showCard();
        } catch (error) {
            console.error('Failed to rate card:', error);
            alert('Failed to save rating. Please try again.');
        }
    }

    // Audio functions
    function getAudioFilename(irish, english) {
        return `${slugify(irish)}_${slugify(english)}.wav`;
    }

    function preloadAudio(card) {
        if (!card.has_audio) return;

        const filename = getAudioFilename(card.irish, card.english);
        if (!audioCache.has(card.id)) {
            const audio = new Audio(`/api/audio/${filename}`);
            audio.preload = 'auto';
            audioCache.set(card.id, audio);
        }
    }

    function playAudio() {
        if (!currentCard || !currentCard.has_audio) return;

        const audioIcon = document.getElementById('study-audio-icon');
        if (audioIcon) audioIcon.classList.add('playing');

        let audio = audioCache.get(currentCard.id);

        if (!audio) {
            const filename = getAudioFilename(currentCard.irish, currentCard.english);
            audio = new Audio(`/api/audio/${filename}`);
            audioCache.set(currentCard.id, audio);
        }

        audio.currentTime = 0;
        audio.play().catch(err => {
            console.error('Audio playback failed:', err);
        });

        audio.onended = () => {
            if (audioIcon) audioIcon.classList.remove('playing');
        };
    }

    function playCardAudio(irish, english, element) {
        const filename = `${slugify(irish)}_${slugify(english)}.wav`;
        const audio = new Audio(`/api/audio/${filename}`);

        if (element) element.classList.add('playing');

        audio.play().catch(err => {
            console.error('Audio playback failed:', err);
        });

        audio.onended = () => {
            if (element) element.classList.remove('playing');
        };
    }

    // Card management functions
    async function addCard() {
        const irish = document.getElementById('add-irish')?.value.trim();
        const english = document.getElementById('add-english')?.value.trim();

        if (!irish || !english) {
            alert('Please fill both fields');
            return;
        }

        try {
            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ irish, english })
            });

            if (response.status === 409) {
                alert('This card already exists!');
                return;
            }

            if (response.ok) {
                // Clear inputs
                document.getElementById('add-irish').value = '';
                document.getElementById('add-english').value = '';

                // Reload cards list
                await loadCards();
                alert('Card added successfully!');
            }
        } catch (error) {
            console.error('Failed to add card:', error);
            alert('Failed to add card. Please try again.');
        }
    }

    async function bulkAddCards() {
        const bulk = document.getElementById('bulk-cards')?.value.trim();

        if (!bulk) {
            alert('Please enter cards to add');
            return;
        }

        const lines = bulk.split('\n').filter(l => l.trim());
        let added = 0;

        for (const line of lines) {
            const [irish, english] = line.split(',').map(s => s.trim());
            if (irish && english) {
                try {
                    const response = await fetch('/api/cards', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ irish, english })
                    });
                    if (response.ok) added++;
                } catch (error) {
                    console.error(`Failed to add ${irish}:`, error);
                }
            }
        }

        document.getElementById('bulk-cards').value = '';
        await loadCards();
        alert(`Added ${added} card${added !== 1 ? 's' : ''} successfully!`);
    }

    async function deleteCard(cardId) {
        if (!confirm('Are you sure you want to delete this card?')) return;

        try {
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadCards();
            }
        } catch (error) {
            console.error('Failed to delete card:', error);
            alert('Failed to delete card. Please try again.');
        }
    }

    // Utility function
    function slugify(text) {
        return text
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-{2,}/g, '-');
    }

    // Keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (currentView !== 'study') return;

            // Space = reveal answer
            if (e.code === 'Space' && !document.getElementById('reveal-btn')?.classList.contains('hidden')) {
                e.preventDefault();
                revealAnswer();
            }

            // Number keys = rate card
            if (!document.getElementById('rating-btns')?.classList.contains('hidden')) {
                if (e.code === 'Digit1') rateCard(0); // Again
                if (e.code === 'Digit2') rateCard(3); // Hard
                if (e.code === 'Digit3') rateCard(4); // Good
                if (e.code === 'Digit4') rateCard(5); // Easy
            }
        });
    }

    // Set animation mode immediately (avoids race condition with server save)
    function setAnimationMode(isFlip) {
        useFlipAnimation = isFlip;

        // Update current card if visible
        const cardInner = document.getElementById('study-card-inner');
        if (cardInner) {
            // Only update mode classes if not revealed yet to avoid jumping
            if (!cardInner.classList.contains('revealed')) {
                if (useFlipAnimation) {
                    cardInner.classList.add('mode-flip');
                    cardInner.classList.remove('mode-fade');
                } else {
                    cardInner.classList.add('mode-fade');
                    cardInner.classList.remove('mode-flip');
                }
            }
        }
    }

    // Load user animation preference
    async function loadAnimationPreference() {
        try {
            const response = await fetch('/gamification/api/settings');
            if (response.ok) {
                const settings = await response.json();
                useFlipAnimation = settings.flashcard_flip_animation !== false;
            }
        } catch (error) {
            console.warn('Could not load animation preference:', error);
        }
    }

    // Initialize
    function init() {
        checkReducedMotion();
        setupKeyboardShortcuts();
        loadAnimationPreference();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export functions
    window.flashcardsHub = {
        showStudyMode,
        showStatsView,
        showManageView,
        revealAnswer,
        rateCard,
        playAudio,
        playCardAudio,
        addCard,
        bulkAddCards,
        deleteCard,
        loadCards,
        loadStats,
        loadAnimationPreference,
        setAnimationMode
    };
})();
