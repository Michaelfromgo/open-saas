import { createFile } from 'wasp/client/operations';
import axios from 'axios';
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // Set this to the max file size you want to allow (currently 5MB).
export const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'text/*',
    'video/quicktime',
    'video/mp4',
];
export async function uploadFileWithProgress({ file, setUploadProgressPercent }) {
    const { uploadUrl } = await createFile({ fileType: file.type, name: file.name });
    return await axios.put(uploadUrl, file, {
        headers: {
            'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
                const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                setUploadProgressPercent(percentage);
            }
        },
    });
}
export function validateFile(file) {
    if (file.size > MAX_FILE_SIZE) {
        return {
            message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`,
            code: 'FILE_TOO_LARGE',
        };
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return {
            message: `File type '${file.type}' is not supported.`,
            code: 'INVALID_FILE_TYPE',
        };
    }
    return null;
}
//# sourceMappingURL=fileUploading.js.map