import boto3
import os
import json

ddb = boto3.resource("dynamodb")
table = ddb.Table(os.environ["SOCKET_TABLE"])

def handler(event, context):
    """
    Maneja las conexiones WebSocket y guarda la info en DynamoDB
    """
    try:
        connection_id = event["requestContext"]["connectionId"]
        
        # Obtener query string parameters
        query_params = event.get("queryStringParameters") or {}
        
        user_id = query_params.get("user_id")
        rol = query_params.get("rol")
        token = query_params.get("token")  # opcional
        
        print(f"Nueva conexión: {connection_id}")
        print(f"Query params: {query_params}")
        print(f"user_id: {user_id}, rol: {rol}")
        
        # Validar que user_id y rol existan
        if not user_id:
            print("❌ Error: user_id es requerido")
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "user_id es requerido"})
            }
        
        if not rol:
            print("❌ Error: rol es requerido")
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "rol es requerido"})
            }
        
        # Guardar conexión en DynamoDB
        item = {
            "connectionId": connection_id,
            "user_id": user_id,
            "rol": rol,
            "connected_at": event["requestContext"]["requestTimeEpoch"]
        }
        
        # Si hay token, validarlo (opcional)
        if token:
            item["token"] = token
            # Aquí podrías validar el JWT si quieres
        
        table.put_item(Item=item)
        
        print(f"✅ Conexión guardada: {item}")
        
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Conectado exitosamente"})
        }
        
    except Exception as e:
        print(f"❌ Error en connect: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }