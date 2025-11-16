import boto3
import json
import os

def lambda_handler(event, context):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("Incidents")

    params = event.get("queryStringParameters") or {}
    student_id = params.get("student_id")

    if not student_id:
        return {
            "statusCode": 400,
            "body": "Debe enviar ?student_id=valor"
        }

    resp = table.query(
        IndexName="IncidentsByStudent",
        KeyConditionExpression="student_id = :s",
        ExpressionAttributeValues={":s": student_id}
    )

    return {
        "statusCode": 200,
        "body": json.dumps(resp["Items"])
    }
