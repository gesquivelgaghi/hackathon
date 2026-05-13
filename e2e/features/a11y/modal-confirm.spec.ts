import { expect, test } from "../../support/fixtures/auth";
import { scanA11y } from "../../support/helpers/a11y";

test.describe("@a11y @saas modal-confirm", () => {
  test("TextConfirmationModal (access group delete) has no serious/critical a11y violations", async ({
    authenticatedPage,
  }, testInfo) => {
    await authenticatedPage.goto("/settings/access-groups");

    await authenticatedPage
      .getByRole("button", { name: /access group actions$/i })
      .first()
      .click();
    await authenticatedPage
      .getByRole("menuitem", { name: /^delete .* access group$/i })
      .first()
      .click();

    const dialog = authenticatedPage.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await scanA11y(authenticatedPage, testInfo, "modal-confirm", {
      include: ".p-modal, [role='dialog']",
    });
  });
});
