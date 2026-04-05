# Transkribera

En webbapp för att transkribera ljud och video — lokalt och gratis, med AI-förbättring vid behov.

## Funktioner

- **Spela in** direkt från mikrofon eller **ladda upp** en ljud-/videofil
- **Lokal transkribering** via [faster-whisper-server](https://github.com/fedirz/faster-whisper-server) — gratis, ingen API-nyckel behövs
- **Förbättra med AI** — skickar till OpenAI `gpt-4o-transcribe` för bättre hantering av svenska/engelska-blandning
- Auto-detekterar språk (hanterar kod-växling mellan svenska och engelska)
- Tidsstämplar (valfritt)
- Kopiera eller ladda ner transkription som `.txt`

## Kom igång

### 1. Lokal server (gratis)

Installera och starta faster-whisper-server:

```bash
pip install faster-whisper-server
uvicorn faster_whisper_server.main:app
```

Servern startar på `http://localhost:8000` som standard.

### 2. Öppna appen

Öppna `index.html` i webbläsaren, eller kör en lokal webbserver:

```bash
python3 -m http.server 8080
# Öppna http://localhost:8080
```

### 3. (Valfritt) OpenAI API-nyckel

För att använda **Förbättra med AI**-knappen, lägg till din OpenAI API-nyckel under inställningar (kugghjulsikonen). Nyckeln sparas bara lokalt i din webbläsare.

## Inställningar

Klicka på kugghjulsikonen för att ändra:

| Inställning | Standard | Beskrivning |
|---|---|---|
| Lokal server-URL | `http://localhost:8000` | Adress till faster-whisper-server |
| Lokal modell | `Systran/faster-whisper-large-v3` | Whisper-modell att använda |
| OpenAI API-nyckel | *(tom)* | Behövs bara för "Förbättra med AI" |

## Filformat som stöds

mp3, wav, mp4, m4a, webm, ogg, flac, mov, och de flesta andra ljud- och videoformat.

## Filstorlek

Filer över 24 MB delas automatiskt upp och transkriberas i delar.
