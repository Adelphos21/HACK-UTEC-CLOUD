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
        student_id = params.get("student_id")

        if not student_id:
            return {"statusCode": 400, "body": json.dumps({"message":"Debe enviar ?student_id=valor"})}

        resp = table.query(
            IndexName="IncidentsByStudent",
            KeyConditionExpression=Key("student_id").eq(student_id)
        )

        return {"statusCode": 200, "body": json.dumps(resp.get("Items", []))}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"message":"error interno","error": str(e)})}
