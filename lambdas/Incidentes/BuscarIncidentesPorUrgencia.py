import os
import json
import boto3
from boto3.dynamodb.conditions import Key

VALID_URGENCIES = {"low","medium","high","critical"}

def lambda_handler(event, context):
    try:
        table_name = os.environ.get("INCIDENTS_TABLE", "Incidents")
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(table_name)

        params = event.get("queryStringParameters") or {}
        urgency = params.get("urgency")

        if not urgency:
            return {"statusCode": 400, "body": json.dumps({"message":"Debe enviar ?urgency=low|medium|high|critical"})}

        if urgency not in VALID_URGENCIES:
            return {"statusCode": 400, "body": json.dumps({"message":"valor de urgency inválido"})}

        resp = table.query(
            IndexName="IncidentsByUrgency",
            KeyConditionExpression=Key("urgency").eq(urgency)
        )

        return {"statusCode": 200, "body": json.dumps(resp.get("Items", []))}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"message":"error interno","error": str(e)})}
