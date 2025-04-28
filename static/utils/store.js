Vue.use(Vuex); // statemanagement libbrary of vue js 

const store = new Vuex.Store({
  state: {
    loggedIn: !!sessionStorage.getItem("token"), // true if token exists updates when the user is logged in 
    role: sessionStorage.getItem("role") || "",   // Get role or default to empty string
    currentUser: JSON.parse(sessionStorage.getItem("currentUser")) || null, // Store user details, including id
  },

  mutations: {
    setLogin(state, user) {
      state.loggedIn = true; 
      state.currentUser = user; // Set currentUser when logged in
      sessionStorage.setItem("currentUser", JSON.stringify(user)); // Store in sessionStorage
    },
    logout(state) {
      state.loggedIn = false;
      state.role = "";  
      state.currentUser = null; // Clear currentUser on logout
      sessionStorage.removeItem("currentUser"); // Remove from sessionStorage
    },
    setRole(state, role) { //keeping the tracks of the users so one can easily track the users logged in and send it to the right page
      state.role = role;      // Set the role based on the logged-in user
      sessionStorage.setItem("role", role); // Store in sessionStorage
    },
  },
});

export default store;
