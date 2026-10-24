# دعوة زفاف صدام وكريمته

Live: https://saddam-wedding.vercel.app/

A static wedding invitation: sealed envelope, Basmala and verse, the invitation, date with countdown and calendar, and the hall location. No build step; GitHub Pages serves the files as they are.

## Changing details

Everything about the event is in `js/config.js`:

- `maps.hall` / `maps.home`: Google Maps links (an empty `home` hides its button).
- `music`: path to an MP3 in `assets/` (empty hides the music button).
- `form`: Google Form `formResponse` URL and `entry.*` IDs. While `action` is empty the RSVP step is hidden.

Fonts (Noto Nastaliq Urdu, IBM Plex Sans Arabic, Amiri Quran) are self-hosted under the SIL Open Font License; see `fonts/OFL.txt`.
