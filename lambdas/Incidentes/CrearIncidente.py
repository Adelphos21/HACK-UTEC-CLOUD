# lambda_function.py
import os, json, uuid, time
import boto3
from datetime import datetime, timezone
from WebSocket.notify import notify_admins
from lambdas.utils import response

ddb = boto3.resource('dynamodb')
table = ddb.Table("Incidents")
users_table = ddb.Table(os.environ["USERS_TABLE"])
INCIDENT_TYPE_LABELS = {
    'infrastructure': 'Infraestructura',
    'electric_failure': 'Falla Eléctrica',
    'water_failure': 'Falla de Agua',
    'security': 'Seguridad',
    'cleaning': 'Limpieza',
    'technology': 'Tecnología',
    'other': 'Otro'
}

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    # validate simple
    if 'type' not in body or 'description' not in body:
        return response(400, {"message": "type and description required"})
    if body.get('urgency') not in ('low','medium','high','critical'):
        return response(400, {"message": "invalid urgency"})

    incident_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()
    created_by = body.get('created_by', 'unknown')
    reported_by_name = "Usuario Desconocido"
    try:
        if created_by != 'unknown':
            user_response = users_table.get_item(Key={"user_id": created_by})
            if "Item" in user_response:
                user = user_response["Item"]
                # Construir nombre completo
                nombre = user.get("nombre", user.get("nombres", ""))
                apellidos = user.get("apellidos", "")
                reported_by_name = f"{nombre} {apellidos}".strip() or user.get("correo", "Usuario")
    except Exception as e:
        print(f"Error obteniendo usuario: {str(e)}")
        # Si falla, usar correo o user_id
        reported_by_name = created_by
    item = {
        "incident_id": incident_id,
        "type": body['type'],
        "floor": body['floor'],
        "ambient": body['ambient'],
        "description": body['description'],
        "urgency": body.get('urgency', 'low'),
        "status": "pending",
        "created_by": body.get('created_by', 'unknown'),
        "reported_by_name": reported_by_name,
        "created_at": now,
        "updated_at": now,
        "history": [{
            "action":"created",
            "by": body.get('created_by','unknown'), 
            "by_name": reported_by_name,
            "at": now}]
    }
    table.put_item(Item=item)
    incident_type_label = INCIDENT_TYPE_LABELS.get(item["type"], "Incidente")
    
    message = {
        "tipo": "nuevo_incidente",
        "incident_id": incident_id,
        "tipo_incidente": incident_type_label, 
        "descripcion": item["description"],
        "urgencia": item["urgency"],
        "estado": item["status"],
        "piso": item["floor"],
        "ambiente": item["ambient"],
        "reportado_por": reported_by_name
    }
    notify_admins(message)
    return response(201, {
        "success": True,
        "message": "Incidente creado exitosamente",
        "data": {
            "incident_id": item["incident_id"],
            "type": item["type"],
            "floor": item["floor"],
            "ambient": item["ambient"],
            "description": item["description"],
            "urgency": item["urgency"],
            "status": item["status"],
            "created_by": item["created_by"],
            "created_at": item["created_at"],
            "updated_at": item["updated_at"],
            "reported_by_name": reported_by_name
        }})

