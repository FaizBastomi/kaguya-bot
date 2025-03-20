import { PrismaClient, SteamAccounts } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function shutdownPrisma() {
	await prisma.$disconnect();
}

export async function addSteamAccount(username: string, password: string, games: string[]) {
	await prisma.steamAccounts.create({
		data: {
			username: username,
			password: password,
			games
		}
	});
}

export async function getSteamAccount(username: string): Promise<SteamAccounts | null> {
	return await prisma.steamAccounts.findFirst({
		where: {
			username
		}
	});
}

export async function deleteSteamAccount(dataId: string) {
	await prisma.steamAccounts.delete({
		where: {
			id: dataId
		}
	});
}

export async function editSteamAccount(dataId: string, username: string, password: string, games: string[]): Promise<SteamAccounts> {
	return await prisma.steamAccounts.update({
		where: {
			id: dataId
		},
		data: {
			username: username,
			password: password,
			games: games
		}
	});
}
