export const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
};

export function verifyMagicBytes(
	buffer: Buffer,
	expectedType: string,
): boolean {
	const signature = MAGIC_BYTES[expectedType];
	if (!signature) return true;
	if (buffer.length < signature.length) return false;
	for (let i = 0; i < signature.length; i++) {
		if (buffer[i] !== signature[i]) return false;
	}
	return true;
}
