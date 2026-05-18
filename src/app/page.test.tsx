import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    publicProfile: {
      findUnique: mocks.findUnique,
    },
  },
}));

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the public profile", async () => {
    mocks.findUnique.mockResolvedValue({
      displayName: "Enzo Chevalier",
      headline: "Étudiant M2 Cybersécurité",
      bio: "Portfolio orienté cybersécurité et développement fullstack.",
      contactEmail: "enzo@example.com",
      githubUrl: "https://github.com/SiBlue7",
      linkedinUrl: "https://www.linkedin.com/in/enzo-chevalier",
    });

    render(await Home());

    expect(
      screen.getByRole("heading", { name: "Enzo Chevalier" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Étudiant M2 Cybersécurité")).toHaveLength(2);
    expect(
      screen.getByText(
        "Portfolio orienté cybersécurité et développement fullstack.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "GitHub" })[0]).toHaveAttribute(
      "href",
      "https://github.com/SiBlue7",
    );
    expect(
      screen.getAllByRole("link", { name: "LinkedIn" })[0],
    ).toHaveAttribute("href", "https://www.linkedin.com/in/enzo-chevalier");
  });

  it("renders a polished fallback when no profile exists yet", async () => {
    mocks.findUnique.mockResolvedValue(null);

    render(await Home());

    expect(
      screen.getByRole("heading", { name: "Portfolio technique" }),
    ).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL + Prisma")).toBeInTheDocument();
  });
});
