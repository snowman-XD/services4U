const CustomerStats = {
    template: `
      <div class="container mt-4">
        <h2 class="mt-5" style="color:white;">Analysis</h2>
  
        <div v-if="loading" class="text-center">
          <div class="spinner-border" role="status">
            <span class="sr-only">Loading...</span>
          </div>
          <p>Loading dashboard...</p>
        </div>
  
        <div v-else>
          <div class="row g-3">
            <div class="col-md-3" v-for="(card, index) in dashboardCards" :key="index">
              <div class="card text-center">
                <div class="card-header bg-dark text-white">
                  {{ card.title }}
                </div>
                <div class="card-body">
                  <h5 class="card-title">{{ card.value }}</h5>
                </div>
              </div>
            </div>
          </div>
  
 

  

</div>
          
    `,
  
    data() {
      return {
        totalServiceRequests: 0,
        pendingRequests: 0,
        totalSpending: 0,
        spendingByService: null,
        mostRequestedService: '',
        totalProfessionalsEngaged: 0,
        loading: true,
        
      };
    },
  
    computed: {
      dashboardCards() {
        return [
          { title: 'Total Service Requests', value: this.totalServiceRequests },
          { title: 'Pending Service Requests', value: this.pendingRequests },
          { title: 'Fav Service', value: this.mostRequestedService },
        
          { title: 'Total Spending', value: this.totalSpending.toFixed(2) },
        ];
      },
    },
  
    methods: {
      async fetchDashboardData() {
        this.loading = true;
        try {
          const token = sessionStorage.getItem('token');
          if (!token) {
            this.showError('not logged in.');
            return;
          }
  
          const res = await fetch(`${window.location.origin}/api/customer/statistics`, {
            method: 'GET',
            headers: {
              'Authentication-Token': token,
            },
          });
  
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(`Error  data: ${errorData.error || res.statusText}`);
            }
  
            const data = await res.json();
            this.totalServiceRequests = data.totalServiceRequests;
            this.pendingRequests = data.pendingRequests; 
            this.spendingByService = data.spendingByService;
            this.totalSpending = data.totalSpending;
            this.mostRequestedService = data.mostRequestedService;
            this.totalProfessionalsEngaged = data.totalProfessionalsEngaged;
  
            // Use nextTick to ensure the DOM is fully updated before creating the chart
            this.$nextTick(() => {
              this.createSpendingChart();
            });
          } else {
            const errorText = await res.text();
            console.error(`Non-JSON response received: ${errorText}`);
            throw new Error('Received an unexpected response format. Please check your request.');
          }
        } catch (error) {
          console.error(`Error fetching dashboard data: ${error.message}`);
          this.showError(`Error fetching dashboard data. Please try again later. ${error.message}`);
        } finally {
          this.loading = false;
        }
      },
  
  
      
      
  
    },
  
    mounted() {
      this.fetchDashboardData(); // calling
    },
  };
  
  export default CustomerStats;
  