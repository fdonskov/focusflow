import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { LanguageSwitcher } from "../LanguageSwitcher";

describe("LanguageSwitcher", () => {
  it("switches language between ru and en", async () => {
    await act(async () => {
      await i18n.changeLanguage("ru");
    });

    render(<LanguageSwitcher />);
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent(/ru/i);

    await userEvent.click(trigger);
    const englishItem = await screen.findByText("English");
    await userEvent.click(englishItem);

    expect(i18n.resolvedLanguage).toBe("en");
  });
});
