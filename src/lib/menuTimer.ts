import type { Message } from 'discord.js';

const menuTimers = new Map<string, NodeJS.Timeout>();

export function startMenuTimer(message: Message<boolean>) {
	clearMenuTimer(message.id);

	const timeout = setTimeout(() => {
		message
			.edit({
				content: 'This menu is no longer active.',
				components: []
			})
			.catch(() => {
				/* already deleted? */
			});
		menuTimers.delete(message.id);
	}, 60_000);

	menuTimers.set(message.id, timeout);
}

export function clearMenuTimer(messageId: string) {
	const existing = menuTimers.get(messageId);
	if (existing) {
		clearTimeout(existing);
		menuTimers.delete(messageId);
	}
}
