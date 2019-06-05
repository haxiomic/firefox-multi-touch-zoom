function restoreOptions() {
  var gettingItem = browser.storage.sync.get(['mtzoom_shiftkey', 'mtzoom_speed']);
  gettingItem.then((res) => {
    document.getElementById('mtzoom_shiftkey').checked = res.mtzoom_shiftkey != null ? res.mtzoom_shiftkey : true;
    document.getElementById('mtzoom_speed').value = res.mtzoom_speed != null ? res.mtzoom_speed : 5;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);

document.getElementById('mtzoom_shiftkey').addEventListener('change', function (event) {
  browser.storage.sync.set({ "mtzoom_shiftkey": event.target.checked });
});

document.getElementById('mtzoom_speed').addEventListener('change', function (event) {
  browser.storage.sync.set({ "mtzoom_speed": parseFloat(event.target.value) });
});
