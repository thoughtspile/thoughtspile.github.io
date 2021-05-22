(function () {
  var shareButton = document.getElementById('share-button');
  if (!navigator.share) {
    shareButton.style.display = 'none';
    return;
  }
  shareButton.addEventListener('click', function () {
    navigator.share({
      title: document.title,
      url: location.href,
    });
  });
})();
