// ========================================
// 1. ELEMENTS AND SETTINGS
// ========================================

const selectedGenres = [];

const genreButtons = document.querySelectorAll(".genre-chip");
const clearButton = document.getElementById("clear-genres");
const findButton = document.getElementById("find-anime");
const rouletteButton = document.getElementById("roulette-button");
const loadMoreButton = document.getElementById("load-more");

const resultsContainer = document.getElementById("anime-results");
const resultsTitle = document.getElementById("results-title");
const resultsMessage = document.getElementById("results-message");

const ratingFilter = document.getElementById("min-rating");
const episodeFilter = document.getElementById("episode-range");
const typeFilter = document.getElementById("anime-type");

let currentPage = 1;
let hasNextPage = false;
let isLoading = false;
let displayedAnime = [];
let searchVersion = 0;

const RESULTS_PER_PAGE = 50;

// ========================================
// 2. ANILIST QUERY
// ========================================

const discoverQuery = `
query (
$page: Int,
$perPage: Int,
$genres: [String],
$formats: [MediaFormat]
) {
Page(page: $page, perPage: $perPage) {
pageInfo {
hasNextPage
}

        media(
            type: ANIME,
            sort: POPULARITY_DESC,
            isAdult: false,
            genre_in: $genres,
            format_in: $formats
        ) {
            id

            title {
                english
                romaji
            }

            coverImage {
                large
            }

            averageScore
            episodes
            seasonYear
            format
            genres
        }
    }
}

`;

// ========================================
// 3. GENRE SELECTION
// ========================================

genreButtons.forEach(button => {
button.addEventListener("click", () => {
const genre = button.dataset.genre;
const index = selectedGenres.indexOf(genre);

    if (index !== -1) {
        selectedGenres.splice(index, 1);
        button.classList.remove("selected");
    } else {
        selectedGenres.push(genre);
        button.classList.add("selected");
    }

    console.log("Selected genres:", selectedGenres);
});

});

// ========================================
// 4. CLEAR ALL FILTERS
// ========================================

clearButton.addEventListener("click", () => {
selectedGenres.length = 0;

genreButtons.forEach(button => {
    button.classList.remove("selected");
});

ratingFilter.value = "0";
episodeFilter.value = "any";
typeFilter.value = "any";

console.log("All filters cleared!");

});

// ========================================
// 5. GET FILTER VALUES
// ========================================

function getEpisodeRange() {
const value = episodeFilter.value;

if (value === "any") {
    return null;
}

if (value === "200+") {
    return { min: 200, max: Infinity };
}

const [min, max] = value.split("-").map(Number);

return { min, max };

}

function matchesFilters(anime) {
// Minimum rating

const minimumRating = Number(ratingFilter.value);

if (
    minimumRating > 0 &&
    (
        anime.averageScore === null ||
        anime.averageScore < minimumRating
    )
) {
    return false;
}

// Episode range

const episodeRange = getEpisodeRange();

if (episodeRange) {
    // Exclude anime with an unknown episode count.
    if (anime.episodes === null) {
        return false;
    }

    if (
        anime.episodes < episodeRange.min ||
        anime.episodes > episodeRange.max
    ) {
        return false;
    }

    // Keep the ranges from overlapping.
    if (
        episodeRange.max !== Infinity &&
        episodeRange.min > 1 &&
        anime.episodes < episodeRange.min
    ) {
        return false;
    }
}

return true;

}

// ========================================
// 6. CREATE AN ANIME CARD
// ========================================

function createAnimeCard(anime) {
const title =
anime.title.english ||
anime.title.romaji ||
"Unknown title";

const card = document.createElement("article");
card.className = "anime-card";
card.tabIndex = 0;
card.setAttribute("role", "link");
card.setAttribute("aria-label", `View details for ${title}`);

const image = document.createElement("img");

image.src = anime.coverImage.large;
image.alt = `${title} cover`;
image.loading = "lazy";

const content = document.createElement("div");
content.className = "anime-card-content";

const heading = document.createElement("h3");
heading.textContent = title;

const meta = document.createElement("div");
meta.className = "anime-card-meta";

const episodes = document.createElement("span");

episodes.textContent = anime.episodes !== null
    ? `${anime.episodes} eps`
    : "Unknown eps";

const rating = document.createElement("span");
rating.className = "rating";

rating.textContent = anime.averageScore !== null
    ? `★ ${(anime.averageScore / 10).toFixed(1)}`
    : "Not rated";

meta.append(episodes, rating);
content.append(heading, meta);
card.append(image, content);

function openDetails() {
    window.location.href = `anime.html?id=${anime.id}`;
}

card.addEventListener("click", openDetails);

card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetails();
    }
});

return card;

}

// ========================================
// 7. DISPLAY ANIME RESULTS
// ========================================

function renderAnime(animeList) {
animeList.forEach(anime => {
// Prevent duplicate cards.
if (displayedAnime.some(item => item.id === anime.id)) {
return;
}

    displayedAnime.push(anime);

    resultsContainer.appendChild(createAnimeCard(anime));
});

}

// ========================================
// 8. SEARCH FOR ANIME
// ========================================

async function searchAnime(reset = true) {
if (isLoading) {
return;
}

if (reset) {
    searchVersion++;

    currentPage = 1;
    hasNextPage = false;
    displayedAnime = [];

    resultsContainer.replaceChildren();

    resultsTitle.textContent = "Your Recommendations";
    resultsMessage.textContent = "Searching for anime that match your filters...";

    loadMoreButton.hidden = true;
}

const thisSearch = searchVersion;

isLoading = true;
findButton.disabled = true;
loadMoreButton.disabled = true;
rouletteButton.disabled = true;

if (!reset) {
    loadMoreButton.textContent = "Loading...";
}

try {
    const selectedType = typeFilter.value;

    const variables = {
        page: currentPage,
        perPage: RESULTS_PER_PAGE,

        // null means AniList should not restrict this field.
        genres: selectedGenres.length > 0
            ? [...selectedGenres]
            : null,

        formats: selectedType !== "any"
            ? [selectedType]
            : null
    };

    const data = await fetchAnime(discoverQuery, variables);

    // Ignore a response if a newer search has started.
    if (thisSearch !== searchVersion) {
        return;
    }

    const pageData = data.Page;

    hasNextPage = pageData.pageInfo.hasNextPage;

    const matchingAnime = pageData.media.filter(matchesFilters);

    renderAnime(matchingAnime);

    if (displayedAnime.length === 0) {
        resultsMessage.textContent =
            "No matching anime found on this page. Try loading more or changing your filters.";
    } else {
        resultsMessage.textContent =
            `Showing ${displayedAnime.length} matching anime.`;
    }

    loadMoreButton.hidden = !hasNextPage;

    // Remember which page to request next.
    currentPage++;

} catch (error) {
    if (thisSearch === searchVersion) {
        console.error("Discovery error:", error);

        resultsMessage.textContent =
            "Couldn't load anime. Check your internet connection and try again.";

        loadMoreButton.hidden = true;
    }

} finally {
    if (thisSearch === searchVersion) {
        isLoading = false;

        findButton.disabled = false;
        loadMoreButton.disabled = false;
        rouletteButton.disabled = false;

        loadMoreButton.textContent = "Load More";
    }
}

}

// ========================================
// 9. FIND MY ANIME BUTTON
// ========================================

findButton.addEventListener("click", () => {
searchAnime(true);
});

// ========================================
// 10. LOAD MORE BUTTON
// ========================================

loadMoreButton.addEventListener("click", () => {
if (hasNextPage) {
searchAnime(false);
}
});

// ========================================
// 11. ANIME ROULETTE
// ========================================

async function spinRoulette() {
if (isLoading) {
return;
}

// If no results exist yet, search first.
if (displayedAnime.length === 0) {
    await searchAnime(true);
}

// If the search returned results, choose one randomly.
if (displayedAnime.length > 0) {
    const randomIndex = Math.floor(
        Math.random() * displayedAnime.length
    );

    const chosenAnime = displayedAnime[randomIndex];

    window.location.href = `anime.html?id=${chosenAnime.id}`;
}

}

rouletteButton.addEventListener("click", spinRoulette);

// ========================================
// 12. AUTOMATIC ROULETTE
// ========================================

// Handles the "Surprise Me" link on the homepage.

const params = new URLSearchParams(window.location.search);

if (params.get("roulette") === "true") {
spinRoulette();
}
// ========================================
// DISPLAY HOMEPAGE SEARCH RESULTS
// ========================================

if (params.has("search")) {
    const searchTerm = params.get("search");
    const savedResults = sessionStorage.getItem("animeSearchResults");

    resultsTitle.textContent = "Search Results";
    resultsMessage.textContent = `Results for "${searchTerm}"`;

    if (savedResults) {
        try {
            const animeResults = JSON.parse(savedResults);

            resultsContainer.replaceChildren();
            displayedAnime = [];

            if (animeResults.length > 0) {
                renderAnime(animeResults);

                resultsMessage.textContent =
                    `Found ${animeResults.length} anime matching "${searchTerm}".`;
            } else {
                resultsMessage.textContent =
                    `No anime found for "${searchTerm}". Try another title.`;
            }

            loadMoreButton.hidden = true;

        } catch (error) {
            console.error("Could not display search results:", error);

            resultsMessage.textContent =
                "Couldn't display your search results. Please try again.";
        }
    }
}