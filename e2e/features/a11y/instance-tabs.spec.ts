import { expect, test } from "../../support/fixtures/auth";
import { scanA11y } from "../../support/helpers/a11y";

test.describe("@a11y @saas instance-tabs", () => {
  test("SingleInstanceTabs has no serious/critical a11y violations", async ({
    authenticatedPage,
  }, testInfo) => {
    await authenticatedPage.goto("/instances");

    const firstInstanceLink = authenticatedPage
      .locator("table tbody a")
      .first();
    await firstInstanceLink.waitFor({ state: "visible", timeout: 60_000 });
    await firstInstanceLink.click();

    const tabList = authenticatedPage.locator('[role="tab"]');
    await expect(tabList.first()).toBeVisible({ timeout: 60_000 });

    await scanA11y(authenticatedPage, testInfo, "instance-tabs");
  });
});
