import os
import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

VALID_URGENCIES = {"low","medium","high","critical"}

def clean_decimals(obj):
    if isinstance(obj, list):
        return [clean_decimals(i) for i in obj]
    if isinstance(obj, dict):
        return {k: clean_decimals(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        # Convertir a int si no tiene decimales
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
        urgency = params.get("urgency")

        if not urgency:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Debe enviar ?urgency=low|medium|high|critical"})
            }

        if urgency not in VALID_URGENCIES:
            return {"statusCode": 400, "body": json.dumps({"message": "valor de urgency inválido"})}

        resp = table.query(
            IndexName="IncidentsByUrgency",
            KeyConditionExpression=Key("urgency").eq(urgency)
        )

        items = clean_decimals(resp.get("Items", []))

        return {"statusCode": 200, "body": json.dumps(items)}

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "error interno", "error": str(e)})
        }
