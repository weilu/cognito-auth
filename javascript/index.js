(function(ready, EventEmitter) {

  ready(function() {
    var url = new URL(window.location);
    var verificationCode = url.searchParams.get("code");
    pageEvent = verificationCode ? 'LoginForm:mount' : 'SignupForm:mount'
    EventEmitter.emit(pageEvent)
  })

})(window.ready, window.EventEmitter)
