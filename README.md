# 📸 Discord Image Tracker Bot

A simple Discord bot built using Node.js and `discord.js`.  
The current functionality focuses on analyzing uploaded images within a server.

---

## 📌 Features

- `!jumlah`:  
  Display the total number of photos and their combined size in a specific channel.

- `!rank`:  
  Show the ranking of all channels in the server based on:
  - Total number of uploaded images
  - Total size (MB) of uploaded images

- All data is temporarily stored in a local file called `data.txt`.

---

## 🚧 Current Limitations

- This bot **does not use a database yet**, all data is stored in `data.txt`.
- Only photo/image uploads are counted, not other file types.
- No persistent tracking — resets if the bot or server is restarted (unless `data.txt` is saved manually).
- Currently only accessible via two commands: `!jumlah` and `!rank`.

---

## 💡 Future Plans

- Migrate from `data.txt` to a proper database (e.g., SQLite, MongoDB)
- Add admin-only commands for reset or export
- Add image type filtering (JPG/PNG/etc)
- Create a web dashboard for real-time stats

---

## ⚙️ How to Run

1. Clone this repository:

2. Install dependencies:

3. Create a `config.json` or `.env` file and insert your Discord bot token (in this case, for the token is located in bot2.js).

4. Run the bot:
