/* jshint esversion:8 */
const { electron, nativeImage, clipboard, shell } = require('electron')
const remote = require('@electron/remote')
const { app, BrowserWindow, dialog } = remote
const _ = require('lodash')
const fs = require('fs')
const ipc = require('electron').ipcRenderer
const Config = require('electron-store')
const settings = new Config({ 'name': 'aio-data' })
const persistantData = new Config({ 'name': 'aio-persist' })
const dataObj = new Config({ 'name': 'aio-data-obj' })
const lastView = new Config({ 'name': 'aio-last' })
const userThemes = new Config({ 'name': 'user-themes' })
const casdkApps = new Config({ 'name': 'casdk' })
const speedoSave = new Config({ 'name': 'MZD_Speedometer' })
const { writeFileSync } = require('fs')
const isDev = require('electron-is-dev')
const path = require('path')
const os = require('os')
const appender = require('appender')
const crlf = require('crlf')
const copydir = require('copy-dir')
const drivelist = require('drivelist')
const extract = require('extract-zip')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
let copyFolderLocation = persistantData.get('copyFolderLocation', app.getPath('desktop'))
let visits = persistantData.get('visits', 0)
let hasSpeedCamFiles = false
let translateSchema, langPath, lang, langDefault
let colordir = `${app.getPath('userData')}/color-schemes/`
let hasColorFiles = fs.existsSync(`${colordir}`)
let approot = (isDev ? './app/' : app.getAppPath())
let builddir = `${approot}/files/tweaks/`
let logFileName = 'MZD_LOG'
let varDir = `${app.getPath('userData')}/background/`
let getBackground = `${varDir}/background.png`
let date = function () { return new Date() }
let dataURL = ''
let aioURL = ''
let helpClick = false
let updateVer = 286

process.on('uncaughtException', (e) => {
  console.error(`Caught unhandled exception: ${e}`)
  dialog.showErrorBox('Caught unhandled exception: ' + (`${e}` || 'Unknown error message'), 'You can report this error to aio@mazdatweaks.com\nor open an issue at https://github.com/Trevelopment/MZD-AIO')
  app.quit()
})
lang = persistantData.get('lang', 'english')
if (window.location.pathname.includes('joiner')) {
  langPath = `../lang/${lang}.aio.json`
  langDefault = '../lang/english.aio.json'
  translateSchema = require('../lang/aio.schema.json')
} else {
  langPath = `${app.getPath('home')}/lang/${lang}.aio.json`
  langDefault = `${app.getPath('home')}/lang/english.aio.json`
  translateSchema = require(`${app.getPath('home')}/lang/aio.schema.json`)
}
let langObj = require(langPath)
let langDef = require(langDefault)
langObj = _.merge(langDef, langObj)

function saveMenuLock () {
  persistantData.set('menuLock', !persistantData.get('menuLock'))
  $('body, .hideNav, .w3-overlay').toggleClass('showNav')
}

if (!fs.existsSync(varDir)) {
  mkdirp.sync(varDir)
}

function helpMessageFreeze (item) {
  $(item).children().toggleClass('w3-show')
}

function runAAPatcher (apk) {
}

function runInstallCSApp () {
  require('./assets/js/installCS.js')()
}

function startTime () {
  let today = new Date()
  let h = today.getHours()
  let m = today.getMinutes()
  m = checkTime(m)
  $('#clock').html(`${h}:${m}`)
  let t = setTimeout(startTime, 10000)
  formatDateCustom(2)
}

function checkTime (i) {
  if (i < 10) { i = '0' + i }
  return i
}

ipc.on('open-copy-folder', openCopyFolder)

function openCopyFolder () {
  let openCopy = `${persistantData.get('copyFolderLocation', copyFolderLocation)}/_copy_to_usb/`
  if (!fs.existsSync(openCopy)) {
    mkdirp.sync(openCopy)
  }
  shell.openPath(openCopy)
}

function openApkFolder () {
  shell.openPath(path.normalize(path.join(path.dirname(__dirname), '../../castscreenApp/')))
}

function openDlFolder () {
  shell.openPath(path.normalize(path.join(app.getPath('userData'), 'color-schemes/')))
}

function openDefaultFolder () {
  shell.openPath(path.normalize(path.join(path.dirname(__dirname), '../background-images/default/')))
}

function autoHelp () {
  $.featherlight('views/autoHelp.htm', { closeSpeed: 500, variant: 'autoHelpBox' })
}

function myStance () {
  ipc.send('reset-window-size')
  updateNotesCallback()
}

function announcement () {
  if (persistantData.get('visits', 0) % 20 === 0) {
    showAnnouncement()
  }
}

function dataCheck () {
  persistantData.delete('updateAvailable')
  localStorage.setItem(`dat${updateVer}`, true)
}

function showAnnouncement () {
  if (persistantData.get('anon', false)) {
    $.featherlight(aioURL, { closeSpeed: 1000, variant: 'announcementWindow' })
  }
}

function hideAnnouncement (anonNum) {
  $('.communicationFile').hide()
  $.featherlight.close()
  localStorage.setItem('anoncmnt', anonNum)
}

function anonData (anonNum) {
  localStorage.setItem('anondat', anonNum)
}

function updateNotes () {
  bootbox.hideAll()
  $.get('views/update.htm', function (data) { $('#changelog').html(data) })
  bootbox.dialog({
    title: `<div class='w3-center'>Welcome To MZD-AIO-TI v${app.getVersion()} | MZD All In One Tweaks Installer</div>`,
    message: `<div id='changelog'></div><button id='upVerBtn' style='display:none;font-weight:800;' class='w3-btn w3-hover-green w3-hover-text-black w3-display-bottommiddle' onclick='bootbox.hideAll();'>OK</button><br>`,
    className: 'update-info',
    size: 'large',
    closeButton: true
  })
  setTimeout(() => {
    $('.modal-dialog').animate({ 'margin-top': '40px', 'margin-bottom': '60px' }, 3000)
    $('#upVerBtn').fadeIn(5000)
    persistantData.set('updated', true)
  }, 2000)
}

function firstTimeVisit () {
  if (persistantData.get('updateVer', 0) < updateVer) {
    myStance()
    settings.set('reset', true)
    lastView.clear()
    if(persistantData.has('updateVer')) {
      updateNotes()
    }
    persistantData.set('updateVer', updateVer)
    persistantData.set('updated', false)
    persistantData.delete('ver270')
    persistantData.delete('message-502')
    persistantData.delete('message-503')
    persistantData.delete('message-504')
    persistantData.delete('new-update-first-run')
    persistantData.delete('keepBackups')
    persistantData.delete('testBackups')
    persistantData.delete('skipConfirm')
    persistantData.delete('transMsg')
    persistantData.delete('delCopyFolder')
    persistantData.delete('known-issues-58')
    persistantData.delete('known-issues-59')
  } else {
    updateNotesCallback()
  }
}

function updateNotesCallback () {
  if (visits > 0) {
    if (!persistantData.get('updated', false)) {
      updateNotes()
    }
  } else {
    persistantData.set('visits', 1)
    $('body').prepend('<div id="super-overlay" style="z-index:999999;width:9999px;height:9999px;display:block;position:fixed;background:transparent;"></div>')
    let firstTimeMessage = bootbox.dialog({
      title: `<div class='w3-center'>Welcome To MZD-AIO-TI v${app.getVersion()} | MZD All In One Tweaks Installer</div>`,
      message: `<div class='w3-center'><h3>Welcome to the AIO!</h3></div><div class='w3-justify'> <b>All changes happen at your own risk! Please understand that you can damage or brick your infotainment system running these tweaks!  If you are careful, follow all instructions carefully, and heed all warnings, the chances of damaging your system are greatly reduced.<br>For more help, open the <a href='' onclick='helpDropdown()'>Help Panel</a> or visit <a href='https://mazdatweaks.com' class="link">MazdaTweaks.com</a><br><br>I appreciate feedback<br>use the <a href='' onclick='$("#feedback").click()'>feedback link</a> below to let me know what you think.<br><br><a href class='w3-btn w3-blue' onclick='$("#tourBtn").click()'>Take The Tour</a><br></center><br><h2><b>***NOTE: FOR FIRMWARE V59.00.502+*** CAN ONLY INSTALL TWEAKS AFTER <a href="" onclick="externalLink(\'im-super-serial\')" title="By Serial Connection">GAINING ACCESS VIA SERIAL CONNECTION </a><b>.  THEN YOU WILL NEED TO INSTALL THE AUTORUN & RECOVERY SCRIPTS AFTER GAINING SERIAL ACCESS.</h2><br></b></div><div id="first-time-msg-btn" class="w3-center"><img class='loader' src='./files/img/load-0.gif' alt='...' /></div>`,
      closeButton: false,
      className: 'first-time-dialog'
    })
    setTimeout(() => { $('#super-overlay').remove() }, 9000)
    setTimeout(() => {
      $('#first-time-msg-btn').html(`<button id='newVerBtn' style='display:none' class='w3-btn w3-hover-text-light-blue w3-display-bottommiddle' onclick='bootbox.hideAll()'>OK</button><br>`)
      $('#newVerBtn').fadeIn(10000)
    }, 5000)
  }
  dataCheck()
}

function helpDropdown () {
  let x = document.getElementById('helpDrop')
  let y = document.getElementById('helpDropBtn')
  if (!x.className.includes('w3-show')) {
    x.className += ' w3-show'
    y.textContent = '\u00D7'
    document.getElementById('sidenavOverlay').display = 'block'
    if (!helpClick) {
      let myNotification = new Notification('Help', {
        body: 'Visit MazdaTweaks.com for more help',
        icon: 'favicon.ico',
        tag: 'MZD-AIO-TI',
        silent: true
      })
      myNotification.onclick = () => {
        externalLink('mazdatweaks')
      }
      snackbar(`Visit <a href onclick='externalLink("mazdatweaks")'>MazdaTweaks.com</a> for more help`)
    }
    helpClick = true
  } else {
    closeHelpDrop()
  }
}

function closeHelpDrop () {
  let x = document.getElementById('helpDrop')
  if (x) {
    x.className = x.className.replace(' w3-show', '')
  }
}

function dropDownMenu (id) {
  let x = document.getElementById(id)
  let y = $('#' + id)
  if (!x.className.includes('w3-show')) {
    $('.w3-dropdown-content').removeClass('w3-show')
    x.className += ' w3-show'
  } else {
    x.className = x.className.replace(' w3-show', '')
  }
  y.on({
    mouseleave: function () {
      y.toggleClass('w3-show')
    }
  })
}

function toggleFullScreen () {
  remote.BrowserWindow.getFocusedWindow().setFullScreen(!remote.BrowserWindow.getFocusedWindow().isFullScreen())
  $('.icon-fullscreen').toggleClass('icon-fullscreen-exit')
}

let togg = false

function toggleOps (x) {
  $(x).toggleClass('icon-plus-square').toggleClass('icon-minus-square')
}

function toggleAllOps () {
  let x = $('.toggleExtra')
  if (togg) {
    $('#alltoggle').addClass('icon-minus-alt').removeClass('icon-plus-alt')
    x.removeClass('icon-plus-square').addClass('icon-minus-square')
  } else {
    $('#alltoggle').removeClass('icon-minus-alt').addClass('icon-plus-alt')
    x.addClass('icon-plus-square').removeClass('icon-minus-square')
  }
  togg = !togg
}

function externalLink (link) {
  const url = `https://trevelopment.win/${link}`
  try { new URL(url); shell.openExternal(url) } catch (e) { console.error('Invalid URL:', url) }
}

function cleanArray (actual) {
  let newArray = []
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i])
    }
  }
  return newArray
}

function copyCode (x) {
  $(x).select()
  let copyText = document.execCommand('Copy')
  if (copyText) snackbar('Copied "' + $(x).val() + '" to clipboard')
}

function donate () {
  shell.openExternal('https://mazdatweaks.com/donate')
}

async function getUSBDrives () {
  let disks = []
  let dsklst = await drivelist.list()
  for (let i = 0; i < dsklst.length; i++) {
    if (!dsklst[i].system) {
      disks.push({ 'name': dsklst[i].name, 'desc': dsklst[i].description, 'mp': dsklst[i].mountpoint })
    }
  }
  return disks
}

function getParameterByName (name, url) {
  if (!url) url = window.location.href
  url = url.toLowerCase()
  name = name.replace(/[[\]]/g, '\\$&').toLowerCase()
  let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  let results = regex.exec(url)
  if (!results) return ''
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

function alternateLayout () {
  $('#options, #sidePanel').toggleClass('alt-layout')
}

function secretMenu () {
  $(`<div id="secretMenu" class="w3-card-12 w3-container">
  <header class="w3-container w3-teal">
  <span onclick="$(this).parent().parent().remove()"
  class="w3-closebtn">&times;</span>
  <h2>Secret Menu</h2>
  </header>
  <div class="w3-container">
  <button class="w3-btn w3-red w3-hover-yellow w3-ripple w3-border" onclick="persistantData.delete('lang')">Reset Language Variable</button>
  <button class="w3-btn w3-green w3-hover-indigo w3-ripple w3-border" onclick="$('#instAll').click()">Install All</button>
  <button class="w3-btn w3-deep-orange w3-hover-red w3-ripple w3-border" onclick="$('#uninstAll').click()">Uninstall All</button>
  <button class="w3-btn w3-blue w3-hover-yellow w3-ripple w3-border" onclick="openDlFolder()">Downloaded Files</button>
  </div>
  <footer class="w3-container w3-teal">
  <p>Modal Footer</p>
  </div>`).insertAfter($('#snackbar'))
  $('#secretMenu').fadeOut(10000)
}

function toggleOverDraws () {
  $('.spdConfigInst').click(function () { $('#autorunCheck').toggle() })
}

function writeRotatorVars (imgs) {
  if (imgs > 1) {
    fs.writeFileSync(`${varDir}/bg-rotator.txt`, `BG_STEPS=${imgs}\nBG_SECONDS=${imgs * $('#bgRotatorSeconds').val()}\nBG_SEC_EACH=${$('#bgRotatorSeconds').val()}\nBG_WIDTH=${imgs * 800}`)
  } else {
    fs.writeFileSync(`${varDir}/bg-rotator.txt`, '')
  }
}

function saveAIOLogHTML () {
  let logContent = document.getElementById('aio-comp-log').innerHTML
  let a = document.body.appendChild(document.createElement('a'))
  a.download = 'AIO_Log.html'
  a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(logContent)
  a.click()
}

function checkForUpdate (ver) {
  $.featherlight(`https://aio.trevelopment.com/update.php?ver=${updateVer}`, { closeSpeed: 100, variant: 'checkForUpdate' })
}

function formatDateCustom (dateFormatType) {
  let currentTime = new Date()
  let dateStr = null
  let month = currentTime.getMonth() + 1
  let day = currentTime.getDate()
  let dayStr = ((day < 10) ? ('0' + day) : day)
  let monthStr = ((month < 10) ? ('0' + month) : month)
  if (dateFormatType === 1) {
    dateStr = dayStr + '.' + monthStr + '.'
  } else if (dateFormatType === 2) {
    dateStr = monthStr + '/' + dayStr
  } else {
    dateStr = currentTime.toISOString().substring(0, 10)
  }
  $('#date').text(dateStr)
}

function getAIOver () {
  return app.getVersion()
}

$(function () {
  $('.toggleExtra.1').addClass('icon-plus-square').removeClass('icon-minus-square')
  setTimeout(() => {
    $('#IN21').click(function () {
      snackbar('THERE MAY BE ISSUES REGARDING COMPATIBILITY WITH THIS TWEAK. AFTER INSTALLING, YOUR USB PORTS MAY BECOME UNREADABLE TO THE CMU. <h5>AUTORUN-RECOVERY SCRIPT WILL BE INSTALLED IN CASE RECOVERY BY SD CARD SLOT IS NEEDED TO RECOVER USB FUNCTION</h5>')
    })
    $('#advancedOptions').click(function () {
      $('.advancedOp, #twkOpsTitle').toggle()
      $('.sidePanel').toggleClass('adv')
      if ($('#IN21').prop('checked')) { $('#IN21').click() }
    })
  }, 1000)
  $('body').css('overflow', 'auto')
})

function toggleTips () {
  showSpdHints = !showSpdHints
  showSpdHints ? $('#SpdOpsTips').slideDown() : $('#SpdOpsTips').slideUp()
}

function numberReplacer (key, value) {
  if (key === 'pos' && value !== null) {
    value = value.toString()
  }
  return value
}

function replaceInFile (someFile, toReplace, replacement, callback) {
  fs.readFile(someFile, 'utf8', function (err, data) {
    if (err) {
      err = err.toString()
      dialog.showErrorBox('ERROR', err)
      return console.error(err)
    }
    let re = new RegExp(toReplace, 'g')
    let result = data.replace(re, replacement)
    fs.writeFile(someFile, result, 'utf8', function (err) {
      if (err) {
        err = err.toString()
        dialog.showErrorBox('ERROR', err)
        return console.error(err)
      }
      if (typeof callback === 'function') callback()
    })
  })
}

function updateBgModal () {
  $('#infotnmtBG,#modalimg').attr('src', `${getBackground}`)
}
