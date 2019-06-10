let storageArea = browser.storage.local;

function restoreOptions() {
  var gettingItem = storageArea.get([
  	'mtzoom_shiftkey',
  	'mtzoom_speed',
  	'mtzoom_disableScrollbarsWhenZooming',
  ]);
  gettingItem.then((res) => {
    document.getElementById('mtzoom_shiftkey').checked = res.mtzoom_shiftkey != null ? res.mtzoom_shiftkey : true;
    document.getElementById('mtzoom_speed').value = res.mtzoom_speed != null ? res.mtzoom_speed : 5;
    document.getElementById('mtzoom_disableScrollbarsWhenZooming').checked = res.mtzoom_disableScrollbarsWhenZooming != null ? res.mtzoom_disableScrollbarsWhenZooming : true;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);

document.getElementById('mtzoom_shiftkey').addEventListener('change', function (event) {
  storageArea.set({ "mtzoom_shiftkey": event.target.checked });
});

document.getElementById('mtzoom_speed').addEventListener('change', function (event) {
  storageArea.set({ "mtzoom_speed": parseFloat(event.target.value) });
});

document.getElementById('mtzoom_disableScrollbarsWhenZooming').addEventListener('change', function (event) {
  storageArea.set({ "mtzoom_disableScrollbarsWhenZooming": event.target.checked });
});
