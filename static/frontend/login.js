const login = {
    template: `
    <div class="d-flex justify-content-center align-items-center vh-100" >
      <div class="card shadow p-4 border rounded-3 ">
        <h3 class="card-title text-center mb-4">Login</h3>
        <div class="form-group mb-3">
          <input v-model="email" type="email" class="form-control" placeholder="Email" required/>
        </div>
       
        <div class="form-group mb-4">
          <input v-model="password" type="password" class="form-control" placeholder="Password" required/>
        </div>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>
        <button class="btn btn-primary w-100" @click="submitInfo" :disabled="loading || !email || !password"><!--frontend security-->
          <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          {{ loading ? 'Logging in...' : 'Submit' }}
        </button>
      </div>
    </div>
    `,
    data() {
        return{
            email: "",
            password: "",
            errorMessage: "",
            loading: false,
          };
  
            
        },
    methods: {
      async submitInfo() {
        this.errorMessage = null; // clearing previous message at each loading
        if (!this.email||!this.password){
          this.errorMessage = "email or password wrong";
          return;
        }
        this.loading = true;

        try{
          const url = window.location.origin;
          const res = await fetch(url + "/user_login", { method:"POST", headers:{"Content-Type": "application/json",}, body: JSON.stringify({ email : this.email, password : this.password}),});
          if (res.ok) { 
           
            const data = await res.json();
            console.log(data);
            console.log("we are logged in");//
            //localStorage.setItem('user',JSON.stringify(data))//

            // session store
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('role',data.role);
            sessionStorage.setItem('email',data.email); //allows me to persist user info during the session , so even when page reloads the data is still acessible until session ends
            sessionStorage.setItem('id',data.id);
            
            // set login and role in vuex store
            this.$store.commit("setRole", data.role);//updating the role state in the viue x  
            this.$store.commit("setLogin",true);
            switch(data.role){
              case "admin":
                this.$router.push("/admin_dashboard");
                break;
              case "cust":
                this.$router.push("/customer_dashboard");
                break;
              case "prof":
                this.$router.push("/professional_dashboard");
                break;
              default:
                this.errorMessage="unkown role";

            }
            
          } else{
            const errorMessage = await res.json();
            console.log('message:' , errorMessage.message);
            this.errorMessage = errorMessage.message || "failed to login";
          }
        } catch (error){
          console.error("error during login", error);
          this.errorMessage = "error occured try again later";
          
        } finally { this.loading = false;}
      },
    },
    };
export default login