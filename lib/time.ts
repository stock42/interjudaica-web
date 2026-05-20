export function getIsoDaysAgo(days: number) {
	return new Date(Date.now() - 1000 * 60 * 60 * 24 * days).toISOString();
}
