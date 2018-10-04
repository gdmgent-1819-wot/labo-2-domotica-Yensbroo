firebase.auth().onAuthStateChanged((user) => {
  const logoutBtn = document.querySelector('.user_actions');
  const userForm = document.querySelector('.user_form');
  const roomElement = document.querySelector('.room');
  const alarmBtn = document.querySelector('.alarm');

  if (user) {
    logoutBtn.style.display = "block";
    userForm.style.display = "none";
    roomElement.style.display = "block";
    alarmBtn.style.display = "block";
  } else {
    logoutBtn.style.display = "none";
    userForm.style.display = "flex";
    roomElement.style.display = "none";
    alarmBtn.style.display = "none";
  }
})

const login = () => {
  const email = document.querySelector('.email').value;
  const password = document.querySelector('.password').value;
  const errorMsg = document.querySelector('.error');

  firebase.auth().signInWithEmailAndPassword(email, password).catch((error) => {
    errorMsg.innerHTML = error;
  })
}

const logout = () => {
  firebase.auth().signOut();
}