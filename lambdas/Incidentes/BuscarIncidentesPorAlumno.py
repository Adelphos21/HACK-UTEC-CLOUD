import os
import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

def clean_decimals(obj):
    if isinstance(obj, list):
        return [clean_decimals(i) for i in obj]
    if isinstance(obj, dict):
        return {k: clean_decimals(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    return obj

def lambda_handler(event, context):
    try:
        table_name = os.environ.get("INCIDENTS_TABLE", "Incidents")
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(table_name)

        params = event.get("queryStringParameters") or {}
        student_id = params.get("student_id")

        if not student_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Debe enviar ?student_id=valor"})
            }

        resp = table.query(
            IndexName="IncidentsByStudent",
            KeyConditionExpression=Key("student_id").eq(student_id)
        )

        items = clean_decimals(resp.get("Items", []))

        return {"statusCode": 200, "body": json.dumps(items)}

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "error interno", "error": str(e)})
        }
