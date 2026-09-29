import { prisma } from "../src/config";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
});

afterAll(async () => {
  await prisma.$disconnect();
});
