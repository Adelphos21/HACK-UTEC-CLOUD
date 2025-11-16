import boto3
import json
import os

def lambda_handler(event, context):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("Incidents")

    params = event.get("queryStringParameters") or {}
    floor = params.get("floor")

    if not floor:
        return {
            "statusCode": 400,
            "body": "Debe enviar ?floor=numero"
        }

    try:
        floor = int(floor)
    except:
        return {
            "statusCode": 400,
            "body": "El floor debe ser un número"
        }

    resp = table.query(
        IndexName="IncidentsByFloor",
        KeyConditionExpression="floor = :f",
        ExpressionAttributeValues={":f": floor}
    )

    return {
        "statusCode": 200,
        "body": json.dumps(resp["Items"])
    }
