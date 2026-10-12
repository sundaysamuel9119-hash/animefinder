const API_URL = "https://graphql.anilist.co";

async function fetchAnime(query, variables = {}) {
try {
const response = await fetch(API_URL, {
method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },

        body: JSON.stringify({
            query: query,
            variables: variables
        })
    });

    if (!response.ok) {
        throw new Error("Failed to connect to AniList.");
    }

    const result = await response.json();

    if (result.errors) {
        throw new Error("AniList returned an error.");
    }

    return result.data;

} catch (error) {
    console.error("AnimeFinder error:", error);
    throw error;
}

}