import SteamUser from 'steam-user';

interface AccountInfo {
	steamID: string;
	accountInfo: {
		name: string;
		country: string;
	};
	emailInfo: {
		email: string;
		validated: boolean;
	};
	limitation: {
		limited: boolean;
		communityBanned: boolean;
		locked: boolean;
	};
	games: string[];
}

export default async function checkAccount(username: string, password: string): Promise<AccountInfo> {
	return new Promise((resolve, reject) => {
		const client = new SteamUser();

		client.logOn({ accountName: username, password });

		client.once('loggedOn', () => {
			console.log('Logged in');
		});

		client.once('steamGuard', () => {
			reject(new Error('Steam Guard'));
		});

		client.once('accountInfo', () => {
			console.log('Account Info retrieved');
		});

		client.once('emailInfo', () => {
			console.log('Email Info retrieved');
		});

		client.once('accountLimitations', async (limited, communityBanned, locked) => {
			console.log('Account Limitations retrieved');

			const games: string[] = [];
			const gameList = await client.getUserOwnedApps(client.steamID!, { includeFreeSub: true, includePlayedFreeGames: true });
			gameList.apps.forEach((game) => {
				games.push(game.name);
			});

			resolve({
				steamID: client.steamID!.toString(),
				accountInfo: {
					name: client.accountInfo!.name,
					country: client.accountInfo!.country
				},
				emailInfo: {
					// @ts-ignore
					email: client.emailInfo!.address,
					validated: client.emailInfo!.validated
				},
				limitation: {
					limited,
					communityBanned,
					locked
				},
				games
			});

			client.logOff();
		});

		client.once('error', (err) => {
			reject(err);
		});
	});
}
