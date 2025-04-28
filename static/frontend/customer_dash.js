const customer_dash = {
    template: `

    
          <div class="container mt-4">
            
          <div class="mt-4">
              <h2 class="me-5" style='color:white;'>Welcome: {{ email }}</h2>
              <h2 class="me-5" style='color:white;'>Role: {{ display_role }}</h2>
           </div>
          <!-- Active Professionals Section -->
            
            <h3 class="mt-5" style="color:white;">All active Professionals</h3>
            <!-- Search Bar Section -->
                <div class="search-bar">
                  <input type="text" v-model="search.location" placeholder="Location" />
                  <input type="text" v-model="search.service" placeholder="Service Type" />
                  <button class="btn btn-primary" @click="allActiveProfessionals">Search</button><!--@click stores my method-->
                </div>


            <div v-if="activeProfessionals.length === 0">
              <p>No  found.</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-bordered table-striped" style="background-color: white;">
                <thead class="thead-dark">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Service Type</th>
                    <th>Experience</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
  
                <tbody>
                  <tr v-for="prof in activeProfessionals" :key="prof.id">
                    <td>{{ prof.full_name }}</td>
                    <td>{{ prof.email }}</td>
                    <td>{{ prof.mobile || 'N/A' }}</td>
                    <td>{{ prof.service_type || 'N/A' }}</td>
                    <td>{{ prof.experience_years || 'N/A' }} years</td>
                    <td>
                    <div class="star-rating" v-html="renderStars(prof.average_rating)"></div>{{ prof.average_rating ? prof.average_rating : 'N/A' }}
                     </td>
  
                    <td>
                      <textarea v-model="remarks[prof.id]" class="small-textarea" placeholder="Enter your remarks"></textarea>
  
                      <button class="btn btn-primary btn-sm" @click="requestService(prof)" style="margin-bottom:32px;">Request</button>
                    </td>
  
                  </tr>
                </tbody>
              </table>
            </div>
  
            <!-- Service Request History Section -->
            <h3 class="mt-5" style="color:white;"> Request History</h3>
            <div v-if="serviceRequests.length === 0">
              <p>no requested services</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-bordered table-striped" style="background-color: white;">
                <thead class="thead-dark">
                  <tr>
                    <th>Professional Name</th>
                    <th>Service Type</th>
                    <th>Date of Request</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="request in serviceRequests" :key="request.id">
                    <td>{{ request.professional.full_name }}</td>
                    <td>{{ request.service.name }}</td>
                    <td>{{ new Date(request.date_of_request).toLocaleString() }}</td>
                    <td>{{ request.service_status }}</td>
                    <td>{{ request.remarks || 'N/A' }}</td>
                    <td>
                      <!-- Change Close button to Complete -->
                      <button v-if="request.service_status === 'Accepted'" class="btn btn-success btn-sm" @click="completeServiceRequest(request.id)">Finished</button>
                      
                      <!-- New Cancel button -->
                      <button v-if="request.service_status !== 'Completed'" class="btn btn-danger btn-sm" @click="service_request_cancel(request.id)">Cancel</button>
                      
                      <button v-if="request.service_status === 'Completed' || request.service_status === 'Accepted'" class="btn btn-primary" @click="openReviewForm(request)">Review</button>
  
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
  
            <!-- Review Form Modal -->
            <div v-if="showReviewForm" class="modal">
              <div class="modal-content">
                <span class="close" @click="closeReviewForm">&times;</span>
                <h2>Submit Review for {{ currentProfessional?.full_name }}</h2>
                <div>
                  <label for="rating">Rating (1-5):</label>
                  <input type="number" v-model="review.rating" min="1" max="5" required />
                </div>
                <div>
                  <label for="reviewText">Review:</label>
                  <textarea v-model="review.text" required></textarea>
                </div>
                <button @click="SubmitReview">Submit Review</button>
              </div>
            </div>
          </div>
        `,
        
        data () {
            return {
                email: sessionStorage.getItem("email"),
                role: sessionStorage.getItem("role"),
                activeProfessionals: [],
                serviceRequests: [],
                showReviewForm: false,
                currentProfessional: null,
                currentRequestId: null,
                review: {rating: null, text:"", },
                    
                   
               
                search: {location: "",service: "",},
                    
                    
                  
                remarks: {}
            };

        },
        computed: {
          display_role() {return this.role === "prof" ? "Professional" : this.role === "cust" ? "Customer": this.role === "admin" ? "Admin":"unknown";}, 
        },
        methods: { 
            async allActiveProfessionals() { // for displaying all professionals on the table when the page is rendered
                try{
                    const parameters= new URLSearchParams();
                    if (this.search.location){
                        parameters.append("location",this.search.location);
                    }
                    if (this.search.service){
                        parameters.append("service", this.search.service);
                    }  // they both will generate the dynamic url eg http://localhost:5000/active_professional?location=NewYork&service=Plumbing 
                    const response = await fetch(`${window.location.origin}/active_professional?${parameters.toString()}`, {method:"GET" ,headers: {"Authentication-Token": sessionStorage.getItem("token"),},});
                    if (!response.ok) {
                        const errordata = await response.json();
                        throw new Error(`unable to fetch '${errordata.error}` );
                    }
                    
                    this.activeProfessionals = await response.json();
                    console.log("data for active professional:" ,this.activeProfessionals);
                    
                }
                catch(error) {
                    console.error(`${error.message}`);
                    alert("error loading the data plese try again later");
                }
            },

            async fetchrequesthistory() { // this method will be mounted so that the data is loaded as soon as the page renders
                try{
                    const response = await fetch(`${window.location.origin}/request_history_api`,{method: "GET",headers:{"Authentication-Token": sessionStorage.getItem("token")},}); // frontend security step
                    if (!response.ok) { const errordata = await response.json(); throw new Error(`unable to fetch service history,${errordata.error}`);}
                    this.serviceRequests = await response.json();
                    console.log("fetched services",this.serviceRequests);
                }
                catch (error){
                    console.error(`${error.message}`);
                    alert("unable to load service history data currently");
                }
            },

            async requestService(prof) {
                const token = sessionStorage.getItem('token');
                if (!token){
                    alert("login first")
                    this.$router.push("/login")// security
                    return;
                }
                if (!prof.service_ids || prof.service_ids.length === 0 ) {
                    alert(`${prof.full_name} not available `);
                    return;
                }
                const serviceId = prof.service_ids[0];// first service id 
                const professionalId = prof.id;// professional id 

                try{
                    const res = await fetch(`${window.location.origin}/service_request_api`, {method : "POST", headers:{"content-Type": "application/json", "Authentication-Token": token}, 
                    body: JSON.stringify({professional_id: professionalId, service_id: serviceId, remarks:this.remarks[prof.id] || "no remark"}),}// adding remarks , default if left unfill
                );
                if (res.ok) {
                    alert("request submitted sucessfully");
                    await this.fetchrequesthistory();// this will refresh the request history table 
                }
                else {
                    const errordata = await res.json();
                    if (res.status === 401){
                        alert("session expired");
                        this.$router.push("/login");
                    } else { console.log(errordata)}
                }
                } catch (error){
                    console.error("error fetching service ",error);
                    alert("error occured pleesh try again later :( ")
                }

            },

            async completeServiceRequest(Id) {
                const token = sessionStorage.getItem('token')
                if (!token){
                    alert ("login first");
                    this.$router.push("/login");
                    return;
                }
                try {
                    const reponse = await fetch(`${window.location.origin}/complete_request_api/${Id}`, {method : 'PATCH', headers:{"Content-Type": "application/json","Authentication-Token": token,},
                        body: JSON.stringify({service_status: "Completed",}),}); // this will set the service status in the database as completed
                        if (reponse.ok) {
                            alert("the request compleated finally");
                            await this.fetchrequesthistory(); //this will refresh the service history table again
                            
                        }else {
                            const errordata = await reponse.json();
                            console.log(errordata)
                            alert("unable to compleate  ")
                        }
    
                    }
                    catch(error){ 
                        console.error("error:",error) ;
                        alert(" there has been problem try again later");
                    }
                },

                

            async service_request_cancel(Id) {// i can name the parameter inside this method function any thing but in template i have to specify 
                const token = sessionStorage.getItem('token');
                if (!token){
                    alert("login first")
                    this.$router.push("/login")// security
                    return;
                }
                
                try {
                    const reponse = await fetch(`${window.location.origin}/cancel_request_api/${Id}`, {method : 'PATCH', headers:{"Content-Type": "application/json","Authentication-Token": token},
                    body: JSON.stringify({service_status: "Canceled",}),}); // this will set the service status in the database as cancelled
                    if (reponse.ok) {
                        alert("the seervice has been cancelled sucessfully");
                        await this.fetchrequesthistory(); //this will refresh the service history table again
                        
                    }else {
                        const errordata = await reponse.json();
                        console.log(errordata)
                        alert("unable to cancel ")
                    }

                }
                catch(error){ 
                    console.error(error) ;
                    alert(" there has been problem try again later");
                }
            },

            openReviewForm(request){
                this.currentProfessional = request.professional;
                this.currentRequestId = request.id; //curent service request id set
                this.showReviewForm = true; // display the review form
                this.review = { rating: null, text: ""}; // resetting the fields to default every time on loading 
            },
            closeReviewForm() {
                this.showReviewForm = false; //basically hidding it 
                this.currentProfessional = null;// clearing the fields
            },

            async SubmitReview() {
                const token = sessionStorage.getItem("token");
                if (!token){
                    alert("login first");
                    this.$router.push("/login");
                    return;
                }

                const rating = parseInt(this.review.rating, 10);
                console.log ("rating", rating);
                if (isNaN(rating)|| rating < 1 || rating > 5){ // checking weather entred rating is a valid integer and is between 1 and 5
                    alert ("rate between 1 to 5 ");
                    return;
                }

                if (!this.currentRequestId){
                    alert("no service id found");
                    return;

                }

                try{
                    const res = await fetch(`${window.location.origin}/submit_review_api/${this.currentRequestId}/review`,
                        {
                            method: 'POST',
                            headers: {'Content-Type': "application/json" , "Authentication-Token": token},
                            body: JSON.stringify({ rating : rating, review_text: this.review.text,}),
                            
                        }
                    );
                    if (res.ok) {
                        alert ("review has been submitted successfully");
                        await this.fetchrequesthistory(); // refresh
                        this.closeReviewForm(); //close it 
                    }else {
                        const errordata = await res.json();
                        console.log ('error:',errordata);
                        alert("error while submittng the review");
                    }
                } catch (error) {
                    console.log ("error whle submitting :", error);
                    alert("try to submit again later ");
                }

            },

            renderStars(rating) {
                if (!rating) {
                  return ""; // Return 'No rating' if not available
                }
          
                const fullStars = Math.floor(rating); // Full stars
                const halfStar = rating % 1 !== 0; // Half star
                const emptyStars = 5 - fullStars - (halfStar ? 1 : 0); // Empty stars
          
                let stars = "";
          
                // Add full stars
                stars += "★".repeat(fullStars);
          
                // Add half star if needed
                if (halfStar) {
                  stars += '<span class="half-star">★</span>';
                }
          
                // Add empty stars
                stars += "☆".repeat(emptyStars);
          
                return stars;
              },
            
        },

        async created() {  // using the created life cycle hook to  load thse data when the page is rendered 
            await this.fetchrequesthistory();
            await this.allActiveProfessionals();
        },
        
    };

    export default customer_dash;