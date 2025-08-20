import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({ auth, storage });

const { cfnIdentityPool } = backend.auth.resources.cfnResources;
cfnIdentityPool.allowUnauthenticatedIdentities = true;

const extStack = backend.createStack('external-s3');
const extBucket = Bucket.fromBucketAttributes(extStack, 'CryptoSentimentBucket', {
  bucketArn: 'arn:aws:s3:::crypto-sentiment-cache-loki',
  region: 'us-east-1',
});

backend.addOutput({
  storage: {
    aws_region: extBucket.env.region,
    bucket_name: extBucket.bucketName,
    buckets: [
      {
        name: 'cryptoSentiment',
        bucket_name: extBucket.bucketName,
        aws_region: extBucket.env.region,
      },
    ],
  },
});

const READ_OBJECT_ARNS = [
  `${extBucket.bucketArn}/sentiment-latest.json`,
  `${extBucket.bucketArn}/history.json`,
];

const listPolicy = new Policy(extStack, 'ExtBucketList', {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:ListBucket'],
      resources: [extBucket.bucketArn],
      conditions: { StringLike: { 's3:prefix': ['sentiment-latest.json', 'history.json'] } },
    }),
  ],
});

const readPolicy = new Policy(extStack, 'ExtBucketRead', {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: READ_OBJECT_ARNS,
    }),
  ],
});

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(listPolicy);
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(readPolicy);

backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  new Policy(extStack, 'ExtBucketListGuest', {
    statements: listPolicy.document.statements,
  }),
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  new Policy(extStack, 'ExtBucketReadGuest', {
    statements: readPolicy.document.statements,
  }),
);
