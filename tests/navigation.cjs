async function clickDestination(page, name) {
  await page.locator(".site-brand").waitFor({ state: "visible" });
  const direct = page.getByRole("button", { name, exact: true });
  if (
    await direct
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await direct.first().click();
    return;
  }
  const tab = ["Doa & Zikir", "Titip Doa"].includes(name)
    ? "Doa"
    : name === "Tasbih Digital"
      ? "Zikir"
      : name === "Utama"
        ? "Utama"
        : "Lain-lain";
  await page.getByRole("button", { name: "Tab " + tab, exact: true }).click();
  if (name === "Utama") return;
  const target = name === "Doa & Zikir" ? "Koleksi Doa & Zikrullah" : name;
  await page.getByRole("button", { name: target, exact: true }).click();
}
module.exports = { clickDestination };
