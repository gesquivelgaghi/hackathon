import { expect, test } from "../../support/fixtures/auth";
import { scanA11y } from "../../support/helpers/a11y";

test.describe("@a11y @saas toast-success", () => {
  test("success notification has no serious/critical a11y violations", async ({
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

    const confirmationInput = dialog.locator('input[type="text"]').first();
    if (await confirmationInput.isVisible()) {
      await confirmationInput.fill("regenerate recovery key");
    }
    await dialog
      .getByRole("button", { name: /^(re)?generate recovery key$/i })
      .click();

    // useNotificationHelper.ts auto-clears `notify.success` after 5s, and the
    // recovery-key API call can take a moment, so widen the visibility window.
    const toast = authenticatedPage.locator(".p-notification--positive");
    await expect(toast).toBeVisible({ timeout: 15_000 });

    await scanA11y(authenticatedPage, testInfo, "toast-success", {
      include: ".p-notification--positive",
    });
  });
});
