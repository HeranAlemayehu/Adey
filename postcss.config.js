export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

function signUpUser(email, password, extraData) {
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // store extra info in Firestore
      return db.collection("users").doc(user.uid).set(extraData);
    })
    .then(() => {
      alert("Account created successfully!");
      window.location.href = "home.html"; // or wherever your home page is
    })
    .catch((error) => {
      alert(error.message);
    });
    function loginUser(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "home.html";
    })
    .catch((error) => {
      alert(error.message);
    });
}
document.getElementById("signupButton").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const name = document.getElementById("name").value;
  const dob = document.getElementById("dob").value;
  const pregnant = document.getElementById("pregnant").value;
  const extraData = { name, dob, pregnant };

  signUpUser(email, password, extraData);
});

document.getElementById("loginButton").addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  loginUser(email, password);
});


  }
