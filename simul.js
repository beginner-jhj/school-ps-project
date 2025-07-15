import { pool } from "./DB/pool.js";
import { Team } from "./classes/team.js";
import { League } from "./classes/league.js";

async function getTeamsFromDB() {
  const query = "SELECT * FROM team_summary ORDER BY elo_rating DESC;";
  const [result] = await pool.execute(query);
  await pool.end();
  let teams = [];
  for (const summary of result) {
    let team = new Team(summary.name);
    team.eloRating = summary.elo_rating;
    team.avgGoal = summary.avg_goal;
    teams.push(team);
  }
  return teams;
}

function selectRandomBottomTeams(teams) {
  let result = [];
  for (let i = 0; i < 5; i++) {
    let randomIndex = Math.floor(Math.random() * teams.length);
    result.push(teams[randomIndex]);
  }
  return result;
}

function updateStats(teams, seasonResult) {
  const TEAMS = Object.assign(
    {},
    ...teams.map((team) => ({ [team.name]: team }))
  );
  for (const team of seasonResult) {
    TEAMS[team.name] = new Team(team.name);
    TEAMS[team.name].eloRating = team.eloRating;
    TEAMS[team.name].avgGoal = team.avgGoal;
  }
  const result = Object.entries(TEAMS).map(([key, value]) => value);
  return result;
}

async function simul(N) {
  let teams = await getTeamsFromDB();
  let top15 = teams.slice(0, 15);
  let elseTeams = teams.slice(15);
  let seasonResults = [];

  let analysis = {
    simulations: N,
    finalTable: null,
    mostWinningTeam: [], //teamname,count
    mostTop4: [],
    mostRelegated: [],
    analysisByTeam: Object.assign(
      {},
      ...teams.map((team) => ({
        [team.name]: {
          matchesPlayed: 0,
          finalPoints: [0, 0], //[points,season]
          finalRank: [0, 0], //[rank,season]
          winning: [], //[[season,point]]
          wins: 0,
          draws: 0,
          loses: 0,
          top4: 0,
          relegation: 0,
          history: {
            eloRating: [],
            points: [],
            rank: [],
          },
          avg: {
            eloRating: 0,
            points: 0,
            rank: 0,
          },
        },
      }))
    ),
  };

  for (let i = 0; i < N; i++) {
    let selectedBottomTeams = selectRandomBottomTeams(elseTeams);
    let finalTeams = top15.concat(selectedBottomTeams);
    let league = new League(finalTeams);
    let seasonTable = league.start({ showMatchResult: false });

    seasonTable.forEach((team, idx) => {
      if (idx === 0) {
        analysis.analysisByTeam[team.name].winning.push([i + 1, team.point]);
      }

      if (idx < 4) {
        analysis.analysisByTeam[team.name].top4 += 1;
      }

      if (idx > 16) {
        analysis.analysisByTeam[team.name].relegation += 1;
      }

      analysis.analysisByTeam[team.name].matchesPlayed += 38;
      analysis.analysisByTeam[team.name].finalPoints = [team.point, i + 1];
      analysis.analysisByTeam[team.name].finalRank = [idx + 1, i + 1];
      analysis.analysisByTeam[team.name].wins += team.win;
      analysis.analysisByTeam[team.name].draws += team.draw;
      analysis.analysisByTeam[team.name].loses += team.lose;
      analysis.analysisByTeam[team.name].history.eloRating.push(team.eloRating);
      analysis.analysisByTeam[team.name].history.points.push(team.point);
      analysis.analysisByTeam[team.name].history.rank.push(idx + 1);
    });

    seasonResults.push(seasonTable);
    teams = updateStats(teams, seasonTable);
    top15 = teams.slice(0, 15);
    elseTeams = teams.slice(15);
  }

  Object.entries(analysis.analysisByTeam).forEach((item) => {
    const teamName = item[0];
    const teamStats = item[1];
    const seasonsPlayed = teamStats.matchesPlayed / 38;
    const avgEloRating =
      teamStats.history.eloRating.reduce(
        (acc, eloRating) => (acc += eloRating),
        0
      ) / seasonsPlayed;
    const avgRank =
      teamStats.history.rank.reduce((acc, rank) => (acc += rank), 0) /
      seasonsPlayed;
    const avgPoints =
      teamStats.history.points.reduce((acc, points) => (acc += points), 0) /
      seasonsPlayed;

    analysis.analysisByTeam[teamName].avg.eloRating = avgEloRating;
    analysis.analysisByTeam[teamName].avg.points = avgPoints;
    analysis.analysisByTeam[teamName].avg.rank = avgRank;
  });

  let mostWinningTeam = Object.entries(analysis.analysisByTeam).sort(
    (team1, team2) => team2[1].winning - team1[1].winning
  )[0];
  analysis.mostWinningTeam = [mostWinningTeam[0], mostWinningTeam[1].winning];
  analysis.mostTop4 = Object.entries(analysis.analysisByTeam)
    .sort((team1, team2) => team2[1].top4 - team1[1].top4)
    .map((item) => item[0])
    .slice(0, 5);
  analysis.mostRelegated = Object.entries(analysis.analysisByTeam)
    .sort((team1, team2) => team2[1].relegation - team1[1].relegation)
    .map((item) => item[0])
    .slice(0, 5);
  analysis.finalTable = seasonResults[N - 1];

  return analysis;
}

simul(1000)
  .then((simulAnalysis) =>
    console.log(JSON.stringify(simulAnalysis.analysisByTeam.tottenham, null,2))
  )
  .catch((err) => console.error(err));
