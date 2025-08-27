function updateNavBar() {
  const navBar = document.getElementById('nav-bar');
  const bannerBar = document.getElementById('banner-bar');
  const user = Authentication.user;

  if (!navBar) return;
  
  if (user) {
    let links = `<a href="scan.html">Scan</a><a href="progress.html">Progress</a>`;

    if (user.isAdmin) {
      links += `<a href="admin.html">Admin</a>`;
    }

    bannerBar.innerHTML = `
        <a href="index.html" class="home-link"><img src="assets/img/Bouscluespaw.png"><span class="screen-reader-text">Home</span></a>
        <div class="notebook-name">${user.name}'s Notebook</div>
        <button id="logout-btn">Logout</button>
    `

    navBar.innerHTML = `
      <div>
        ${links}
      </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
      Authentication.token = undefined;
      window.location.href = 'index.html';
    });
  } else {
    bannerBar.innerHTML = `
        <a href="index.html" class="home-link"><img src="assets/img/Bouscluespaw.png"><span class="screen-reader-text">Home</span></a>
        `;
    navBar.innerHTML = `
      <div>
        <a href="login.html#login" class="button">Login</a>
        <a href="login.html#register" class="button">Register</a>
      </div>
    `;
  }
}

class Config{

    static config = undefined;
    static pending = undefined;

    static async get(){
        if(!Config.config){
            if(!Config.pending){
                Config.pending = new Promise(async resolve=>{
                    const request = await fetch('/config.json');
                    Config.config = await request.json();
                    resolve(this.config)
                })
            }

            await this.pending;
        }

        return Config.config;
    }
}


class Authentication{

    static _currentUser = undefined;

    static get user(){
        if(typeof this.currentUser !== 'undefined'){
            return this.currentUser;
        }

        const userInfo = localStorage.getItem('userToken');

        if(!userInfo){
            this.currentUser = null;
            return undefined;
        }
        
        this.currentUser = JSON.parse(atob(userInfo.split('.')[1]));

        return this.currentUser;
    }

    static get token(){
        return localStorage.getItem('userToken');
    }

    static set token(value){
        if(typeof value === 'undefined'){
            this.currentUser = null
            localStorage.removeItem('userToken');
            return;
        }
        this.currentUser = undefined;
        localStorage.setItem('userToken', value);
    }
}

window.MegaplexScavenger = window.MegaplexScavenger || {};

window.MegaplexScavenger.Config = Config;
window.MegaplexScavenger.Authentication = Authentication;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if the user is logged in and update the navbar accordingly
  updateNavBar();

  // Fetch the config.json file and update the title
  const originalTitle = document.title.split(' - ')[0];
  const config = await Config.get();
    if (config.scavengerHuntName) {
        document.title = `${originalTitle} - ${config.scavengerHuntName}`;
    }
});
