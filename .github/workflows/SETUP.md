# GitHub Actions Deployment to Cloud Run

This repository includes a GitHub Actions workflow that automatically deploys the application to Google Cloud Run when code is pushed to the `main` branch.

## Prerequisites

Before the workflow can run, you need to set up the following in your GitHub repository:

### 1. GCP Workload Identity Federation Setup

This workflow uses GCP Workload Identity Federation for secure authentication. Follow these steps:

#### Step 1: Create a Service Account in GCP

```bash
# Create a service account for GitHub Actions
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer" \
  --project=med-aid-advisor

# Get the service account email
gcloud iam service-accounts describe github-actions-deployer \
  --project=med-aid-advisor \
  --format="value(email)"
```

#### Step 2: Grant Permissions to Service Account

```bash
# Grant roles to the service account
gcloud projects add-iam-policy-binding med-aid-advisor \
  --member="serviceAccount:github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding med-aid-advisor \
  --member="serviceAccount:github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com" \
  --role="roles/run.developer"

gcloud projects add-iam-policy-binding med-aid-advisor \
  --member="serviceAccount:github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding med-aid-advisor \
  --member="serviceAccount:github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

#### Step 3: Create Workload Identity Pool and Provider

```bash
# Create the workload identity pool
gcloud iam workload-identity-pools create github-pool \
  --project=med-aid-advisor \
  --location=global \
  --display-name="GitHub Actions Pool"

# Create the workload identity provider
gcloud iam workload-identity-pools providers create github-pool/github-provider \
  --project=med-aid-advisor \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Attribute mapping (maps GitHub repo to GCP service account)
gcloud iam workload-identity-pools providers create-attribute-condition github-pool/github-provider \
  --project=med-aid-advisor \
  --location=global \
  --workload-identity-pool=github-pool \
  --provider=github-provider \
  --attribute="attribute.repository/owner" \
  --value="<YOUR_GITHUB_USERNAME>"

# Allow GitHub OIDC provider to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com \
  --project=med-aid-advisor \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/med-aid-advisor/locations/global/workloadIdentityPools/github-pool/providers/github-provider"

# IMPORTANT: Replace <YOUR_GITHUB_USERNAME> with your actual GitHub username
# The attribute condition ensures only your GitHub repositories can use this provider
```

#### Step 4: Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions → New repository secret):

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `WIF_PROVIDER` | `projects/med-aid-advisor/locations/global/workloadIdentityPools/github-pool/providers/github-provider` | Full provider resource name |
| `WIF_POOL` | `projects/med-aid-advisor/locations/global/workloadIdentityPools/github-pool` | Full pool resource name |
| `GCP_SERVICE_ACCOUNT_EMAIL` | `github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com` | Service account email from Step 1 |

### 2. GitHub Repository Settings

Enable Actions in your repository:
1. Go to your repository on GitHub
2. Click Settings → Actions → General
3. Under "Workflow permissions", ensure "Read and write permissions" are enabled
4. Click "Save"

## Workflow Configuration

The workflow `.github/workflows/deploy-cloudrun.yml` includes:

- **Triggers**: Automatically runs on push to `main` branch, or manually via workflow_dispatch
- **Build**: Uses Docker Buildx to create multi-platform images (linux/amd64)
- **Cache**: Caches Docker layers for faster builds
- **Push**: Pushes image to Artifact Registry (europe-west4-docker.pkg.dev)
- **Deploy**: Deploys new revision to Cloud Run service

## Manual Deployment

You can also trigger a deployment manually:

1. Go to Actions tab in your repository
2. Select "Deploy to Cloud Run" workflow
3. Click "Run workflow" button
4. Optionally, select a specific branch

## Deployment URLs

- **Service URL**: https://medaid-questionnaire-84640843558.europe-west4.run.app
- **GCP Console**: https://console.cloud.google.com/run?project=med-aid-advisor

## Troubleshooting

### Workflow Fails with "Permission denied"
- Verify service account has required roles
- Check Workload Identity Federation configuration
- Ensure GitHub secrets are correctly set

### Build Fails
- Check the Actions logs for specific error messages
- Verify Dockerfile is correct
- Ensure all dependencies are in package.json

### Deployment Fails
- Verify Cloud Run API is enabled
- Check service exists and is healthy
- Review deployment logs in GCP Console


---

## Alternative: Simple Authentication (Service Account Key)

If you prefer a simpler setup without Workload Identity Federation, you can use the `deploy-cloudrun-simple.yml` workflow:

### Step 1: Create Service Account Key

```bash
# Create a service account if you haven't already
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer" \
  --project=med-aid-advisor

# Grant required roles
gcloud projects add-iam-policy-binding med-aid-advisor \
  --member="serviceAccount:github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding med-aid-advisor \
  --member="serviceAccount:github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com" \
  --role="roles/run.developer"

gcloud projects add-iam-policy-binding med-aid-advisor \
  --member="serviceAccount:github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Create and download the service account key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions-deployer@med-aid-advisor.iam.gserviceaccount.com \
  --project=med-aid-advisor
```

### Step 2: Add GitHub Secret

Add the following secret to your GitHub repository:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GCP_CREDENTIALS` | `<contents of github-actions-key.json>` | Full JSON content of the service account key |

**⚠️ Security Note**: The simple authentication method stores service account credentials in GitHub secrets. For better security, consider using Workload Identity Federation (see above).
