# Classical MIDI sources

The classical files use public-domain Mutopia editions a CC0 Noctave edition, and the CC BY-SA 3.0 Mutopia Italian Concerto edition, obtained 2026-10-23. No third-party audio recording or soundfont is included. Math Run synthesizes the MIDI notes in an 8-bit-inspired square/triangle sound using Web Audio.

- `mozart-rondo-alla-turca.mid`: W. A. Mozart, Rondo alla Turca, K. 331, movement III. Typeset by Rune Zedeler and Chris Sawer. Mutopia-2015/08/13-108. Public Domain.
  - Edition: https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=108
  - MIDI: https://www.mutopiaproject.org/ftp/MozartWA/KV331/KV331_3_RondoAllaTurca/KV331_3_RondoAllaTurca.mid
- `bach-prelude-c-major.mid`: J. S. Bach, The Well-Tempered Clavier I, Prelude 1 in C major, BWV 846. Maintained by Tobias Erbsland. Mutopia-2011/09/12-5. Public Domain.
  - Edition: https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=5
  - MIDI: https://www.mutopiaproject.org/ftp/BachJS/BWV846/wtk1-prelude1/wtk1-prelude1.mid

The downloaded classical MIDI files are unmodified. Playback uses their tempo maps and note timings. Music defaults on but starts only with the game, never on the website ready screen. M or the music button toggles mute. After each complete classical piece the playlist advances Liszt → Mozart → Bach Prelude → Bach Italian Concerto I → Bach Italian Concerto II → Liszt. Playback pauses with the game, on game over, and when the tab loses focus.

- `reviewer-2-boss.mid`: “Reviewer 2”, original game cue composed for Math Run.
  32 bars in D minor at 160 BPM, with a driving octave bass, sixteenth-note
  arpeggios, an upper melody, and diminished dominant tension. Generated directly
  as Standard MIDI; no third-party composition, recording, or samples are used.
  It loops during boss arenas and restarts on each new boss encounter. The selected
  classical piece resumes at its previous playback position after victory.

- `liszt-liebestraum-no-3.mid`: Franz Liszt, Liebestraum No. 3, S. 541/3.
  Complete Noctave edition from a CC0 MuseScore transcription (score 1578986),
  with four corrections documented by Noctave against the Kistner edition.
  Partitur and transcription are CC0 1.0; the composition is public domain.
  Converted with MuseScore 3 using:
  `QT_QPA_PLATFORM=offscreen musescore -o liszt-liebestraum-no-3.mid liszt-liebestraum-no-3.mxl`
  The source MusicXML is included for reproducibility. Normal duplicate-pitch
  warnings during export merge coincident piano voices.
  - Edition and license: https://noctavepiano.com/en/sheet-music/liszt-reve-d-amour-3/
  - Source: https://noctavepiano.com/partitions/liszt-reve-d-amour-3/liszt-reve-d-amour-3.mxl
  - License: https://creativecommons.org/publicdomain/zero/1.0/

- `bach-italian-concerto-1.mid` and `bach-italian-concerto-2.mid`: J. S. Bach,
  Italian Concerto, BWV 971, movements I (Allegro) and II (Andante).
  Edition by Boris Dušek and Jay Anderson, Mutopia-2012/02/05-1826,
  based on Breitkopf & Härtel, Leipzig, 1853, plate B.W. III.
  Licensed **Creative Commons Attribution-ShareAlike 3.0**. The MIDI data are
  unchanged, only the filenames were renamed from `piano.mid` (I) and
  `piano-1.mid` (II). The movement order was checked against `piano.ly`
  in the matching LilyPond source archive.
  - Edition: https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1826
  - MIDI archive: https://www.mutopiaproject.org/ftp/BachJS/BWV971/piano/piano-mids.zip
  - Source archive: https://www.mutopiaproject.org/ftp/BachJS/BWV971/piano/piano-lys.zip
  - License: https://creativecommons.org/licenses/by-sa/3.0/

M is the master mute for both music and effects. The individual Music and Sound
buttons retain their settings while master mute is active.

Each new run starts with a uniformly random classical track from the MIDI collection, from the beginning. The boss theme is excluded from this selection. N or Next skips
to the next classical track without changing mute/pause settings. Boss themes
cannot be skipped. Pausing/resuming preserves the current track and position.
