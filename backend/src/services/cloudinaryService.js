import cloudinary from '../config/cloudinary.js';
import { AppError } from '../utils/asyncHandler.js';
import { removeTempFile } from '../utils/tempStorage.js';

const DOCUMENT_FOLDER = 'hostel-allocation/documents';

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== 'your_api_secret'
  );

export const assertCloudinaryConfigured = () => {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      503
    );
  }
};

export const uploadOnCloudinary = async (localFilePath, { folder = DOCUMENT_FOLDER, mimetype } = {}) => {
  assertCloudinaryConfigured();

  const resourceType = mimetype === 'application/pdf' ? 'raw' : 'auto';

  return cloudinary.uploader.upload(localFilePath, {
    folder,
    resource_type: resourceType,
  });
};

export const uploadDocumentFromPath = async (localFilePath, mimetype) => {
  try {
    const result = await uploadOnCloudinary(localFilePath, { mimetype });
    return {
      fileUrl: result.secure_url,
      publicId: result.public_id,
    };
  } finally {
    await removeTempFile(localFilePath);
  }
};

export const deleteAsset = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
  } catch {
    // Legacy local filenames or already-deleted assets are ignored.
  }
};

export const deleteAssets = async (publicIds = []) => {
  await Promise.all(publicIds.filter(Boolean).map((id) => deleteAsset(id)));
};
