const { Client } = require("minio");
const env = require("./env");

const minioClient = new Client({
  endPoint: env.minio.endPoint,
  port: env.minio.port,
  useSSL: env.minio.useSSL,
  accessKey: env.minio.accessKey,
  secretKey: env.minio.secretKey
});

async function ensureBucket() {
  const exists = await minioClient.bucketExists(env.minio.bucketName);
  if (!exists) {
    await minioClient.makeBucket(env.minio.bucketName, "us-east-1");
  }

  // Izinkan akses baca publik agar gambar bisa ditampilkan di browser
  const publicReadPolicy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${env.minio.bucketName}/*`]
      }
    ]
  });
  await minioClient.setBucketPolicy(env.minio.bucketName, publicReadPolicy);
}

module.exports = {
  minioClient,
  ensureBucket
};
