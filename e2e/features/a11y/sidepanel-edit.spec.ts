import { expect, test } from "../../support/fixtures/auth";
import { scanA11y } from "../../support/helpers/a11y";
import { navigateToSidebarLink } from "../../support/helpers/navigation";

test.describe("@a11y @self-hosted sidepanel-edit", () => {
  test("edit mirror side panel has no serious/critical a11y violations", async ({
    authenticatedPage,
  }, testInfo) => {
    await navigateToSidebarLink(authenticatedPage, "Repositories");
    await authenticatedPage
      .locator(".p-contextual-menu__toggle")
      .first()
      .click();
    await authenticatedPage.getByRole("button", { name: "Edit" }).click();

    const sidePanel = authenticatedPage.locator(".side-panel");
    await expect(sidePanel).toBeVisible();

    await scanA11y(authenticatedPage, testInfo, "sidepanel-edit", {
      include: ".side-panel",
    });
  });
});
