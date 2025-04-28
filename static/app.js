import store from "./utils/store.js"
import Navbar from "./components/Navbar.js";
import router from "./utils/router.js";
new Vue({
    el: '#app',
    template: `<div>
    <Navbar/>
    <router-view/>
    </div>`,
    
    
    components:{ 
        Navbar,
        
    },
    router,
    store,
    mounted(){console.log('view mounted');
        console.log('navbar component:',Navbar);
    }
});