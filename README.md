# KlasAI

KlasAI is een webomgeving voor leerlingen waarin ze met lokale AI-modellen werken. Die modellen draaien op de server van school. Een leerling kiest eerst een doel en krijgt daarna een chatbalk, zoals bij ChatGPT.

| Doel   | Waarvoor                         | Voorbeeldmodel      |
| ------ | -------------------------------- | ------------------- |
| Chat   | Vragen, uitleg, overhoren        | Llama 3.1 8B        |
| Beeld  | Afbeeldingen maken               | Stable Diffusion XL |
| Muziek | Korte muziekstukken maken        | MusicGen Small      |
| Code   | Hulp bij programmeren            | Qwen2.5-Coder 7B    |

## Starten met Ollama

De chat (doel **Chat**) is gekoppeld aan [Ollama](https://ollama.com). Beeld, Muziek en Code zijn nog nagebootst.

1. Installeer Ollama op de computer die als server dient. Download een model:

   ```bash
   ollama pull llama3.1:8b
   ```

2. Installeer [Node.js](https://nodejs.org) (versie 18 of nieuwer). Start KlasAI in deze map:

   ```bash
   npm start
   ```

3. Open `http://localhost:3000`. Leerlingen in hetzelfde netwerk gebruiken `http://<ip-adres-van-de-server>:3000`.

De browser van een leerling praat alleen met de KlasAI-server. Alleen die server praat met Ollama. Zo hoeft Ollama niet open te staan voor het netwerk, en kunnen leerlingen de systeeminstructie in `server.js` niet aanpassen.

### Instellingen

Je kunt dit aanpassen met omgevingsvariabelen:

| Variabele    | Standaard                | Betekenis                       |
| ------------ | ------------------------ | ------------------------------- |
| `CHAT_MODEL` | `llama3.1:8b`            | Ollama-model voor de chat       |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Adres van Ollama                |
| `PORT`       | `3000`                   | Poort van KlasAI                |
| `HOST`       | `0.0.0.0`                | Netwerkadres waarop KlasAI luistert |

Voorbeeld: `CHAT_MODEL=gemma2:9b npm start`

Op de beheerpagina zie je of de chat verbonden is met Ollama. Opent iemand `prototype/index.html` zonder de server, of is Ollama niet bereikbaar? Dan geeft de chat voorbeeldantwoorden en staat er een melding bij.

> **Let op:** accounts staan nog in de browser, niet op de server. Iedereen die de server kan bereiken, kan dus de chat gebruiken. Laat KlasAI daarom alleen op het schoolnetwerk draaien totdat echte accounts op de server zijn gebouwd.

## Klikbare opzet

`prototype/index.html` is de interface in één bestand. Zonder server kun je het ook direct in je browser openen. De chat geeft dan voorbeeldantwoorden.

Het prototype laat zien:

- **Inloggen en zelf een account maken** (naam, klas, gebruikersnaam en wachtwoord)
- **Een doel kiezen** uit Chat, Beeld, Muziek of Code
- **Een chatbalk** waarin je met de knop links van AI-doel wisselt
- **Gesprekken in de zijbalk**, met een eigen kleur per doel
- **Een beheerpagina** waar de beheerder:
  - wachtwoorden van leerlingen opnieuw instelt
  - accounts verwijdert
  - zelf registreren aan of uit zet

Demo-accounts:

- leerling: `sam` / `welkom123`
- beheerder: `beheerder` / `klasai`

### Wat nog nagebootst is

- Beeld, Muziek en Code geven nepantwoorden. De afbeelding wordt in de browser getekend en het muziekje met Web Audio gemaakt.
- Accounts en gesprekken staan alleen in de `localStorage` van de browser.
- Wachtwoorden worden in het prototype niet versleuteld.

## Volgende stappen

1. Een backend bouwen met echte accounts. Daarin worden wachtwoorden gehasht met bcrypt of argon2, worden sessies bijgehouden en bestaat de rol beheerder.
2. Code koppelen aan Ollama, bijvoorbeeld met `qwen2.5-coder:7b`.
3. Beeld koppelen aan een lokale Stable Diffusion-server, bijvoorbeeld ComfyUI.
4. Muziek koppelen aan MusicGen (AudioCraft).
5. Gesprekken per leerling opslaan in een database.
