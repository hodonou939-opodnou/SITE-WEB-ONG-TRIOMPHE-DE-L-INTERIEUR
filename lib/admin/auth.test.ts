import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: mockGetClaims },
  }),
}));

const mockFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  db: { adminProfile: { findUnique: (...args: unknown[]) => mockFindUnique(...args) } },
}));

import { getAdminSession } from "./auth";

describe("getAdminSession", () => {
  beforeEach(() => {
    mockGetClaims.mockReset();
    mockFindUnique.mockReset();
  });

  it("returns null when there is no logged-in Supabase user", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: null }, error: null });

    const session = await getAdminSession();

    expect(session).toBeNull();
  });

  it("returns the matching AdminProfile fields when a session exists", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: "user-123" } }, error: null });
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      fullName: "Christelle",
      role: "admin",
      testBypass: true,
    });

    const session = await getAdminSession();

    expect(session).toEqual({ id: "user-123", fullName: "Christelle", role: "admin" });
    expect(session).not.toHaveProperty("testBypass");
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: "user-123" } });
  });
});
