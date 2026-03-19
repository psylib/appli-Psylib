#!/bin/bash
set -euo pipefail

# PsyScale — Deploy API to AWS ECS
# Usage: ./scripts/deploy-api.sh [IMAGE_TAG]

AWS_REGION="eu-west-3"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_NAME="psyscale/api"
ECS_CLUSTER="psyscale-cluster"
ECS_SERVICE="psyscale-api"
IMAGE_TAG="${1:-$(git rev-parse --short HEAD)}"

echo "🚀 Deploying PsyScale API — tag: ${IMAGE_TAG}"

# 1. Login ECR
echo "📦 Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# 2. Build image
echo "🔨 Building Docker image..."
docker build \
  -f apps/api/Dockerfile \
  -t "${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" \
  -t "${ECR_REGISTRY}/${IMAGE_NAME}:latest" \
  .

# 3. Push to ECR
echo "⬆️  Pushing to ECR..."
docker push "${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
docker push "${ECR_REGISTRY}/${IMAGE_NAME}:latest"

# 4. Run Prisma migrations
echo "🗄️  Running DB migrations..."
aws ecs run-task \
  --cluster "${ECS_CLUSTER}" \
  --task-definition psyscale-api \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[${ECS_SUBNET_ID}],securityGroups=[${ECS_SECURITY_GROUP_ID}],assignPublicIp=DISABLED}" \
  --overrides "{\"containerOverrides\":[{\"name\":\"api\",\"command\":[\"npx\",\"prisma\",\"migrate\",\"deploy\"],\"workingDirectory\":\"/app/apps/api\"}]}" \
  --region "${AWS_REGION}"

echo "⏳ Waiting 30s for migrations..."
sleep 30

# 5. Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster "${ECS_CLUSTER}" \
  --service "${ECS_SERVICE}" \
  --force-new-deployment \
  --region "${AWS_REGION}"

# 6. Wait for stability
echo "⏳ Waiting for deployment to stabilize..."
aws ecs wait services-stable \
  --cluster "${ECS_CLUSTER}" \
  --services "${ECS_SERVICE}" \
  --region "${AWS_REGION}"

echo "✅ Deployment complete!"
echo "   Image: ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
