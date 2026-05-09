/* jshint esversion:8 */
/* global window */
const electron = require('electron')
const remote = require('@electron/remote')
const { app, BrowserWindow, dialog } = remote
const _ = require('lodash')
const fs = require('fs')
const ipc = electron.ipcRenderer
const path = require('path')
const { writeFileSync } = fs
const isDev = require('electron-is-dev')
const mkdirp = require('mkdirp')
const Config = require('electron-store')
const copydir = require('copy-dir')
const rimraf = require('rimraf')
const extract = require('extract-zip')
const crlf = require('crlf')
const appender = require('appender')
const drivelist = require('drivelist')

window.remote = remote
window.ipc = ipc
window.app = app
window.dialog = dialog
window.fs = fs
window.path = path

const settings = new Config({ 'name': 'aio-data' })
const persistantData = new Config({ 'name': 'aio-persist' })
const dataObj = new Config({ 'name': 'aio-data-obj' })
const lastView = new Config({ 'name': 'aio-last' })
const userThemes = new Config({ 'name': 'user-themes' })
const casdkApps = new Config({ 'name': 'casdk' })
const speedoSave = new Config({ 'name': 'MZD_Speedometer' })

window.settings = settings
window.persistantData = persistantData
window.dataObj = dataObj
window.lastView = lastView
window.userThemes = userThemes
window.casdkApps = casdkApps
window.speedoSave = speedoSave
window.mkdirp = mkdirp
window.rimraf = rimraf
window.copydir = copydir
window.extract = extract
window.crlf = crlf
window.appender = appender
window.drivelist = drivelist
window.isDev = isDev

window.copyFolderLocation = persistantData.get('copyFolderLocation', app.getPath('desktop'))
window.visits = persistantData.get('visits', 0)
window.hasSpeedCamFiles = false
window.colordir = `${app.getPath('userData')}/color-schemes/`
window.hasColorFiles = fs.existsSync(`${window.colordir}`)
window.approot = (isDev ? './app/' : app.getAppPath())
window.builddir = `${window.approot}/files/tweaks/`
window.logFileName = 'MZD_LOG'
window.varDir = `${app.getPath('userData')}/background/`
window.getBackground = `${window.varDir}/background.png`
window.date = function () { return new Date() }
window.dataURL = ''
window.aioURL = ''
window.helpClick = false
window.updateVer = 286

process.on('uncaughtException', (e) => {
  console.error(`Caught unhandled exception: ${e}`)
  dialog.showErrorBox('Caught unhandled exception: ' + (`${e}` || 'Unknown error message'), 'You can report this error to aio@mazdatweaks.com\nor open an issue at https://github.com/Trevelopment/MZD-AIO')
  app.quit()
})

window.lang = persistantData.get('lang', 'english')
if (window.location.pathname.includes('joiner')) {
  window.langPath = `../lang/${window.lang}.aio.json`
  window.langDefault = '../lang/english.aio.json'
  window.translateSchema = require('../lang/aio.schema.json')
} else {
  window.langPath = `${app.getPath('home')}/lang/${window.lang}.aio.json`
  window.langDefault = `${app.getPath('home')}/lang/english.aio.json`
  window.translateSchema = require(`${app.getPath('home')}/lang/aio.schema.json`)
}
window.langObj = require(window.langPath)
const langDef = require(window.langDefault)
window.langObj = _.merge(langDef, window.langObj)

function saveMenuLock () {
  persistantData.set('menuLock', !persistantData.get('menuLock'))
  $('body, .hideNav, .w3-overlay').toggleClass('showNav')
}
window.saveMenuLock = saveMenuLock

if (!fs.existsSync(window.varDir)) {
  mkdirp.sync(window.varDir)
}

function startTime () {
  const today = new Date()
  let h = today.getHours()
  let m = today.getMinutes()
  m = checkTime(m)
  $('#clock').html(`${h}:${m}`)
  setTimeout(startTime, 10000)
  formatDateCustom(2)
}
window.startTime = startTime

function checkTime (i) {
  if (i < 10) { i = '0' + i }
  return i
}

ipc.on('open-copy-folder', openCopyFolder)
window.openCopyFolder = openCopyFolder

function openCopyFolder () {
  const openCopy = `${persistantData.get('copyFolderLocation', window.copyFolderLocation)}/_copy_to_usb/`
  if (!fs.existsSync(openCopy)) {
    mkdirp.sync(openCopy)
  }
  require('electron').shell.openPath(openCopy)
}

function openApkFolder () {
  require('electron').shell.openPath(path.normalize(path.join(path.dirname(__dirname), '../../castscreenApp/')))
}
window.openApkFolder = openApkFolder

function openDlFolder () {
  require('electron').shell.openPath(path.normalize(path.join(app.getPath('userData'), 'color-schemes/')))
}
window.openDlFolder = openDlFolder

function openDefaultFolder () {
  require('electron').shell.openPath(path.normalize(path.join(path.dirname(__dirname), '../background-images/default/')))
}
window.openDefaultFolder = openDefaultFolder

function autoHelp () {
  $.featherlight('views/autoHelp.htm', { closeSpeed: 500, variant: 'autoHelpBox' })
}
window.autoHelp = autoHelp

function myStance () {
  ipc.send('reset-window-size')
  updateNotesCallback()
}
window.myStance = myStance

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
window.updateNotes = updateNotes

function firstTimeVisit () {
  if (persistantData.get('updateVer', 0) < window.updateVer) {
    myStance()
    settings.set('reset', true)
    lastView.clear()
    if(persistantData.has('updateVer')) {
      updateNotes()
    }
    persistantData.set('updateVer', window.updateVer)
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
window.firstTimeVisit = firstTimeVisit

function updateNotesCallback () {
  if (window.visits > 0) {
    if (!persistantData.get('updated', false)) {
      updateNotes()
    }
  } else {
    persistantData.set('visits', 1)
    $('body').prepend('<div id="super-overlay" style="z-index:999999;width:9999px;height:9999px;display:block;position:fixed;background:transparent;"></div>')
    bootbox.dialog({
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
window.updateNotesCallback = updateNotesCallback

function helpDropdown () {
  const x = document.getElementById('helpDrop')
  if (!x.className.includes('w3-show')) {
    x.className += ' w3-show'
    document.getElementById('sidenavOverlay').display = 'block'
    if (!window.helpClick) {
      new Notification('Help', {
        body: 'Visit MazdaTweaks.com for more help',
        icon: 'favicon.ico',
        tag: 'MZD-AIO-TI',
        silent: true
      }).onclick = () => { window.externalLink('mazdatweaks') }
      window.snackbar(`Visit <a href onclick='externalLink("mazdatweaks")'>MazdaTweaks.com</a> for more help`)
    }
    window.helpClick = true
  } else { closeHelpDrop() }
}
window.helpDropdown = helpDropdown

function closeHelpDrop () {
  const x = document.getElementById('helpDrop')
  if (x) x.className = x.className.replace(' w3-show', '')
}

function dropDownMenu (id) {
  const x = document.getElementById(id)
  const y = $('#' + id)
  if (!x.className.includes('w3-show')) {
    $('.w3-dropdown-content').removeClass('w3-show')
    x.className += ' w3-show'
  } else {
    x.className = x.className.replace(' w3-show', '')
  }
  y.on({ mouseleave: function () { y.toggleClass('w3-show') } })
}
window.dropDownMenu = dropDownMenu

function toggleFullScreen () {
  remote.BrowserWindow.getFocusedWindow().setFullScreen(!remote.BrowserWindow.getFocusedWindow().isFullScreen())
  $('.icon-fullscreen').toggleClass('icon-fullscreen-exit')
}
window.toggleFullScreen = toggleFullScreen

let togg = false
function toggleAllOps () {
  const x = $('.toggleExtra')
  if (togg) {
    $('#alltoggle').addClass('icon-minus-alt').removeClass('icon-plus-alt')
    x.removeClass('icon-plus-square').addClass('icon-minus-square')
  } else {
    $('#alltoggle').removeClass('icon-minus-alt').addClass('icon-plus-alt')
    x.addClass('icon-plus-square').removeClass('icon-minus-square')
  }
  togg = !togg
}
window.toggleAllOps = toggleAllOps

function externalLink (link) {
  const url = `https://trevelopment.win/${link}`
  try { new URL(url); require('electron').shell.openExternal(url) } catch (e) { console.error('Invalid URL:', url) }
}
window.externalLink = externalLink

function cleanArray (actual) {
  const newArray = []
  for (let i = 0; i < actual.length; i++) { if (actual[i]) newArray.push(actual[i]) }
  return newArray
}
window.cleanArray = cleanArray

function copyCode (x) {
  $(x).select()
  document.execCommand('Copy')
  snackbar('Copied "' + $(x).val() + '" to clipboard')
}
window.copyCode = copyCode

function donate () {
  require('electron').shell.openExternal('https://mazdatweaks.com/donate')
}
window.donate = donate

function getParameterByName (name, url) {
  if (!url) url = window.location.href
  url = url.toLowerCase()
  name = name.replace(/[[\]]/g, '\\$&').toLowerCase()
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)
  if (!results) return ''
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}
window.getParameterByName = getParameterByName

function writeRotatorVars (imgs) {
  if (imgs > 1) {
    fs.writeFileSync(`${window.varDir}/bg-rotator.txt`, `BG_STEPS=${imgs}\nBG_SECONDS=${imgs * $('#bgRotatorSeconds').val()}\nBG_SEC_EACH=${$('#bgRotatorSeconds').val()}\nBG_WIDTH=${imgs * 800}`)
  } else {
    fs.writeFileSync(`${window.varDir}/bg-rotator.txt`, '')
  }
}
window.writeRotatorVars = writeRotatorVars

function saveAIOLogHTML () {
  const logContent = document.getElementById('aio-comp-log').innerHTML
  const a = document.body.appendChild(document.createElement('a'))
  a.download = 'AIO_Log.html'
  a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(logContent)
  a.click()
}
window.saveAIOLogHTML = saveAIOLogHTML

function checkForUpdate (ver) {
  $.featherlight(`https://aio.trevelopment.com/update.php?ver=${window.updateVer}`, { closeSpeed: 100, variant: 'checkForUpdate' })
}
window.checkForUpdate = checkForUpdate

function formatDateCustom (dateFormatType) {
  const currentTime = new Date()
  let dateStr = null
  const month = currentTime.getMonth() + 1
  const day = currentTime.getDate()
  const dayStr = ((day < 10) ? ('0' + day) : day)
  const monthStr = ((month < 10) ? ('0' + month) : month)
  if (dateFormatType === 1) dateStr = dayStr + '.' + monthStr + '.'
  else if (dateFormatType === 2) dateStr = monthStr + '/' + dayStr
  else dateStr = currentTime.toISOString().substring(0, 10)
  $('#date').text(dateStr)
}
window.formatDateCustom = formatDateCustom

function toggleOps (x) { $(x).toggleClass('icon-plus-square').toggleClass('icon-minus-square') }
window.toggleOps = toggleOps

function secretMenu () {
  $(`<div id="secretMenu" class="w3-card-12 w3-container"><header class="w3-container w3-teal"><span onclick="$(this).parent().parent().remove()" class="w3-closebtn">&times;</span><h2>Secret Menu</h2></header><div class="w3-container"><button class="w3-btn w3-red w3-hover-yellow w3-ripple w3-border" onclick="persistantData.delete('lang')">Reset Language Variable</button><button class="w3-btn w3-green w3-hover-indigo w3-ripple w3-border" onclick="$('#instAll').click()">Install All</button><button class="w3-btn w3-deep-orange w3-hover-red w3-ripple w3-border" onclick="$('#uninstAll').click()">Uninstall All</button><button class="w3-btn w3-blue w3-hover-yellow w3-ripple w3-border" onclick="openDlFolder()">Downloaded Files</button></div><footer class="w3-container w3-teal"><p>Modal Footer</p></div>`).insertAfter($('#snackbar'))
  $('#secretMenu').fadeOut(10000)
}
window.secretMenu = secretMenu

function showCompatibility () {
  $(`<div id="compatibilityCheck" class="w3-small w3-padding" style="width:100%;max-width:1200px;margin:auto;background:rgba(0,0,0,.8);color:#fff;"><header class="w3-container w3-indigo"><span onclick="$(this).parent().parent().remove()" class="w3-closebtn">&times;</span><h2>Compatibility</h2></header><div class="w3-container"><div class="w3-panel w3-center"><H2> **AIO IS COMPATIBLE WITH ALL FW V55, V56, V58, V59 AND UP TO V70.00.352** </H2><h3 style="text-transform: capitalize;">NOTE: FW v59.00.502+ <a href="" onclick="externalLink('im-super-serial')">Requires Additional Steps To Install Tweaks.</a>  If updating to v59.00.502+ install Autorun & Recovery Scripts to allow Tweaks to be installed after updating.</h3><h3 style="text-transform: capitalize;">WARNING: FW v70.00.335+ <a href="" onclick="externalLink('id7')">Requires Making A Serial Connection <strong>Before Updating</strong>.</a></h3></div>`).insertAfter($('#mzd-title'))
}
window.showCompatibility = showCompatibility

function updateBgModal () {
  $('#infotnmtBG,#modalimg').attr('src', `${window.getBackground}`)
}
window.updateBgModal = updateBgModal

$(function () {
  $('.toggleExtra.1').addClass('icon-plus-square').removeClass('icon-minus-square')
  $('body').css('overflow', 'auto')
})
