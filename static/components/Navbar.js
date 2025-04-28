const Navbar ={
    template : `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <!-- Logo or Brand Name -->
      <a class="navbar-brand" href="#">Services_4U</a>

      <!-- Toggler for small screens -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Navbar links -->
      <div class="collapse nav-pills navbar-collapse " id="navbarNav">
        <ul class="navbar-nav ms-auto"><!--ms auto to shift contents to right-->
          <li class="nav-item">
            <router-link v-if="!state.loggedIn" class="nav-link" :class="{ active: isActive('/') }" to="/">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link v-if="!state.loggedIn" class="nav-link" :class="{ active: isActive('/login') }" to="/login">Login</router-link>
          </li>
          <li class="nav-item">
            <router-link v-if="!state.loggedIn" class="nav-link" :class="{ active: isActive('/Register') }" to="/Register">Signup</router-link>
          </li>
          <li class="nav-item"><!--state.loggedIN is in store -->
          <router-link v-if="state.loggedIn && state.role === 'cust'" class="nav-link" :class="{ active: isActive('/customer_dashboard') }" to="/customer_dashboard">Dashboard</router-link>
        </li>
        <li class="nav-item">
          <router-link v-if="state.loggedIn && state.role === 'prof'" class="nav-link" :class="{ active: isActive('/professional_dashboard') }" to="/professional_dashboard">Dashboard</router-link>
        </li>
        <li class="nav-item">
          <router-link v-if="state.loggedIn && state.role === 'admin'" class="nav-link" :class="{ active: isActive('/admin_dashboard') }" to="/admin_dashboard">Dashboard</router-link>
        </li>
        <li class="nav-item">
          <router-link v-if="state.loggedIn && state.role === 'admin'" class="nav-link" :class="{ active: isActive('/admin_create') }" to="/admin_create">Create</router-link>
        </li>
        <li class="nav-item">
          <router-link v-if="state.loggedIn && state.role === 'admin'" class="nav-link" :class="{ active: isActive('/admin_stats') }" to="/admin_stats">Statistics</router-link>
        </li>
        <li class="nav-item">
          <router-link v-if="state.loggedIn && state.role === 'cust'" class="nav-link" :class="{ active: isActive('/customer_stats') }" to="/customer_stats">Statistics</router-link>
        </li>
        <li class="nav-item">
          <router-link v-if="state.loggedIn && state.role === 'prof'" class="nav-link" :class="{ active: isActive('/professional_stats') }" to="/professional_stats">Statistics</router-link>
        </li>
        
        
          <li class="nav-item">
            <router-link v-if="state.loggedIn && !state.role === 'admin'" class="nav-link" :class="{ active: isActive('/profile') }" to="/profile">Update</router-link>
          </li> <!--updateprofile will only be visible to professional and customers thus excluding  admin-->
          <li class="nav-item" v-if = state.loggedIn>
          <a   class="nav-link" @click="logout" style ="cursor: pointer;">logout</a>
        </li>
         
        </ul>
      </div>
    </div>
  </nav>`,

methods: {
  logout() {
    sessionStorage.clear();
    this.$store.commit("logout");
    this.$router.push("/");
  },
  isActive(route) {
        return this.$route.path === route;
        
    },
},
computed: { state() { return this.$store.state;},},
mounted() {
  console.log("navbar mounted"); // to check the debugs
}
};

export default Navbar;