import request from "supertest";
import { server } from "../server.js";
import { User } from "../model/user.model.js";

describe("Auth API", () => {
  beforeAll(async () => {
    await User.deleteMany({ email: "test@test.com" });
  });

  it("should register a user", async () => {
    const res = await request(server)
      .post("/api/user/register")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "123456",
      });

    expect(res.statusCode).toBe(201);
  });
});

