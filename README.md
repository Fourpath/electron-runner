# electron-runner
A fork of [lutris/web-runner](https://github.com/lutris/web-runner). Ported to Electron Forge. 

## Building
1. Clone the repository.
2. `npm install`
3. `npm run make` (edit the command or forge config file to your needs)

## Usage
Pretty much same as the original.
```
usage: electron-runner <url> [options]

options:
    --name                  Window title
    --icon                  Window icon path
    --user-agent            User-Agent header for HTTP requests
    --window-size           Window size in pixels, e.g. 800x600
    --disable-resizing      Prevent window from being resized
    --fullscreen            Make window fullscreen (ignored if resizing is disabled)
    --maximize-window       Make window maximized (ignored if resizing is disabled)
    --disable-scrolling     Prevent window content from being scrolled
    --disable-menu-bar      Disable menu bar
    --devtools              Open devtools on start
    --frameless             Hide window frame
    --hide-cursor           Hide mouse cursor while in window
    --remove-margin         Remove window content margin
    --execjs                Execute JavaScript code on start
    --zoom-factor           Set content zoom factor on start
    --injectcss             Inject CSS code on start
    --open-links            Open links in a window
```

## License
See `LICENSE` file.