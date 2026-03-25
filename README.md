# Portfolio DevOps - Makata Jean Junior

Portfolio fullstack professionnel genere a partir du CV :
- Backend : Node.js + Express
- Frontend : React + Vite

## Structure

- `backend` : API REST (`/api/portfolio`, `/api/health`)
- `frontend` : application React consommant l'API

## Lancer le projet

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

API disponible sur `http://localhost:4000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Application disponible sur `http://localhost:5173`.

### Dashboard admin

- URL: `http://localhost:5173/admin`
- Cle par defaut: `admin123`
- Tu peux changer la cle avec la variable d'environnement backend `ADMIN_KEY`.

Exemple PowerShell:

```powershell
$env:ADMIN_KEY="ma-cle-secrete"
npm run dev
```

## Build production (frontend)

```bash
cd frontend
npm run build
```

## Docker (automatisation)

### Lancer tout
Dans la racine du projet (`devops-portfolio`) :

```powershell
docker compose up --build -d
```

Optionnel (scripts):
- `./start-docker.ps1`
- `./stop-docker.ps1`

### URL
- Portfolio : `http://localhost:5173/`
- Admin dashboard : `http://localhost:5173/admin`
- Backend API : `http://localhost:4000/`

### Cle admin
Par defaut : `admin123`.

Tu peux creer un fichier `.env` a la racine :

```ini
ADMIN_KEY=admin123
```

### Stop
```powershell
docker compose down
```
