import { type File } from 'wasp/entities';
import { type CreateFile, type GetAllFilesByUser, type GetDownloadFileSignedURL } from 'wasp/server/operations';
type FileDescription = {
    fileType: string;
    name: string;
};
export declare const createFile: CreateFile<FileDescription, File>;
export declare const getAllFilesByUser: GetAllFilesByUser<void, File[]>;
export declare const getDownloadFileSignedURL: GetDownloadFileSignedURL<{
    key: string;
}, string>;
export {};
