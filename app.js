const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.use(express.json());

//Path: /states/
//Method: GET
const convertDbObjectsToResponseObjects = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};

const convertDbDistrictObjectToResponseObject = (district) => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
    *
    FROM
    state
    `;
  const dbStates = await db.all(getStatesQuery);
  response.send(
    dbStates.map((eachState) => convertDbObjectsToResponseObjects(eachState))
  );
});

//Path: /states/:stateId/
//Method: GET

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIdQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id=${stateId};
    `;
  console.log(stateId);
  const dbState = await db.get(getStateByIdQuery);
  response.send(convertDbObjectsToResponseObjects(dbState));
});

//Path: /districts/
//Method: POST

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictsQuery = `
    INSERT INTO
    district(district_name,state_id,cases,cured,active,deaths)
    VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    `;
  await db.run(postDistrictsQuery);
  response.send("District Successfully Added");
});

//Path: /districts/:districtId/
//Method: GET

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `
    SELECT
    *
    FROM
    district
    WHERE
    district_id=${districtId};
    `;
  const dbDistrict = await db.get(getDistrictByIdQuery);
  response.send(convertDbDistrictObjectToResponseObject(dbDistrict));
});

//Path: `/districts/:districtId/`
//Method: `DELETE`

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictsQuery = `
    DELETE FROM
    district
    WHERE
    district_id=${districtId};
    `;
  await db.run(deleteDistrictsQuery);
  response.send("District Removed");
});

//Path: `/districts/:districtId/`
//Method: `PUT`

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictsQuery = `
    UPDATE district
    SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE
    district_id=${districtId};
    `;
  await db.run(updateDistrictsQuery);
  response.send("District Details Updated");
});

//Path: `/states/:stateId/stats/`
//Method: `GET`

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalCovidDetailsOfStateQuery = `
    SELECT
    sum(cases) AS totalCases,
    sum(cured) AS totalCured,
    sum(active) AS totalActive,
    sum(deaths) AS totalDeaths
    FROM
    district
    WHERE
    state_id=${stateId};
    `;
  const dbStateData = await db.get(getTotalCovidDetailsOfStateQuery);
  response.send(dbStateData);
});

//Path: `/districts/:districtId/details/`
//Method: `GET`

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
    SELECT
    state_name AS stateName
    FROM
    district LEFT JOIN state ON district.state_id = state.state_id
    WHERE
    district.district_id=${districtId};
    `;
  const dbDistrictDetails = await db.get(getDistrictDetailsQuery);
  response.send(dbDistrictDetails);
});

module.exports = app;
