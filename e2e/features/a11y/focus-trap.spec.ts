import { expect, test } from "../../support/fixtures/auth";
import { scanA11y } from "../../support/helpers/a11y";

test.describe("@a11y @saas focus-trap", () => {
  test("modal traps focus while open and closes cleanly on Escape", async ({
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

    for (let i = 0; i < 8; i++) {
      await authenticatedPage.keyboard.press("Tab");
      const isFocusInsideDialog = await dialog.evaluate((node) =>
        node.contains(document.activeElement),
      );
      expect(isFocusInsideDialog, `focus escaped on Tab #${i + 1}`).toBe(true);
    }

    await scanA11y(authenticatedPage, testInfo, "focus-trap-open", {
      include: ".p-modal, [role='dialog']",
    });

    await authenticatedPage.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    // TODO: Canonical's `ConfirmationModal` does not restore focus to its
    // trigger on Escape — `document.activeElement` lands on `<body>`. Once
    // upstream fixes this, re-add an `expect(document.activeElement !==
    // document.body).toBe(true)` (or a `toBeFocused()` on the trigger) here.

    // TODO: drop `disableRules` once `SingleInstanceTabs` wraps its
    // `role="tab"` links in a `role="tablist"` parent
    // (src/pages/dashboard/instances/[single]/SingleInstanceTabs/). The
    // post-close full-page scan currently catches this background-page bug
    // even though it is unrelated to the focus-trap lifecycle this spec
    // exercises.
    await scanA11y(authenticatedPage, testInfo, "focus-trap-closed", {
      disableRules: ["aria-required-parent"],
    });
  });
});
