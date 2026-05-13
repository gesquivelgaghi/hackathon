import { test } from "../../support/fixtures/auth";
import { scanA11y } from "../../support/helpers/a11y";

test.describe("@a11y @saas overview", () => {
  test("authenticated overview has no serious/critical a11y violations", async ({
    authenticatedPage,
  }, testInfo) => {
    await authenticatedPage.goto("/overview");
    await scanA11y(authenticatedPage, testInfo, "overview");
  });
});
