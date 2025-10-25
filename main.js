'use strict'

const electron = require('electron')
const { app, BrowserWindow, dialog, Menu, session, shell } = electron

const appMenu = Menu.buildFromTemplate(require('./menu'))

function isUrl(string, {lenient = false} = {}) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string')
	}

	string = string.trim();
	if (string.includes(' ')) {
		return false
	}

	try {
		new URL(string)
		return true
	} catch {
		if (lenient) {
			return isUrl(`https://${string}`)
		}

		return false;
	}
}

const args = process.argv.slice(2)
console.log(args)

let inputUrl = args[0]

let gameTitle
let icon
let userAgent
let p = args.indexOf('--name')
if (p !== -1 && args[p + 1]) {
    gameTitle = args[p + 1]
    app.setName(gameTitle)
} else {
    app.setName('electron-runner')
}
p = args.indexOf('--icon')
if (p !== -1 && args[p + 1]) {
    icon = args[p + 1]
}

p = args.indexOf('--user-agent')
if (p !== -1 && args[p + 1]) {
    userAgent = args[p + 1]
}

let mainWindow

function createWindow() {
    if (!inputUrl) {
        dialog.showErrorBox('No input URL', '')
        app.quit()
        return
    }
    let windowSize = ''
    let p = args.indexOf('--window-size')
    if (p !== -1) {
        windowSize = args[p + 1] || 'x'
    }

    windowSize = windowSize.split('x')
    windowSize.length = 2
    windowSize = windowSize.map((n) => parseInt(n, 10) || 0)

    for (let i = 0; i < args.length; ++i) {
        if (args[i] === '--set-cookie' && args[i + 1]) {
            const sep = args[i + 1].indexOf('=')
            const cookie = {
                url: inputUrl,
                name: args[i + 1].slice(0, sep),
                value: args[i + 1].slice(sep + 1)
            }
            session.defaultSession.cookies.set(cookie)
        }
    }

    if (userAgent) {
        session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
            details.requestHeaders['User-Agent'] = userAgent
            callback({ requestHeaders: details.requestHeaders })
        })
    }

    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            plugins: true,
            allowDisplayingInsecureContent: true
        },
        title: gameTitle || 'electron-runner',
        width: windowSize[0] || 800,
        height: windowSize[1] || 600,
        useContentSize: true,
        center: true,
        autoHideMenuBar: true,
        show: false,
        icon: icon,
        resizable: !args.includes('--disable-resizing'),
        backgroundColor: '#000000',
        frame: !args.includes('--frameless')
    })

    if (!isUrl(inputUrl) && !inputUrl.startsWith('file://')) {
        inputUrl = 'file://' + inputUrl
    }
    mainWindow.loadURL(inputUrl)

    if (args.includes('--devtools')) {
        mainWindow.webContents.openDevTools()
    }

    if (args.includes('--disable-menu-bar')) {
        mainWindow.setMenu(null)
    }

    let execjs = []

    execjs.push(`
    document.body.style.userSelect = "none"
    document.body.style.webkitUserSelect = "none"
  `)
    if (args.includes('--disable-scrolling')) {
        execjs.push('document.documentElement.style.overflow = "hidden"')
        execjs.push('document.body.style.overflow = "hidden"')
    }
    if (args.includes('--hide-cursor')) {
        execjs.push('document.body.style.cursor = "none"')
    }
    if (args.includes('--remove-margin')) {
        execjs.push(`
      document.documentElement.style.margin = '0'
      document.body.style.margin = '0'
      document.documentElement.style.padding = '0'
      document.body.style.padding = '0'
    `)
    }

    execjs = execjs.join(';\n')

    mainWindow.once('ready-to-show', () => {
        mainWindow.webContents.executeJavaScript(execjs, false)

        p = args.indexOf('--execjs')
        if (p !== -1 && args[p + 1]) {
            mainWindow.webContents.executeJavaScript(args[p + 1], true)
        }

        p = args.indexOf('--zoom-factor')
        if (p !== -1) {
            mainWindow.webContents.setZoomFactor(parseFloat(args[p + 1]))
        }

        if (args.includes('--maximize-window') && !args.includes('--disable-resizing')) {
            mainWindow.maximize()
        }

        if (args.includes('--fullscreen', 2) && !args.includes('--disable-resizing')) {
            mainWindow.setFullScreen(true)
        }

        p = args.indexOf('--injectcss')
        if (p !== -1 && args[p + 1]) {
            mainWindow.webContents.insertCSS(args[p + 1])
        }

        mainWindow.show()
    })

    mainWindow.webContents.once('did-fail-load', (e, errorCode, errorDescription, validatedUrl, isMainFrame) => {
        if (!isMainFrame) return
        dialog.showErrorBox('Failed to load URL', validatedUrl + '\n\n' + errorCode + ' ' + errorDescription)
        app.quit()
    })

    mainWindow.webContents.on('will-navigate', handleRedirect)
    mainWindow.webContents.on('new-window', handleRedirect)

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

Menu.setApplicationMenu(appMenu)

function handleRedirect(e, url) {
    if (url !== mainWindow.webContents.getURL() && !args.includes('--open-links')) {
        e.preventDefault()
        shell.openExternal(url)
    }
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    app.quit()
})