import boto3
import os
import json
from datetime import datetime, timezone

ROLES_AUTORIZADOS = ["Personal administrativo", "Autoridad"]

ddb = boto3.resource("dynamodb")
table = ddb.Table(os.environ["INCIDENTS_TABLE"])
users_table = ddb.Table(os.environ["USERS_TABLE"])

def lambda_handler(event, context):
    try:
        # Parseo del body
        body = event.get("body")
        if isinstance(body, str):
            body = json.loads(body)

        incident_id = body.get("incident_id")
        new_status = body.get("new_status")
        user_id = body.get("user_id")   # usuario que intenta modificar

        # Validar campos
        if not incident_id or not new_status or not user_id:
            return {
                "statusCode": 400,
                "body": "Campos requeridos: incident_id, new_status, user_id"
            }

        # Validar status permitido
        if new_status not in ["pending", "in_progress", "completed", "rejected"]:
            return {
                "statusCode": 400,
                "body": "Estado inválido"
            }

        # Obtener rol del usuario
        user_resp = users_table.get_item(Key={"user_id": user_id})
        if "Item" not in user_resp:
            return {"statusCode": 404, "body": "Usuario no encontrado"}

        rol = user_resp["Item"].get("rol")

        if rol not in ROLES_AUTORIZADOS:
            return {
                "statusCode": 403,
                "body": "No tiene permisos para actualizar incidentes"
            }

        # Obtener incidente
        incident_resp = table.get_item(Key={"incident_id": incident_id})
        if "Item" not in incident_resp:
            return {"statusCode": 404, "body": "Incidente no encontrado"}

        now = datetime.now(timezone.utc).isoformat()

        # Actualizar incidente
        table.update_item(
            Key={"incident_id": incident_id},
            UpdateExpression="SET #s = :new_status, updated_at = :now, history = list_append(history, :entry)",
            ExpressionAttributeNames={
                "#s": "status"
            },
            ExpressionAttributeValues={
                ":new_status": new_status,
                ":now": now,
                ":entry": [{
                    "action": f"status_changed_to_{new_status}",
                    "by": user_id,
                    "at": now
                }]
            }
        )

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Estado actualizado correctamente",
                "incident_id": incident_id,
                "new_status": new_status
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": f"Error interno: {str(e)}"
        }
