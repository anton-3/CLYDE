import { config } from 'dotenv'
import { Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js'

config()
if (!process.env.BOT_TOKEN || !process.env.OPENAI_KEY || !process.env.OPENAI_URL) {
  throw new Error('fix ur .env homie')
}

const commands = [
  {
    name: 'clyde',
    description: 'clyde',
  },
]

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)
try {
  console.log('Started refreshing application (/) commands.')

  await rest.put(Routes.applicationCommands(process.env.BOT_ID), { body: commands })

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
    await interaction.reply('CLYDE!')
  }
})

client.login(process.env.BOT_TOKEN)
