export interface InstagramResponse {
	status: number;
	message: string;
	result: string[];
}

export interface FacebookResponse {
	status: number;
	message: string;
	result: string[];
}

export interface TikTokVidResponse {
	status: number;
	message: string;
	result: TikTokVidResult;
}

export interface TikTokVidResult {
	title: string;
	keyword: string;
	description: string;
	thumbnail: string;
	duration: number;
	author: TikTokVidAuthor;
	statistic: TikTokVidStatistic;
	link: string;
}

export interface TikTokVidAuthor {
	username: string;
	nickname: string;
	avatar: string;
}

export interface TikTokVidStatistic {
	play_count: number;
	like_count: number;
	share_count: number;
	comment_count: number;
}

export interface TikTokImgResponse {
	status: number;
	message: string;
	result: string[];
}
