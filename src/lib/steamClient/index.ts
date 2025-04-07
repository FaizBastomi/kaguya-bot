import SteamUser from 'steam-user';
import * as forge from 'node-forge';
import { AxiosRequestConfig } from 'axios';
import { createAxiosSession } from '../utils';

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

export default async function checkAccount(username:string,password:string): Promise<AccountInfo> {
	try {
		void forceLogin(username, password);
		const accountInfo = await checkSteamAccount(username, password);
		return accountInfo;
	} catch (error) {
		throw error;
	}
}

async function axiosPost<T>(url: string, baseURL: string = '', data?: any, config?: AxiosRequestConfig): Promise<T> {
	const session = createAxiosSession(baseURL);
	const response = await session.post<T>(url, data, config);
	return response.data;
}

async function forceLogin(username: string, password: string): Promise<void> {
	const rsaResponse = await axiosPost<{
		success: boolean;
		publickey_mod: string;
		publickey_exp: string;
		timestamp: string;
	}>(
		'/login/getrsakey',
		'https://steamcommunity.com',
		new URLSearchParams({
			username,
			donotcache: String(Date.now())
		}),
		{
			headers: {
				'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.5; Windows NT)',
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}
	);

	if (!rsaResponse.success) {
		console.error(`Failed to get RSA key for ${username}`);
		return;
	}

	const rsa = forge.pki.setRsaPublicKey(
		new forge.jsbn.BigInteger(rsaResponse.publickey_mod, 16),
		new forge.jsbn.BigInteger(rsaResponse.publickey_exp, 16)
	);
	const encrypted = rsa.encrypt(password, 'RSAES-PKCS1-V1_5');
	const encryptedPassword = Buffer.from(encrypted, 'binary').toString('base64');

	const loginResponse = await axiosPost<any>(
		'/login/dologin',
		'https://steamcommunity.com',
		// @ts-ignore
		new URLSearchParams({
			username,
			password: encryptedPassword,
			emailauth: '',
			loginfriendlyname: '',
			captchagid: '-1',
			captcha_text: '',
			emailsteamid: '',
			rsatimestamp: rsaResponse.timestamp,
			remember_login: false,
			donotcache: String(Date.now())
		}),
		{
			headers: {
				'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.5; Windows NT)',
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}
	);

	if (loginResponse?.success) {
		console.log(`Login successful for ${username}`);
	}
}

async function checkSteamAccount(username: string, password: string): Promise<AccountInfo> {
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
