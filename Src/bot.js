import "dotenv/config";
import "./config/index.js";

import axios from "axios";
import cron from "node-cron";
import express from "express";

import { User } from "./model/user.model.js";
import { Order } from "./model/oder.model.js";
import TelegramBot from "node-telegram-bot-api";
import { authenticateGoogleSheets } from "./googleSheets.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const app = express();
const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
});

let userData = {};

const getToday = () => {
  const date = new Date();
  return date.toLocaleDateString("uz-UZ");
};

const generateMongoOrderNumber = async () => {
  const today = getToday();
  const count = await Order.countDocuments({ date: today });
  return `${count + 1}-${today}`;
};

bot.onText(/\/start/, async (msg) => {
  let user = await User.findOne({ chat_id: msg.chat.id });

  if (!user) {
    await User.create({
      chat_id: msg.chat.id,
      username: msg.chat.username,
      first_name: msg.chat.first_name,
    });
  }

  bot.sendMessage(msg.chat.id, "📸 Iltimos, mahsulot rasmini yuboring.");
});

cron.schedule("0 */2 * * *", async () => {
  try {
    const users = await User.find({ chat_id: { $exists: true } });
    const messageText = `😊 Salom. Buyrtmalar mavjudmi?`

    for (const user of users) {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: user.chat_id,
        text: messageText,
      });
    }

    console.log(`✅ ${users.length} ta foydalanuvchiga xabar yuborildi`);
  } catch (err) {
    console.error(
      "❌ Avtomatik yuborishda xatolik:",
      err?.response?.data || err.message
    );
  }
});

bot.on("photo", (msg) => {
  const chatId = msg.chat.id;

  if (!userData[chatId]) {
    userData[chatId] = { step: "photo1" };
  }

  const photoId = msg.photo[msg.photo.length - 1].file_id;

  if (userData[chatId].step === "photo1") {
    userData[chatId].photo1 = photoId;
    userData[chatId].step = "photo2";
    bot.sendMessage(chatId, "📸 Iltimos, mijoz bilan suhbat rasmini yuboring.");
  } else if (userData[chatId].step === "photo2") {
    userData[chatId].photo2 = photoId;
    userData[chatId].step = "name";
    bot.sendMessage(chatId, "Mijoz ismini yuboring:");
  }
});

bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  if (userData[chatId] && userData[chatId].step === "phone") {
    userData[chatId].phone = msg.contact.phone_number;
    userData[chatId].step = "address";
    bot.sendMessage(chatId, "Mijoz manzilini yuboring:");
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!userData[chatId]) return;

  const step = userData[chatId].step;

  if (step === "name" && msg.text) {
    userData[chatId].name = msg.text;
    userData[chatId].step = "phone";

    bot.sendMessage(chatId, "📞 Mijoz telefon raqamini yuboring:");
  } else if (step === "phone") {
    // Agar foydalanuvchi contact yuborsa
    if (msg.contact) {
      userData[chatId].phone = msg.contact.phone_number;
    }
    // Agar foydalanuvchi matn ko'rinishida raqam yozsa
    else if (msg.text) {
      userData[chatId].phone = msg.text;
    } else {
      return bot.sendMessage(chatId, "❗ Telefon raqam noto‘g‘ri formatda.");
    }

    userData[chatId].step = "address";
    bot.sendMessage(chatId, "📍 Mijoz manzilini yuboring:");
  } else if (step === "address" && msg.text) {
    userData[chatId].address = msg.text;
    userData[chatId].step = "productName";
    bot.sendMessage(chatId, "📦 Mahsulot nomini kiriting:");
  } else if (step === "productName" && msg.text) {
    userData[chatId].productName = msg.text;
    userData[chatId].step = "color";
    bot.sendMessage(chatId, "🎨 Mahsulot rangi:");
  } else if (step === "color" && msg.text) {
    userData[chatId].color = msg.text;
    userData[chatId].step = "size";
    bot.sendMessage(chatId, "📏 Mahsulot razmeri:");
  } else if (step === "size" && msg.text) {
    userData[chatId].size = msg.text;
    userData[chatId].step = "price";
    bot.sendMessage(chatId, "💰 Mahsulot narxini kiriting (masalan, 230000):");
  } else if (step === "price" && msg.text) {
    userData[chatId].price = msg.text;
    userData[chatId].step = "pricePaid";

    bot.sendMessage(chatId, "💰 Mahsulot to‘landi mi?", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ To‘landi", callback_data: "price_paid" },
            { text: "❌ To‘lanmadi", callback_data: "price_unpaid" },
          ],
        ],
      },
    });
  } else if (step === "delivery" && msg.text) {
    userData[chatId].delivery = msg.text;
    userData[chatId].step = "deliveryPaid";

    bot.sendMessage(chatId, "🚚 Dostavka to‘landi mi?", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ To‘landi", callback_data: "delivery_paid" },
            { text: "❌ To‘lanmadi", callback_data: "delivery_unpaid" },
          ],
        ],
      },
    });
  }
});

bot.on("callback_query", async (query) => {
  const userId = query.from.id;
  const data = query.data;
  const user = userData[userId];

  if (!user) {
    return bot.sendMessage(
      userId,
      "❗ Ma'lumotlar topilmadi. Qaytadan boshlang."
    );
  }

  if (data === "price_paid" || data === "price_unpaid") {
    user.priceStatus = data === "price_paid" ? "✅To‘landi" : "❌To‘lanmadi";
    user.step = "delivery";
    return bot.sendMessage(
      userId,
      "🚚 Dostavka narxini kiriting (masalan, 30000):"
    );
  }

  if (data === "delivery_paid" || data === "delivery_unpaid") {
    user.deliveryStatus =
      data === "delivery_paid" ? "✅To‘landi" : "❌To‘lanmadi";
    user.step = "confirm";

    const today = getToday();
    const orderNumber = await generateMongoOrderNumber();

    user.orderNumber = orderNumber;
    user.date = today;

    const confirmText = `
🆔 Buyurtma raqami: ${orderNumber}
👤 Mijozning ismi: ${user.name}
📞 Mijozning telefon raqami: ${user.phone}
📍  Mijoz manzili: ${user.address}
📦 Mahsulot: ${user.productName}
🎨 Rangi: ${user.color}
📏 Razmer: ${user.size}
💰 Summa: ${user.price} so'm ${user.priceStatus}
🚚 Dostavka: ${user.delivery} so'm ${user.deliveryStatus}

Tasdiqlaysizmi?`;

    await bot.sendMediaGroup(userId, [
      { type: "photo", media: user.photo1 },
      { type: "photo", media: user.photo2 },
    ]);

    bot.sendMessage(userId, confirmText, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Ha", callback_data: "confirm_yes" },
            { text: "❌ Yo'q", callback_data: "confirm_no" },
          ],
        ],
      },
    });

    return;
  }
  if (data === "confirm_yes") {
    const message = `
   ✅ Buyurtma yuborildi!
🆔 Buyurtma raqami: ${user.orderNumber}
👤 Mijozning ismi: ${user.name}
📞 Mijozning telefon raqami: ${user.phone}
📍 Mijoz manzili: ${user.address}
📦 Mahsulot: ${user.productName}
🎨 Rangi: ${user.color}
📏 Razmer: ${user.size}
💰 Summa: ${user.price} so'm ${user.priceStatus}
🚚 Dostavka: ${user.delivery} so'm ${user.deliveryStatus}`;

    const token = process.env.BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMediaGroup`;

    const chatId = -1002416597350; // Kanal ID
    const channelUsername = "umari_trade_control"; // Post link uchun kerak

    const media = [
      {
        type: "photo",
        media: user.photo1,
        caption: message,
        parse_mode: "HTML",
      },
      { type: "photo", media: user.photo2 },
    ];

    try {
      const response = await axios.post(url, {
        chat_id: chatId,
        media: media,
      });

      let GROUP_LINK_ID = process.env.GROUP_LINK_ID;

      // Guruh emas, kanal bo‘lsa link hosil qilish mumkin
      // if (chatId.toString().startsWith("-100") && channelUsername) {
      const message_id = response.data.result[0].message_id;
      let postLink = `https://t.me/c/${GROUP_LINK_ID}/1/${message_id}`;
      // }

      authenticateGoogleSheets(user, postLink);
    } catch (err) {
      console.error("Kanalga yuborishda xatolik:", err?.response?.data || err);
    }

    await saveToMongoDB(user);
    bot.sendMessage(userId, "✅ Buyurtma qabul qilindi!");
    delete userData[userId];
  } else if (data === "confirm_no") {
    bot.sendMessage(userId, "❌ Buyurtma bekor qilindi.");
    delete userData[userId];
  }
});

const saveToMongoDB = async (data) => {
  try {
    const newOrder = new Order(data);
    await newOrder.save();
    console.log("✅ MongoDBga saqlandi");
  } catch (err) {
    console.error("❌ MongoDBga yozishda xatolik:", err);
  }
};

app.listen(3000, () => console.log("🚀 Bot ishga tushdi port 3000 da"));
