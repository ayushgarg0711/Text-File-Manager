# Text File Manager

Text File Manager is a small file manager that runs entirely in the browser. You can create, read, update and delete plain text files from a clean dark interface, with no server, database or install step.

It started as a Streamlit app written in Python. This version is plain HTML, CSS and JavaScript split into separate files, so it can be opened locally or hosted on any static host.

## Features

- **Create** a file with a name and content. Duplicate names and invalid names are rejected with a clear message.
- **Read** any file in a scrollable viewer, with a one-click Copy button.
- **Update** a file in one of three ways: rename it, append content to the end, or overwrite everything.
- **Delete** a file after ticking a confirmation box.
- **Workspace panel** listing every file with its size and last edited time, plus search to filter by name.
- **Live stats** for the number of files and total storage used.
- **Responsive layout** that works on phones, with the file list stacking above the editor.
- **Saved automatically** in the browser, so files are still there when you come back.

## Getting started

No build step or dependencies are needed. Use either option:

**Option 1: open the file.** Open `index.html` in any modern browser. Keep `style.css` and `script.js` in the same folder.

**Option 2: run the Python server.** With Python 3 installed, run this in the project folder:

```bash
python server.py
```

It serves the site at `http://localhost:8000` and opens your browser. To use another port, run `python server.py 9000`. Press Ctrl+C to stop it.

## How it works

Files are stored in the browser's `localStorage` under the key `fileforge_files_v2` as a single JSON object:

```json
{
  "notes.txt": { "c": "file content here", "t": 1760000000000 }
}
```

`c` is the file content and `t` is the last edited time in milliseconds. An older `fileforge_files_v1` entry, if present, is migrated automatically on first load.

The page renders from one state object. Every action updates the stored files, then redraws the stats, tabs, file list and operation panel. File names and content are always inserted as escaped text, so pasted HTML is shown as text and never run.

## Project structure

```
.
├── index.html   # page structure
├── style.css    # theme, layout and responsive rules
├── script.js    # app logic: state, storage and the four operations
├── server.py    # optional local web server
└── README.md    # this file
```

## Good to know

- Storage is per browser and per device. Files created on your laptop will not appear on your phone, and clearing site data removes them.
- Browsers limit `localStorage` to roughly 5 MB per site, which is plenty for text but not for large files.
- If the browser blocks storage, for example in a private window, the app still works but warns you that files will be lost when the page closes.
- File names cannot contain slashes and are limited to 80 characters. There are no folders.
- Unlike the original Streamlit version, this one does not write to your disk. It cannot create or modify files in a folder on your computer.

## Ideas for next steps

- Import and export files from and to your computer
- Folders and drag-and-drop moving
- A Markdown preview for `.md` files
- Sync across devices with a small backend

## Credits

Built with HTML, CSS and JavaScript. Fonts are [Space Mono](https://fonts.google.com/specimen/Space+Mono) and [Syne](https://fonts.google.com/specimen/Syne) from Google Fonts.
