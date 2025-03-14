const SteamUser = require('steam-user');

async function checkSteamAccount(username, password) {
	return new Promise((resolve, reject) => {
		const client = new SteamUser();

		client.logOn({ accountName: username, password });

		/** Events */
		client.once('loggedOn', () => {
			console.log('Logged in');
		});

		client.once('steamGuard', () => {
			reject(new Error('Steam Guard code required'));
		});

		client.once('accountInfo', () => {
			console.log('Account info retrieved');
		});

		client.once('emailInfo', () => {
			console.log('Email info retrieved');
		});

		client.once('accountLimitations', (limited, communityBanned, locked) => {
			console.log('Account limitations retrieved');
			resolve({
				steamID: client.steamID.toString(),
				accountInfo: {
					name: client.accountInfo?.name || null,
					country: client.accountInfo?.country || null
				},
				emailInfo: client.emailInfo ? { address: client.emailInfo.adress, validated: client.emailInfo.validated } : null,
				limitations: {
					limited,
					communityBanned,
					locked
				}
			});

			client.logOff();
		});

		client.once('error', (err) => {
			reject(err);
		});
	});
}

module.exports = { checkSteamAccount };
