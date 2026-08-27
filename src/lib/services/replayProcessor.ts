import { getFacebookMedia, getInstagramMedia, getTikTokMedia } from './lolhuman';

export function cleanUrl(inputUrl: string): string {
	try {
		if (!inputUrl.includes('?') && inputUrl.includes('&')) inputUrl = inputUrl.replace('&', '?');
		const parsed = new URL(inputUrl);
		for (const key of parsed.searchParams.keys()) {
			if (/^(igs[hi]|utm_|fbclid|gclid|mibextid|share_id|ref|si?|s)/i.test(key)) parsed.searchParams.delete(key);
		}
		return parsed.toString();
	} catch {
		return inputUrl;
	}
}

export interface PlatformHandler {
	name: string;
	regex: RegExp;
	validate?: (url: string) => string | null;
	fetch: (url: string) => Promise<string[]>;
	postProcess?: (urls: string[], url: string) => string[];
}

export class ReplayProcessor {
	private platforms: PlatformHandler[] = [];

	public addPlatform(handler: PlatformHandler) {
		this.platforms.push(handler);
		return this;
	}

	public getHandler(url: string): PlatformHandler | { error: string } {
		let hostname: string;
		try {
			hostname = new URL(url).hostname;
		} catch {
			return { error: 'Please provide a valid URL.' };
		}

		const handler = this.platforms.find((p) => p.regex.test(hostname));
		if (!handler) return { error: 'Please provide a valid Instagram, Facebook, or TikTok URL.' };

		if (handler.validate) {
			const err = handler.validate(url);
			if (err) return { error: err };
		}
		return handler;
	}
}

export const processor = new ReplayProcessor()
	.addPlatform({
		name: 'Instagram',
		regex: /(?:^|\.)(instagram\.com)$/i,
		fetch: getInstagramMedia,
		postProcess: (urls, url) => (/reel/i.test(url) ? [urls.find((u) => /mp4/i.test(u)) || urls[0]] : urls)
	})
	.addPlatform({
		name: 'Facebook',
		regex: /(?:^|\.)(facebook\.com|fb\.watch|fb\.com)$/i,
		validate: (url) =>
			!/(\/v\/|\/videos\/|[\/?&]v=|fb\.watch|\/reel\/|\/r\/)/i.test(url) ? 'Only video URLs are supported for Facebook.' : null,
		fetch: getFacebookMedia,
		postProcess: (urls) => [urls[0]]
	})
	.addPlatform({
		name: 'TikTok',
		regex: /(?:^|\.)(tiktok\.com)$/i,
		fetch: getTikTokMedia
	});
