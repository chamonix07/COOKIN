// ============================================
// CONFIGURATION & DOM ELEMENTS
// ============================================

const API_CONFIG = {
    BASE_URL: 'https://dummyjson.com/recipes',
    LIMIT: 100,
    TIMEOUT: 10000
};

// DOM Elements
const recipesGrid = document.getElementById('recipes-grid');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const noResultsElement = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');
const cuisineFilter = document.getElementById('cuisine-filter');
const difficultyFilter = document.getElementById('difficulty-filter');
const resetButton = document.getElementById('reset-filters');
const recipeModal = document.getElementById('recipe-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.querySelector('.modal-close');
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

// State Management
let allRecipes = [];
let filteredRecipes = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    fetchRecipes();
});

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
    // Search and filter events
    searchInput.addEventListener('input', filterRecipes);
    cuisineFilter.addEventListener('change', filterRecipes);
    difficultyFilter.addEventListener('change', filterRecipes);
    resetButton.addEventListener('click', resetFilters);

    // Modal events
    modalClose.addEventListener('click', closeModal);
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) closeModal();
    });

    // Mobile menu events
    menuToggle.addEventListener('click', toggleMenu);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar-container')) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// ============================================
// API FUNCTIONS - FETCH DATA
// ============================================

/**
 * Fetch all recipes from API
 */
async function fetchRecipes() {
    showLoading(true);
    hideError();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const response = await fetch(`${API_CONFIG.BASE_URL}?limit=${API_CONFIG.LIMIT}`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        allRecipes = data.recipes || [];

        // Update filter options with available cuisines
        updateFilterOptions();

        // Display all recipes initially
        filteredRecipes = [...allRecipes];
        displayRecipes(filteredRecipes);
        showLoading(false);

    } catch (error) {
        console.error('Error fetching recipes:', error);
        showError(`Unable to load recipes. ${error.message}`);
        showLoading(false);
    }
}

// ============================================
// FILTER & SEARCH FUNCTIONS
// ============================================

/**
 * Filter recipes based on search query, cuisine, and difficulty
 */
function filterRecipes() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const cuisineQuery = cuisineFilter.value.toLowerCase();
    const difficultyQuery = difficultyFilter.value.toLowerCase();

    filteredRecipes = allRecipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchQuery);
        const matchesCuisine = !cuisineQuery || recipe.cuisine.toLowerCase() === cuisineQuery;
        
        // Use recipe.difficulty if available, otherwise calculate from cookTime
        const recipeDifficulty = recipe.difficulty.toLowerCase();
        const matchesDifficulty = !difficultyQuery || recipeDifficulty === difficultyQuery;

        return matchesSearch && matchesCuisine && matchesDifficulty;
    });

    displayRecipes(filteredRecipes);
}

/**
 * Reset all filters and show all recipes
 */
function resetFilters() {
    searchInput.value = '';
    cuisineFilter.value = '';
    difficultyFilter.value = '';
    filteredRecipes = [...allRecipes];
    displayRecipes(filteredRecipes);
}

/**
 * Update cuisine filter options from available recipes
 */
function updateFilterOptions() {
    const cuisines = new Set(allRecipes.map(r => r.cuisine));
    const currentCuisine = cuisineFilter.value;

    // Add new cuisine options
    Array.from(cuisines).sort().forEach(cuisine => {
        if (!Array.from(cuisineFilter.options).some(opt => opt.value === cuisine)) {
            const option = document.createElement('option');
            option.value = cuisine;
            option.textContent = cuisine;
            cuisineFilter.appendChild(option);
        }
    });

    cuisineFilter.value = currentCuisine;
}

// ============================================
// DISPLAY FUNCTIONS - RENDER RECIPES
// ============================================

/**
 * Display recipes in grid layout
 */
function displayRecipes(recipes) {
    recipesGrid.innerHTML = '';

    if (recipes.length === 0) {
        showNoResults(true);
        return;
    }

    showNoResults(false);

    recipes.forEach((recipe, index) => {
        const recipeCard = createRecipeCard(recipe);
        recipesGrid.appendChild(recipeCard);

        // Add stagger animation
        recipeCard.style.animationDelay = `${index * 50}ms`;
    });
}

/**
 * Create a recipe card element
 */
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.setAttribute('role', 'listitem');

    const rating = (recipe.rating || 0).toFixed(1);
    const mealType = recipe.mealType || 'Dinner';

    card.innerHTML = `
        <div class="recipe-image-wrapper">
            <img src="${recipe.image}" alt="${escapeHtml(recipe.name)}" class="recipe-image">
            <div class="recipe-image-overlay"></div>
            <span class="recipe-rating">${rating}</span>
            <div class="recipe-header">
                <h3 class="recipe-title">${escapeHtml(recipe.name)}</h3>
            </div>
        </div>
        <div class="recipe-content">
            <div class="recipe-badges">
                <span class="recipe-cuisine">${escapeHtml(recipe.cuisine || 'International')}</span>
                <span class="recipe-meal-type">${recipe.mealType}</span>
            </div>
            <div class="recipe-meta">
                <span class="recipe-meta-item">
                    <img src="./assets/icons/timer.png" alt="Time" width="16" height="16" style="vertical-align: middle; margin-right: 2px;">
                    ${(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min
                </span>
                <span class="recipe-meta-item">
                    <img src="./assets/icons/group.png" alt="Person" width="16" height="16" style="vertical-align: middle; margin-right: 2px;">
                    ${recipe.servings || 0} persons</span>
                <span class="recipe-meta-item">
                    <img src="./assets/icons/speedometer.png" alt="Difficulty" width="16" height="16" style="vertical-align: middle; margin-right: 2px;">
                    ${recipe.difficulty || 'Medium'}</span>
            </div>
            <button class="recipe-button" aria-label="View recipe for ${escapeHtml(recipe.name)}">
                View Recipe
            </button>
        </div>
    `;

    // Add click events to open modal
    card.querySelector('.recipe-button').addEventListener('click', () => openModal(recipe));
    card.querySelector('.recipe-image-wrapper').addEventListener('click', () => openModal(recipe));

    return card;
}

// ============================================
// MODAL FUNCTIONS - RECIPE DETAILS
// ============================================

/**
 * Open modal and display recipe details
 */
function openModal(recipe) {
    // Show modal immediately with existing data
    recipeModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Display recipe modal with data from list
    displayRecipeModal(recipe);
}

/**
 * Display recipe details in modal
 */
function displayRecipeModal(recipe) {
    const ingredients = (recipe.ingredients || []).map(ing => `<li>${escapeHtml(ing)}</li>`).join('');
    const instructions = (recipe.instructions || []).map((inst, idx) => `
        <div class="instruction-step">
            <div class="step-number">${idx + 1}</div>
            <p>${escapeHtml(inst)}</p>
        </div>
    `).join('');

    const prepTime = recipe.prepTimeMinutes || 0;
    const cookTime = recipe.cookTimeMinutes || 0;
    const rating = (recipe.rating || 0).toFixed(1);
    const reviews = recipe.reviewCount || 0;
    const tags = recipe.tags || [];

    modalBody.innerHTML = `
        <div class="modal-header-image">
            <img src="${recipe.image}" alt="${escapeHtml(recipe.name)}" class="modal-image">
            <button class="modal-close" aria-label="Close recipe details modal">&times;</button>
        </div>
        
        <div class="modal-body-content">
            <h2 class="modal-recipe-title">${escapeHtml(recipe.name)}</h2>
            
            <div class="modal-info-bar">
                <span class="info-item">
                    <img src="./assets/icons/timer.png" alt="Prep time" width="16" height="16">
                    Prep: ${prepTime} min
                </span>
                <span class="info-item">
                    <img src="./assets/icons/timer.png" alt="Cook time" width="16" height="16">
                    Cook: ${cookTime} min
                </span>
                <span class="info-item">
                    <img src="./assets/icons/group.png" alt="Servings" width="16" height="16">
                    ${recipe.servings || 0} servings
                </span>
                <span class="info-item">
                    <img src="./assets/icons/speedometer.png" alt="Difficulty" width="16" height="16">
                    ${recipe.difficulty}
                </span>
                <span class="info-item">⭐ ${rating} (${reviews} reviews)</span>
                <span class="info-item">🔥 ${recipe.caloriesPerServing || 'N/A'} cal/serving</span>
            </div>

            <div class="modal-content-sections">
                <div class="modal-section">
                    <h3 class="section-title">Ingredients</h3>
                    <div class="section-divider"></div>
                    <ul class="ingredients-list">
                        ${ingredients || '<li>No ingredients listed</li>'}
                    </ul>
                </div>

                <div class="modal-section">
                    <h3 class="section-title">Instructions</h3>
                    <div class="section-divider"></div>
                    <div class="instructions-list">
                        ${instructions || '<p>No instructions available</p>'}
                    </div>
                </div>
            </div>

            ${tags.length > 0 ? `
                <div class="modal-tags-section">
                    <h3 class="section-title">Tags</h3>
                    <div class="section-divider"></div>
                    <div class="tags-container">
                        ${tags.map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // Reattach close button listener
    const newCloseBtn = modalBody.querySelector('.modal-close');
    if (newCloseBtn) {
        newCloseBtn.addEventListener('click', closeModal);
    }

    recipeModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close recipe detail modal
 */
function closeModal() {
    recipeModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ============================================
// UTILITY FUNCTIONS - HELPERS
// ============================================

/**
 * Toggle mobile menu visibility
 */
function toggleMenu() {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
}

/**
 * Show or hide loading spinner
 */
function showLoading(show) {
    loadingElement.classList.toggle('active', show);
}

/**
 * Display error message
 */
function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.add('active');
}

/**
 * Hide error message
 */
function hideError() {
    errorElement.classList.remove('active');
    errorElement.textContent = '';
}

/**
 * Show or hide no results message
 */
function showNoResults(show) {
    noResultsElement.classList.toggle('active', show);
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
