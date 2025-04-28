import Home from "/static/components/Home.js";
import signup from "/static/frontend/signup.js";
import login from "/static/frontend/login.js";
import Update_profile  from "/static/components/update.js";
import customer_dash from "/static/frontend/customer_dash.js";
import DashboardAdmin from "/static/frontend/admin_dash.js";
import Professional_dashboard from "/static/frontend/professional_dash.js";
import ProfessionalStatistics from "/static/frontend/prof_analysis.js";
import CustomerStats from "/static/frontend/customer_analysis.js";
import AdminStatistics from "/static/frontend/admin_analysis.js";
import logout from "/static/frontend/logout.js";
import CreateService from "/static/frontend/admin_create.js";
const routes = [
    { path: "/" , component: Home},
    {path: "/login" , component: login },
    {path: "/Register" , component: signup},
    
    {path:"/customer_dashboard", component: customer_dash, meta: {requiresLogin: true, role: "cust"}},
    {path:"/professional_dashboard", component: Professional_dashboard, meta: {requiresLogin: true, role: "prof"}},
    {path:"/admin_dashboard", component: DashboardAdmin, meta: {requiresLogin: true, role: "admin"}},
    {path:"/customer_stats", component: CustomerStats, meta: {requiresLogin: true, role: "cust"}},
    {path:"/professional_stats", component: ProfessionalStatistics, meta: {requiresLogin: true, role: "prof"}},
    {path:"/admin_stats", component: AdminStatistics, meta: {requiresLogin: true, role: "admin"}},
    {path:"/admin_create", component: CreateService, meta: {requiresLogin: true, role: "admin"}},
    {path: "/profile", component: Update_profile, meta: { loggedIn: true}},// will be availabele to both costumer and professional handeled by vue frontend routing so need not to define in backend

    {path:"/customer_dashboard", component: customer_dash, meta: {requiresLogin: true, role: "cust"}},
    {path:"/customer_dashboard", component: customer_dash, meta: {requiresLogin: true, role: "cust"}},
    {path:'/logout', component:logout},

];

const router = new VueRouter({
    routes,
});

router.beforeEach((to,from,next) => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    const isloggedin = token &&  token !== "undefined" && token !== null;
    const requiresLogin = to.matched.some((record) => record.meta.requiresLogin);

    if (requiresLogin && !isloggedin){
        next({path: "/login"});
    }
    else if (to.meta.role && to.meta.role !== role)
    { next({path: '/'});} //redirect the user to home if the role didnt matched
    else{next();}
})
export default router;