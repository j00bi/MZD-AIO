/* jshint esversion:6 */
let dll = null
ipc.on('update-not available', (event) => {
  setTimeout(function () {
    $('#update-available a').addClass('w3-hide')
  }, 2000)
})
ipc.on('update-available-alert', (event) => {
  $('#update-available, #update-available a').removeClass('w3-hide')
  let updots = 0
  dll = setInterval(function () {
    if (updots !== 5) {
      $('#update-available a').append('.')
      updots++
    } else {
      $('#update-available').html('<a>Update Downloading.</a>')
      updots = 0
    }
  }, 2000)
})
ipc.on('update-err', (event) => {
  clearInterval(dll)
  dll = null
  $('#update-available').html('<a onclick="shell.openExternal(\'https://github.com/Trevelopment/MZD-AIO/releases\')" class="link">ERROR: CLICK HERE FOR UPDATE.</a>')
  snackbarstay(`<a onclick="shell.openExternal(\'https://github.com/Trevelopment/MZD-AIO/releases\')" class="link">UPDATE ERROR: CLICK HERE TO DOWNLOAD THE LATEST UPDATE.</a>`)
})
ipc.on('update-downloaded', (event) => {
  snackbarstay(`<span id="restart">An Update Is Available:  <a href="" class="w3-btn w3-deep-purple w3-hover-light-blue">UPDATE</a></span>`)
  $('#update-available').text('Update Available')
  setTimeout(function () { document.getElementById('update-ready').className = '' }, 7500)
  document.getElementById('restart').addEventListener('click', (e) => {
    e.preventDefault()
    ipc.send('update-and-restart')
  })
})
ipc.on('dl-progress', (event, megaBytes, fileName, totalSize) => {
  if ((megaBytes / totalSize) < 1) {
    if ($('#progress').length) {
    } else {
      showNotification('Downloading Please wait <img src="./files/img/load-1.gif" alt="...">', `<div id="dl-notif"><h5>Downloading ${fileName}: </h5><span id="progress"></span></div>`, 0)
    }
  } else {
    let el = document.getElementById('progress')
    if (el) el.textContent = `${fileName} Download Complete.`
    snackbar(`${fileName} Download Complete.`)
    $('#progress').parent().fadeOut('1000')
  }
})
ipc.on('notif-progress', (event, message) => {
  if ($('#progress').length) {
    let el = document.getElementById('dl-notif')
    if (el) el.textContent = message
    $('#dl-notif').parent().hide(1000)
    snackbar(message)
  } else {
    showNotification('Download', message, 10)
  }
})
ipc.on('notif-bg-saved', (event, message) => {
  showNotification('Background', message, 10)
})

function showNotification (title, message, fadeouttime, callback) {
  $('#notices').show()
  let notice = document.createElement('div')
  notice.setAttribute('class', 'notice')
  let closeBtn = document.createElement('span')
  closeBtn.className = 'w3-closebtn w3-display-topright'
  closeBtn.style.cursor = 'pointer'
  closeBtn.textContent = '\u00D7'
  closeBtn.onclick = function () { $(this).parent().hide((fadeouttime + 1) * 1000) }
  notice.appendChild(closeBtn)
  let contentDiv = document.createElement('div')
  contentDiv.className = 'w3-hover-text-indigo'
  contentDiv.textContent = message ? String(message).replace(/<[^>]+>/gm, '') : ''
  notice.appendChild(contentDiv)
  document.getElementById('notices').appendChild(notice)
  if (fadeouttime !== 0) {
    setTimeout(function () {
      $('#notices *').fadeOut(fadeouttime * 1000)
    }, 3000)
  }
  let nohtml = message ? String(message).replace(/<[^>]+>/gm, '') : ''
  snackbar(`<img src='icon.ico' onerror='$(this).hide()'> ${nohtml}`)
  let myNotification = new Notification(title, {
    body: nohtml,
    icon: 'icon.ico',
    silent: true
  })
  if (callback) {
    myNotification.onclick = () => {
      callback()
    }
  } else {
    myNotification.onclick = () => {
      remote.BrowserWindow.getChildWindows().close()
      remote.BrowserWindow.fromId(1).focus()
      console.log('Notification clicked: ' + myNotification.timestamp)
    }
  }
}

ipc.on('snackbar-msg', (event, message) => {
  snackbar(message)
})

function snackbar (message, mtime) {
  $.gritter.add({
    title: 'MZD-AIO',
    text: message,
    time: mtime * 1000 || 5000
  })
}

function snackbarstay (message) {
  $.gritter.add({
    title: 'MZD-AIO',
    text: message,
    sticky: true
  })
}
