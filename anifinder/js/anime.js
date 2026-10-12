// ========================================
// ANIME DETAILS PAGE
// ========================================

const animeDetailsQuery = `
    query ($id: Int) {
        Media(id: $id, type: ANIME) {
            id

            title {
                romaji
                english
                native
            }

            description(asHtml: false)
            averageScore
            episodes
            seasonYear
            format
            status
            genres

            coverImage {
                extraLarge
                large
            }

            bannerImage
            siteUrl
        }
    }
`;

async function loadAnimeDetails() {
    const params = new URLSearchParams(window.location.search);
    const animeId = params.get("id");

    const page = document.getElementById("anime-details");

    if (!animeId) {
        page.textContent = "No anime was selected.";
        return;
    }

    page.textContent = "Loading anime details...";

    try {
        const data = await fetchAnime(animeDetailsQuery, {
            id: Number(animeId)
        });

        const anime = data.Media;

        if (!anime) {
            page.textContent = "Anime not found.";
            return;
        }

        // Clear the loading message.
        page.replaceChildren();

        // Banner
        if (anime.bannerImage) {
            const banner = document.createElement("img");
            banner.src = anime.bannerImage;
            banner.alt = "";
            banner.className = "anime-banner";
            page.appendChild(banner);
        }

        // Main details container
        const details = document.createElement("div");
        details.className = "anime-details-content";

        // Cover image
        const cover = document.createElement("img");
        cover.src = anime.coverImage.extraLarge ||
                    anime.coverImage.large;
        cover.alt = "Cover of " +
                    (anime.title.english || anime.title.romaji);
        cover.className = "anime-cover";

        details.appendChild(cover);

        // Information beside the cover
        const info = document.createElement("div");
        info.className = "anime-info";

        const title = document.createElement("h1");
        title.textContent =
            anime.title.english ||
            anime.title.romaji ||
            anime.title.native;

        info.appendChild(title);

        const rating = document.createElement("p");
        rating.textContent = anime.averageScore !== null
            ? `⭐ Rating: ${anime.averageScore}/100`
            : "⭐ Rating unavailable";

        info.appendChild(rating);

        const episodes = document.createElement("p");
        episodes.textContent = anime.episodes
            ? `📺 Episodes: ${anime.episodes}`
            : "📺 Episodes: Unknown";

        info.appendChild(episodes);

        const year = document.createElement("p");
        year.textContent = `📅 Year: ${anime.seasonYear || "Unknown"}`;

        info.appendChild(year);

        const format = document.createElement("p");
        format.textContent = `🎬 Format: ${anime.format || "Unknown"}`;

        info.appendChild(format);

        const status = document.createElement("p");
        status.textContent = `📌 Status: ${anime.status || "Unknown"}`;

        info.appendChild(status);

        const genres = document.createElement("p");
        genres.textContent = "🏷️ Genres: " +
            (anime.genres.length
                ? anime.genres.join(", ")
                : "Unknown");

        info.appendChild(genres);

        details.appendChild(info);
        page.appendChild(details);

        // Description
        const descriptionTitle = document.createElement("h2");
        descriptionTitle.textContent = "Synopsis";

        page.appendChild(descriptionTitle);

        const description = document.createElement("p");

        description.textContent = anime.description
            ? anime.description.replace(/<[^>]*>/g, "").trim()
            : "No description available.";

        page.appendChild(description);

        // Link to AniList
        const link = document.createElement("a");
        link.href = anime.siteUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "View on AniList";

        page.appendChild(link);

        document.title = title.textContent + " | AnimeFinder";

    } catch (error) {
        console.error("Failed to load anime details:", error);

        page.textContent =
            "Couldn't load anime details. Check your internet connection and try again.";
    }
}

loadAnimeDetails();