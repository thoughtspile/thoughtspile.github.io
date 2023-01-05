document.addEventListener("click", function (e) {
  e.target.closest &&
    e.target.closest(".go-bmc") &&
    ga("send", "event", "Page", "buymecoffee");
});
