import { downloadData } from 'aws-amplify/storage';

const targetBucket = {
  bucket: { bucketName: 'crypto-sentiment-cache-loki', region: 'us-east-1' }
};

export async function logS3SentimentFiles() {
  try {
    const latest = await downloadData({
      path: 'sentiment-latest.json',
      options: targetBucket
    }).result;
    const latestJson = await latest.body.json();
    console.log('[S3] sentiment-latest.json eTag:', latest.eTag);
    console.log('[S3] sentiment-latest.json payload:', latestJson);

    const history = await downloadData({
      path: 'history.json',
      options: targetBucket
    }).result;
    const historyJson = await history.body.json();
    console.log('[S3] history.json eTag:', history.eTag);
    console.log('[S3] history.json payload:', historyJson);
  } catch (err) {
    console.error('[S3] download failed:', err);
  }
}
