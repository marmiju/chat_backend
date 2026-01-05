import request from "supertest";
import {server} from "../server.js";

let token;
beforeAll(async () => {
  // login
  const res = await request(server)
    .post("/api/user/login")
    .send({
      email: "test@test.com",
      password: "123456",
    });

  token = res._body.token; 
  
});


describe("Group API", () => {
  it("should create group", async () => {
    const res = await request(server)
      .post("/api/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "testGroup",
        description: "test with jest",
      });
    expect(res.statusCode).toBe(201);
  });
});
