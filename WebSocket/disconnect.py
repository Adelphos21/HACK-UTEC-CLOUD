import boto3
import os

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["SOCKET_TABLE"])

def handler(event, context):
    connection_id = event["requestContext"]["connectionId"]

    # Eliminar la conexión
    table.delete_item(Key={"connectionId": connection_id})

    return {"statusCode": 200}
