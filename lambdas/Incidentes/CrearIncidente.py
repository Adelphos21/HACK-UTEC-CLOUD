# lambda_function.py
import os, json, uuid, time
import boto3
from datetime import datetime, timezone
from WebSocket.notify import notify_admins
from lambdas.utils import response

ddb = boto3.resource('dynamodb')
table = ddb.Table("Incidents")

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    # validate simple
    if 'type' not in body or 'description' not in body:
        return response(400, {"message": "type and description required"})
    if body.get('urgency') not in ('low','medium','high','critical'):
        return response(400, {"message": "invalid urgency"})

    incident_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "incident_id": incident_id,
        "type": body['type'],
        "floor": body['floor'],
        "ambient": body['ambient'],
        "description": body['description'],
        "urgency": body.get('urgency', 'low'),
        "status": "pending",
        "created_by": body.get('created_by', 'unknown'),
        "created_at": now,
        "updated_at": now,
        "history": [{"action":"created","by": body.get('created_by','unknown'), "at": now}]
    }
    table.put_item(Item=item)
    message = {
    "tipo": "nuevo_incidente",
    "incident_id": incident_id,
    "descripcion": item["description"],
    "urgencia": item["urgency"],
    "estado": item["status"]
    }
    notify_admins(message)
    return response(201, {
        "incident_id": incident_id,
        "status": "pending",
        "created_at": now
    })

