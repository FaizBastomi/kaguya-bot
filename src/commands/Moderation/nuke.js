const { Subcommand } = require('@sapphire/plugin-subcommands');
const { PermissionsBitField } = require('discord.js');

const { config } = require('../../index');

class NukeCommands extends Subcommand {
	constructor(ctx, options) {
		super(ctx, {
			...options,
			name: 'nuke',
			description: 'Nuke a channel',
			subcommands: [
				{ name: 'copy', chatInputRun: 'nukeChannelCopy' },
				{ name: 'delete', chatInputRun: 'nukeChannelDelete' }
			]
		});
	}

	registerApplicationCommands(registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder //
					.setName(this.name)
					.setDescription(this.description)
					.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
					.addSubcommand((subcommand) =>
						subcommand //
							.setName('copy')
							.setDescription('Copy the channel before nuking it')
					)
					.addSubcommand((subcommand) =>
						subcommand //
							.setName('delete')
							.setDescription('Delete the channel')
					),
			{
				idHints: config.data.nukeID || '',
				registerCommandIfMissing: true
			}
		);
	}

	async nukeChannelCopy(interaction) {
		await interaction.channel.clone();
		return interaction.channel.delete();
	}
	async nukeChannelDelete(interaction) {
		return interaction.channel.delete();
	}
}

module.exports = {
	NukeCommands
};
