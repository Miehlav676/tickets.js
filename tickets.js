const { MessageEmbed, MessageButton, MessageActionRow, Permissions, MessageAttachment } = require('discord.js');
const fs = require('fs');

const config = {
  transcriptChannelId: '1114585233623351317', // Set the transcript channel ID here
};

function saveTranscript(channel, user, reason) {
  const messages = [];

  // Fetch all messages in the channel
  channel.messages
    .fetch({ limit: 100 })
    .then((fetchedMessages) => {
      fetchedMessages.forEach((msg) => {
        const message = `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}`;
        messages.push(message);
      });

      // Create the transcript file
      const transcript = messages.join('\n');
      fs.writeFileSync(`${channel.name}-transcript.txt`, transcript);

      // Upload the transcript file to the transcript channel
      const transcriptChannel = channel.guild.channels.cache.get(config.transcriptChannelId);
      if (transcriptChannel && transcriptChannel.isText()) {
        const transcriptAttachment = new MessageAttachment(`${channel.name}-transcript.txt`);
        transcriptChannel
          .send({ files: [transcriptAttachment] })
          .then((message) => {
            const transcriptLinkEmbed = new MessageEmbed()
              .setColor('#0099ff')
              .setTitle('Ticket Transcript')
              .setDescription(`Ticket: ${channel.name}\nReason: ${reason}\nClosure Timestamp: ${new Date().toISOString()}`)
              .addField(
                'Download Transcript',
                `[Click here to download transcript](${message.attachments.first().url})`
              );

            // Send the transcript embed to the user's DM
            user.send({ embeds: [transcriptLinkEmbed] });
          })
          .catch((error) => {
            console.error(`Failed to send transcript to transcript channel: ${error}`);
          })
          .finally(() => {
            // Delete the transcript file after uploading to the transcript channel
            fs.unlinkSync(`${channel.name}-transcript.txt`);
          });
      } else {
        console.error('Transcript channel not found or is not a text channel.');
      }
    })
    .catch((error) => {
      console.error(`Failed to fetch messages: ${error}`);
    });
}

module.exports = {
  name: 'ticket',
  description: 'Open a support ticket',
  aliases: ['open-ticket', 'create-ticket'],
  async execute(message) {
    if (!message.guild) {
      return message.reply('This command can only be used in a server!');
    }

    const { guild, author, channel } = message;

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Support Ticket')
      .setDescription('Click the button below to open a support ticket.');

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('open_ticket')
        .setLabel('Open Ticket')
        .setStyle('SUCCESS')
    );

    const reply = await message.reply({ embeds: [embed], components: [row] });

    const filter = (interaction) => interaction.customId === 'open_ticket';
    const collector = reply.createMessageComponentCollector({ filter });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      const user = interaction.user;

      // Prompt the user for a reason
      const reasonEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Support Ticket')
        .setDescription('Please type your reason for opening a ticket.');

      await interaction.followUp({ embeds: [reasonEmbed], ephemeral: true });

      const reasonFilter = (m) => m.author.id === user.id;
      const reasonCollector = interaction.channel.createMessageCollector({ filter: reasonFilter, time: 60000, max: 1 });

      reasonCollector.on('collect', async (msg) => {
        const reason = msg.content;

        // Delete the user's message containing the reason
        msg.delete().catch(console.error);

        let supportRole = guild.roles.cache.find((role) => role.name === 'Support');
        if (!supportRole) {
          supportRole = await guild.roles.create({
            name: 'Support',
            color: 'BLUE',
            permissions: [],
          });
        }

        const userMention = user.toString();

        let category = guild.channels.cache.find((ch) => ch.type === 'GUILD_CATEGORY' && ch.name === 'Tickets');
        if (!category) {
          category = await guild.channels.create('Tickets', {
            type: 'GUILD_CATEGORY',
            permissionOverwrites: [
              { id: guild.id, deny: [Permissions.FLAGS.VIEW_CHANNEL] },
            ],
          });
        }

        let ticketChannel;
        try {
          ticketChannel = await guild.channels.create(`ticket-${user.username}`, {
            type: 'GUILD_TEXT',
            parent: category.id,
            permissionOverwrites: [
              { id: guild.id, deny: [Permissions.FLAGS.VIEW_CHANNEL] },
              { id: user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL] },
              { id: supportRole.id, allow: [Permissions.FLAGS.VIEW_CHANNEL] },
            ],
          });
        } catch (error) {
          console.error('Failed to create ticket channel:', error);
          return;
        }

        const ticketEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle('Support Ticket')
          .setDescription(`Ticket created by ${userMention}\nReason: ${reason}\nPlease use this channel for further communication.\n${supportRole.toString()}`);

        const closeButton = new MessageButton()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle('DANGER');

        const saveTranscriptButton = new MessageButton()
          .setCustomId('save_transcript')
          .setLabel('Save Transcript')
          .setStyle('PRIMARY');

        const ticketRow = new MessageActionRow().addComponents(closeButton, saveTranscriptButton);

        const ticketMessage = await ticketChannel.send({ content: `${userMention}`, embeds: [ticketEmbed], components: [ticketRow] });

        const closeCollector = ticketChannel.createMessageComponentCollector({
          filter: (interaction) => interaction.customId === 'close_ticket' && interaction.user.id === user.id,
        });

        let transcriptSaved = false;
        let countdown = 10;

        closeCollector.on('collect', async (interaction) => {
          await interaction.deferUpdate();

          const closeEmbed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('Support Ticket')
            .setDescription(`Ticket closed. This channel will be deleted in **${countdown}** seconds.`);

          let closeMessage;

          try {
            closeMessage = await ticketChannel.send({ embeds: [closeEmbed] });
          } catch (error) {
            console.error(`Failed to send close message: ${error}`);
            return;
          }

          if (!transcriptSaved) {
            saveTranscript(ticketChannel, user, reason);
            transcriptSaved = true;
          }

          const deletionTimeout = setInterval(() => {
            countdown--;
            closeEmbed.setDescription(`Ticket closed. This channel will be deleted in **${countdown}** seconds.`);

            closeMessage
              .edit({ embeds: [closeEmbed] })
              .catch((error) => console.error(`Failed to edit close message: ${error}`));

            if (countdown === 0) {
              clearInterval(deletionTimeout);
              ticketChannel.delete().catch((error) => console.error(`Failed to delete ticket channel: ${error}`));
            }
          }, 1000);

          const saveTranscriptCollector = ticketChannel.createMessageComponentCollector({
            filter: (interaction) => interaction.customId === 'save_transcript' && interaction.user.id === user.id,
          });

          saveTranscriptCollector.on('collect', async (interaction) => {
            await interaction.deferUpdate();
            if (!transcriptSaved) {
              saveTranscript(ticketChannel, user, reason);
              transcriptSaved = true;
            } else {
              const alreadySavedEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('Transcript Already Saved')
                .setDescription('The transcript has already been saved.');

              ticketChannel.send({ embeds: [alreadySavedEmbed] });
            }
          });
        });

        reasonCollector.on('end', () => {
          if (!reasonCollector.collected.size) {
            const timeoutEmbed = new MessageEmbed()
              .setColor('#ff0000')
              .setTitle('Support Ticket')
              .setDescription('You did not provide a reason in time. Please try again.');

            interaction.followUp({ embeds: [timeoutEmbed], ephemeral: true });
          }
        });
      });

      collector.on('end', () => {
        const expiredEmbed = new MessageEmbed()
          .setColor('#ff0000')
          .setTitle('Support Ticket')
          .setDescription('Ticket creation timed out.');

          reply.edit({ embeds: [expiredEmbed], components: [] });
        });
      });
    },
  };
