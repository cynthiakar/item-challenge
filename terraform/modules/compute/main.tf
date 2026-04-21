# IAM roles for Lambdas
resource "aws_iam_role" "ts_lambda" {
  name = "item_api_lambda_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Cloudwatch Access
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.ts_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


# DynamoDB Access Policy for Lambdas
resource "aws_iam_policy" "dynamodb_access" {
  name        = "item_api_dynamodb_policy"
  description = "Allows Lambdas to access the ExamItems table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        # Restrict access to ONLY this table
        Resource = aws_dynamodb_table.items_table.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamo_attach" {
  role       = aws_iam_role.ts_lambda.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# Package the Lambda function code
# TODO: figure out how to package and access different handlers
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/dist"
  output_path = "${path.module}/lambda_function.zip"
}


# Attach the policy to your shared Lambda role
resource "aws_iam_role_policy_attachment" "lambda_dynamo_attach" {
  role       = aws_iam_role.ts_lambda.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

##### LAMBDAS

### GET - getItemHandler
resource "aws_lambda_function" "get_item_lambda" {
  function_name = var.getItemLambda.name
  handler       = var.getItemLambda.handler
  filename      = data.archive_file.ts_lambda.output_path
  role          = aws_iam_role.ts_lambda.arn
  runtime       = "nodejs20.x"
}
resource "aws_lambda_permission" "apigw_get_item" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_item_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.items_api.execution_arn}/*/*"
}

### POST - createItemHandler
resource "aws_lambda_function" "create_item_lambda" {
  function_name = var.createItemLambda.name
  handler       = var.createItemLambda.handler
  filename      = data.archive_file.ts_lambda.output_path
  role          = aws_iam_role.ts_lambda.arn
  runtime       = "nodejs20.x"
}
resource "aws_lambda_permission" "apigw_create_item" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_item_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.items_api.execution_arn}/*/*"
}

### PUT - updateItemHandler
resource "aws_lambda_function" "update_item_lambda" {
  function_name = var.updateItemLambda.name
  handler       = var.updateItemLambda.handler
  filename      = data.archive_file.ts_lambda.output_path
  role          = aws_iam_role.ts_lambda.arn
  runtime       = "nodejs20.x"
}
resource "aws_lambda_permission" "apigw_update_item" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_item_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.items_api.execution_arn}/*/*"
}


