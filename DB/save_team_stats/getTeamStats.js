import { getFixutres } from "./getFixtures.js";
import { Team } from "../../classes/team.js";

//시즌 가져오고, 모든 팀 스탯 db에 저장

/**
 *
 * @returns {Object} - team stats
 */

export async function getTeamStats() {
  let thisYear = new Date().getFullYear();
  let teamStats = {};

  for (let season = 2010; season < thisYear; season++) {
    const fixtures = await getFixutres(39, season);
    for (const match of fixtures) {
      let homeTeam = match.teams.home.name.toLowerCase().split(" ").join("");
      let awayTeam = match.teams.away.name.toLowerCase().split(" ").join("");
      let isHomeWinner = match.teams.home.winner;
      let isDraw = match.goals.home === match.goals.away;
      let homeResult;
      let awayResult;

      if (!teamStats[homeTeam]) {
        teamStats[homeTeam] = new Team(homeTeam);
      }

      if (!teamStats[awayTeam]) {
        teamStats[awayTeam] = new Team(awayTeam);
      }

      teamStats[homeTeam].updateTotalMatches();
      teamStats[awayTeam].updateTotalMatches();

      teamStats[homeTeam].updateScore(match.goals.home);
      teamStats[awayTeam].updateScore(match.goals.away);

      if (isDraw) {
        homeResult = 0.5;
        awayResult = 0.5;
      } else {
        homeResult = isHomeWinner ? 1 : 0;
        awayResult = !isHomeWinner ? 1 : 0;
      }

      let homeTeamElo = teamStats[homeTeam].eloRating;
      let awayTeamElo = teamStats[awayTeam].eloRating;

      teamStats[homeTeam].eloRating = calculateEloRating(
        homeTeamElo,
        awayTeamElo,
        homeResult
      );
      teamStats[awayTeam].eloRating = calculateEloRating(
        awayTeamElo,
        homeTeamElo,
        awayResult
      );
    }
  }

  for (const item of Object.entries(teamStats)) {
    let teamStat = item[1];
    teamStat.updateAvgGoal(teamStat.score / teamStat.totalMatches);
  }
  return teamStats;
}

/**
 * Calculates the new Elo rating after a match.
 *
 * Formula:
 *    R' = R + K * (S - E)
 *
 * Where:
 *    R  = Current rating
 *    R' = New rating
 *    K  = K-factor (adjusts rating volatility, typically 20-60 in football)
 *    S  = Actual match result (1 for win, 0.5 for draw, 0 for loss)
 *    E  = Expected score (calculated as follows)
 *
 * Expected score formula:
 *    E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 *
 * @param {number} playerRating - The current rating of the player/team.
 * @param {number} opponentRating - The current rating of the opponent team.
 * @param {number} result - The actual match result (1 = win, 0.5 = draw, 0 = loss).
 * @param {number} kFactor - The K-factor determining rating change sensitivity (default: 30).
 * @returns {number} - The new Elo rating after the match.
 */

function calculateEloRating(
  playerRating,
  opponentRating,
  result,
  kFactor = 30
) {
  // Calculate expected score
  const expectedScore =
    1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

  // Calculate new Elo rating
  const newRating = playerRating + kFactor * (result - expectedScore);

  return Math.round(newRating); // Round to nearest integer
}
