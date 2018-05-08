(function(EventEmitter, tmpl, Cognito) {

  var $root = document.getElementById('root'), 
    $container = document.createElement('div'),
    $button,
    $link,
    $title,
    $close,
    $form;

  function startLoading() {
    removeAlert()
    $button = $container.querySelectorAll('input[type=submit]')[0];
    $button.disabled = true;
    $button.value = 'Loading...';
  }

  function stopLoading() {
    $button.disabled = false;
    $button.value = 'Sign me up!'
  }

  function addAlert(options) {
    $title.insertAdjacentHTML('afterend', tmpl('Alert', options));
    $close = $container.getElementsByClassName('Alert__close')[0];
    $close.addEventListener('click', handleClose);
  }

  function removeAlert() {
    $alert = $container.getElementsByClassName('Alert')[0];
    $alert && $alert.remove();
    $close && $close.removeEventListener('click', handleClose);
  }

  function hideForm() {
    var style = $form.getAttribute("style") || ''
    $form.setAttribute("style", style + "display: none;")
  }

  function showForm() {
    var style = $form.getAttribute("style") || ''
    $form.setAttribute("style", style.replace('display: none;', ''))
  }

  function handleClose(event) {
    event.target.parentNode.remove()
  }

  function handleLoginLink(event) {
    event.preventDefault();
    EventEmitter.emit('SignupForm:unmount');
    EventEmitter.emit('LoginForm:mount');
  }

  function handleSubmit(event) {
    var $inputs = $container.getElementsByTagName('input'),
      attributes;
    event.preventDefault()
    startLoading()
    var password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    var email = $inputs.email.value
    Cognito.signUp(email, password)
    .then(function(result) {
      localStorage.setItem('password', password)
      localStorage.setItem('email', email)
      localStorage.removeItem('existingUser')
      stopLoading()
      hideForm()
      addAlert({
        type: 'success',
        message: 'Check your email to sign in',
      })
      console.log(result)
    })
    .catch(function(error) {
      stopLoading()
      if (error.message === 'User already exists') {
        Cognito.forgotPassword(email)
        .then(function(result) {
          localStorage.setItem('password', password)
          localStorage.setItem('email', email)
          localStorage.setItem('existingUser', true)
          stopLoading()
          hideForm()
          addAlert({
            type: 'success',
            message: 'Check your email to sign in',
          })
        })
        .catch(function(error) {
          stopLoading()
          addAlert({
            type: 'error',
            message: error.message,
          })
          console.error(error)
        })
        return;
      }
      addAlert({
        type: 'error',
        message: error.message,
      })
      console.error(error)
    })
  }

  EventEmitter.on('SignupForm:mount', function() {
    Cognito.isNotAuthenticated()
    .then(function() {
      $container.innerHTML = tmpl('SignupForm', {})
      $link = $container.getElementsByClassName('Control__link')[0]
      $form = $container.getElementsByTagName('form')[0]
      $title = $container.getElementsByClassName('title')[0]
      $link.addEventListener('click', handleLoginLink)
      $form.addEventListener('submit', handleSubmit)
      $root.appendChild($container)
    })
    .catch(function() {
      EventEmitter.emit('SignupForm:unmount');
      EventEmitter.emit('Welcome:mount');
    })
  })

  EventEmitter.on('SignupForm:unmount', function() {
    if ($link)
      $link.removeEventListener('click', handleLoginLink)
    if ($form)
      $form.removeEventListener('submit', handleSubmit)
    if ($container)
      $container.remove()
  })

})(
  window.EventEmitter,
  window.tmpl,
  window.Cognito
)
