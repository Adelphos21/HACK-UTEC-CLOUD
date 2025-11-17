import os
import json
import boto3
from datetime import datetime, timezone
from WebSocket.notify import notify_user

from lambdas.utils import response

ddb = boto3.resource("dynamodb")
table = ddb.Table(os.environ["INCIDENTS_TABLE"])
INCIDENT_TYPE_LABELS = {
    'infrastructure': 'Infraestructura',
    'electric_failure': 'Falla Eléctrica',
    'water_failure': 'Falla de Agua',
    'security': 'Seguridad',
    'cleaning': 'Limpieza',
    'technology': 'Tecnología',
    'other': 'Otro'
}

FIELD_LABELS = {
    'type': 'tipo',
    'description': 'descripción',
    'floor': 'piso',
    'ambient': 'ambiente',
    'urgency': 'urgencia'
}

EDITABLE_FIELDS = ["type", "description", "floor", "ambient", "urgency"]

def lambda_handler(event, context):
    try:
        body = event.get("body")
        if isinstance(body, str):
            body = json.loads(body)

        incident_id = body.get("incident_id")
        admin_user_id = body.get("admin_user_id") 
        if not incident_id:
            return response(400, {"message": "incident_id requerido"})

        # obtener incidente
        resp = table.get_item(Key={"incident_id": incident_id})
        if "Item" not in resp:
            return response(404, {"message": "Incidente no encontrado"})

        incident = resp["Item"]
        created_by = incident.get("created_by")
        # validar estado
        if incident["status"] != "pending":
            return response(
                403,
                {"message": "Solo se puede editar si el incidente está en estado 'pending'"}
            )

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
            return response(400, {"message": "No hay campos válidos para actualizar"})

        now = datetime.now(timezone.utc).isoformat()
        update_expr.append("updated_at = :now")
        expr_values[":now"] = now

        table.update_item(
            Key={"incident_id": incident_id},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values
        )


        # Notificación 3: Admin actualizó el incidente → notificar al estudiante
        if created_by and created_by != "unknown":
            # Obtener el tipo de incidente actualizado o usar el existente
            incident_type = body.get("type", incident.get("type"))
            incident_type_label = INCIDENT_TYPE_LABELS.get(incident_type, "Incidente")
            
            # Convertir campos actualizados a etiquetas legibles
            updated_fields = [key for key in body.keys() if key in EDITABLE_FIELDS]
            updated_fields_labels = [FIELD_LABELS.get(f, f) for f in updated_fields]
            
            message = {
                "tipo": "incidente_editado",
                "incident_id": incident_id,
                "tipo_incidente": incident_type_label,  
                "piso": body.get("floor", incident.get("floor")),      
                "ambiente": body.get("ambient", incident.get("ambient")), 
                "mensaje": "Un administrador ha actualizado tu incidente",
                "campos_actualizados": updated_fields,  
                "campos_actualizados_labels": updated_fields_labels,  
                "timestamp": now
            }
            notify_user(message, created_by)

        
        return response(
            200,
            {
                "message": "Incidente actualizado",
                "incident_id": incident_id,
                "updated_at": now
            }
        )

    except Exception as e:
        return response(500, {"error": str(e)})
