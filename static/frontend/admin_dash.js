const DashboardAdmin = {
    template: ` 
   

      <div class="container mt-4 ">
          <button class="btn btn-primary mx-2" @click="FinishedRequests">
          📥download finished requests
          </button>
          <button class="btn btn-primary mx-2" @click="canceledRequests">
          📥download canceled requests
          </button>
          
          <div class="mt-4">
              <h2 class="me-5" style='color:white;'>Welcome: {{ email }}</h2>
              <h2 class="me-5" style='color:white;'>Role: {{ display_role }}</h2>
           </div>
         <!-- Inactive Professionals Section -->
         
            
      <div class="mybox-container">
      <div class="custom-card">
          <!-- Section Title -->
          <h3 class ="professionls-container" >Professionals</h3>
  
          <!-- Search Filters -->
          <div class="custom-search">
                                  <!--dynamic searching by @input-->
              <input type="text" v-model="searchEmailProf" 
                     placeholder=" Search by Email"   
                     @input="searchProfessionals" 
                     class="custom-input">
              
              <input type="text" v-model="searchLocationProf" 
                     placeholder=" Search by Location" 
                     @input="searchProfessionals" 
                     class="custom-input">
  
              <div class="custom-checkbox">
                  <input type="checkbox" v-model="blockedProf" 
                         @change="searchProfessionals" id="blockedCheckbox">
                  <label for="blockedCheckbox">Blocked</label>
              </div>
          </div>
      </div>
  </div>
          

       <!--all inactive professionals ie unvarified -->

        
          <div v-if="inactiveProf.length === 0"> <!--if length is  0-->
              <p>No inactive professionals found.</p>
          </div>
          <div v-else class="table-responsive">
              <table class="table table-bordered table-striped" style="background-color: white;">
                  <thead class="thead-dark">
                      <tr>
                          <th>Email</th>
                          <th>Contacts</th>
                          <th>Location</th>
                          <th>Service Type</th>
                          <th>Experience</th>
                          
                          <th>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr v-for="user in inactiveProf" :key="user.id">
                          <td>{{ user.email }}</td>
                          <td>{{ user.mobile || 'N/A' }}</td>
                          <td>{{ user.location || 'N/A' }}</td>
                          <td>{{ user.service_type || 'N/A' }}</td>
                          <td>{{ user.experience_years || 'N/A' }} years</td>
                          
                          <td>
                              <button v-if="!user.active" class="btn btn-success btn-sm" @click="activate(user.id)">Activate</button>
                              <button v-if="!user.blocked && user.active" class="btn btn-danger btn-sm" @click="blockUser(user.id)">Block</button>
                              <button v-else-if="user.blocked && user.active" class="btn btn-warning btn-sm" @click="unblockUser(user.id)">Unblock</button>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
  
          <!-- Active Customers Section -->
          
    <div class="mybox-container">
        <div class="custom-card">
        <!-- Section Title -->
           <h3 class="customers-title">Customers</h3>

        <!-- Search Filters -->
        <div class="custom-search">
            <input type="text" v-model="searchEmailCust" 
                   placeholder=" Search by Email" 
                   @input="searchCustomers" 
                   class="custom-input">

            

            <input type="text" v-model="searchLocationCust" 
                   placeholder="Search by Location" 
                   @input="searchCustomers" 
                   class="custom-input">

            <div class="custom-checkbox">
                <input type="checkbox" v-model="blockedCust" 
                       @change="searchCustomers" id="blockedCheckboxCust">
                <label for="blockedCheckboxCust">Blocked</label>
            </div>
        </div>
    </div>
</div>

          
          <div v-if="activeCustomers.length === 0"> <!--if list length is zero-->
              <p>No active customers found.</p>
          </div> <!--dynamic table-->
          <div v-else class="table-responsive">
              <table class="table table-bordered table-striped" style="background-color: white;">
                  <thead class="thead-dark">
                      <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Contacts</th>
                          <th>Location</th>
                          <th>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr v-for="customer in activeCustomers" :key="customer.id">
                          <td>{{ customer.full_name }}</td>
                          <td>{{ customer.email }}</td>
                          <td>{{ customer.mobile || 'N/A' }}</td>
                          <td>{{ customer.location || 'N/A' }}</td>
                          <td>
                              <button v-if="!customer.blocked" class="btn btn-danger btn-sm" @click="blockCustomer(customer.id)">Block</button>
                              <button v-else class="btn btn-success btn-sm" @click="unblockCustomer(customer.id)">Unblock</button>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
    `,
    data() {
      return {
        email: sessionStorage.getItem("email"),
        role: sessionStorage.getItem("role"),
        inactiveProf: [], // store the json reponse for all inactive prof
        activeCustomers: [], // store json response
        searchEmailProf: "",
        searchLocationProf: "",
        blockedProf: false,
        searchEmailCust: "",
        //searchNameCust: "",
        searchLocationCust: "",
        blockedCust: false,
      };
    },
    computed: {
      display_role() {return this.role === "prof" ? "Professional" : this.role === "cust" ? "Customer": this.role === "admin" ? "Admin":"unknown";}, 
    },
    methods: {
      async FinishedRequests() { // downloading the csv data of finished service requests
        const res = await fetch(window.location.origin + "/export_finished", {
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        });
  
        if (res.ok) {
          const data = await res.json();
          const downloadLink = window.location.origin + "/download-file/closed_requests.csv";
          const a = document.createElement("a");
          a.href = downloadLink;
          a.click();
          alert("Export completed successfully!");
        } else {
          alert("Failed to export closed requests.");
        }
      },
      async canceledRequests() { // downloading the csv data of canceled service requests
        const res = await fetch(window.location.origin + "/export_canceled", {
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        });
  
        if (res.ok) {
          const data = await res.json();
          const downloadLink = window.location.origin + "/download-file/canceled_requests.csv";
          const a = document.createElement("a");
          a.href = downloadLink;
          a.click();
          alert("Export completed successfully!");
        } else {
          alert("Failed to export closed requests.");
        }
      },





      async fetchInactiveProfessionals() {  // not using the try catch method 
        const professionalsRes = await fetch(
          window.location.origin + "/inactive_professional",
          { 
             // explitcitly
            headers: {
              AuthenticationToken: sessionStorage.getItem("token"),
            },
          }
        );
        this.inactiveProf = await professionalsRes.json();
      },




      async fetchActiveCustomers() { // to get all the active customer
        const customersRes = await fetch(
          window.location.origin + "/active_customers",
          { 
            
            headers: {
              AuthenticationToken: sessionStorage.getItem("token"),
            },
          }
        );
        this.activeCustomers = await customersRes.json();
      },

        
      async searchProfessionals() { // used in the @input to trigger for professional search
        const res = await fetch(
          window.location.origin +  //another method for writing this type url is in --> search customer  below
            "/search_professionals?email=" +
            this.searchEmailProf +
            "&location=" +
            this.searchLocationProf +
            "&blocked=" +
            this.blockedProf, // dynamically creating the url based on the user input 
          {
            
            headers: {
              AuthenticationToken: sessionStorage.getItem("token"),
            },
          }
        );
        this.inactiveProf = await res.json();
      },     
    //will fetch the  data 


      async searchCustomers() {  // used in the costumer search @input trigger  
        const res = await fetch(`${window.location.origin}/search_customers?email=${this.searchEmailCust}&location=${this.searchLocationCust}&blocked=${this.blockedCust}`,
          { 
            
            headers: {
              AuthenticationToken: sessionStorage.getItem("token"),
            },
          }
        );
        this.activeCustomers = await res.json();
      },


      async blockUser(id) { // blocking the user 
        const res = await fetch(`${window.location.origin}/block-user/${id}`, {
          method: "POST",
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        });
  
        if (res.ok) {
          alert("User blocked"); // backend api sets the blocked value to true


           // this is updating the local state on the frontend side instead of refetchinig all users from the backend
          this.inactiveProf = this.inactiveProf.map((user) =>    //.map() creating the new array  with updated blocked status 
            user.id === id ? { ...user, blocked: true } : user
          );
        }
      },



      async unblockUser(id) {
        const res = await fetch(window.location.origin + "/unblock-user/" + id, {  // no diffrence in creating this type of url works same as in blocked
          method: "POST",
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        });
  
        if (res.ok) {
          alert("User unblocked");
          this.inactiveProf = this.inactiveProf.map((user) =>
            user.id === id ? { ...user, blocked: false } : user
          );
        }
      },


      async blockCustomer(id) {   //will use the same backend api as  block user 
        const res = await fetch(window.location.origin + "/block-user/" + id, {
          method: "POST",
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        });
  
        if (res.ok) {
          alert("Customer blocked");
          this.activeCustomers = this.activeCustomers.map((customer) =>
            customer.id === id ? { ...customer, blocked: true } : customer
          );
        }
      },
      async unblockCustomer(id) { // will use same backend api as of unblock user
        const res = await fetch(window.location.origin + "/unblock-user/" + id, {
          method: "POST",
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        });
  
        if (res.ok) {
          alert("Customer unblocked");
          this.activeCustomers = this.activeCustomers.map((customer) =>
            customer.id === id ? { ...customer, blocked: false } : customer
          );
        }
      },


      async activate(id) { //for activating the professionals ie  verifying them 
        const res = await fetch(window.location.origin + "/activate-prof/" + id, {
          method: "POST",
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        });
  
        if (res.ok) {
          alert("Professional activated");
          this.inactiveProf = this.inactiveProf.filter((user) => user.id !== id);
        } else {
          const errorData = await res.json();
          alert("Error activating professional: " + errorData.message);
        }
      },
    },
    async created() { // to get all the inactive professionlal
      const professionalsRes = await fetch(
        window.location.origin + "/inactive_professional",
        {
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        }
      );
      this.inactiveProf = await professionalsRes.json();
      console.log("Inactive Professionals:", this.inactiveProf);
         
      // to get all active costomers
      const customersRes = await fetch(
        window.location.origin + "/active_customers",
        {
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        }
      );
      this.activeCustomers = await customersRes.json();
      console.log("Active Customers:", this.activeCustomers);
    },
    mounted() {
        console.log("lakdi",this.inactiveProf)
    }
  };
  // since the data being searched so i will not  render the tables in the hook   
  export default DashboardAdmin;
  