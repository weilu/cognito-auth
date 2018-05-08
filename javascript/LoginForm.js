(function(EventEmitter, tmpl, Cognito){
  /* LoginForm */
  var $root = document.getElementById('root'), 
    $container = document.createElement('div'),
    $title,
    $close,
    $alert,
    $button,
    $form,
    $link;
  var url = new URL(window.location);
  var verificationCode = url.searchParams.get("code");

  function startLoading() {
    removeAlert()
    $button = $container.querySelectorAll('input[type=submit]')[0];
    $button.disabled = true;
    $button.value = 'Loading...';
  }

  function stopLoading() {
    $button.disabled = false;
    $button.value = 'Let\'s go';
  }

  function addAlert(options) {
    $title.insertAdjacentHTML('afterend', tmpl('Alert', options));
    $close = $container.getElementsByClassName('Alert__close')[0];
    $close.addEventListener('click', handleClose);
  }

  function handleClose(event) {
    event.target.parentNode.remove()
  }

  function removeAlert() {
    $alert = $container.getElementsByClassName('Alert')[0];
    $alert && $alert.remove();
    $close && $close.removeEventListener('click', handleClose);
  }

  function handleSignupLink(event) {
    event.preventDefault();
    EventEmitter.emit('LoginForm:unmount')
    EventEmitter.emit('SignupForm:mount')
  }

  function redirectToWelcomePage() {
    EventEmitter.emit('LoginForm:unmount');
    EventEmitter.emit('Welcome:mount');
  }

  function handleSubmit(event) {
    event.preventDefault()
    var $inputs = $container.getElementsByTagName('input');
    var email = $inputs.email.value
    startLoading()
    Cognito.logIn(email, localStorage.getItem('password'))
    .then(function(result) {
      stopLoading()
      addAlert({
        type: 'success',
        message: 'Log in successful! Redirecting...'
      })
      setTimeout(redirectToWelcomePage, 3000)
      // use identity token as Authorization header
      console.log(result.idToken.jwtToken)
    })
    .catch(function(error) {
      stopLoading()
      console.log(error.message)
      // If the user needs to enter its confirmation code switch to the
      // confirmation form page.
      if (error.message === 'User is not confirmed.') {
        if (verificationCode) {
          console.log('Auto verifying user using code in URL');
          Cognito.confirm(email, verificationCode)
          .then(function(result) {
            handleSubmit(event)
          })
          .catch(function(error) {
            stopLoading();
            addAlert({
              type: 'error',
              message: error.message,
            });
            console.log(error);
          })
        } else {
          EventEmitter.emit('ConfirmForm:mount', {
            email: $inputs.email.value,
          });
          EventEmitter.emit('LoginForm:unmount');
        }
        return;
      }
      addAlert({
        type: 'error',
        message: error.message,
      })
      console.error(error)
    })
  }

  EventEmitter.on('LoginForm:mount', function(message) {
    Cognito.isNotAuthenticated()
    .then(function() {
      $container.innerHTML = tmpl('LoginForm', {})
      $link = $container.getElementsByClassName('Control__link')[0];
      $form = $container.getElementsByClassName('form')[0];
      $title = $container.getElementsByClassName('title')[0];
      $link.addEventListener('click', handleSignupLink);
      $form.addEventListener('submit', handleSubmit);
      $root.appendChild($container);
      if (message) {
        addAlert(message);
      }
      var email = $container.querySelector('input');
      var storedEmail = localStorage.getItem('email')
      if (storedEmail) {
        email.value = storedEmail
      }
    })
    .catch(redirectToWelcomePage)
  })

  EventEmitter.on('LoginForm:unmount', function() {
    $link && $link.removeEventListener('click', handleSignupLink);
    $form && $form.removeEventListener('submit', handleSubmit);
    $container.remove();
  })
})(window.EventEmitter, window.tmpl, window.Cognito)
