// ==UserScript==
// @name     	Ikariam Automation Plus
// @version  	1
// @run-at   	document-idle
// @grant 		none
// ==/UserScript==


var currentQuery;


var time_pirateRun = 1000 * 60 * 3
var time_guiUpdate = 1000
var time_playerUpdate = 1000 * 60

var IAP_running
var loginStatus;
var ikariam;
var player;


//*****************************MAIN RUNNING MODES***********************************//
function main() {
  console.log("Running Ikariam Automation Plus")

  IAP_running = (localStorage.getItem('IAP_running') == "true");
  autoLogin(); //joinGame

  var currentQuery = getParameterByName(scriptQuery);
  console.log(currentQuery)

  switch (currentQuery) {
    case pirateQuery:
      main_pirate()
      break;
    default:
      main_user()
  }
}

//*********USER INTERFACE MODE*********//
function main_user() {

  if (ikariam != null) {
    setupGUI()
    setInterval(updateGUI, time_guiUpdate);
    setIntervalImmediate(getPlayerInfo, time_playerUpdate);

    openSecret(link_pirateFortress, pirateQuery)

  }
}

function setIntervalImmediate(func, time) {
  func()
  setInterval(func, time)
}


//*********PIRATE ACTIVITY MODE********//
function main_pirate() {
  setTimeout(function() {
    IAP_running = (localStorage.getItem('IAP_running') == "true");
    if (IAP_running) {
      console.log("Running Pirates")
      document.getElementsByClassName("button")[0].click()
    }
    localStorage.setItem('IAP_time_pirateRun', Date.now())
    setTimeout(main_pirate, time_pirateRun)
  }, 3000);
}




//*****************************SCRIPT STATE FUNCTIONS*******************************//

function pauseScript(val) {
  IAP_running = val
  localStorage.setItem('IAP_running', val);
}



//*****************************SCRIPT GUI*******************************************//
/*---original---*/
var leftMenuList;
var buildingName_button;

/*---new ones---*/
var pauseButton;


var time_pirateRunrTxt

var recap_popup;
var recap_button;
var recap_buttonIco


//*********GUI SETUP*******************//
function setupGUI() {
  console.log("adding GUI")

  /******************LOCATE ORIGINAL GUI******************************/
  leftMenuList = document.getElementById("js_viewCityMenu").childNodes[1]
buildingName_button = leftMenuList.lastElementChild;


  /******************CREATE NEW GUI ELEMENTS**************************/
  console.log(ikariam)

  /*---pirate timer---*/
  time_pirateRunrTxt = document.createElement('a');
  var pirateLI = document.createElement('li')
  pirateLI.appendChild(time_pirateRunrTxt);
  document.getElementById("GF_toolbar").children[0].appendChild(pirateLI);
  time_pirateRunrTxt.innerText = "time_pirateRunr"


  /*---script pause button---*/
  pauseButton = newSliderButton("Run Ikariam plus") 
  pauseButton.onclick = event_pauseButton
  leftMenuList.appendChild(pauseButton);
  update_pauseButton();


  /*---recap tab---*/
  recap_button = newSliderButton("Show Recap Page") 
  recap_button.onclick = event_recapButton
  recap_button.icon.src = icon_recap
  leftMenuList.appendChild(recap_button);


  ajaxHandlerCall("?view=noViewChange")
}

function newSliderButton(text){
  var button = buildingName_button.cloneNode(true)
  
  button.icon = document.createElement("img");
  button.children[0].appendChild(button.icon);
  
  button.text = button.children[1].children[0]
  button.text.innerText = text
  return button
}

async function create_recap_popup(){
    console.log("Creating recap Popup")

  var xhr = new XMLHttpRequest();
  xhr.open("GET", html_recap)
  var response = await awaitXHR(xhr, "")
  //recap_popup = ikariam.createPopup("asd",2,response,4,5);
  ikariam.TemplateView.createMainBox(1, 2)
  recap_popup = document.getElementById("_c")
  console.log(recap_popup)
  recap_popup.childNodes[0].childNodes[1].innerHTML=response
}

function updateGUI() {
  //console.log("Update GUI")

  if (IAP_running) {
    lastPiratesTime = new Date(parseInt(localStorage.getItem('IAP_time_pirateRun')));
    var ellapsedPirates = time_pirateRun - (Date.now() - lastPiratesTime)
    time_pirateRunrTxt.innerText = "Pirates:" + toHHMMSS(ellapsedPirates)
  } else {
    time_pirateRunrTxt.innerText = "Pirates: paused"
  }
}


//*********GUI EVENTS******************//
function event_recapButton() {
  console.log("recap button")
  if(recap_popup == null){
    create_recap_popup()
  }else{
    recap_popup.hidden = !recap_popup.hidden;
  }
}


function event_pauseButton() {
  console.log("pause button event")
  pauseScript(!IAP_running);
  update_pauseButton();
}

function update_pauseButton() {
  if (IAP_running) {
    pauseButton.text.innerText = "Pause Ikariam Auto Plus"
    pauseButton.icon.src = icon_on
  } else {
    pauseButton.text.innerText = "Run Ikariam Auto Plus"
    pauseButton.icon.src = icon_off
  }
}


//*****************************AUTO LOGIN*******************************************//
function autoLogin() {
  console.log("Running autoLogin Script")


  //Detect if our session is expired, and redirect us to the hub
  var page = document.getElementById("pageContent")
  if (page != null) {
    loginStatus = "expired"
    console.log("expired page detected!")
    var elements = page.innerText
    if (elements == "Your session has expired, please log in through the start page!\nTo lobby") {
      window.location.href = page.children[1].href + "/hub"
    }
  }

  //Detect if we're in the hub, and join game in the default server (try to close the hub page as well)
  var joinGame = document.getElementById("joinGame")
  if (joinGame != null) {
    loginStatus = "loggedOut"
    console.log("login page detected!")
    var button = joinGame.childNodes[1]
    button.click()
    //modern security standards forbid js code from closing a tab it didn't open
    close();
  }

  //Detect if the ikariam object is available, aka if we're in the game
  ikariam = unsafeWindow.ikariam
  if (ikariam != null) {
    loginStatus = "loggedOut"
    console.log("Logged in OK")
  }
}


//*****************************GAME DATA RETRIVAL***********************************//
//*********PLAYER DATA*****************//
async function getPlayerInfo() {
  console.log("get Player Info")
  try {
    player = JSON.parse(localStorage.getItem(str_storage_player));
    if (true || typeof player != object) throw 'Player is not an object yet';
  } catch (error) {
    player = Object();
    player.advisors = Object();
    player.cities = Object();
  }

  var xhr = new XMLHttpRequest();
  xhr.open("GET", link_getCityData + 0)
  await awaitXHR(xhr, "")
  var response = JSON.parse(xhr.responseText);
  parsePlayerData(response)

  for (const property in player.cityList) {
    var cityId = player.cityList[property].id //?.id breaks my editor's formatting :(
    if (cityId != null) {
      xhr.open("GET", link_getCityData + cityId);
      await awaitXHR(xhr, "")
      var response = JSON.parse(xhr.responseText);
      player.cities[cityId] = parseCityData(response)
    }
  }

  console.log("player", player);
  localStorage.setItem(str_storage_player, JSON.stringify(player))
}

function parsePlayerData(response) {
  var bgData = response[0][1].backgroundData
  var heData = response[0][1].headerData

  /****************/
  player.ambrosia = heData.ambrosia
  player.gold = heData.gold
  player.income = heData.income
  player.cost_sci = heData.scientistsUpkeep
  player.cost_mil = heData.upkeep
  player.ship_tot = heData.freeTransporters
  player.ship_max = heData.maxTransporters

  player.rewards = bgData.dailyTasks

  player.cityList = heData.cityDropdownMenu

  advisors = player.advisors;
  advisors.towns = heData.advisors.cities.cssclass
  advisors.diplomacy = heData.advisors.diplomacy.cssclass
  advisors.military = heData.advisors.military.cssclass
  advisors.research = heData.advisors.research.cssclass
}

function parseCityData(response) {
  var bgData = response[0][1].backgroundData
  var heData = response[0][1].headerData

  /****************/
  var city = Object();


  city.name = bgData.name
  city.id = bgData.id
  city.isCapital = bgData.isCapital
  city.isOwn = heData.relatedCity.owncity
  city.isl_id = bgData.islandId
  city.upgradeTime = bgData.endUpgradeTime
  city.corruption = heData.badTaxAccountant

  city.buildings = bgData.position

  city.resources_curr = heData.currentResources
  city.resources_trade = heData.branchOfficeResources
  city.resources_max = heData.maxResources
  city.resources_prod_wood = heData.resourceProduction
  city.resources_luxur = heData.producedTradegood
  city.resources_prod_luxur = heData.tradegoodProduction
  city.resources_use_wine = heData.wineSpendings
  return city
}


//*****************************UTILITY FUNCTIONS************************************//
function toHHMMSS(time) {
  var sec_num = Math.floor(time / 1000)
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return hours + ':' + minutes + ':' + seconds;
}

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


function openSecret(link, query) {
  /*---silent opener---*/
  var silentOpener = document.createElement('iframe');
  silentOpener.width = "000"
  silentOpener.width = "000"
  //document.body.appendChild(silentOpener);
  leftMenuList.appendChild(silentOpener);
  silentOpener.src = link + "&" + scriptQuery + "=" + query
  return silentOpener
}

function ajaxHandlerCall(txt) {
  try {
    unsafeWindow.ajaxHandlerCall(txt);
  } catch (error) {
    console.error(error);
  }
}

function awaitXHR(xhr, data) {
  return new Promise(resolve => {
    xhr.send(data);
    xhr.onload = function(e) {
      resolve(this.response);
    }
    xhr.onerror = function() {
      reject(undefined);
    };
  });
}



//*****************************SCRIPT CONFIGURATION*********************************//
/*********STRING CONFIGURATION*************/
const scriptQuery = "winky"
const userQuery = "default"
const pirateQuery = "pirate"


const str_storage_player = "IAP_player"
/******************************************/

/**********IMAGE CONFIGURATION*************/
const icon_recap = "https://i.imgur.com/YBxghHa.png"	
const icon_off 	 = "https://imgur.com/btKdBAb.png"	
const icon_on 	 = "https://imgur.com/7s4P0JN.png"
/******************************************/
/**********HTML CONFIGURATION**************/
const html_recap = "https://raw.githubusercontent.com/dogeMcdogeface/Ikariam-Automation-Plus/main/res/recap_page.html"
      
/******************************************/

/***********LINK CONFIGURATION*************/

const link_pirateFortress = "?view=pirateFortress&position=17&backgroundView=city&cityId=1581"
const link_getCityData = "?view=updateGlobalData&backgroundView=city&ajax=1&currentCityId="
/******************************************/


//*****************************INIT SECTION*****************************************//
window.addEventListener("load", init(), false);

function init() { //wait for document to load
  if (document.readyState == "complete") {
    main();
  } else
    setTimeout(() => {
      init()
    }, 1000);
}
