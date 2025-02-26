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
		this.container.stores.get('commands').loadAll();
	}
}

module.exports = {
	CommandRegistry
};
