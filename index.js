import { config } from 'dotenv'
import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js'

config()
if (!process.env.BOT_TOKEN || !process.env.OPENAI_KEY || !process.env.OPENAI_URL) {
  throw new Error('fix ur .env homie')
}

async function askClyde(question) {
  return "back in 'nam, I killed some kids idk"
}

// const clydeCommand = new SlashCommandBuilder()
//   .setName('clyde')
//   .setDescription('CLYDE')
//   .addStringOption((option) => option.setName('prompt'))

const clydeCommand = {
  name: 'clyde',
  description: 'CLYDE!',
  options: [
    {
      type: 3,
      name: 'prompt',
      description: 'CLYDE!',
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
    const prompt = console.log(interaction.options.getString('prompt'))
    let response = 'idk lol'
    try {
      response = await askClyde(prompt)
    } catch (error) {
      console.error(error)
    }
    await interaction.reply(response)
  }
})

client.login(process.env.BOT_TOKEN)
