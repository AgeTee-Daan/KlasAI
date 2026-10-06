# KlasAI

KlasAI is een webomgeving voor leerlingen waarin ze met lokale AI-modellen werken. Die modellen draaien op de server van school. Een leerling kiest eerst een doel en krijgt daarna een chatbalk, zoals bij ChatGPT.

| Doel   | Waarvoor                         | Voorbeeldmodel      |
| ------ | -------------------------------- | ------------------- |
| Chat   | Vragen, uitleg, overhoren        | Llama 3.1 8B        |
| Beeld  | Afbeeldingen maken               | Stable Diffusion XL |
| Muziek | Korte muziekstukken maken        | MusicGen Small      |
| Code   | Hulp bij programmeren            | Qwen2.5-Coder 7B    |

## Klikbare opzet

`prototype/index.html` is een klikbaar prototype in één bestand, zonder installatie. Open het in je browser.

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

- De AI-antwoorden zijn nep. De afbeelding wordt in de browser getekend en het muziekje met Web Audio gemaakt.
- Accounts en gesprekken staan alleen in de `localStorage` van de browser.
- Wachtwoorden worden in het prototype niet versleuteld.

## Volgende stappen

1. Een backend bouwen met echte accounts. Daarin worden wachtwoorden gehasht met bcrypt of argon2, worden sessies bijgehouden en bestaat de rol beheerder.
2. Chat en Code koppelen aan [Ollama](https://ollama.com).
3. Beeld koppelen aan een lokale Stable Diffusion-server, bijvoorbeeld ComfyUI.
4. Muziek koppelen aan MusicGen (AudioCraft).
5. Gesprekken per leerling opslaan in een database.
