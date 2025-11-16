# 🛰️ HACK // UTEC - Gestión de Incidentes 

Este proyecto implementa una API serverless para gestionar incidentes dentro de un entorno escolar.
La arquitectura se basa en AWS Lambda, API Gateway (REST + WebSocket), DynamoDB, EventBridge y un frontend desplegado en AWS Amplify.
Además, el procesamiento en segundo plano se ejecuta con Airflow dentro de un contenedor en ECS Fargate.

---

## 📦 Requisitos Previos

### 🔹 Node.js + npm  
Versión recomendada: **Node 18+**

## ⚙️ Instalación del proyecto

```bash
git clone <URL-del-repo>
cd <carpeta-del-proyecto>
npm install
```

Esto instalará automáticamente:
- dependencias del proyecto
- serverless-dotenv-plugin

### 🔐 Archivo .env

El proyecto usa serverless-dotenv-plugin.
Crea un archivo llamado .env en la raíz del proyecto y coloca:

```env
#Datos serverless y AWS
ORG_NAME=orgname
SERVICE_NAME=cat
AWS_ACCOUNT_ID=447551125206
ROLE_NAME=LabRole

# DynamoDB tables (nombres con que se crearan y accederan a las tablas)
INCIDENTS_TABLE=Incidents
USERS_TABLE=Users
SOCKET_TABLE=conexiones_websocket

# JWT
JWT_SECRET=super-clave-ultra-secreta-123
JWT_EXPIRES_MINUTES=60
```

### 🚀 Despliegue

Finalmente, para desplegar todo el backend en AWS:

```bash
sls deploy
```
