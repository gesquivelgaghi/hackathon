import { expect, test } from "../../support/fixtures/auth";
import { scanA11y } from "../../support/helpers/a11y";

test.describe("@a11y @saas modal-form", () => {
  test("recovery key modal has no serious/critical a11y violations", async ({
    authenticatedPage,
  }, testInfo) => {
    await authenticatedPage.goto("/instances");

    const firstInstanceLink = authenticatedPage
      .locator("table tbody a")
      .first();
    await firstInstanceLink.waitFor({ state: "visible", timeout: 60_000 });
    await firstInstanceLink.click();

    const menuToggle = authenticatedPage.getByRole("button", {
      name: /^(more )?actions$/i,
    });
    await menuToggle.waitFor({ state: "visible", timeout: 60_000 });
    await menuToggle.click();

    await authenticatedPage
      .getByRole("menuitem", { name: /^(re)?generate recovery key$/i })
      .first()
      .click();

    const dialog = authenticatedPage.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await scanA11y(authenticatedPage, testInfo, "modal-form", {
      include: ".p-modal, [role='dialog']",
    });
  });
});
