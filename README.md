# Discord Bot Ticket Command

This repository contains the source code for a "ticket" command that can be added to your Discord bot. The command allows users to open support tickets and communicate with support staff in a dedicated channel.

## Prerequisites

- Node.js (version 14 or higher)
- Discord.js library (version 13 or higher)
- Basic knowledge of JavaScript and Discord bot development

## Installation

1. Clone the repository to your local machine or download the code as a ZIP file.

2. Install the required dependencies by running the following command in the project directory:

3. Configure the command:

- Open the `tickets.js` file located in the `commands` directory.
- Adjust the `config.transcriptChannelId` value to the ID of the channel where you want the ticket transcripts to be uploaded.
- Customize other parts of the command, such as role names or category names, to match your server setup if needed.

4. Integrate the command into your bot:

- Copy the `tickets.js` file to the appropriate directory in your Discord bot project structure.
- Make sure the Discord.js library is correctly imported and set up in your bot's main file.
- Register the command with your bot's command handler.

5. Deploy and run your bot:

- Follow the instructions for deploying and running your Discord bot in your preferred hosting environment.
- Make sure to set up the necessary environment variables and bot token as required.

6. Invite your bot to your server:

- Generate an invite link for your bot with the necessary permissions. You can create an invite link by generating an OAuth2 URL with the `bot` scope and selecting the required permissions for your bot (e.g., read and send messages, manage channels, etc.).
- Paste the invite link in a web browser and select the server where you want to add the bot.

7. Test the "ticket" command:

- In your Discord server, use the configured command prefix followed by the command name (e.g., `!ticket`, `!open-ticket`, `!create-ticket`) to open a support ticket.
- Follow the prompts and interact with the bot to create and manage tickets.

## Screenshots

1. ![Screenshot 1](https://who.likes-throwing.rocks/64EiPhiCq.png)
2. ![Screenshot 2](https://who.likes-throwing.rocks/64EiScP2d.png)
3. ![Screenshot 3](https://who.likes-throwing.rocks/64EiZWgfA.png)
4. ![Screenshot 4](https://who.likes-throwing.rocks/64Ej5Roab.png)
5. ![Screenshot 5](https://who.likes-throwing.rocks/64Ej9js7u.png) 

## Contributing

Contributions are welcome! If you find any issues or want to enhance the command, feel free to submit a pull request.

## License

This project is licensed under the MIT License.
