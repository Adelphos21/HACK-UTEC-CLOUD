import os
import json
import boto3
from datetime import datetime, timezone

ddb = boto3.resource("dynamodb")
table = ddb.Table(os.environ["INCIDENTS_TABLE"])

EDITABLE_FIELDS = ["type", "description", "floor", "ambient", "urgency"]

def lambda_handler(event, context):
    try:
        body = event.get("body")
        if isinstance(body, str):
            body = json.loads(body)

        incident_id = body.get("incident_id")
        if not incident_id:
            return {"statusCode": 400, "body": json.dumps({"message": "incident_id requerido"})}

        # obtener incidente
        resp = table.get_item(Key={"incident_id": incident_id})
        if "Item" not in resp:
            return {"statusCode": 404, "body": json.dumps({"message": "Incidente no encontrado"})}

        incident = resp["Item"]

        # validar estado
        if incident["status"] != "pending":
            return {
                "statusCode": 403,
                "body": json.dumps({"message": "Solo se puede editar si el incidente está en estado 'pending'"})
            }

        # construir expresiones dinámicas
        update_expr = []
        expr_values = {}
        expr_names = {}

        for field in EDITABLE_FIELDS:
            if field in body:
                update_expr.append(f"#f_{field} = :v_{field}")
                expr_values[f":v_{field}"] = body[field]
                expr_names[f"#f_{field}"] = field

        if not update_expr:
            return {"statusCode": 400, "body": json.dumps({"message": "No hay campos válidos para actualizar"})}

        # actualizar updated_at
        now = datetime.now(timezone.utc).isoformat()
        update_expr.append("updated_at = :now")
        expr_values[":now"] = now

        table.update_item(
            Key={"incident_id": incident_id},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values
        )

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Incidente actualizado",
                "incident_id": incident_id,
                "updated_at": now
            })
        }

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
