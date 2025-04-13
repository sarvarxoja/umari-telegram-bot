import path from "path";
import { dirname } from "path";
import { google } from "googleapis";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Google Sheets API autentifikatsiya qilish
const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(__dirname, "credentials.json"), // Siz yuborgan json shu nomda saqlansin
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const authenticateGoogleSheets = async (data, postLink) => {
  try {
    // Auth klientini olish
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Sheet ID va qaysi diapazonda yozish
    const spreadsheetId = process.env.SPREADSHEET_ID; // .env faylidan oladi
    const range = "Sheet1!A:K"; // Sheet nomingiz va qatorlar

    // Yoziladigan ma'lumotlar
    const values = [
      [
        data.orderNumber, // Order number
        data.name, // Ism
        data.phone, // Telefon
        data.address, // Manzil
        data.productName, // Mahsulot nomi
        data.color, // Rangi
        data.size, // O'lchami
        data.price, // Narxi
        data.delivery, // Yetkazib berish
        data.date, // Sana
        postLink, // Foto
      ],
    ];

    const resource = { values };

    // Ma'lumotni Sheet'ga qo'shish
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW", // Ma'lumotni xom holda qo'shish
      resource,
    });

    console.log("✅ Muvaffaqiyatli Google Sheets’ga yozildi.");
  } catch (err) {
    console.error("❌ Xatolik:", err.message);
  }
};
