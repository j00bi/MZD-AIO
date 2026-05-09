/* jshint esversion:6 */
const selectBgDir = $('.menuCheck.bg input')
const selectColorsDL = $('.menuCheck.colors input')
$(function () {
  selectColorsDL.on('click', function () {
    if (selectColorsDL.hasClass('ng-pristine') && !hasColorFiles) {
      bootbox.confirm({
        title: 'The Color Scheme Tweak Requires Additional Files.',
        message: 'Download Color Scheme Files?',
        buttons: {
          confirm: { label: 'Download' },
          cancel: { label: 'Cancel' }
        },
        callback: function (result) {
          if (result) {
            ipc.send('download-aio-files', 'color-schemes.zip')
          } else {
            angular.element(selectColorsDL).scope().checked = false
          }
        }
      })
    }
  })
  angular.element($('.install-check input#IN23')).on('click', function () {
    if ($('.install-check input#IN23, .uninstall-check input#UN23').hasClass('ng-pristine') && !hasSpeedCamFiles) {
      bootbox.confirm({
        title: 'The Speedcam Patch Requires Additional Files.',
        message: 'Download Speedcam Patch Files?',
        buttons: {
          confirm: { label: 'Download' },
          cancel: { label: 'Cancel' }
        },
        callback: function (result) {
          if (result) {
            ipc.send('download-aio-files', 'speedcam-patch.zip')
          } else {
            angular.element($('.install-check input#IN23')).scope().checked = false
          }
        }
      })
    }
  })
})
ipc.on('already-downloaded', function (event, filename) {
  bootbox.confirm({
    message: 'You have already downloaded these files! Would you like to redownload and overwrite files?',
    buttons: {
      cancel: { label: 'No', className: 'btn-success' },
      confirm: { label: 'Yes', className: 'btn-danger' }
    },
    callback: function (result) {
      if (result) {
        ipc.send('resume-dl')
      }
    }
  })
})
ipc.on('selected-joined-bg', function (event, filepath) {
  if(filepath && filepath[0]) {
    let outFile = `${getBackground}`
    clipboard.writeImage(filepath[0])
    joinedPhoto(filepath[0])
    let bgNotification = new Notification('Background', {
      body: `Your Infotainment Background Will Be Changed To: ${filepath[0]}`,
      icon: 'favicon.ico',
      silent: true
    })
    bgNotification.onclick = () => {}
  }
})
ipc.on('selected-bg', function (event, filepath) {
  let outFile = `${getBackground}`
  let el = document.getElementById('selected-file')
  if (el) el.textContent = `Your Selected Background Image: ${filepath}`
  fs.writeFileSync(`${outFile}`, nativeImage.createFromPath(`${filepath}`).resize({ 'width': 800, 'height': 480 }).toPNG())
  let bgNotification = new Notification('Background', {
    body: `Your Infotainment Background Will Be Changed To: ${filepath}`,
    icon: 'favicon.ico',
    silent: true
  })
  snackbar(`Your Infotainment Background: <img src="${outFile}?` + new Date().getTime() + `" alt="${filepath}">`)
  bgNotification.onclick = () => {
    $('#imgframe').click()
  }
  ipc.emit('set-bg')
})
ipc.on('selected-offscreen-bg', function (event, filepath) {
  let outFile = `${varDir}/OffScreenBackground.png`
  fs.writeFileSync(`${outFile}`, nativeImage.createFromPath(`${filepath}`).resize({ 'width': 800, 'height': 480 }).toPNG())
  snackbar(`Your Infotainment Off-Screen Background: <img src="${outFile}?` + new Date().getTime() + `" alt="${filepath}">`)
})
ipc.on('set-bg', (prev) => {
  let bgNoCache = `${getBackground}?` + new Date().getTime()
  let frameEl = document.getElementById('imgframe')
  let modalEl = document.getElementById('imgmodal')
  if (frameEl) { frameEl.innerHTML = `<img src='${bgNoCache}' />` }
  if (modalEl) { modalEl.innerHTML = `<img src='${bgNoCache}' />` }
  if (`${prev}` === true) {
    $('#imgframe').click()
  }
})
ipc.on('selected-album-art', function (event, filepath) {
  let outFile = `${varDir}/no_artwork_icon.png`
  $('.blnk-albm-art').hide()
  $('#blnk-albm-img').show()
  settings.set('blank-album-art', `${filepath}`)
  fs.writeFileSync(`${outFile}`, nativeImage.createFromPath(`${filepath}`).resize({ 'width': 146, 'height': 146 }).toPNG())
  setTimeout(function () {
    let bgNoCache = `<img src="${varDir}/no_artwork_icon.png?` + new Date().getTime() + `">`
    $('#blnk-albm-img').html(`${bgNoCache}`)
    snackbar(`Blank Album Art: ${bgNoCache}`)
  }, 2000)
})
ipc.on('aio-info', function (event) {
  $('#FW_VER').attr('data-content', `FW_VERSION: ${persistantData.get('FW')}`)
  $('#FW_VER').show()
})
ipc.on('close-featherlight', function (event) {
  $.featherlight.current().close()
})
ipc.on('open-translator', function () {
  remote.BrowserWindow.fromId(1).focus()
  $('#openTranslator').click()
})
ipc.on('go-home', function () {
  remote.BrowserWindow.fromId(1).focus()
  $('#goHome').click()
})
