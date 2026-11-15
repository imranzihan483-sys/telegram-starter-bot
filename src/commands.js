import { InlineKeyboard } from "grammy"

const sourceId = process.env.MAIN_CHANNEL_ID
const destinations = [
  process.env.DEST_CHANNEL_ID_1,
  process.env.DEST_CHANNEL_ID_2,
].filter(Boolean)

const copied = new Map()

export function registerCommands(bot) {
  bot.command("start", (ctx) =>
    ctx.reply("Auto Poster Bot is running!")
  )

  bot.command("help", (ctx) =>
    ctx.reply("Automatic channel posting is enabled.")
  )

  bot.on("channel_post", async (ctx) => {
    const msg = ctx.channelPost
    const chatId = String(ctx.chat.id)

    console.log(`[CHANNEL] ${ctx.chat.title}: ${chatId}`)

    if (!sourceId || chatId !== sourceId) return

    const ids = []

    for (const dest of destinations) {
      try {
        const result = await ctx.api.copyMessage(
          dest,
          ctx.chat.id,
          msg.message_id
        )
        ids.push({ chatId: dest, messageId: result.message_id })
      } catch (err) {
        console.error("Copy failed:", err.message)
      }
    }

    copied.set(msg.message_id, ids)
  })

  bot.on("edited_channel_post", async (ctx) => {
    const msg = ctx.editedChannelPost

    if (!sourceId || String(ctx.chat.id) !== sourceId) return

    const oldCopies = copied.get(msg.message_id) || []

    for (const item of oldCopies) {
      try {
        await ctx.api.deleteMessage(item.chatId, item.messageId)
      } catch (err) {
        console.error("Old copy delete failed:", err.message)
      }
    }

    const ids = []

    for (const dest of destinations) {
      try {
        const result = await ctx.api.copyMessage(
          dest,
          ctx.chat.id,
          msg.message_id
        )
        ids.push({ chatId: dest, messageId: result.message_id })
      } catch (err) {
        console.error("Edited copy failed:", err.message)
      }
    }

    copied.set(msg.message_id, ids)
  })

  bot.callbackQuery("ping", (ctx) =>
    ctx.answerCallbackQuery({ text: "pong" })
  )
}
