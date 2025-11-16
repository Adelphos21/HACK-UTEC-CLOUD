import boto3, os, json

def notify_admins(message):
    ddb = boto3.resource("dynamodb")
    table = ddb.Table(os.environ["SOCKET_TABLE"])
    api_gateway = boto3.client("apigatewaymanagementapi",
        endpoint_url=os.environ["WEBSOCKET_ENDPOINT"]
    )

    # Obtener todas las conexiones de admins
    resp = table.scan(
        FilterExpression="rol = :r",
        ExpressionAttributeValues={":r": "Personal administrativo"}
    )

    for item in resp.get("Items", []):
        connection_id = item["connectionId"]
        try:
            api_gateway.post_to_connection(
                Data=json.dumps(message),
                ConnectionId=connection_id
            )
        except Exception as e:
            # Si falla (cliente desconectado), lo eliminamos
            table.delete_item(Key={"connectionId": connection_id})
