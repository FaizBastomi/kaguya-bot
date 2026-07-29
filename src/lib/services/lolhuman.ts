import axios from 'axios';
import type { FacebookResponse, InstagramResponse } from './types/lolhuman.api';

const BASE_URL = 'https://api.lolhuman.xyz/api';

function getApiKey(): string {
	const apikey = process.env.LOLHUMAN_API_KEY;
	if (!apikey) {
		throw new Error('LOLHUMAN_API_KEY is not set in environment variables');
	}
	return apikey;
}

export async function getInstagramMedia(url: string): Promise<string[]> {
	const apikey = getApiKey();
	try {
		const { data } = await axios.get<InstagramResponse>(`${BASE_URL}/instagram`, { params: { apikey, url } });
		if (data.status === 200 && data.result?.length) {
			return data.result;
		}
	} catch {
		// ponytail: fallback to instagram2 endpoint if instagram fails
	}

	const { data } = await axios.get<InstagramResponse>(`${BASE_URL}/instagram2`, { params: { apikey, url } });
	return data.result || [];
}

export async function getFacebookMedia(url: string): Promise<string[]> {
	const apikey = getApiKey();
	const { data } = await axios.get<FacebookResponse>(`${BASE_URL}/facebook`, { params: { apikey, url } });
	return data.result || [];
}
