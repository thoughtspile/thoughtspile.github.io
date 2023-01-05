!(function () {
  var e = document.getElementById("share-button");
  document
    .getElementById("share-twitter")
    .addEventListener("click", function (e) {
      ga("send", "event", "Share", "share", "twitter");
    }),
    navigator.share
      ? e.addEventListener("click", function (e) {
          ga("send", "event", "Share", "share", "mobile"),
            e.preventDefault(),
            navigator.share({ title: document.title, url: location.href });
        })
      : e.parentElement.removeChild(e);
})();
