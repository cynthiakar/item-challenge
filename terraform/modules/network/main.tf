resource "aws_api_gateway_rest_api" "items_api" {
  name = "ItemsAPI"
}

# /api root
resource "aws_api_gateway_resource" "api_root" {
  rest_api_id = aws_api_gateway_rest_api.items_api.id
  parent_id   = aws_api_gateway_rest_api.items_api.root_resource_id
  path_part   = "api"
}

# /api/items root resource
resource "aws_api_gateway_method" "items" {
  rest_api_id   = aws_api_gateway_rest_api.items_api.id
  resource_id   = aws_api_gateway_rest_api.api_root.id
  http_method   = "ANY"
  authorization = "NONE"
}


### POST /api/items - createItemHandler
resource "aws_api_gateway_method" "create_item" {
  rest_api_id   = aws_api_gateway_rest_api.items_api.id
  resource_id   = aws_api_gateway_resource.items.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_item" {
  rest_api_id             = aws_api_gateway_rest_api.items_api.id
  resource_id             = aws_api_gateway_resource.items.id
  http_method             = aws_api_gateway_method.create_item.http_method
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.create_item.invoke_arn
  integration_http_method = "POST"
}


##### /items/{id} resource
resource "aws_api_gateway_resource" "item_id" {
  rest_api_id = aws_api_gateway_rest_api.items_api.id
  parent_id   = aws_api_gateway_resource.items.id
  path_part   = "{id}"
}

### GET /api/items/:id - getItemHandler
resource "aws_api_gateway_method" "get_item" {
  rest_api_id   = aws_api_gateway_rest_api.items_api.id
  resource_id   = aws_api_gateway_resource.item_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_item" {
  rest_api_id             = aws_api_gateway_rest_api.items_api.id
  resource_id             = aws_api_gateway_resource.item_id.id
  http_method             = aws_api_gateway_method.get_item.http_method
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_item.invoke_arn
  integration_http_method = "POST"
}

### PUT /api/items/:id - updateItemHandler
resource "aws_api_gateway_method" "update_item" {
  rest_api_id   = aws_api_gateway_rest_api.items_api.id
  resource_id   = aws_api_gateway_resource.item_id.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "update_item" {
  rest_api_id             = aws_api_gateway_rest_api.items_api.id
  resource_id             = aws_api_gateway_resource.item_id.id
  http_method             = aws_api_gateway_method.update_item.http_method
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.update_item.invoke_arn
  integration_http_method = "POST"
}


