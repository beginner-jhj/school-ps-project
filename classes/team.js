export class Team {
  constructor(name) {
    this.name = name;
    this.eloRating = 1300;
    this.avgGoal = 0;
    this.point = 0;
    this.score = 0;
    this.concede = 0;
    this.goalDiffrence = 0;
    this.win = 0;
    this.draw = 0;
    this.lose = 0;
    this.totalMatches = 0;
  }

  updateEloRating(playerRating, opponentRating, result, kFactor = 30) {
    const expectedScore =
      1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

    // Calculate new Elo rating
    const newRating = playerRating + kFactor * (result - expectedScore);

    this.eloRating = Math.round(newRating);
  }

  updateAvgGoal(value) {
    this.avgGoal += Number(value.toFixed(2));
  }

  updateScore(score) {
    this.score += score;
    this.#updateGoalDiffrence();
  }

  updateConcede(concede) {
    this.concede += concede;
    this.#updateGoalDiffrence();
  }

  #updateGoalDiffrence() {
    this.goalDiffrence = this.score - this.concede;
  }

  updateWin() {
    this.win += 1;
    this.point += 3;
  }

  updateDraw() {
    this.draw += 1;
    this.point += 1;
  }

  updateLose() {
    this.lose += 1;
  }

  updateTotalMatches() {
    this.totalMatches += 1;
  }
}
