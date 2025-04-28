const Home = {
    template:`
    <div class="home">
    <!-- Banner Section -->
    <section class="banner">
      <img src="static/images/do2.png" alt="HomeServicePro Banner">
      <div class="banner-content">
        
        <router-link to="/Register">

        <div class="text-center my-5"> <!--centered the button-->
        <button 
          class="open-button btn btn-primary btn-lg rounded-pill shadow-lg" 
          style="font-size: 1.5rem; padding: 20px 40px; background-color: #007bff; border-color: #007bff; cursor: pointer;" 
          
        >Register now
        </button>
      </div>
          
        </router-link>
      </div>
    </section>

    <!-- Services Section -->
    <section class="services" style="text-align: center; padding: 50px;">
    <h2 style="color: white; margin-bottom: 30px;">Top Services Offered</h2>
    
    <div class="service-list" 
        >
      
      <div class="service-item" style="width: 300px; flex-shrink: 0; border: 3px  ; padding: 10px;  border-radius: 10px; background-color: rgb(177, 177, 177);">
        <img src="static/images/img1.png" alt="Plumbing" style="width: 100%;">
        <h1 >Plumbing</h1>
      </div>

      <div class="service-item" style="width: 300px; flex-shrink: 0;  border: 3px  ; padding: 10px;  border-radius: 10px; background-color: rgb(177, 177, 177);">
        <img src="static/images/img2.png" alt="Cooking" style="width: 100%;">
        <h1>Cooking</h1>
      </div>
      <div class="service-item" style="width: 300px; flex-shrink: 0;  border: 3px  ; padding: 10px;  border-radius: 10px; background-color: rgb(177, 177, 177);">
      <img src="static/images/img4.png" alt="Electrician" style="width: 100%;">
      <h1>Pest control</h1>
    </div>
      
      <div class="service-item" style="width: 300px; flex-shrink: 0;  border: 3px  ; padding: 10px;  border-radius: 10px; background-color: rgb(177, 177, 177);">
        <img src="static/images/img3.png" alt="Electrician" style="width: 100%;">
        <h1>Electrician</h1>
      </div>
      

    </div>
</section>

    



    <!-- Footer Section -->
    <footer>
      <h>Abhinav     |      22f3003256 </h1>
    </footer>
  </div>
    `,
};

export default Home;
