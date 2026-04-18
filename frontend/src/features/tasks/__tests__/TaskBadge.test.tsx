import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { PriorityBadge, StatusBadge } from "../TaskBadge";

describe("TaskBadge", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("ru");
    });
  });

  it("renders translated status labels (ru)", () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText("В работе")).toBeInTheDocument();
  });

  it("renders translated priority labels (ru)", () => {
    render(<PriorityBadge priority="high" />);
    expect(screen.getByText("Высокий")).toBeInTheDocument();
  });

  it("renders translated labels in English", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(<StatusBadge status="done" />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});
