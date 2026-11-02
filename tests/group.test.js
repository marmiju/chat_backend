import request from "supertest";
import {server} from "../server.js";

let token;
beforeAll(async () => {
  let res = await request(server)
    .post("/api/user/login")
    .send({
      email: "test@test.com",
      password: "123456",
    });

  if (res.statusCode !== 200) {
    await request(server)
      .post("/api/user/register")
      .send({
        username: "testuser",
        email: "test@test.com",
        password: "123456",
      });

    res = await request(server)
      .post("/api/user/login")
      .send({
        email: "test@test.com",
        password: "123456",
      });
  }

  token = res.body?.token || res._body?.token;
});



describe("Group and Chat API", () => {
  let createdGroupId;

  it("should create group", async () => {
    const res = await request(server)
      .post("/api/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "testGroup",
        description: "test with jest",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body._id).toBeDefined();
    createdGroupId = res.body._id;
  });

  it("should get group by ID", async () => {
    const res = await request(server)
      .get(`/api/groups/${createdGroupId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(createdGroupId);
    expect(res.body.name).toBe("testGroup");
  });

  it("should send a message to the group", async () => {
    const res = await request(server)
      .post("/api/chats")
      .set("Authorization", `Bearer ${token}`)
      .send({
        group_id: createdGroupId,
        content: "Hello from test suite!",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.content).toBe("Hello from test suite!");
    expect(res.body.deliveries).toBeDefined();
  });

  it("should fetch messages for the group", async () => {
    const res = await request(server)
      .get(`/api/chats/${createdGroupId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("should leave the group", async () => {
    const res = await request(server)
      .post(`/api/groups/${createdGroupId}/leave`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Left group successfully");
  });
});

