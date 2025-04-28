const Update_profile= {
    template:`
    <div class="profile-container">
      
      <form v-if="!isAdmin" @submit.prevent="updateuserprofile" class="profile-form">
        <div class="form-group">
          <label for="fullName">Your Name:</label>
          <input type="text" id="fullName" v-model="fullName" required class="form-control">
        </div>
        <div class="form-group">
          <label for="mobile">Contacts:</label>
          <input type="text" id="mobile" v-model="mobile" required class="form-control">
        </div>
        <div class="form-group">
          <label for="location">Location:</label>
          <input type="text" id="location" v-model="location" required class="form-control">
        </div>
        <div class="form-group">
          <label for="pincode">Pincode:</label>
          <input type="text" id="pincode" v-model="pincode" required class="form-control">
        </div>
        <button type="submit" :disabled="loading" class="btn-submit">Update</button>
        <div v-if="loading" class="loading-indicator">Updating...</div>
      </form>
    </div>
    `,
    data() {
        return{
        email : sessionStorage.getItem("email"),
        role : sessionStorage.getItem("role"),
        id : sessionStorage.getItem('id'),
        fullName : "",
        mobile :"",
        location : "",
        pincode : "",
        loading: false,
    };},
   
    methods: {
        async loaduserprofile() {
            try { // loading the user data in userdata in jason form 
                const response = await fetch(`${window.location.origin}/user/${this.id}`);
                if (response.ok) { const userdata = await response.json();  this.setUserData(userdata);}
                else { console.error("failed to login");}
            }
            catch (error) {
                console.log("error loading the data ", error);
            }
        },
        setUserData(userdata) {
            this.full_name = userdata.full_Name;
            this.mobile = userdata.mobile;
            this.location = userdata.location;
            this.pincode = userdata.pincode;
            
        },
        
        async updateuserprofile() {
            this.loading = true;
            try {
                const response = await fetch(`${window.location.origin}/user/update`, {method : "PUT", headers: {
                    "Content-Type": "application/json" , 
                    "Authentication-Token": sessionStorage.getItem("token"),// correct token useage  for the correct user
                },
                body : JSON.stringify({
                    full_name: this.fullname,
                    mobile: this.mobile,
                    location: this.location,
                    pincode: this.pincode,
                }),});
            if (response.status === 401) {
                alert ("log in again session expired");
                window.location.href = "/#/login";
            }
            else if (!response.ok) { throw new Error(`http error ${response.status}`), alert(`error ${response.status}`);}
              // throw will stop the code to execute further and will jump to the catch block
            const updateuser = await response.json();
            console.log ("profile updated",updateuser.message);
            alert ("your profile has been updated !!");
            this.loaduserprofile();   
        }
            catch (error) {
                console.log("failed to update", error);
                alert("failed to update your profile")
                        }
            finally {
                this.loading = false;
            }

    },
    input_validation(){
        const mobilepattern = /^[0-9]{10}$/;
        if (!mobilepattern.test(this.mobile))
            {
                alert("incorrect mobile pattern");
                return false;
             }
             
    
    
        const pinpattern = /^[0-9]{6}$/;
        if (pinpattern.test(this.pincode))
            {
                alert("invalid pincode");
                return false;
             }
             return true ;
    },
}, 
created(){ this.loaduserprofile();},};

export default Update_profile;