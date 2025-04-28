const Professional_dashboard = {
  
    template: `
    <div class="container mt-4">
    <div class="mt-4">
    <h2 class="me-5" style='color:white;'>Welcome: {{ email }}</h2>
    <h2 class="me-5" style='color:white;'>Role: {{ display_role }}</h2>
 </div>
        <!-- New Service Requests Section -->
        <h2 class="mt-5" style="color:white">Requests for you</h2>
        <div v-if="serviceRequests.length === 0">
            <p style="color:white">No request.</p>
        </div>
        <div v-else class="table-responsive">
            <table class="table table-bordered table-striped" style="background-color: white;">
                <thead class="thead-dark">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Date of Request</th>
                        <th>Location</th>
                        <th>Contacts</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="request in serviceRequests" :key="request.id">
                        <td>{{ request.id }}</td>
                        <td>{{ request.customer_full_name || 'N/A' }}</td>
                        <td>{{ new Date(request.date_of_request).toLocaleString() }}</td>
                        <td>{{ request.customer_location || 'N/A' }}</td>
                        <td>{{ request.customer_mobile || 'N/A' }}</td>
                        <td>{{ request.service_status }}</td>
                        <td>{{ request.remarks || 'N/A' }}</td>
                        <td>
                            <button v-if="request.service_status === 'Pending'" class="btn btn-primary btn-sm" @click="acceptRequest(request.id)">Accept</button>
                            <button v-if="request.service_status === 'Pending'" class="btn btn-danger btn-sm" @click="rejectRequest(request.id)">Reject</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Completed Services Section -->
        <h2 class="mt-5" style="color:white">Completed Services</h2>
        <div v-if="FinishedRequests.length === 0">
            <p style="color:white">No completed services available.</p>
        </div>
        <div v-else class="table-responsive">
            <table class="table table-bordered table-striped" style="background-color: white;">
                <thead class="thead-dark">
                    <tr>
                        <th>Service ID</th>
                        <th>Customer Name</th>
                        <th>Service Name</th>
                        <th>Date Completed</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="service in FinishedRequests" :key="service.id">
                        <td>{{ service.id }}</td>
                        <td>{{ service.customer_name }}</td>
                        <td>{{ service.service_name }}</td>
                        <td>{{ service.date_completed }}</td>
                        <td>{{ service.remarks }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>`,

  data () {
    return { 
        email: sessionStorage.getItem("email"),
        role: sessionStorage.getItem("role"),
        FinishedRequests: [], // this list willl hold finished requests 
        serviceRequests: [], //this awwrray will hold the requests that will be displaye in the table 
    };
  },
  computed: {
    display_role() {return this.role === "prof" ? "Professional" : this.role === "cust" ? "Customer": this.role === "admin" ? "Admin":"unknown";}, 
  },
  methods:{

        async fetchCompleatedRequests() {  //method to fetch the  finished service requests
          try{
          const res = await fetch(`${window.location.origin}/api/prof/completed-requests`, {method: "GET" , headers:{"Authentication-Token": sessionStorage.getItem("token")},});
          if (!res.ok) {
              const errordata = await res.json();
              throw new Error(`error fetching the DAta : ${errordata.error} `);
          }
          
          this.FinishedRequests= await res.json(); 
      
      } catch (error) { 
          console.error(`Error fetching requests:${error} `);
          alert("try again later");
      }
    },




    async fetchServiceRequests() {  //method to fetch the service requests
        try{
        const res = await fetch(`${window.location.origin}/professional/request_api`, {method: "GET" , headers:{"Authentication-Token": sessionStorage.getItem("token")},});
        if (!res.ok) {
            const errordata = await res.json();
            throw new Error(`error fetching the DAta : ${errordata.error} `);
        }
        this.serviceRequests= await res.json(); 
    
    } catch (error) { 
        console.error(`Error fetching requests:${error} `);
        alert("try again later");
    }
  },



  async acceptRequest(Id) {
    const token = sessionStorage.getItem("token");

    if (!token) {
      alert("You must be logged in to accept this request.");
      this.$router.push("/login");
      return;
    }
    try {
        const response = await fetch(`${window.location.origin}/professional/request_api/${Id}/approve`, { method: "PATCH",
            headers: {"Content-Type": "application/json", "Authentication-Token": sessionStorage.getItem('token')},
        });
        if (response.ok){
            alert("request accepted successfully");
            await this.fetchServiceRequests();// referesh
        }else{
            const errordata = await response.json();
            alert("error occured while compleating the requests");
            console.log("error:",errordata);
        }
    }catch (error){
        console.error("error:",error);
        alert("something went wrong try again later");
    }},
    


    async rejectRequest(Id) {
        const token = sessionStorage.getItem("token");
  
        if (!token) {
          alert("You must be logged in to reject this request.");
          this.$router.push("/login");
          return;
        }

        try{
            const response = await fetch(`${window.location.origin}/professional/request_api/${Id}/reject`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json",
                        "Authentication-Token": token,},
                }
            );
            if (response.ok){
                alert("rejected");
                await this.fetchServiceRequests();
            } else {
                const errordata = await response.json();
                alert("error rejecting:");
                console.log("error", errordata);
            }

        }catch(error){
            console.error("error",error);
            alert("pls  try again later")
        }},








       

  },

    async created(){  // created runs before the dom is mounted so fetching will start in first place , while mounted runs after the dom is rendered
        await this.fetchServiceRequests();
        await this.fetchCompleatedRequests();
        console.log(this.fetchCompleatedRequests);
    },
};

export default Professional_dashboard;