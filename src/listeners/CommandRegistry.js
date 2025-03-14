const { Listener } = require('@sapphire/framework');

const { config } = require('../index');

class CommandRegistry extends Listener {
	/**
	 * @param {Listener.LoaderContext} context
	 */
	constructor(context, options) {
		super(context, {
			...options,
			event: 'applicationCommandRegistriesRegistered',
			once: true
		});
	}

	async run(registries) {
		const raw = {};

		for (const registry of registries) {
			raw[registry[1].commandName + 'ID'] = registry[1].globalCommandId;
		}

		config.data = config.saveAndReloadConfig(raw);
		console.log('Will reload commands in 5 seconds');
		setTimeout(() => {
			this.container.stores.get('commands').loadAll();
		}, 5 * 1000);
	}
}

module.exports = {
	CommandRegistry
};
