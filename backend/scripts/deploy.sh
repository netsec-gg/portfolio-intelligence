#!/bin/bash

# Portify AWS ECS Fargate Deployment Script
# This script automates the deployment of Portify to AWS ECS Fargate

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"
DOCKER_DIR="$PROJECT_ROOT"

# Default values
ENVIRONMENT="development"
AWS_REGION="us-east-1"
PROJECT_NAME="portify"
SKIP_TERRAFORM=false
SKIP_DOCKER=false
SKIP_MIGRATION=false
FORCE_DEPLOY=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command_exists aws; then
        missing_tools+=("aws-cli")
    fi
    
    if ! command_exists terraform; then
        missing_tools+=("terraform")
    fi
    
    if ! command_exists docker; then
        missing_tools+=("docker")
    fi
    
    if ! command_exists jq; then
        missing_tools+=("jq")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install the missing tools and try again."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker and try again."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Function to validate terraform.tfvars
validate_terraform_vars() {
    print_status "Validating Terraform variables..."
    
    if [ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]; then
        print_error "terraform.tfvars not found in $TERRAFORM_DIR"
        print_error "Please copy terraform.tfvars.example to terraform.tfvars and update with your values."
        exit 1
    fi
    
    # Check for required variables
    local required_vars=("db_password" "jwt_secret" "openai_api_key" "kite_api_key" "kite_api_secret")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var\s*=" "$TERRAFORM_DIR/terraform.tfvars" || \
           grep -q "^$var\s*=\s*\"your-" "$TERRAFORM_DIR/terraform.tfvars"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing or placeholder values for required variables: ${missing_vars[*]}"
        print_error "Please update terraform.tfvars with actual values."
        exit 1
    fi
    
    print_success "Terraform variables validated!"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    if [ "$SKIP_TERRAFORM" = true ]; then
        print_warning "Skipping Terraform deployment..."
        return
    fi
    
    print_status "Deploying infrastructure with Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    terraform init
    
    # Plan deployment
    print_status "Planning Terraform deployment..."
    terraform plan -out=tfplan
    
    # Apply deployment
    if [ "$FORCE_DEPLOY" = true ]; then
        print_status "Applying Terraform deployment (auto-approved)..."
        terraform apply -auto-approve tfplan
    else
        print_status "Applying Terraform deployment..."
        terraform apply tfplan
    fi
    
    # Get outputs
    print_status "Getting Terraform outputs..."
    ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url)
    ALB_DNS_NAME=$(terraform output -raw alb_dns_name)
    ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_id)
    ECS_SERVICE_NAME=$(terraform output -raw ecs_service_name)
    
    print_success "Infrastructure deployed successfully!"
    print_status "ECR Repository: $ECR_REPOSITORY_URL"
    print_status "Application URL: http://$ALB_DNS_NAME"
    
    cd "$PROJECT_ROOT"
}

# Function to build and push Docker image
build_and_push_image() {
    if [ "$SKIP_DOCKER" = true ]; then
        print_warning "Skipping Docker build and push..."
        return
    fi
    
    print_status "Building and pushing Docker image..."
    
    # Get ECR repository URL if not set
    if [ -z "$ECR_REPOSITORY_URL" ]; then
        cd "$TERRAFORM_DIR"
        ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url)
        cd "$PROJECT_ROOT"
    fi
    
    # Login to ECR
    print_status "Logging in to ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$ECR_REPOSITORY_URL"
    
    # Build Docker image
    print_status "Building Docker image..."
    docker build -t "$PROJECT_NAME" "$DOCKER_DIR"
    
    # Tag image
    print_status "Tagging Docker image..."
    docker tag "$PROJECT_NAME:latest" "$ECR_REPOSITORY_URL:latest"
    docker tag "$PROJECT_NAME:latest" "$ECR_REPOSITORY_URL:$(date +%Y%m%d-%H%M%S)"
    
    # Push image
    print_status "Pushing Docker image to ECR..."
    docker push "$ECR_REPOSITORY_URL:latest"
    docker push "$ECR_REPOSITORY_URL:$(date +%Y%m%d-%H%M%S)"
    
    print_success "Docker image built and pushed successfully!"
}

# Function to run database migrations
run_migrations() {
    if [ "$SKIP_MIGRATION" = true ]; then
        print_warning "Skipping database migrations..."
        return
    fi
    
    print_status "Running database migrations..."
    
    # Get cluster and service names if not set
    if [ -z "$ECS_CLUSTER_NAME" ] || [ -z "$ECS_SERVICE_NAME" ]; then
        cd "$TERRAFORM_DIR"
        ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_id)
        ECS_SERVICE_NAME=$(terraform output -raw ecs_service_name)
        cd "$PROJECT_ROOT"
    fi
    
    # Get a running task ARN
    TASK_ARN=$(aws ecs list-tasks \
        --cluster "$ECS_CLUSTER_NAME" \
        --service-name "$ECS_SERVICE_NAME" \
        --desired-status RUNNING \
        --query 'taskArns[0]' \
        --output text)
    
    if [ "$TASK_ARN" = "None" ] || [ -z "$TASK_ARN" ]; then
        print_warning "No running tasks found. Skipping migrations."
        print_warning "You may need to run migrations manually after the service is running."
        return
    fi
    
    # Run migrations
    print_status "Executing migrations on task: $TASK_ARN"
    aws ecs execute-command \
        --cluster "$ECS_CLUSTER_NAME" \
        --task "$TASK_ARN" \
        --container "$PROJECT_NAME-container" \
        --interactive \
        --command "npm run migrate"
    
    print_success "Database migrations completed!"
}

# Function to update ECS service
update_ecs_service() {
    print_status "Updating ECS service..."
    
    # Get cluster and service names if not set
    if [ -z "$ECS_CLUSTER_NAME" ] || [ -z "$ECS_SERVICE_NAME" ]; then
        cd "$TERRAFORM_DIR"
        ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_id)
        ECS_SERVICE_NAME=$(terraform output -raw ecs_service_name)
        cd "$PROJECT_ROOT"
    fi
    
    # Force new deployment
    aws ecs update-service \
        --cluster "$ECS_CLUSTER_NAME" \
        --service "$ECS_SERVICE_NAME" \
        --force-new-deployment \
        >/dev/null
    
    print_status "Waiting for service to stabilize..."
    aws ecs wait services-stable \
        --cluster "$ECS_CLUSTER_NAME" \
        --services "$ECS_SERVICE_NAME"
    
    print_success "ECS service updated successfully!"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get ALB DNS name if not set
    if [ -z "$ALB_DNS_NAME" ]; then
        cd "$TERRAFORM_DIR"
        ALB_DNS_NAME=$(terraform output -raw alb_dns_name)
        cd "$PROJECT_ROOT"
    fi
    
    # Wait for ALB to be ready
    print_status "Waiting for load balancer to be ready..."
    sleep 30
    
    # Check health endpoint
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Checking health endpoint (attempt $attempt/$max_attempts)..."
        
        if curl -f -s "http://$ALB_DNS_NAME/api/health" >/dev/null; then
            print_success "Health check passed!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Health check failed after $max_attempts attempts"
            print_error "Please check the logs: aws logs tail /ecs/$PROJECT_NAME --follow"
            exit 1
        fi
        
        sleep 30
        ((attempt++))
    done
    
    # Test API endpoint
    print_status "Testing API endpoint..."
    HEALTH_RESPONSE=$(curl -s "http://$ALB_DNS_NAME/api/health" | jq -r '.status' 2>/dev/null || echo "error")
    
    if [ "$HEALTH_RESPONSE" = "healthy" ]; then
        print_success "API is responding correctly!"
    else
        print_warning "API health check returned: $HEALTH_RESPONSE"
    fi
}

# Function to display deployment summary
display_summary() {
    print_success "Deployment completed successfully!"
    echo
    echo "=== Deployment Summary ==="
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo "Project: $PROJECT_NAME"
    echo
    
    if [ -n "$ALB_DNS_NAME" ]; then
        echo "Application URL: http://$ALB_DNS_NAME"
        echo "Health Check: http://$ALB_DNS_NAME/api/health"
        echo "API Documentation: http://$ALB_DNS_NAME/api/docs"
        echo
        echo "Webhook URLs:"
        echo "  Slack: http://$ALB_DNS_NAME/api/webhooks/slack"
        echo "  Telegram: http://$ALB_DNS_NAME/api/webhooks/telegram"
        echo "  WhatsApp: http://$ALB_DNS_NAME/api/webhooks/whatsapp"
        echo
    fi
    
    echo "Useful commands:"
    echo "  View logs: aws logs tail /ecs/$PROJECT_NAME --follow"
    echo "  Update service: aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --force-new-deployment"
    echo "  Scale service: aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --desired-count <count>"
    echo
    echo "Next steps:"
    echo "1. Configure your messaging platform webhooks"
    echo "2. Set up ChatGPT integration using the API documentation"
    echo "3. Configure monitoring and alerting"
    echo "4. Set up a custom domain (optional)"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -e, --environment ENV     Set environment (development, staging, production)"
    echo "  -r, --region REGION       Set AWS region (default: us-east-1)"
    echo "  -p, --project NAME        Set project name (default: portify)"
    echo "  --skip-terraform          Skip Terraform deployment"
    echo "  --skip-docker             Skip Docker build and push"
    echo "  --skip-migration          Skip database migrations"
    echo "  --force                   Auto-approve Terraform deployment"
    echo "  -h, --help                Show this help message"
    echo
    echo "Examples:"
    echo "  $0                        Deploy with default settings"
    echo "  $0 -e production -r us-west-2"
    echo "  $0 --skip-terraform       Only build and deploy Docker image"
    echo "  $0 --force                Deploy without confirmation prompts"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            AWS_REGION="$2"
            shift 2
            ;;
        -p|--project)
            PROJECT_NAME="$2"
            shift 2
            ;;
        --skip-terraform)
            SKIP_TERRAFORM=true
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-migration)
            SKIP_MIGRATION=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main deployment flow
main() {
    echo "=== Portify AWS ECS Fargate Deployment ==="
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo "Project: $PROJECT_NAME"
    echo
    
    check_prerequisites
    
    if [ "$SKIP_TERRAFORM" = false ]; then
        validate_terraform_vars
    fi
    
    deploy_infrastructure
    build_and_push_image
    update_ecs_service
    run_migrations
    verify_deployment
    display_summary
}

# Run main function
main "$@" 