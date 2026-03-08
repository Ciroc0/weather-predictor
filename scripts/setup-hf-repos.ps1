param(
    [string]$BaseDir = (Join-Path $PSScriptRoot "..\hf"),
    [switch]$SkipAuthCheck
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

function Clone-Or-Verify {
    param(
        [string]$RepoUrl,
        [string]$TargetDir
    )

    if (Test-Path $TargetDir) {
        if (-not (Test-Path (Join-Path $TargetDir ".git"))) {
            throw "Target exists but is not a git repository: $TargetDir"
        }

        Write-Host "Exists, skipping clone:" $TargetDir
        return
    }

    Write-Host "Cloning" $RepoUrl "to" $TargetDir
    git clone $RepoUrl $TargetDir
}

Require-Command git
Require-Command git-lfs

git lfs install | Out-Null

if (-not $SkipAuthCheck) {
    $hfToken = $env:HF_TOKEN
    $tokenFile = Join-Path $HOME ".huggingface\token"

    if (-not $hfToken -and -not (Test-Path $tokenFile)) {
        Write-Warning "No Hugging Face token detected. Clone may work for public repos, but push will require authentication."
    }
}

$spacesDir = Join-Path $BaseDir "spaces"
$datasetsDir = Join-Path $BaseDir "datasets"

New-Item -ItemType Directory -Force -Path $spacesDir, $datasetsDir | Out-Null

$repos = @(
    @{ Url = "https://huggingface.co/spaces/Ciroc0/dmi-collector"; Target = (Join-Path $spacesDir "dmi-collector") }
    @{ Url = "https://huggingface.co/spaces/Ciroc0/dmi-vs-ml-dashboard"; Target = (Join-Path $spacesDir "dmi-vs-ml-dashboard") }
    @{ Url = "https://huggingface.co/spaces/Ciroc0/dmi-ml-trainer"; Target = (Join-Path $spacesDir "dmi-ml-trainer") }
    @{ Url = "https://huggingface.co/datasets/Ciroc0/dmi-aarhus-predictions"; Target = (Join-Path $datasetsDir "dmi-aarhus-predictions") }
    @{ Url = "https://huggingface.co/datasets/Ciroc0/dmi-aarhus-weather-data"; Target = (Join-Path $datasetsDir "dmi-aarhus-weather-data") }
)

foreach ($repo in $repos) {
    Clone-Or-Verify -RepoUrl $repo.Url -TargetDir $repo.Target
}

Write-Host ""
Write-Host "Done. Repositories are available under:" (Resolve-Path $BaseDir)
