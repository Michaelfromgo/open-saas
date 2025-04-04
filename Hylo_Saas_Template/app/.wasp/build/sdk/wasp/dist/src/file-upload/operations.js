import { HttpError } from 'wasp/server';
import { getUploadFileSignedURLFromS3, getDownloadFileSignedURLFromS3 } from './s3Utils';
export const createFile = async ({ fileType, name }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    const userInfo = context.user.id;
    const { uploadUrl, key } = await getUploadFileSignedURLFromS3({ fileType, userInfo });
    return await context.entities.File.create({
        data: {
            name,
            key,
            uploadUrl,
            type: fileType,
            user: { connect: { id: context.user.id } },
        },
    });
};
export const getAllFilesByUser = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.File.findMany({
        where: {
            user: {
                id: context.user.id,
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};
export const getDownloadFileSignedURL = async ({ key }, _context) => {
    return await getDownloadFileSignedURLFromS3({ key });
};
//# sourceMappingURL=operations.js.map