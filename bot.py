from pyrogram import Client, filters
from pyrogram.types import Message
from config import Telegram, Server
import os

bot = Client(
    "FileToLinkBot",
    bot_token=Telegram.BOT_TOKEN,
    api_id=Telegram.API_ID,
    api_hash=Telegram.API_HASH
)

@bot.on_message(filters.command("start"))
async def start_handler(client, message: Message):
    await message.reply_text(
        "👋 Welcome to FileToLink Bot!\n\nJust send me a file and I will give you a streaming/download link."
    )

@bot.on_message(filters.document | filters.video | filters.audio)
async def handle_file(client, message: Message):
    sent_msg = await message.reply_text("📤 Uploading file...")

    file_path = await message.download()
    file_name = os.path.basename(file_path)

    stream_url = f"{Server.URL}file/{file_name}"

    await sent_msg.edit_text(
        f"✅ File Uploaded\n\n🔗 Stream Link: [Click Here]({stream_url})",
        disable_web_page_preview=True
    )

    # Optional: delete file to save storage
    os.remove(file_path)

if __name__ == "__main__":
    bot.run()
