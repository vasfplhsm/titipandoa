async function clickDestination(page, name) {
  await page.locator(".site-brand").waitFor({ state: "visible" });
  if (name === "Utama") {
    await page.locator(".site-brand").click();
    return;
  }
  if (["Titip Doa", "Tumpang Doa"].includes(name)) {
    await page.locator(".site-brand").click();
    return;
  }
  let direct = page.getByRole("button", { name, exact: true });
  if (
    await direct
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await direct.first().click();
    return;
  }
  if (["Doa & Zikir", "Tasbih Digital"].includes(name)) {
    await page.getByRole("button", { name: "Tentang", exact: true }).click();
    await page.getByRole("button", { name, exact: true }).click();
    return;
  }
  await page
    .getByRole("button", { name: "Tab Lain-lain", exact: true })
    .click();
  await page.getByRole("button", { name, exact: true }).click();
}
module.exports = { clickDestination };
