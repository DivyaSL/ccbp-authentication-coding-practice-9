const express = require("express");
const app = express();

const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

intializeDbAndServer();

//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `
    SELECT
        *
    FROM 
        user
    WHERE 
        username = '${username}'; 
    `;

  const userPresent = await db.get(selectUserQuery);

  if (userPresent !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO 
                user (username, name, password, gender, location)
            VALUES
                ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');
                `;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `
    SELECT
        *
    FROM 
        user
    WHERE 
        username = '${username}'; 
    `;

  const userPresent = await db.get(selectUserQuery);

  if (userPresent === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userPresent.password
    );
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.response("Login success!");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
    SELECT 
        *
    FROM 
        user 
    WHERE 
        username = '${username}';
    `;
  const userPresent = await db.get(selectUserQuery);
  const passwordMatched = await bcrypt.compare(
    oldPassword,
    userPresent.password
  );

  if (passwordMatched === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePassword = `
            UPDATE 
                user 
            SET 
                password = '${hashedPassword}'
            WHERE 
                username = '${username}';`;

      await db.run(updatePassword);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
