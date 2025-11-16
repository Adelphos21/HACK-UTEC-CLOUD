import boto3
import json
import os

ddb = boto3.resource("dynamodb")
table = ddb.Table(os.environ["SOCKET_TABLE"])

# Crear el cliente de API Gateway 
api_gateway = boto3.client(
    "apigatewaymanagementapi",
    endpoint_url=os.environ["WEBSOCKET_ENDPOINT"]
)

def notify_role(message, rol_objetivo):
    try:
        resp = table.scan(
            FilterExpression="rol = :r",
            ExpressionAttributeValues={":r": rol_objetivo}
        )

        for item in resp.get("Items", []):
            connection_id = item["connectionId"]
            try:
                api_gateway.post_to_connection(
                    Data=json.dumps(message),
                    ConnectionId=connection_id
                )
                print(f"✓ Mensaje enviado a conexión {connection_id} (rol: {rol_objetivo})")
            except Exception as e:
                print(f"✗ Error enviando a {connection_id}: {str(e)}")
                # Si la conexión ya no existe, eliminarla de la tabla
                table.delete_item(Key={"connectionId": connection_id})
    except Exception as e:
        print(f"Error en notify_role: {str(e)}")


def notify_user(message, user_id_target):

    try:
        resp = table.scan(
            FilterExpression="user_id = :u",
            ExpressionAttributeValues={":u": user_id_target}
        )

        for item in resp.get("Items", []):
            connection_id = item["connectionId"]
            try:
                api_gateway.post_to_connection(
                    Data=json.dumps(message),
                    ConnectionId=connection_id
                )
                print(f"✓ Mensaje enviado a usuario {user_id_target}")
            except Exception as e:
                print(f"✗ Error enviando a usuario {user_id_target}: {str(e)}")
                table.delete_item(Key={"connectionId": connection_id})
    except Exception as e:
        print(f"Error en notify_user: {str(e)}")


def notify_all(message):
    try:
        resp = table.scan()

        for item in resp.get("Items", []):
            connection_id = item["connectionId"]
            try:
                api_gateway.post_to_connection(
                    Data=json.dumps(message),
                    ConnectionId=connection_id
                )
                print(f"✓ Mensaje broadcast enviado a {connection_id}")
            except Exception as e:
                print(f"✗ Error en broadcast a {connection_id}: {str(e)}")
                table.delete_item(Key={"connectionId": connection_id})
    except Exception as e:
        print(f"Error en notify_all: {str(e)}")

def notify_admins(message):
    notify_role(message, "Personal administrativo")
    notify_role(message, "Autoridad")