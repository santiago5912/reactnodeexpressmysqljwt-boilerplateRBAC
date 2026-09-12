import app from "../../app.js";
import request from "supertest";

describe("GET /api/dummydata", () => {
  it("should return dummy data as JSON", async () => {
    return request(app)
      .get("/api/dummydata")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        expect(res.statusCode).toBe(200);
      });
  });
});
