// Everything about the event lives here. Edit this file only; the page reads it on load.
window.INVITATION = {
  // Friday 30 October 2026, 5:00 pm Syria time (UTC+3): departure from the groom's house.
  start: "2026-10-30T17:00:00+03:00",
  // Assumed end, used only for the calendar entry.
  end: "2026-10-30T22:00:00+03:00",
  rsvpDeadlineText: "الجمعة 30 تشرين الأول",

  maps: {
    hall: "https://maps.app.goo.gl/5As17YUfRNUFVfSz6",
    // Leave empty to hide the "groom's house" button.
    home: ""
  },

  // Upload the track to this path in the repo; the music button appears once the file exists.
  music: "assets/music.mp3",

  // Google Form. Leave action empty and the RSVP step stays hidden (v1).
  form: {
    action: "", // https://docs.google.com/forms/d/e/<FORM_ID>/formResponse
    fields: {
      name: "",   // entry.123456789
      attend: "", // entry.…  options must read exactly: سأحضر / أعتذر
      men: "",    // entry.…
      women: "",  // entry.…
      wish: ""    // entry.…
    }
  }
};
