import request from "supertest";
import { jest } from "@jest/globals";
import prisma from "../lib/prismaClient.js";

// Mock the Google GenAI SDK so we don't consume real quota during testing
jest.unstable_mockModule("@google/genai", () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      constructor() {
        this.models = {
          generateContent: jest.fn().mockResolvedValue({
            text: "This is a mock AI response for testing purposes.",
          }),
        };
      }
    },
  };
});

// Dynamically import app so the mock takes effect before the routes are loaded
const { default: app } = await import("../index.js");

const testUser = {
  name: "Test User",
  email: `test-${Date.now()}@example.com`,
  password: "password123",
};

let userToken = "";
let createdNoteId = "";
let createdUserId = "";

describe("AI Notes API Integration Tests", () => {
  // Teardown: Clean up the database and disconnect Prisma
  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  // 1. Register a user
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe(testUser.email);
    
    createdUserId = res.body.user.id;
  });

  // 2. Login a user
  it("should login the user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    
    // Save token for subsequent requests
    userToken = res.body.token;
  });

  // 3. Create a note
  it("should create a new note", async () => {
    const noteData = {
      title: "My Integration Test Note",
      content: "This note was created during an automated test.",
    };

    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${userToken}`)
      .send(noteData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("note");
    expect(res.body.note).toHaveProperty("id");
    expect(res.body.note.title).toBe(noteData.title);
    
    createdNoteId = res.body.note.id;
  });

  // 4. Get all notes
  it("should get all notes for the logged-in user", async () => {
    const res = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("notes");
    expect(Array.isArray(res.body.notes)).toBe(true);
    
    const noteIds = res.body.notes.map((n) => n.id);
    expect(noteIds).toContain(createdNoteId);
  });

  // 5. Ask AI on a note
  it("should ask the AI a question about the note", async () => {
    const res = await request(app)
      .post(`/api/notes/${createdNoteId}/ask`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        question: "What is this note about?",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("answer");
    expect(res.body.answer).toBe("This is a mock AI response for testing purposes.");
  });
});
