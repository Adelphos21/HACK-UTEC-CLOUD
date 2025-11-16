import boto3
import json
import os

def lambda_handler(event, context):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("Incidents")

    params = event.get("queryStringParameters") or {}
    urgency = params.get("urgency")

    if not urgency:
        return {
            "statusCode": 400,
            "body": "Debe enviar ?urgency=low|medium|high"
        }

    resp = table.query(
        IndexName="IncidentsByUrgency",
        KeyConditionExpression="urgency = :u",
        ExpressionAttributeValues={":u": urgency}
    )

    return {
        "statusCode": 200,
        "body": json.dumps(resp["Items"])
    }
