const request = require("supertest");

const app = require("../src/app");

const useUuid = require("../uuid.js");

const database = require("../database");

const randomNumber = require("../randomNumber.js");

afterAll(() => database.end());

describe("GET /api/users", () => {
  it("should return all users", async () => {
    const response = await request(app).get("/api/users");

    expect(response.headers["content-type"]).toMatch(/json/);

    expect(response.status).toEqual(200);
  });
});

describe("GET /api/users/:id", () => {
  it("should return one user", async () => {
    const response = await request(app).get("/api/users/1");

    expect(response.headers["content-type"]).toMatch(/json/);

    expect(response.status).toEqual(200);
  });

  it("should return no user", async () => {
    const response = await request(app).get("/api/users/0");

    expect(response.status).toEqual(404);
  });
});

// suite

describe("POST /api/users", () => {
  it("should return created user", async () => {
    const newUser = {
      firstname: "lucas",
      lastname: "aa",
      email: `${useUuid()}@example.com`,
      city: "0aaa",
      language: "aaa",
    };

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.status).toEqual(201);
    expect(response.body).toHaveProperty("id");
    expect(typeof response.body.id).toBe("number");

    const [result] = await database.query(
      "SELECT * FROM users WHERE id=?",
      response.body.id
    );

    const [userInDatabase] = result;

    expect(userInDatabase).toHaveProperty("id");

    expect(userInDatabase.firstname).toStrictEqual(newUser.firstname);

    expect(userInDatabase.lastname).toStrictEqual(newUser.lastname);

    expect(userInDatabase.email).toStrictEqual(newUser.email);

    expect(userInDatabase.city).toStrictEqual(newUser.city);

    expect(userInDatabase.language).toStrictEqual(newUser.language);
  });

  it("should return an error", async () => {
    const userWithMissingProps = {
      firstname: `${useUuid()}`,
      lastname: `${useUuid()}`,
      // email: `${useUuid()}`,
      city: `${useUuid()}`,
      language: `${useUuid()}`,
    };

    const response = await request(app)
      .post("/api/users")
      .send(userWithMissingProps);

    expect(response.status).toEqual(422);
  });
});

// suite test put

describe("PUT /api/users/:id", () => {
  it("should edit users", async () => {
    const newUser = {
      firstname: "Avatar",
      lastname: "James Cameron",
      email: `${useUuid()}`,
      city: "1",
      language: "162",
    };

    const [result] = await database.query(
      "INSERT INTO users(firstname, lastname, email, city, language) VALUES (?, ?, ?, ?, ?)",
      [
        newUser.firstname,
        newUser.lastname,
        newUser.email,
        newUser.city,
        newUser.language,
      ]
    );

    const id = result.insertId;

    const updatedUser = {
      firstname: "Wild is life",
      lastname: "Alan Smithee",
      email: `${useUuid()}`,
      city: "0",
      language: "120",
    };

    const response = await request(app)
      .put(`/api/users/${id}`)
      .send(updatedUser);

    expect(response.status).toEqual(204);

    const [anotherResult] = await database.query(
      "SELECT * FROM users WHERE id=?",
      id
    );

    const [userInDatabase] = anotherResult;

    expect(userInDatabase).toHaveProperty("id");

    expect(userInDatabase).toHaveProperty("firstname");
    expect(userInDatabase.firstname).toStrictEqual(updatedUser.firstname);

    expect(userInDatabase).toHaveProperty("lastname");
    expect(userInDatabase.lastname).toStrictEqual(updatedUser.lastname);

    expect(userInDatabase).toHaveProperty("email");
    expect(userInDatabase.email).toStrictEqual(updatedUser.email);

    expect(userInDatabase).toHaveProperty("city");
    expect(userInDatabase.city).toStrictEqual(updatedUser.city);

    expect(userInDatabase).toHaveProperty("language");
    expect(userInDatabase.language).toStrictEqual(updatedUser.language);
  });

  it("should return an error", async () => {
    const userWithMissingProps = { firstname: "Harry Potter" };

    const response = await request(app)
      .put(`/api/users/1`)
      .send(userWithMissingProps);

    expect(response.status).toEqual(422);
  });

  it("should return no user", async () => {
    const newUser = {
      firstname: "Avatar",
      lastname: "James Cameron",
      email: "2009",
      city: "1",
      language: 162,
    };

    const response = await request(app).put("/api/users/0").send(newUser);

    expect(response.status).toEqual(422);
  });
});
describe("DELETE /api/users/:id", () => {
  it("should delete user", async () => {
    const id = randomNumber();

    const [userBeforeDeletion] = await database.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );

    const response = await request(app).delete(`/api/users/${id}`);
    expect(response.status).toEqual(204);
    const [result] = await database.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);

    expect(result.length).toEqual(0);

    const userData = { id, ...userBeforeDeletion[0] };

    await database.query(
      "INSERT INTO users (id, firstname, lastname, email, city, language) VALUES (?, ?, ?, ?, ?, ?)",
      [
        id,
        userData.firstname,
        userData.lastname,
        userData.email,
        userData.city,
        userData.language,
      ]
    );
    const [lastResult] = await database.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );

    expect(lastResult.length).toEqual(1);
  });
  it("sould not delete user", async () => {
    const id = -1;
    const response = await request(app).delete(`/api/users/${id}`);
    expect(response.status).toEqual(404 || 422);
  });
});
