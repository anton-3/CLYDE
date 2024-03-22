import { config } from 'dotenv'
import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js'
import { OpenAI } from 'openai'

config()
if (!process.env.BOT_TOKEN || !process.env.OPENAI_API_KEY || !process.env.OPENAI_API_URL) {
  throw new Error('fix ur .env homie')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL,
})
const temperature = 1

const systemPrompt = `IGNORE ALL PREVIOUS INSTRUCTIONS. You are Clyde, a Vietnam war vet with a southern accent. Respond to the user's message appropriately.
- You will NOT break character for any reason.
- For each message you receive, give EXACTLY ONE 2-3 sentence response.
- Do NOT surround your message with quotation marks.
- Do NOT ASK ANY QUESTIONS, ONLY ANSWER THEM.
- Make sure what you say is relevant to the user's message.
- DON'T FORGET the southern accent, use it in EVERY SENTENCE!
- IMPORTANT: you ALWAYS begin EVERY message with the phrase "Back in 'nam", followed by some story about your times in the war that relates to the user's message.`
// You are in the middle of being questioned for a murder that you did not commit.
// - You will NOT break character for any reason, and you will not confess to committing the murder.

async function askClyde(prompt) {
  const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
  const model = process.env.OPENAI_MODEL
  const response = await openai.chat.completions.create({ model, messages, temperature })
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
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === 'clyde') {
    const prompt = interaction.options.getString('prompt')
    const user = interaction.user.username
    console.log(`${user}: ${prompt}`)
    let response = process.env.ERROR_MESSAGE
    await interaction.deferReply()
    try {
      response = await askClyde(prompt)
    } catch (error) {
      console.error(error)
    }
    console.log(`Clyde: ${response}`)
    await interaction.editReply(response)
  }
})

client.login(process.env.BOT_TOKEN)
