const trendingQuery = "query { Page(page: 1, perPage: 10) { media( type: ANIME, sort: TRENDING_DESC, isAdult: false ) { id title { english romaji } coverImage { large } averageScore seasonYear } } }";

async function loadTrendingAnime() {
const container = document.getElementById("trending-anime");

try {
    const data = await fetchAnime(trendingQuery);
    const animeList = data.Page.media;

    container.innerHTML = "";

    animeList.forEach(anime => {
        const title = anime.title.english || anime.title.romaji;
        const rating = anime.averageScore
            ? `${anime.averageScore}/100`
            : "Not rated";

        const card = document.createElement("article");
        card.className = "anime-card";

        const image = document.createElement("img");
        image.src = anime.coverImage.large;
        image.alt = title;
        image.loading = "lazy";

        const content = document.createElement("div");
        content.className = "anime-card-content";

        const heading = document.createElement("h3");
        heading.textContent = title;

        const meta = document.createElement("div");
        meta.className = "anime-card-meta";

        const year = document.createElement("span");
        year.textContent = anime.seasonYear || "Year unknown";

        const score = document.createElement("span");
        score.className = "rating";
        score.textContent = `★ ${rating}`;

        meta.append(year, score);
        content.append(heading, meta);
        card.append(image, content);

        card.addEventListener("click", () => {
            window.location.href = `anime.html?id=${anime.id}`;
        });

        card.style.cursor = "pointer";
        container.appendChild(card);
    });

} catch (error) {
    container.textContent =
        "Couldn't load anime. Please check your internet connection and try again.";
}

}

loadTrendingAnime();
// ========================================
// HOMEPAGE ANIME SEARCH
// ========================================

const searchForm = document.getElementById("anime-search-form");
const searchInput = document.getElementById("anime-search-input");

const searchQuery = `
query ($search: String) {
Page(page: 1, perPage: 20) {
media(
search: $search,
type: ANIME,
isAdult: false,
sort: SEARCH_MATCH
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
        }
    }
}

`;

searchForm.addEventListener("submit", async event => {
event.preventDefault();

const animeName = searchInput.value.trim();

if (!animeName) {
    return;
}

const button = searchForm.querySelector("button");
const originalButtonText = button.textContent;

button.disabled = true;
button.textContent = "...";

try {
    const data = await fetchAnime(searchQuery, {
        search: animeName
    });

    const results = data.Page.media;

    if (results.length === 0) {
        alert("No anime found. Try another title!");
        return;
    }

    // Save the search results for the Discover page.
    sessionStorage.setItem(
        "animeSearchResults",
        JSON.stringify(results)
    );

    sessionStorage.setItem("animeSearchTerm", animeName);

    // Open Discover and display the matching titles.
    window.location.href = "discover.html?search=" +
        encodeURIComponent(animeName);

} catch (error) {
    console.error("Anime search failed:", error);

    alert(
        "Couldn't search for anime. Check your internet connection and try again."
    );

} finally {
    button.disabled = false;
    button.textContent = originalButtonText;
}

});