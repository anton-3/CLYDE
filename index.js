import { config } from 'dotenv'
import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js'
import { OpenAI } from 'openai'
import nodeCron from 'node-cron'

config()
if (!process.env.BOT_TOKEN || !process.env.OPENAI_API_KEY || !process.env.OPENAI_API_URL || !process.env.CHANNEL_ID_TO_PING || !process.env.ROLE_ID_TO_PING) {
  throw new Error('fix ur .env homie')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL,
})

const systemPrompt = `You are Clyde, a Vietnam war vet with a southern accent. Respond to the user's message appropriately and briefly.
- IMPORTANT: you ALWAYS begin EVERY message with the phrase "Back in 'nam", followed by some short story about your times in the war that relates to the user's message.
- Be a bit flirty and charming, but don't be too forward. You will NOT break character for any reason.
- For each message you receive, give EXACTLY ONE BRIEF 1-2 sentence response that is relevant to the user's message.
- DON'T FORGET the southern drawl, use it in EVERY SENTENCE!`

const trashPrompt = "Give us a BRIEF order to take out the trash bins NOW"

const cronString = "0 20 * * 0"

const LOGGING_ENABLED = process.env.LOGGING_ENABLED === "true"

const memoryLength = Math.max(0, parseInt(process.env.MEMORY_LENGTH, 10) || 10)
const channelHistory = new Map()

async function askClyde(prompt, history = []) {
  const recent = history.slice(-memoryLength * 2)
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recent,
    { role: 'user', content: prompt },
  ]
  const model = process.env.OPENAI_MODEL ?? "gpt-5.2"
  // const reasoning_effort = process.env.REASONING_EFFORT ?? "none"
  const start = LOGGING_ENABLED ? Date.now() : 0
  if (LOGGING_ENABLED) console.log(`[${new Date().toISOString()}] Prompt API call started`)
  const response = await openai.chat.completions.create({ model, messages })
  if (LOGGING_ENABLED) {
    const elapsed = Date.now() - start
    console.log(`[${new Date().toISOString()}] Prompt API call finished in ${elapsed}ms`)
    const usage = response.usage
    if (usage) {
      const details = usage.completion_tokens_details
      const reasoning = details?.reasoning_tokens ?? null
      const output = details?.output_tokens ?? (reasoning != null ? usage.completion_tokens - reasoning : usage.completion_tokens)
      console.log(`  Tokens: prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens}`)
      if (reasoning != null) {
        console.log(`  Breakdown: reasoning=${reasoning} response=${output}`)
      }
    }
  }
  return response.choices[0].message.content
}

const clydeCommand = {
  name: 'clyde',
  description: 'CLYDE!',
  options: [
    {
      type: 3,
      name: 'prompt',
      description: "if he says something weird, it's because he has dementia",
      required: true,
    },
  ],
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)
try {
  console.log('Started refreshing application (/) commands.')
  await rest.put(Routes.applicationCommands(process.env.BOT_ID), { body: [clydeCommand] })
  console.log('Successfully reloaded application (/) commands.')
} catch (error) {
  console.error(error)
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)

  nodeCron.schedule(cronString, async () => {
    try {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID_TO_PING)
      const response = await askClyde(trashPrompt)
      const message = `<@&${process.env.ROLE_ID_TO_PING}> ${response}`
      await channel.send({ content: message })
      console.log(`Clyde: ${message}`)
    } catch (e) {
      console.error(`Error sending scheduled message: ${e}`)
    }
  })
  console.log(`Scheduled to send messages on this cron schedule: "${cronString}"`)
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === 'clyde') {
    const prompt = interaction.options.getString('prompt')
    const user = interaction.user.username
    console.log(`${user}: ${prompt}`)
    let response = process.env.ERROR_MESSAGE
    await interaction.deferReply()
    const channelId = interaction.channelId
    const history = channelHistory.get(channelId) ?? []
    try {
      response = await askClyde(prompt, history)
    } catch (error) {
      console.error(error)
    }
    const newPair = [
      { role: 'user', content: prompt },
      { role: 'assistant', content: response },
    ]
    const nextHistory = [...history, ...newPair].slice(-memoryLength * 2)
    channelHistory.set(channelId, nextHistory)
    console.log(`Clyde: ${response}`)
    await interaction.editReply(response)
  }
})

client.login(process.env.BOT_TOKEN)
