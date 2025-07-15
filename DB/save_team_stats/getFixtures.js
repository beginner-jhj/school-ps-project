import "dotenv/config";

const key = process.env.API_KEY;

/**
 *
 * @param {Number} leagueId
 * @param {Number} season
 */

export async function getFixutres(leagueId = 39, season = 2021) {
  const headers = new Headers();
  headers.append("x-rapidapi-key", key);
  headers.append("x-rapidapi-host", "v3.football.api-sports.io");

  const requestOptions = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`,
      requestOptions
    );

    const data = await response.json();

    const matches = data.response;
    return matches;
  } catch (err) {
    throw new Error(err);
  }
}
