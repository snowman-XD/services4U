const signup = {
  template: `
  <div>
      <!-- Button to open the form -->
      <div class="text-center my-5">
      <button 
        class="open-button btn btn-primary btn-lg rounded-pill shadow-lg" 
        style="font-size: 1.5rem; padding: 20px 40px; background-color: #007bff; border-color: #007bff; cursor: pointer;" 
        @click="openForm"
      >
        Open Sign Up Form
      </button>
    </div>
      <!-- The popup form -->
      <div v-if="isFormVisible" class="form-popup">
          <div class="card shadow p-4">
              <h3 class="card-title text-center mb-4">Registration</h3>

              <div class="form-group mb-3">
                  <input v-model="fullname" type="text" class="form-control" placeholder="Full Name" required />
              </div>
              <div class="form-group mb-3">
                  <input v-model="email" type="email" class="form-control" placeholder="Email" required />
              </div>
              <div class="form-group mb-4">
                  <input v-model="password" type="password" class="form-control" placeholder="Password" required />
              </div>
              <div class="form-group mb-4">
                  <select v-model="role" class="form-control" @change="fetchServices">
                      <option value="cust">Customer</option>
                      <option value="prof">Professional</option>
                  </select>
              </div>

              <!-- Additional fields for professionals -->
              <div v-if="role === 'prof'">
                  <div class="form-group mb-3">
                        <select v-model="serviceType" class="form-control" @change="setservice_id" >
                            <option disabled value="">Select a Service</option>
                            <option v-for="service in services" :key="service.id" :value="service.name">{{service.name}}</option>
                            
                        </select>
                     <!-- <input v-model="serviceType" type="text" class="form-control" placeholder="Service Type" list="serviceList" @input="setservice_id" />
                      <datalist id="serviceList">
                          <option v-for="service in services" :key="service.id" :value="service.name"></option>
                      </datalist> -->
                  </div>
                  <div class="form-group mb-3">
                      <input v-model="experienceYears" type="number" class="form-control" placeholder="Experience in Years" />
                  </div>
                  <div class="form-group mb-3">
                      <input v-model="location" type="text" class="form-control" placeholder="Location" />
                  </div>
                  <div class="form-group mb-3">
                      <input v-model="pincode" type="text" class="form-control" placeholder="Pincode" />
                  </div>
                  <div class="form-group mb-3">
                      <input v-model="mobile" type="text" class="form-control" placeholder="Mobile" />
                  </div>
                  <!--<div class="form-group mb-3">
                      <label>Upload Documents (ZIP)</label>
                      <input ref="file" type="file" @change="handleFileUpload" class="form-control" accept=".zip" />
                  </div>-->
              </div>

              <!-- Additional fields for customers -->
              <div v-if="role === 'cust'">
                  <div class="form-group mb-3">
                      <input v-model="location" type="text" class="form-control" placeholder="Location" />
                  </div>
                  <div class="form-group mb-3">
                      <input v-model="pincode" type="text" class="form-control" placeholder="Pincode" />
                  </div>
                  <div class="form-group mb-3">
                      <input v-model="mobile" type="text" class="form-control" placeholder="Mobile" />
                  </div>
              </div>
              <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }} <!--working like the flash message warning-->
        </div>

              <button class="btn btn-primary" @click="submitinfo">Submit</button>
              <button class="btn cancel " @click="closeForm">Close</button>
          </div>
      </div>
  </div>
  `,
  data() {
      return{
          isFormVisible: false,  // Change this to 'isFormVisible'
          fullname: "",
          email: "",
          password: "",
          role: "",
          serviceType: "",
          experienceYears: "",
          location: "",
          pincode: "",
          mobile: "",
          //file: null,
          services: [],
          errorMessage : null,
      };
  },
  methods: { 
      openForm() {
          this.isFormVisible = true;
          this.$nextTick(() => {
              console.log('Form visibility changed:', this.isFormVisible); // Ensure Vue update is applied
          });
      },
      closeForm() {
          this.isFormVisible = false;
      },
      async fetchServices() {
          if (this.role === "prof") {
              const origin = window.location.origin; 
              const url = `${origin}/services`;
              const response = await fetch(url);
              if (response.ok) {
                  const data = await response.json();
                  this.services = data; 
              } else {
                  console.error("failed to fetch services");
              }
          }
      },
      

      async submitinfo() {
          const formdata = new FormData();
          formdata.append("full_name", this.fullname);
          formdata.append("email", this.email);
          formdata.append("password", this.password);
          formdata.append("role", this.role);

          if (this.role === "prof") {
              formdata.append("service_type", this.serviceType);
              formdata.append("experience_years", this.experienceYears);
              formdata.append("location", this.location);
              formdata.append("pincode", this.pincode);
              formdata.append("mobile", this.mobile);
              if (this.file) {
                  formdata.append("documents", this.file);
              }
          }

          if (this.role === "cust") {
              formdata.append("location", this.location);
              formdata.append("pincode", this.pincode);
              formdata.append("mobile", this.mobile);
          }

          const origin = window.location.origin;
          const url = `${origin}/Register`;
          const response = await fetch(url, {method: 'POST', body: formdata, credentials: "same-origin"});
          if (response.ok) {
              const data = await response.json();
              console.log(data);
              this.errorMessage = data.message;
              this.router.push("/login");
          } else {
              const errordata = await response.json();
              this.errorMessage = errordata.message;
              console.log("error in the data", errordata);
          }
      },

      setservice_id() { // will display the services created by admin while typing 
          const selected_service = this.services.find(service => service.name === this.serviceType);
          if (selected_service) {
              this.serviceID = selected_service.id;
          }
      }
  },
 
  
};


export default signup;
