# PsyLib — Envoi automatique cold email (sequence 3 touches : relances 2/3 puis nouveaux 1)
# Lancé par la tâche planifiée Windows "PsyLib Cold Email Daily".
# Plafonds : touch 2 = 50, touch 3 = 30, touch 1 = 50 (max 130/j, sous quota Resend ~200/j).
# Le script gere l'eligibilite (J+4 / J+10) ; s'arrete seul quand plus de leads ("Rien à envoyer").
#
# Durci 2026-06-22 : log dès la 1re ligne (diagnostic garanti même en cas
# d'échec précoce), retry x2 sur l'envoi, chemins absolus robustes.

$proj = 'C:\Users\tonyr\OneDrive\Projet\PsyFlow'

# --- Log AVANT toute autre opération risquée -------------------------------
$logDir = Join-Path $proj 'tmp\cold-cron-logs'
New-Item -ItemType Directory -Force -Path $logDir -ErrorAction SilentlyContinue | Out-Null
$stamp = Get-Date -Format 'yyyy-MM-dd'
$log   = Join-Path $logDir "send-$stamp.log"

function Write-Log([string]$msg) {
  $line = "$(Get-Date -Format o) $msg"
  $line | Out-File -FilePath $log -Append -Encoding utf8
}

Write-Log "=== DEMARRAGE wrapper (PID $PID, user $env:USERNAME) ==="

try {
  Set-Location $proj
  Write-Log "Set-Location OK -> $proj"

  # Charge les secrets (lignes KEY=VALUE) dans l'environnement du process
  $secrets = Join-Path $env:USERPROFILE '.psylib-cold.env'
  if (-not (Test-Path $secrets)) { throw "Fichier secrets introuvable : $secrets" }
  Get-Content $secrets | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
  }
  if (-not $env:RESEND_API_KEY) { throw "RESEND_API_KEY absent apres chargement des secrets" }
  Write-Log "Secrets charges OK"

  # Localise npx (PATH peut differer en tache planifiee)
  $npx = (Get-Command npx -ErrorAction SilentlyContinue).Source
  if (-not $npx) { $npx = 'C:\Program Files\nodejs\npx.cmd' }
  if (-not (Test-Path $npx)) { throw "npx introuvable (PATH + fallback nodejs)" }
  Write-Log "npx -> $npx"

  # Envoi d'une touche avec retry x2 (echecs au reveil souvent transitoires : reseau/OneDrive)
  function Send-Touch([string]$npxPath, [int]$touch, [int]$max) {
    for ($try = 1; $try -le 2; $try++) {
      Write-Log "=== touch $touch --max $max (tentative $try/2) ==="
      & $npxPath tsx scripts/send-cold-emails.ts --touch $touch --max $max *>&1 | ForEach-Object { Write-Log $_ }
      if ($LASTEXITCODE -eq 0) { Write-Log "touch $touch OK (exit 0)"; return $true }
      Write-Log "touch $touch echec (exit $LASTEXITCODE)"
      if ($try -lt 2) { Start-Sleep -Seconds 30 }
    }
    return $false
  }

  # Sequence 3 touches. Priorite aux relances (leads deja contactes), puis nouveaux contacts.
  # Le script gere lui-meme l'eligibilite (delais J+4 / J+10) et l'idempotence par touche.
  # Plafonds sous le quota Resend free (~200/j) : 50 + 30 + 50 = 130 max.
  $r2 = Send-Touch $npx 2 50
  $r3 = Send-Touch $npx 3 30
  $r1 = Send-Touch $npx 1 50
  if (-not ($r1 -and $r2 -and $r3)) {
    throw "Au moins un envoi en echec (touch1=$r1 touch2=$r2 touch3=$r3)"
  }
}
catch {
  Write-Log "ERREUR FATALE : $($_.Exception.Message)"
  Write-Log $_.ScriptStackTrace
  exit 1
}
finally {
  Write-Log "=== FIN wrapper ==="
}
