const path = require("path");
const crypto = require("crypto");
const env = require("../config/env");
const { minioClient } = require("../config/minio");

function buildPublicUrl(objectName) {
  return `${env.minio.publicUrl}/${env.minio.bucketName}/${objectName}`;
}

async function uploadImage(fileBuffer, originalName, mimeType, customObjectName = null) {
  const ext = path.extname(originalName);
  const objectName = customObjectName || `cars/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

  await minioClient.putObject(env.minio.bucketName, objectName, fileBuffer, {
    "Content-Type": mimeType
  });

  return {
    objectName,
    url: buildPublicUrl(objectName)
  };
}

async function deleteImage(objectName) {
  if (!objectName) {
    return;
  }

  await minioClient.removeObject(env.minio.bucketName, objectName);
}

module.exports = {
  uploadImage,
  deleteImage
};
