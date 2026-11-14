export const ANNOUNCEMENT =
  "Assalamualaikum! Insya-Allah saya akan menunaikan umrah tidak lama lagi. Kalau ada yang nak tumpang doa, boleh tinggalkan di sini. Insya-Allah saya cuba bacakan satu persatu di Tanah Suci. 🤍";
export const CATEGORIES = [
  "Kesihatan",
  "Rezeki",
  "Keluarga",
  "Jodoh",
  "Zuriat",
  "Keampunan",
  "Lain-lain",
];
export const DEFAULT_PROFILE = {
  display_name: "",
  announcement: ANNOUNCEMENT,
  welcome_message: "Tinggalkan di sini, saya bacakan di Tanah Suci.",
  departure_date: "",
  return_date: "",
  accepting_submissions: true,
  sharing_text: ANNOUNCEMENT,
};
export function cleanProfile(value = {}) {
  const result = { ...DEFAULT_PROFILE };
  for (const key of Object.keys(result)) {
    if (key === "accepting_submissions") {
      if (typeof value[key] === "boolean") result[key] = value[key];
    } else if (typeof value[key] === "string")
      result[key] = value[key].slice(
        0,
        key.includes("date") ? 10 : key === "display_name" ? 200 : 2000,
      );
  }
  return result;
}
export function validatePrayer(name, message, category) {
  if (name.trim().length > 200)
    return "Nama terlalu panjang. Gunakan sehingga 200 aksara.";
  if (!message.trim()) return "Tuliskan doa atau hajat anda dahulu.";
  if (message.trim().length > 10000)
    return "Doa terlalu panjang. Gunakan sehingga 10,000 aksara.";
  if (category && !CATEGORIES.includes(category))
    return "Pilih kategori yang tersedia.";
  return "";
}
export function publicURL(location) {
  return location.origin + location.pathname;
}
export function filterPrayers(
  rows,
  query = "",
  category = "",
  status = "",
  ascending = false,
) {
  return rows
    .filter(
      (r) =>
        (!query ||
          [r.sender_name, r.message]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase())) &&
        (!category || r.category === category) &&
        (!status || Boolean(r.is_read) === (status === "read")),
    )
    .sort((a, b) =>
      ascending
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at),
    );
}
