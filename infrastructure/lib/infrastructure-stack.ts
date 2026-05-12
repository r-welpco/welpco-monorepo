import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

/**
 * Simplified architecture: single NestJS backend + RDS PostgreSQL only.
 * Do not add MSK (Kafka), OpenSearch, or ElastiCache (Redis).
 * When implementing: compose DatabaseStack (RDS) and a compute stack for the
 * single backend (e.g. ECS Fargate + ALB, or Lambda).
 */
export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: Add DatabaseStack (RDS PostgreSQL) and compute for single backend
    // (e.g. ECS Fargate service or Lambda). No Kafka, OpenSearch, or Redis.
  }
}
