import { pool } from "../pool.js";
import { getTeamStats } from "./getTeamStats.js";

async function saveTeamStats() {
  const teamStats = await getTeamStats();
  const teamSummary = Object.entries(teamStats).map((stat) => ({
    name: stat[1].name,
    avgGoal: stat[1].avgGoal,
    eloRating: stat[1].eloRating,
  }));
  const query =
    "INSERT INTO team_summary(name,avg_goal,elo_rating) VALUES(?,?,?)";
  for (const summary of teamSummary) {
    console.log(summary);
    await pool.execute(query, [
      summary.name,
      summary.avgGoal,
      summary.eloRating,
    ]);
  }

  console.log("Finished.");
  await pool.end();
}

saveTeamStats();
