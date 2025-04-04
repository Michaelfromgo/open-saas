import { Dispatch, SetStateAction } from 'react';
interface FileUploadProgress {
    file: File;
    setUploadProgressPercent: Dispatch<SetStateAction<number>>;
}
export interface FileUploadError {
    message: string;
    code: 'NO_FILE' | 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE' | 'UPLOAD_FAILED';
}
export declare const MAX_FILE_SIZE: number;
export declare const ALLOWED_FILE_TYPES: string[];
export declare function uploadFileWithProgress({ file, setUploadProgressPercent }: FileUploadProgress): Promise<import("axios").AxiosResponse<any, any>>;
export declare function validateFile(file: File): FileUploadError | null;
export {};
