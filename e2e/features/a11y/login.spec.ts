import { test } from "../../support/fixtures/auth";
import { LoginPage } from "../auth/login.page";
import { scanA11y } from "../../support/helpers/a11y";
import { navigateTo } from "../../support/helpers/navigation";

test.describe("@a11y @saas login", () => {
  test("unauthenticated login page has no serious/critical a11y violations", async ({
    page,
  }, testInfo) => {
    await navigateTo(page, "/login");
    const loginPage = new LoginPage(page);
    await loginPage.checkPageHeading("Sign in to Landscape");

    await scanA11y(page, testInfo, "login-initial");
  });

  test("login validation error state has no serious/critical a11y violations", async ({
    page,
  }, testInfo) => {
    await navigateTo(page, "/login");
    const loginPage = new LoginPage(page);
    await loginPage.checkPageHeading("Sign in to Landscape");

    await loginPage.identifierInput.fill("not-an-email");
    await loginPage.identifierInput.press("Tab");

    // TODO: drop `disableRules` once Canonical's `Input` component announces
    // its `aria-errormessage` target (currently the referenced element has
    // neither `role="alert"`/`role="status"` nor `aria-live`, which makes
    // `aria-valid-attr-value` fire). Track the fix upstream and remove this.
    await scanA11y(page, testInfo, "login-validation-error", {
      disableRules: ["aria-valid-attr-value"],
    });
  });
});
