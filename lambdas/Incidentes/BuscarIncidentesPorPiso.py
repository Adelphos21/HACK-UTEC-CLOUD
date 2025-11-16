import os
import json
import boto3
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    try:
        table_name = os.environ.get("INCIDENTS_TABLE", "Incidents")
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(table_name)

        params = event.get("queryStringParameters") or {}
        floor = params.get("floor")

        if floor is None:
            return {"statusCode": 400, "body": json.dumps({"message":"Debe enviar ?floor=numero"})}

        try:
            floor_val = int(floor)
        except ValueError:
            return {"statusCode": 400, "body": json.dumps({"message":"El floor debe ser un número entero"})}

        resp = table.query(
            IndexName="IncidentsByFloor",
            KeyConditionExpression=Key("floor").eq(floor_val)
        )

        return {"statusCode": 200, "body": json.dumps(resp.get("Items", []))}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"message":"error interno","error": str(e)})}
