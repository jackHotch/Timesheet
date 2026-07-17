# Deploying Timesheet to AWS Fargate/ECS

This is a click-through runbook for standing up the app on AWS via the console (no Terraform/CDK). Follow it top to bottom — later steps depend on resources created in earlier ones.

Region used throughout: **us-east-1**.

## 0. Naming convention

Use these exact names so they line up with the checked-in files (`deploy/ecs/*.json`, `.github/workflows/deploy.yml`):

| Resource | Name |
|---|---|
| ECR repos | `timesheet/timesheet-api`, `timesheet/timesheet-client` |
| ECS cluster | `timesheet-cluster` |
| ECS services | `timesheet-api-svc`, `timesheet-client-svc` |
| Task def families | `timesheet-api`, `timesheet-client` |
| Security groups | `timesheet-alb-sg`, `timesheet-ecs-sg` |
| IAM roles | `timesheet-ecs-execution-role`, `timesheet-api-task-role`, `timesheet-client-task-role`, `timesheet-gha-deploy-role` |
| CloudWatch log groups | `/ecs/timesheet-api`, `/ecs/timesheet-client` |
| SSM parameter path | `/timesheet/*` |

## Prerequisites

- A Neon Postgres project exists; you have its host, port, user, password, database name.
- `simpletimesheet.app` is registered and DNS-hosted at Cloudflare.
- You have an AWS account with console access and can create IAM roles.

## 1. ECR — container registries

1. ECR → **Create repository** (private) → name `timesheet/timesheet-api`. Enable "Scan on push".
2. Repeat for `timesheet/timesheet-client`.
3. Note the registry URI shown (`<account-id>.dkr.ecr.us-east-1.amazonaws.com`) — you'll need your account ID repeatedly below.

## 2. IAM — roles

Create these four roles (IAM → Roles → Create role):

**`timesheet-ecs-execution-role`**
- Trusted entity: AWS service → **Elastic Container Service** → **Elastic Container Service Task**.
- Attach managed policy `AmazonECSTaskExecutionRolePolicy`.
- Add inline policy granting `ssm:GetParameters`, `ssm:GetParameter` on `arn:aws:ssm:us-east-1:<account-id>:parameter/timesheet/*`, and `kms:Decrypt` on `arn:aws:kms:us-east-1:<account-id>:alias/aws/ssm` (required even though it's the AWS-managed key).

**`timesheet-api-task-role`**
- Trusted entity: same (`ecs-tasks.amazonaws.com`).
- Inline policy: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::<your-bucket>` and `arn:aws:s3:::<your-bucket>/*`.
- This is what replaces the static `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` — the API's S3 client now falls back to this role automatically (see code change notes at the bottom of this doc).

**`timesheet-client-task-role`**
- Trusted entity: same. No permissions needed — the client container makes no AWS API calls. (You can skip attaching this role to the client task definition entirely; it's listed here only for completeness.)

**`timesheet-gha-deploy-role`** (assumed by GitHub Actions via OIDC — no long-lived AWS keys)
- First, add the OIDC identity provider once: IAM → Identity providers → **Add provider** → OpenID Connect → Provider URL `https://token.actions.githubusercontent.com` → Audience `sts.amazonaws.com`.
- Create the role with a custom trust policy:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "Federated": "arn:aws:iam::<account-id>:oidc-provider/token.actions.githubusercontent.com" },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            "token.actions.githubusercontent.com:sub": "repo:jackHotch/Timesheet:ref:refs/heads/main"
          }
        }
      }
    ]
  }
  ```
- Inline permissions policy:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      { "Effect": "Allow", "Action": "ecr:GetAuthorizationToken", "Resource": "*" },
      {
        "Effect": "Allow",
        "Action": [
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:BatchGetImage"
        ],
        "Resource": [
          "arn:aws:ecr:us-east-1:<account-id>:repository/timesheet/timesheet-api",
          "arn:aws:ecr:us-east-1:<account-id>:repository/timesheet/timesheet-client"
        ]
      },
      {
        "Effect": "Allow",
        "Action": ["ecs:RegisterTaskDefinition", "ecs:DescribeTaskDefinition", "ecs:UpdateService", "ecs:DescribeServices"],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": "iam:PassRole",
        "Resource": [
          "arn:aws:iam::<account-id>:role/timesheet-ecs-execution-role",
          "arn:aws:iam::<account-id>:role/timesheet-api-task-role",
          "arn:aws:iam::<account-id>:role/timesheet-client-task-role"
        ]
      },
      {
        "Effect": "Allow",
        "Action": ["ssm:GetParameters", "ssm:GetParameter"],
        "Resource": "arn:aws:ssm:us-east-1:<account-id>:parameter/timesheet/*"
      }
    ]
  }
  ```

## 3. Networking — security groups

Use the **default VPC** (it already has public subnets with auto-assigned public IPs in at least 2 AZs — confirm under VPC → Subnets).

1. `timesheet-alb-sg`: inbound rules — TCP 80 from `0.0.0.0/0` and `::/0`, TCP 443 from `0.0.0.0/0` and `::/0`. Outbound: all.
2. `timesheet-ecs-sg`: inbound rules — TCP 3000 with source = `timesheet-alb-sg`, TCP 8080 with source = `timesheet-alb-sg` (select the security group itself as the source, not a CIDR). Outbound: all.

> **Cost note:** tasks run in public subnets with a public IP (needed to reach ECR, Neon, and S3 without paying for a NAT Gateway), but the security group only allows inbound traffic from the ALB — so they're not directly reachable from the internet. This is a well-known, accepted tradeoff for small deployments; the more isolated (and pricier) alternative is private subnets + a NAT Gateway.

## 4. ACM — TLS certificate

1. Certificate Manager → **Request a certificate** (public), region **us-east-1**.
2. Domain names: `simpletimesheet.app`, then **Add another name to this certificate** → `api.simpletimesheet.app`.
3. Validation method: **DNS validation**.
4. After requesting, expand each domain to see its CNAME validation record (name + value).

## 5. Cloudflare — certificate validation

1. Cloudflare dashboard → DNS → Records → **Add record** for each of the two CNAMEs ACM showed you.
2. Set proxy status to **DNS only** (grey cloud, not orange) for both.
3. Back in ACM, wait for status to flip to **Issued** (can take a few minutes) before continuing.

## 6. SSM Parameter Store — secrets

Systems Manager → Parameter Store → **Create parameter**, type **SecureString**, for each of:

| Name | Value |
|---|---|
| `/timesheet/jwt-secret` | a long random string (not the default `change-me-in-production`) |
| `/timesheet/database-host` | your Neon host |
| `/timesheet/database-port` | `5432` |
| `/timesheet/database-user` | your Neon user |
| `/timesheet/database-password` | your Neon password |
| `/timesheet/database-name` | your Neon database name |
| `/timesheet/database-ssl` | `true` |
| `/timesheet/aws-s3-bucket` | your S3 bucket name |
| `/timesheet/client-url` | `https://simpletimesheet.app` |

These are referenced by the `secrets` block in `deploy/ecs/api-taskdef.json`, which resolves them to real environment variables when the container starts (not the same as the `environment` block, which is plaintext).

## 7. CloudWatch Logs

Create two log groups up front (CloudWatch → Log groups → **Create log group**): `/ecs/timesheet-api`, `/ecs/timesheet-client`. Set retention to 30 days (optional, but avoids unbounded storage cost).

## 8. ECS cluster

ECS → Clusters → **Create cluster** → name `timesheet-cluster` → infrastructure: **AWS Fargate** only.

## 9. Task definitions

You won't hand-write these in the console — `deploy/ecs/api-taskdef.json` and `deploy/ecs/client-taskdef.json` are already checked into the repo. They contain the placeholder token `__AWS_ACCOUNT_ID__` instead of a real account ID — this repo is public, so the real number is never committed; the GitHub Actions workflow substitutes it at runtime from a secret (see step 13). Before the first deploy:

1. To register one manually (for the one-time bootstrap before GitHub Actions has run), copy the file's contents and, only in the console's JSON editor (or a local scratch copy — never save this substitution back into the git-tracked file), replace `__AWS_ACCOUNT_ID__` with your real AWS account ID.
2. Register each one once, either via the console (ECS → Task definitions → **Create new task definition** → look for **"Configure via JSON"** → paste the substituted contents — "Create new revision" only appears once a family already exists) or via `aws ecs register-task-definition --cli-input-json file://deploy/ecs/api-taskdef.json` (after substituting locally, outside git).

Note the images referenced (`timesheet/timesheet-api:latest`, `timesheet/timesheet-client:latest`) won't exist in ECR yet — either push a placeholder image once by hand (`docker build`, `docker push`) or just create the ECS services after the first GitHub Actions run has pushed real images.

## 10. Application Load Balancer

1. EC2 → Load Balancers → **Create load balancer** → Application Load Balancer → name `timesheet-alb` → internet-facing → default VPC → select the public subnets in both AZs → security group `timesheet-alb-sg`.
2. Create target group `timesheet-api-tg`: target type **IP**, port 8080, health check path `/health`, success code 200.
3. Create target group `timesheet-client-tg`: target type **IP**, port 3000, health check path `/`, success code 200.
4. Listener on port 80: default action → **Redirect to** HTTPS 443.
5. Listener on port 443: attach the ACM certificate from step 4; default rule → forward to `timesheet-client-tg`; add a rule: **if Host header is `api.simpletimesheet.app`** → forward to `timesheet-api-tg`.

## 11. ECS services

ECS → cluster `timesheet-cluster` → **Create service**:

**`timesheet-api-svc`**
- Launch type: Fargate. Task definition: `timesheet-api`. Desired tasks: 1.
- Networking: default VPC, public subnets, security group `timesheet-ecs-sg`, **auto-assign public IP: enabled**.
- Load balancing: attach to `timesheet-api-tg`, container port 8080.

**`timesheet-client-svc`**
- Same, using task definition `timesheet-client`, target group `timesheet-client-tg`, container port 3000.

## 12. Cloudflare — production DNS

Add two more DNS records (DNS only / grey cloud):
- `simpletimesheet.app` (apex) → CNAME → the ALB's DNS name (Cloudflare flattens apex CNAMEs automatically, so this is valid even at the root).
- `api.simpletimesheet.app` → CNAME → the same ALB DNS name.

## 13. GitHub repository configuration

Repo Settings → **Secrets and variables** → **Actions**:

**Secrets**:
- `NEON_DATABASE_HOST`, `NEON_DATABASE_PORT`, `NEON_DATABASE_USER`, `NEON_DATABASE_PASSWORD`, `NEON_DATABASE_NAME` — used only by the `migrate` job to talk to Neon directly.
- `AWS_ACCOUNT_ID` = your real AWS account ID — used by the `deploy-api`/`deploy-client` jobs to fill in the `__AWS_ACCOUNT_ID__` placeholder in the task definition files at runtime, since this repo is public and the real number should never be committed to it.

**Variables**:
- `AWS_REGION` = `us-east-1`
- `AWS_DEPLOY_ROLE_ARN` = ARN of `timesheet-gha-deploy-role`
- `ECR_REPO_API` = `timesheet/timesheet-api`
- `ECR_REPO_CLIENT` = `timesheet/timesheet-client`
- `ECS_CLUSTER` = `timesheet-cluster`
- `ECS_SERVICE_API` = `timesheet-api-svc`
- `ECS_SERVICE_CLIENT` = `timesheet-client-svc`
- `NEXT_PUBLIC_API_URL` = `https://api.simpletimesheet.app`

## 14. First push & validation

1. Push to `main`. Watch Actions → `Deploy` run through `migrate` → `build-push-api`/`build-push-client` → `deploy-api`/`deploy-client`.
2. In ECS, confirm both services reach steady state with healthy targets in their target groups.
3. Visit `https://simpletimesheet.app` (client should load) and `https://api.simpletimesheet.app/health` (should return `{"status":"ok"}`) — both over valid HTTPS.
4. Log in through the client and exercise a file-upload/invoice flow to confirm the API's S3 task role is working end-to-end.

## Related code changes made for this deployment

- `api/src/config/configuration.ts`, `api/src/database/database.service.ts`, `api/scripts/migrate.ts` — added SSL support (`DATABASE_SSL=true`), required by Neon.
- `api/src/aws/s3.service.ts` — S3 client now omits explicit credentials when `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` aren't set, so it falls back to the ECS task role in production instead of requiring static keys.
- `api/src/app.controller.ts` — added a public `GET /health` route (the existing `GET /` sits behind the global JWT guard, which would otherwise fail every ALB health check).
- `api/Dockerfile`, `client/Dockerfile` — new production multi-stage builds (the old `Dockerfile.dev` files remain for local `docker compose` dev use, unchanged).
- `client/next.config.mjs` — added `output: 'standalone'` so the production image only needs the minimal Next.js standalone server output.
