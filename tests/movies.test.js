const request = require("supertest");

const app = require("../src/app");

const database = require("../database");

const useUuid = require("../uuid.js");

const randomNumber = require("../randomNumber.js");

afterAll(() => database.end());

describe("GET /api/movies", () => {
  it("should return all movies", async () => {
    const response = await request(app).get("/api/movies");

    expect(response.headers["content-type"]).toMatch(/json/);

    expect(response.status).toEqual(200);
  });
});

describe("GET /api/movies/:id", () => {
  it("should return one movie", async () => {
    const response = await request(app).get("/api/movies");

    expect(response.headers["content-type"]).toMatch(/json/);

    expect(response.status).toEqual(200);
  });

  it("should return no movie", async () => {
    const response = await request(app).get("/api/movies/0");

    expect(response.status).toEqual(404);
  });
});

// suite

describe("POST /api/movies", () => {
  it("should return created movie", async () => {
    const newMovie = {
      title: "Star Wars",
      director: "George Lucas",
      year: "1977",
      color: "1",
      duration: 120,
    };

    const response = await request(app).post("/api/movies").send(newMovie);

    expect(response.status).toEqual(201);
    expect(response.body).toHaveProperty("id");
    expect(typeof response.body.id).toBe("number");

    const [result] = await database.query(
      "SELECT * FROM movies WHERE id=?",
      response.body.id
    );

    const [movieInDatabase] = result;

    expect(movieInDatabase).toHaveProperty("id");

    expect(movieInDatabase).toHaveProperty("title");
    expect(movieInDatabase.title).toStrictEqual(newMovie.title);
    expect(movieInDatabase).toHaveProperty("director");
    expect(movieInDatabase.director).toStrictEqual(newMovie.director);
    expect(movieInDatabase).toHaveProperty("year");
    expect(movieInDatabase.year).toStrictEqual(newMovie.year);
    expect(movieInDatabase).toHaveProperty("color");
    expect(movieInDatabase.color).toStrictEqual(newMovie.color);
    expect(movieInDatabase).toHaveProperty("duration");
    expect(movieInDatabase.duration).toStrictEqual(newMovie.duration);
  });

  it("should return an error", async () => {
    const movieWithMissingProps = {
      title: `${useUuid()}`,
      director: `${useUuid()}`,
      year: `${useUuid()}`,
      color: `${useUuid()}`,
      duration: `${useUuid()}`,
    };

    const response = await request(app)
      .post("/api/movies")
      .send(movieWithMissingProps);

    expect(response.status).toEqual(400);
  });
});

describe("PUT /api/movies/:id", () => {
  it("should edit movie", async () => {
    const newMovie = {
      title: "Avatar",
      director: "James Cameron",
      year: "2010",
      color: "1",
      duration: 162,
    };

    const [result] = await database.query(
      "INSERT INTO movies(title, director, year, color, duration) VALUES (?, ?, ?, ?, ?)",
      [
        newMovie.title,
        newMovie.director,
        newMovie.year,
        newMovie.color,
        newMovie.duration,
      ]
    );

    const id = result.insertId;

    const updatedMovie = {
      title: "Wild is life",
      director: "Alan Smithee",
      year: "2023",
      color: "0",
      duration: 120,
    };

    const response = await request(app)
      .put(`/api/movies/${id}`)
      .send(updatedMovie);

    expect(response.status).toEqual(204);

    const [anotherResult] = await database.query(
      "SELECT * FROM movies WHERE id=?",
      id
    );

    const [movieInDatabase] = anotherResult;

    expect(movieInDatabase).toHaveProperty("id");

    expect(movieInDatabase).toHaveProperty("title");
    expect(movieInDatabase.title).toStrictEqual(updatedMovie.title);

    expect(movieInDatabase).toHaveProperty("director");
    expect(movieInDatabase.director).toStrictEqual(updatedMovie.director);

    expect(movieInDatabase).toHaveProperty("year");
    expect(movieInDatabase.year).toStrictEqual(updatedMovie.year);

    expect(movieInDatabase).toHaveProperty("color");
    expect(movieInDatabase.color).toStrictEqual(updatedMovie.color);

    expect(movieInDatabase).toHaveProperty("duration");
    expect(movieInDatabase.duration).toStrictEqual(updatedMovie.duration);
  });

  it("should return an error", async () => {
    const movieWithMissingProps = { title: "Harry Potter" };

    const response = await request(app)
      .put(`/api/movies/1`)
      .send(movieWithMissingProps);

    expect(response.status).toEqual(422);
  });

  it("should return no movie", async () => {
    const newMovie = {
      title: "Avatar",
      director: "James Cameron",
      year: "2009",
      color: "1",
      duration: 162,
    };

    const response = await request(app).put("/api/movies/0").send(newMovie);

    expect(response.status).toEqual(404 || 422);
  });
});

describe("DELETE /api/movies/:id", () => {
  it("should delete movie", async () => {
    const id = randomNumber();

    const [movieBeforeDeletion] = await database.query(
      "SELECT * FROM movies WHERE id = ?",
      [id]
    );

    const response = await request(app).delete(`/api/movies/${id}`);
    expect(response.status).toEqual(204);
    const [result] = await database.query("SELECT * FROM movies WHERE id = ?", [
      id,
    ]);
    expect(result.length).toEqual(0);

    const movieData = { id, ...movieBeforeDeletion[0] };

    await database.query(
      "INSERT INTO movies (id, title, director, year, color, duration) VALUES (?, ?, ?, ?, ?, ?)",
      [
        id,
        movieData.title,
        movieData.director,
        movieData.year,
        movieData.color,
        movieData.duration,
      ]
    );
  });
  it("sould not delete movie", async () => {
    const id = -1;
    const response = await request(app).delete(`/api/movies/${id}`);
    expect(response.status).toEqual(404 || 422);
  });
});
