function restoreOptions() {
  var gettingItem = browser.storage.sync.get('mtzoom_shiftkey');
  gettingItem.then((res) => {
    if (Object.keys(res).length === 0) {
      changeShiftKey(true);
      document.getElementById('mtzoom_shiftkey').checked = true;
    } else {
      document.getElementById('mtzoom_shiftkey').checked = res.mtzoom_shiftkey;
    }
  });
}

function changeShiftKey(value) {
  browser.storage.sync.set({
    "mtzoom_shiftkey": value
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('mtzoom_shiftkey').addEventListener('change', function (event) {
  changeShiftKey(event.target.checked)
});
