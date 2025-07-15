export class League {
  /**
   * @param {Object} teams - key: teamName, value: class Team
   */
  constructor(teams) {
    this.teams = teams;
    this.table = teams;
  }

  #shuffleFixtures(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap
    }
    return arr;
  }

  #scoreProbability(eG, score) {
    const factorial = (x) => {
      if (x === 1 || x === 0) {
        return 1;
      }
      let result = 1;
      for (let i = x; i > 1; i--) {
        result *= i;
      }
      return result;
    };
    return (Math.pow(eG, score) * Math.exp(-eG)) / factorial(score);
  }

  #createFixtures() {
    let matchUps = [];
    let teamEntrie = this.teams;
    for (let i = 0; i < teamEntrie.length - 1; i++) {
      for (let j = i + 1; j < teamEntrie.length; j++) {
        let randomIndex = [0, 1][Math.floor(Math.random() * 2)];
        let matchUp = [teamEntrie[i].name, teamEntrie[j].name];
        let firstMatch = {
          home: matchUp[randomIndex],
          away: matchUp[1 - randomIndex],
        };
        let secondMatch = {
          home: matchUp[1 - randomIndex],
          away: matchUp[randomIndex],
        };
        matchUps.push(firstMatch);
        matchUps.push(secondMatch);
      }
    }
    let shuffledMatchUps = this.#shuffleFixtures(matchUps);
    return shuffledMatchUps;
  }

  #adjustXG(factors = {}) {
    let { baseHomeXG, baseAwayXG, homeElo, awayElo } = factors;
    let diff = homeElo - awayElo;
    let eloFactor = 1 + diff / 500;
    let adjustedHomeXG = baseHomeXG * eloFactor;
    let adjustedAwayXG = baseAwayXG * (2 - eloFactor);
    return [adjustedHomeXG, adjustedAwayXG];
  }

  /**
   *
   * @param {Array} scores - Give an array containing scores and their probabilities.
   */

  #weightedRandomScore(scores) {
    const sum = scores.reduce((acc, score) => acc + score.probability, 0);
    const rand = Math.random() * sum;
    let acc = 0;
    for (const score of scores) {
      acc += score.probability;
      if (rand < acc) return score;
    }

    return scores[scores.length - 1];
  }

  #startMatch(homeXG, awayXG, eloDiff) {
    let scores = [];
    for (let homeGoal = 0; homeGoal <= 5; homeGoal++) {
      for (let awayGoal = 0; awayGoal <= 5; awayGoal++) {
        let homeTeamProb = this.#scoreProbability(homeXG, homeGoal);
        let awayTeamProb = this.#scoreProbability(awayXG, awayGoal);
        let score = {
          homeGoal: homeGoal,
          awayGoal: awayGoal,
          probability: homeTeamProb * awayTeamProb,
        };
        scores.push(score);
      }
    }

    scores.sort((a, b) => b.probability - a.probability);

    if (eloDiff < 0 && Math.random() < 0.3) {
      const bottom7 = scores.slice(-7);
      return { score: this.#weightedRandomScore(bottom7), upset: true };
    }

    return { score: this.#weightedRandomScore(scores), upset: false };
  }

  start(options = {}) {
    const fixtures = this.#createFixtures();
    const TEAMS = Object.assign(
      {},
      ...this.teams.map((team) => ({ [team.name]: team }))
    );
    for (const match of fixtures) {
      const HOME_TEAM = match.home;
      const AWAY_TEAM = match.away;

      const HOME_TEAM_MODEL = TEAMS[HOME_TEAM];
      const AWAY_TEAM_MODEL = TEAMS[AWAY_TEAM];

      let homeResult;
      let awayResult;

      const [adjustedHomeXG, adjustedAwayXG] = this.#adjustXG({
        baseHomeXG: HOME_TEAM_MODEL.avgGoal,
        baseAwayXG: AWAY_TEAM_MODEL.avgGoal,
        homeElo: HOME_TEAM_MODEL.eloRating,
        awayElo: AWAY_TEAM_MODEL.eloRating,
      });

      const { score, upset } = this.#startMatch(
        adjustedHomeXG,
        adjustedAwayXG,
        HOME_TEAM_MODEL.eloRating - AWAY_TEAM_MODEL.eloRating
      );

      if (options.showMatchResult) {
        console.log({
          homeTeam: HOME_TEAM,
          awayTeam: AWAY_TEAM,
          homeElo: HOME_TEAM_MODEL.eloRating,
          awayElo: AWAY_TEAM_MODEL.eloRating,
          originalHomeXG: HOME_TEAM_MODEL.avgGoal,
          originalAwayXG: AWAY_TEAM_MODEL.avgGoal,
          adjustedHomeXG: adjustedHomeXG,
          adjustedAwayXG: adjustedAwayXG,
          score: score,
          upset: upset,
        });
      }

      const isHomeWin = score.homeGoal > score.awayGoal;
      const isDraw = score.homeGoal === score.awayGoal;

      HOME_TEAM_MODEL.updateScore(score.homeGoal);
      HOME_TEAM_MODEL.updateConcede(score.awayGoal);

      AWAY_TEAM_MODEL.updateScore(score.awayGoal);
      AWAY_TEAM_MODEL.updateConcede(score.homeGoal);

      if (isHomeWin) {
        homeResult = 1;
        awayResult = 0;
        HOME_TEAM_MODEL.updateWin();
        AWAY_TEAM_MODEL.updateLose();
      } else if (isDraw) {
        homeResult = 0.5;
        awayResult = 0.5;
        HOME_TEAM_MODEL.updateDraw();

        AWAY_TEAM_MODEL.updateDraw();
      } else {
        homeResult = 0;
        awayResult = 1;
        AWAY_TEAM_MODEL.updateWin();
        HOME_TEAM_MODEL.updateLose();
      }

      HOME_TEAM_MODEL.updateEloRating(
        HOME_TEAM_MODEL.eloRating,
        AWAY_TEAM_MODEL.eloRating,
        homeResult
      );
      AWAY_TEAM_MODEL.updateEloRating(
        AWAY_TEAM_MODEL.eloRating,
        HOME_TEAM_MODEL.eloRating,
        awayResult
      );
    }

    this.table.sort((a, b) => b.point - a.point);

    return this.table;
  }
}
