variable "getItemLambda" {
  default = {
    handler = "getUser.getItemHandler"
    name    = "get-item-function"
  }
}

variable "createItemLambda" {
  default = {
    handler = "createItem.createItemHandler"
    name    = "create-item-function"
  }
}

variable "updateItemLambda" {
  default = {
    handler = "updateItem.updateItemHandler"
    name    = "update-item-function"
  }
}
