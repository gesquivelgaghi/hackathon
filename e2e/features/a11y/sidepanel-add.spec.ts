import { expect, test } from "../../support/fixtures/auth";
import { scanA11y } from "../../support/helpers/a11y";
import { navigateToSidebarLink } from "../../support/helpers/navigation";

test.describe("@a11y @self-hosted sidepanel-add", () => {
  test("add mirror side panel has no serious/critical a11y violations", async ({
    authenticatedPage,
  }, testInfo) => {
    await navigateToSidebarLink(authenticatedPage, "Repositories");
    await authenticatedPage
      .getByRole("button", { name: "Add mirror" })
      .click();
    await expect(
      authenticatedPage.getByRole("heading", { name: "Add mirror" }),
    ).toBeVisible();

    await scanA11y(authenticatedPage, testInfo, "sidepanel-add", {
      include: ".side-panel",
    });
  });
});
