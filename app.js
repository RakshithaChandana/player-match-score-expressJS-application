const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
//Returns list of all players in the player table
const convertDBObjectAPI1 = (objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;`;
  const getPlayerQueryResponse = await db.all(getPlayersQuery);
  response.send(
    getPlayerQueryResponse.map((item) => convertDBObjectAPI1(item))
  );
});

//API 2
//Return a specific player based on the playerId
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details WHERE player_id="${playerId}";`;
  const getPlayerQueryResponse = await db.get(getPlayerQuery);
  response.send(convertDBObjectAPI1(getPlayerQueryResponse));
});

//API 3
//Updates the details of specific player based on playerId
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `
    UPDATE player_details 
    SET player_name="${playerName}"
    WHERE player_id="${playerId}";`;
  const updatePlayerDetailsQueryResponse = await db.run(
    updatePlayerDetailsQuery
  );
  response.send("Player Details Updated");
});

//API 4
//Returns match details of specific match
const convertDBObjectAPI2 = (objectItem) => {
  return {
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `
    SELECT * FROM match_details WHERE match_id="${matchId}";`;
  const getMatchesQueryResponse = await db.get(getMatchesQuery);
  response.send(convertDBObjectAPI2(getMatchesQueryResponse));
});

//API 5
//Returns list of matches of a player
const convertDBObjectAPI5 = (objectItem) => {
  return {
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
  };
};

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerQuery = `
    SELECT match_details.match_id,match_details.match,match_details.year
    FROM match_details JOIN player_match_score ON 
    match_details.match_id=player_match_score.match_id
    WHERE player_match_score.player_id="${playerId}";`;
  const getMatchesOfPlayerQueryResponse = await db.all(getMatchesOfPlayerQuery);
  response.send(
    getMatchesOfPlayerQueryResponse.map((eachItem) =>
      convertDBObjectAPI5(eachItem)
    )
  );
});

//API 6
//Returns list of players of a specific match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
    SELECT player_details.player_id,player_details.player_name
    FROM player_details JOIN player_match_score 
    ON player_details.player_id=player_match_score.player_id
    WHERE player_match_score.match_id="${matchId}";`;
  const getPlayersOfMatchQueryResponse = await db.all(getPlayersOfMatchQuery);
  response.send(
    getPlayersOfMatchQueryResponse.map((item) => convertDBObjectAPI1(item))
  );
});

//API 7
//Returns the statistics of total score,fours,sixes of a specific player based on playerId
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playerScoresQuery = `
    SELECT player_details.player_id AS playerId,player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM player_details JOIN player_match_score 
    ON player_details.player_id=player_match_score.player_id
    WHERE player_match_score.player_id=${playerId};`;
  const playerScoresQueryResponse = await db.get(playerScoresQuery);
  response.send(playerScoresQueryResponse);
});
module.exports = app;
