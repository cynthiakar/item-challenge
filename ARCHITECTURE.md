# Architecture Documentation

## Data Model Design: 

_DynamoDB table schema, key design, Global Secondary Index (GSI) strategy_

### Proposed Solution

For the basic DynamoDB schema, we should use the ID (UUID) as the Primary Key (PK) because it guarantees uniqueness and is highly performant for lookup operations. 4 of the 6 API operations use the ID as an input, so it will be used often as the lookup key. 

Given that each item also has versions, we should use a Sort Key (SK) to strategically pick the latest version without having to query an item and finding its latest version. The number of versions that an item has can vary. Since each ExamItem keeps track of its own version via the metadata.version attribute, we can use that to separate the latest vs historical versions. 

DynamoDB Schema:

- PK: ID
- SK: Version (Either 0 or metadata.version)

Every ExamItem stored will have one record whose SK is 0 to indicate that it's the latest version. In GET /api/items/:id, we can just query with PK as ID and SK as 0. This allows us to retrieve the latest ExamItem in O(1) time. However, this will require us to do two write operations for each POST /api/items call. One write operation with the SK as 0 to overwrite the current latest version and a second write operation with the SK as the actual metadata.version, so we can maintain the historical versioning trail. This way SK=0 is more of a functional way to reliably retrieve the latest version with just one lookup.

GSI Strategy:

This would be best informed by usage patterns. For example, using PK=Subject and SK=version could help us retrieve the latest version of ExamItems per subject. Similarly, using PK=Metadata.status could give us all the ExamItems that are in a certain phase such as "review". Each GSI does add to the overall storage cost, so it would be best to add and adapt as needed. 

### Considerations

Pros:
- Highly performant lookups
- This will improve the performance of "GET /api/items - List items with pagination". Assuming that we only want to list the latest versions of items, this will allow us to quickly query all the items and choose only the latest version. 
- Using the metadata.version as the SK, we can easily query for a chronological audit trail of an ExamItem, which will be helpful for "GET /api/items/:id/audit - Get audit trail for an item"

Cons:
- Two writes per save operation - including createItemRequest, updateItemRequest, and createVersionRequest
- Each current item will use double the storage to store the latest version and the identical historical version - this could be a significant cost given that the content object of the ExamItem could be quite long depending on the length of the question, options, correctAnswer, and explanation. 

### Alternative Solutions

1. Make use of ScanIndexForward feature in DynamoDB - We do not have to use SK=0 to represent the latest version. We can just write the SK as the metadata.version and keep incrementing, allowing us to avoid duplicating records. The ScanIndexForward set to false will sort in descending order and setting Limit=1 will return the latest version always. While this helps for the general use case of "GET /api/items/:id", the "GET /api/items" listing operation won't be able to make use of the SK=0 flag to quickly retrieve the latest version of all the items.
2. Add isLatest flag - We can keep the SK as the metadata.version and add another attribute to the record that indicates that it is the latest. However, we would need to query to retrieve every version and find the flag, which is much slower than our suggested O(1) operation. Additionally, we would need to update the record with the previous isLatest flag to false and save the new record with the flag set to True. 
3. Keep track of the latest version in a separate table - We could have a separate table with PK=ID where the value is always the latest version number. While this could be helpful as the number of records increase, it would require us to maintain another DB, meaning setting up another resource in our IaC and requiring a read operation to two tables as opposed to one.


## Infrastructure Choices:

_Why you chose specific services and configurations_

I left the Terraform resource definitions quite bare because monitoring the traffic and usage patterns live would allow for better tuning. Additionally, the straightforward configurations makes it easier for initial deployments and troubleshooting.

At a high level, I have implemented the following:

- 3 Lambdas
- API Gateway
- DynamoDB

### Lambdas
I created a Lambda for each API endpoint that I have implemented in the src/handlers folder. This will allow separate scaling and configurations for each endpoint depending on needs. I only added these 3 to the Terraform because it represents realistically what I currently have and prevents setting up unused resources. Each Lambda receives traffic via API Gateway integrations. 


### API Gateway

There is a root aws_api_gateway_resource to represent the /api/ part of the endpoint. The GET /api/items:id and PUT /api/items:id each require the ID to be identified in the endpoint path. The POST /api/items does not so it just directly chains the /items/ to the /api/ aws_api_gateway_resource. The other two chain to the /items/ aws_api_gateway_resource and also identify the ID as a part of the endpoint. 

### DynamoDB

I have set up one DynamoDB resource and added permissions to each Lambda to access that specific database ARN. Since the endpoints share the same storage, it makes sense to just have one DB connect to many Lambdas.


## Scalability: 

_How your design scales, potential bottlenecks_

### Scaling

The data model design of having PK=ID and SK=Version will allow read operations to remain quick even as traffic increases. I predict that there will be more read requests than write requests given the nature of the ExamItems data, but it's hard to say for certain without more observability/information. 

Having separate Lambdas for each handler function will also help decouple costly operations, allowing us to tune compute resources according to the needs of each API endpoint. This also allows for each Lambda function to scale independently, since Lambdas scale on demand, we shouldn't keep a lot of Lambdas available to serve an endpoint that doesn't receive as much traffic. Given that, we still need to tune how many Lambdas we should keep on "standby" as to reduce the overhead of having to wait for Lambdas to spin up if there is a spike in requests. 

One DynamoDB database shared amongst all the handlers will also help with the stateless nature of Lambdas. As a future implementation, we could also explore caches to speed up read operations or long term storage solutions such as S3s to store archival ExamItems that are rarely retrieved. The S3s would help reduce the cost of storage in DynamoDB.

The API Gateway allows us to manage and direct traffic to each Lambda function. It automatically scales to handle concurrent calls. For development, it also allows us to swap out the backend handlers without having to affect clients of the API.

### Potential Bottlenecks
1. As I mentioned above, the duplicated writes could be costly for both storage codes and write operation costs to DynamoDB, depending on the size of the content object.
2. For particular GSIs that I mentioned above, we risk having hot partitions. For example, with the subject GSI, if AP Biology has a lot more ExamItems than AP Computer Science, then there will be  a lot more traffic to that one partition than the other, causing performance issues.


## Security: 

_Authentication, authorization, encryption, IAM policies_

I haven't implemented too much security beyond IAM policies that follow the standard principle of least privilege. However, by having API Gateway front the endpoints, we can make use of features to centralize authentication and authorization before a request hits the Lambdas. Rate limiting and throttling also helps prevent DDOS attacks. Having Cloudwatch for all of these resources also makes observability/monitoring easier and allows us to identify/troubleshoot incidents or bugs. Having a healthy and stable service is one of the most significant ways to prevent against incidents. 

## Trade-offs: 

What you prioritized and what you'd add with more time

1. I prioritized the 3 API implementations that best represent the basic CRUD operations - create, get, and update. Given more time, I would implement the handlers for the other 3 API operations
2. Given my data model decisions, I would have adjusted the DynamoDB TS file to better fit the implementations that I detailed
3. Since I am new to TS, I prioritized the 3 basic APIs because the implementation is straightforward so it allows me to be more specific with validation and error handling, which is what I can carry over from my experience in other languages and focus more on architecture. 
4. Given my experience in cybersecurity, I would have liked to create a more detailed security strategy. However, I chose to focus on implementing the basic features first to give us a base to work off of. 

