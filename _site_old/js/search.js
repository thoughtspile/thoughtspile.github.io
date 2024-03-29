var searchFunc = function (t, r, i) {
  $.ajax({
    url: t,
    dataType: "xml",
    success: function (t) {
      var e,
        n = $("entry", t)
          .map(function () {
            return {
              title: $("title", this).text(),
              content: $("content", this).text(),
              url: $("link", this).attr("href"),
            };
          })
          .get(),
        t = document.getElementById(r);
      t &&
        ((e = document.getElementById(i)),
        t.addEventListener("input", function () {
          var o = '<ul class="search-result-list">',
            h = this.value
              .trim()
              .toLowerCase()
              .split(/[\s\-]+/);
          (e.innerHTML = ""),
            this.value.trim().length <= 0 ||
              (n.forEach(function (t) {
                var n = !0;
                (t.title && "" !== t.title.trim()) || (t.title = "Untitled");
                var r,
                  e,
                  i,
                  l = t.title.trim().toLowerCase(),
                  a = t.content
                    .trim()
                    .replace(/<[^>]+>/g, "")
                    .toLowerCase(),
                  s = t.url,
                  c = -1,
                  u = -1;
                "" !== a
                  ? h.forEach(function (t, e) {
                      (r = l.indexOf(t)),
                        (c = a.indexOf(t)),
                        r < 0 && c < 0
                          ? (n = !1)
                          : (c < 0 && (c = 0), 0 == e && (u = c));
                    })
                  : (n = !1),
                  n &&
                    ((o +=
                      "<li><a href='" +
                      s +
                      "' class='search-result-title'>" +
                      l +
                      "</a>"),
                    (e = t.content.trim().replace(/<[^>]+>/g, "")),
                    0 <= u &&
                      ((s = u + 80),
                      (s = 0 == (t = (t = u - 20) < 0 ? 0 : t) ? 100 : s) >
                        e.length && (s = e.length),
                      (i = e.substr(t, s)),
                      h.forEach(function (t) {
                        var e = new RegExp(t, "gi");
                        i = i.replace(
                          e,
                          '<em class="search-keyword">' + t + "</em>"
                        );
                      }),
                      (o += '<p class="search-result">' + i + "...</p>")),
                    (o += "</li>"));
              }),
              (e.innerHTML = o += "</ul>"));
        }));
    },
  });
};
