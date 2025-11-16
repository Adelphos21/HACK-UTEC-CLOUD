import boto3
import os
import jwt

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["SOCKET_TABLE"])

def handler(event, context):

    connection_id = event["requestContext"]["connectionId"]

    # Leer JWT desde los query params:
    params = event.get("queryStringParameters") or {}
    token = params.get("token")

    rol = "Estudiante"
    user_id = ""

    if token:
        try:
            payload = jwt.decode(
                token,
                os.environ["JWT_SECRET"],
                algorithms=["HS256"]
            )
            rol = payload.get("rol", "Estudiante")
            user_id = payload.get("user_id", "")
        except Exception as e:
            print("Error en decode JWT:", e)

    # Guardamos la conexión en DynamoDB
    table.put_item(Item={
        "connectionId": connection_id,
        "rol": rol,
        "user_id": user_id
    })

    return {"statusCode": 200}
