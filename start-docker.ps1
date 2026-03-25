param(
  [string]$AdminKey
)

if ($AdminKey -and $AdminKey.Trim().Length -gt 0) {
  $env:ADMIN_KEY = $AdminKey
}

docker compose up --build -d
