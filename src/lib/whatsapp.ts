// Klien WhatsApp — memanggil wa-server eksternal (porting app/utils/whatsapp.py).
// wa-server menangani format nomor; di sini cukup kirim apa adanya.

const BASE = process.env.WA_SERVER_URL || "http://localhost:5011";

export async function sendWhatsappMessage(to: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, text }),
    });
    return res.ok;
  } catch (e) {
    console.error("WA send-message gagal:", e);
    return false;
  }
}

export async function sendWhatsappDocument(
  to: string,
  file: Buffer,
  filename: string,
  caption = ""
): Promise<boolean> {
  try {
    const form = new FormData();
    form.append("to", to);
    form.append("caption", caption);
    form.append("filename", filename);
    form.append(
      "file",
      new Blob([new Uint8Array(file)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename
    );
    const res = await fetch(`${BASE}/send-document`, { method: "POST", body: form });
    return res.ok;
  } catch (e) {
    console.error("WA send-document gagal:", e);
    return false;
  }
}
