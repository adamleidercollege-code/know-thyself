import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { MetricCard } from "../MetricCard";
import type { Metric } from "@/lib/schema";

const m: Metric = {
  name: "Self-Efficacy", score: 3, summary: "summary text",
  detail: "detail text", interactions: ["Anxiety"],
};

describe("MetricCard", () => {
  it("renders score and exactly one filled dot at the score position", () => {
    const { container } = render(<MetricCard metric={{ ...m, score: 4 }} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    const dots = container.querySelectorAll("[data-dot]");
    expect(dots).toHaveLength(5);
    const filled = container.querySelectorAll("[data-dot-on]");
    expect(filled).toHaveLength(1);
    expect(dots[3]).toHaveAttribute("data-dot-on");
  });

  it("score 1 fills only the first dot", () => {
    const { container } = render(<MetricCard metric={{ ...m, score: 1 }} />);
    const dots = container.querySelectorAll("[data-dot]");
    expect(dots[0]).toHaveAttribute("data-dot-on");
    expect(dots[4]).not.toHaveAttribute("data-dot-on");
  });

  it("score 5 fills only the last dot", () => {
    const { container } = render(<MetricCard metric={{ ...m, score: 5 }} />);
    const dots = container.querySelectorAll("[data-dot]");
    expect(dots[4]).toHaveAttribute("data-dot-on");
    expect(dots[0]).not.toHaveAttribute("data-dot-on");
  });

  it("toggles detail on Read more", async () => {
    render(<MetricCard metric={m} />);
    expect(screen.queryByText("detail text")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /read more/i }));
    expect(screen.getByText("detail text")).toBeInTheDocument();
  });
});
