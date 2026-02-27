const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE, // path to service account JSON
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

module.exports = { storage, bucket };