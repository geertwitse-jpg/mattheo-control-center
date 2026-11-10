const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let pin="",currentPage="dashboard";
const pad=n=>String(n).padStart(2,"0");
function updateClock(){const d=new Date(),time=pad(d.getHours())+":"+pad(d.getMinutes()),date=new Intl.DateTimeFormat("nl-BE",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d);["#loginTime","#heroTime","#dashTime"].forEach(s=>{const e=$(s);if(e)e.textContent=time});$("#loginDate").textContent=date;$("#heroDate").textContent=date;$("#fullDate").textContent=date;$("#greeting").textContent=d.getHours()<12?"Goedemorgen":d.getHours()<18?"Fijne middag":"Goede avond";}
function showApp(){ $("#login").classList.add("hidden");$("#app").classList.remove("hidden"); }
function lockApp(){pin="";drawDots();$("#app").classList.add("hidden");$("#login").classList.remove("hidden");$("#loginHint").textContent="Dashboard vergrendeld.";}
function drawDots(){ $$("#pinDots i").forEach((el,i)=>el.classList.toggle("filled",i<pin.length));}
$("#keypad").addEventListener("click",e=>{const key=e.target.closest("button")?.dataset.key;if(!key)return;if(key==="clear")pin="";else if(key==="back")pin=pin.slice(0,-1);else if(pin.length<6)pin+=key;drawDots();if(pin.length===6){if(pin==="123456"){showApp();$("#loginHint").textContent="";}else{$("#loginHint").textContent="Onjuiste demo-pincode. Probeer opnieuw.";pin="";setTimeout(drawDots,300);} }});
function navigate(page){currentPage=page;$$(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("#pageCrumb").textContent=page.replace("-"," ").toUpperCase();$("#sidebar").classList.remove("open");window.scrollTo(0,0);}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
$$("[data-page-link]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.pageLink)));
$("#menuButton").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#lockButton").addEventListener("click",lockApp);$("#settingsLock").addEventListener("click",lockApp);
function modal(title,body){$("#modalTitle").textContent=title;$("#modalText").textContent=body;$("#modal").classList.remove("hidden");}
$("#modalClose").addEventListener("click",()=>$("#modal").classList.add("hidden"));$("#modalOk").addEventListener("click",()=>$("#modal").classList.add("hidden"));

// Spotify OAuth PKCE + Web Playback SDK. Client ID is public; never place a client secret here.
const SPOTIFY_REDIRECT=location.origin+location.pathname;
const SPOTIFY_SCOPES=["streaming","user-read-email","user-read-private","user-read-playback-state","user-modify-playback-state","user-read-currently-playing","playlist-read-private","playlist-read-collaborative"];
let spotifyToken="",spotifyExpires=0,spotifyRefresh="",spotifyPlayer=null,spotifyDevice="",spotifyTrackState=null,spotifyProgressTimer=null,spotifyShuffleState=false,spotifyRepeatState="off";
const spStore=sessionStorage;
const SPOTIFY_CLIENT_ID="53f4df522b224ba6831f54d644b6207f";
const spClient=()=>localStorage.getItem("mcc_spotify_client_id")||SPOTIFY_CLIENT_ID;
const spB64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
async function spVerifier(){const a=new Uint8Array(64);crypto.getRandomValues(a);return [...a].map(x=>"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"[x%66]).join("");}
async function spChallenge(v){return spB64(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)));}
function spStatus(t){const e=$("#spotifyStatus");if(e)e.textContent=t;}
function spFormat(ms){const n=Math.floor((ms||0)/1000);return Math.floor(n/60)+":"+String(n%60).padStart(2,"0");}
function spSafe(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function spotifyConnect(){
 const client=spClient();if(!client){spotifySettings();return;}
 const verifier=await spVerifier(),challenge=await spChallenge(verifier),state=spB64(crypto.getRandomValues(new Uint8Array(24)));
 spStore.setItem("mcc_sp_verifier",verifier);spStore.setItem("mcc_sp_state",state);
 const u=new URL("https://accounts.spotify.com/authorize");Object.entries({client_id:client,response_type:"code",redirect_uri:SPOTIFY_REDIRECT,code_challenge_method:"S256",code_challenge:challenge,state,scope:SPOTIFY_SCOPES.join(" ")}).forEach(([k,v])=>u.searchParams.set(k,v));
 location.assign(u.toString());
}
async function spotifyTokenExchange(code){
 const verifier=spStore.getItem("mcc_sp_verifier"),client=spClient();if(!verifier||!client)throw Error("De PKCE-sessie ontbreekt. Koppel opnieuw.");
 const body=new URLSearchParams({client_id:client,grant_type:"authorization_code",code,redirect_uri:SPOTIFY_REDIRECT,code_verifier:verifier});
 const r=await fetch("https://accounts.spotify.com/api/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});const d=await r.json();if(!r.ok)throw Error(d.error_description||d.error||"Spotify-token kon niet worden opgehaald.");
 spotifySaveToken(d);spStore.removeItem("mcc_sp_verifier");spStore.removeItem("mcc_sp_state");
}
function spotifySaveToken(d){spotifyToken=d.access_token;spotifyExpires=Date.now()+d.expires_in*1000;spotifyRefresh=d.refresh_token||spotifyRefresh;spStore.setItem("mcc_sp_access",spotifyToken);spStore.setItem("mcc_sp_expires",String(spotifyExpires));if(spotifyRefresh)localStorage.setItem("mcc_sp_refresh",spotifyRefresh);}
async function spotifyAccess(){
 if(!spotifyToken){spotifyToken=spStore.getItem("mcc_sp_access")||"";spotifyExpires=Number(spStore.getItem("mcc_sp_expires")||0);spotifyRefresh=localStorage.getItem("mcc_sp_refresh")||spStore.getItem("mcc_sp_refresh")||"";}
 if(spotifyToken&&Date.now()<spotifyExpires-60000)return spotifyToken;
 if(!spotifyRefresh)throw Error("Je Spotify-sessie is verlopen. Koppel opnieuw.");
 const r=await fetch("https://accounts.spotify.com/api/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:spClient(),grant_type:"refresh_token",refresh_token:spotifyRefresh})});
 const d=await r.json();if(!r.ok){spotifyDisconnect(false);throw Error("Spotify-sessie verlopen. Koppel je account opnieuw.");}spotifySaveToken(d);return spotifyToken;
}
async function spApi(path,options={}){
 const token=await spotifyAccess();const r=await fetch("https://api.spotify.com/v1"+path,{...options,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json",...(options.headers||{})}});
 if(r.status===204)return null;const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error?.message||"Spotify API-fout ("+r.status+")");return d;
}
function spotifySdk(){
 if(window.Spotify){spotifyInitPlayer();return;}
 if(document.getElementById("spotify-sdk"))return;
 const s=document.createElement("script");s.id="spotify-sdk";s.src="https://sdk.scdn.co/spotify-player.js";document.head.appendChild(s);
 window.onSpotifyWebPlaybackSDKReady=spotifyInitPlayer;
}
function spotifyInitPlayer(){
 if(spotifyPlayer||!spotifyToken)return;
 spotifyPlayer=new Spotify.Player({name:"Mattheo Control Center",volume:.65,getOAuthToken:async cb=>{try{cb(await spotifyAccess());}catch(e){spStatus(e.message);}}});
 spotifyPlayer.addListener("ready",({device_id})=>{spotifyDevice=device_id;$("#spotifyDevice").textContent="Verbonden: Mattheo Control Center";spotifyTransfer();});
 spotifyPlayer.addListener("not_ready",()=>{spotifyDevice="";$("#spotifyDevice").textContent="Speler niet beschikbaar";});
 spotifyPlayer.addListener("player_state_changed",state=>{if(!state)return;spotifyTrackState=state;const t=state.track_window.current_track;$("#spotifyTrack").textContent=t.name;$("#spotifyArtist").textContent=t.artists.map(a=>a.name).join(", ");$("#spotifyArt").innerHTML=t.album.images?.[0]?'<img alt="" src="'+spSafe(t.album.images[0].url)+'">':"♫";$("#spotifyElapsed").textContent=spFormat(state.position);$("#spotifyDuration").textContent=spFormat(state.duration);$("#spotifyProgress").style.width=(state.duration?state.position/state.duration*100:0)+"%";$("#spotifyPlay").textContent=state.paused?"▶":"Ⅱ";});
 spotifyPlayer.addListener("initialization_error",e=>spStatus("Browser kan beveiligde Spotify-weergave niet starten: "+e.message));
 spotifyPlayer.addListener("authentication_error",e=>spStatus("Spotify-authenticatie mislukt: "+e.message));
 spotifyPlayer.addListener("account_error",()=>spStatus("Spotify Premium is vereist voor afspelen in deze speler."));
 spotifyPlayer.addListener("playback_error",e=>spStatus("Afspeelfout: "+e.message));
 spotifyPlayer.connect().then(ok=>{if(!ok)spStatus("Spotify-speler kon niet verbinden.");});
}
async function spotifyTransfer(){try{await spApi("/me/player",{method:"PUT",body:JSON.stringify({device_ids:[spotifyDevice],play:false})});spStatus("Verbonden met Spotify.");}catch(e){spStatus("Speler klaar. Tik op afspelen om te starten.");}}
async function spotifyLoadPlaylists(){try{const d=await spApi("/me/playlists?limit=30");$("#spotifyResultsTitle").textContent="Jouw playlists";$("#spotifyResultHint").textContent=(d.total||d.items.length)+" playlists";spotifyRenderItems(d.items,"playlist");}catch(e){spStatus(e.message);}}
function spotifyRenderItems(items,type){const root=$("#spotifyResults");if(!items?.length){root.innerHTML='<div class="spotify-empty">Geen resultaten gevonden.</div>';return;}root.innerHTML=items.map(x=>{const item=x.track||x;const title=item.name||"Onbekend",sub=type==="playlist"?(item.owner?.display_name||"Playlist"):(item.artists||[]).map(a=>a.name).join(", ");const img=item.album?.images?.[0]?.url||item.images?.[0]?.url||"";const uri=item.uri||"";return '<button class="spotify-result" data-uri="'+spSafe(uri)+'"><span class="spotify-thumb">'+(img?'<img src="'+spSafe(img)+'" alt="">':"♫")+'</span><span><b>'+spSafe(title)+'</b><small>'+spSafe(sub)+'</small></span><i>▶</i></button>';}).join("");root.querySelectorAll(".spotify-result").forEach(b=>b.addEventListener("click",()=>spotifyPlayUri(b.dataset.uri)));}
async function spotifySearch(){const q=$("#spotifySearch").value.trim();if(!q)return;try{const d=await spApi("/search?"+new URLSearchParams({q,type:"track,album,artist,playlist",limit:"8"}));const items=[...(d.tracks?.items||[]),...(d.albums?.items||[]),...(d.artists?.items||[]),...(d.playlists?.items||[])];$("#spotifyResultsTitle").textContent="Zoekresultaten";$("#spotifyResultHint").textContent=items.length+" resultaten";spotifyRenderItems(items,"search");}catch(e){spStatus(e.message);}}
async function spotifyPlayUri(uri){if(!uri)return;try{if(!spotifyPlayer||!spotifyDevice)throw Error("De ingebouwde Spotify-speler is nog niet klaar. Wacht even en probeer opnieuw.");await spotifyPlayer.activateElement();if(uri.startsWith("spotify:track:"))await spApi("/me/player/play?device_id="+spotifyDevice,{method:"PUT",body:JSON.stringify({uris:[uri]})});else await spApi("/me/player/play?device_id="+spotifyDevice,{method:"PUT",body:JSON.stringify({context_uri:uri})});spStatus("Afspelen gestart. Als je niets hoort, tik dan op de grote afspeelknop.");}catch(e){spStatus(e.message);}}
async function spotifyCurrent(){try{const d=await spApi("/me/player");if(!d)return;if(d.item){$("#spotifyTrack").textContent=d.item.name;$("#spotifyArtist").textContent=d.item.artists?.map(a=>a.name).join(", ")||"";$("#spotifyArt").innerHTML=d.item.album?.images?.[0]?'<img alt="" src="'+spSafe(d.item.album.images[0].url)+'">':"♫";}$("#spotifyDevice").textContent=d.device?.name?"Afspelen op: "+d.device.name:"Geen actieve speler";}catch(e){spStatus(e.message);}}
async function spotifyControl(path,method="POST",body){try{await spApi(path,{method,...(body?{body:JSON.stringify(body)}:{})});}catch(e){spStatus(e.message);}}
async function spotifyDisconnect(reload=true){spotifyPlayer?.disconnect();spotifyPlayer=null;spotifyDevice="";spotifyToken="";spotifyRefresh="";spotifyExpires=0;["mcc_sp_access","mcc_sp_expires","mcc_sp_verifier","mcc_sp_state"].forEach(k=>spStore.removeItem(k));localStorage.removeItem("mcc_sp_refresh");if(reload){$("#spotifyAccountLabel").textContent="Spotify niet gekoppeld";$("#spotifyDevice").textContent="Geen actieve Spotify-speler";$("#spotifyTrack").textContent="Nog niets afgespeeld";$("#spotifyArtist").textContent="Koppel Spotify om je muziek te zien";$("#spotifyConnect").textContent="Spotify koppelen";spStatus("Account ontkoppeld.");}}
function spotifySettings(){const current=spClient();const value=prompt("Plak hier je Spotify Client ID (geen wachtwoord of Client Secret):",current);if(value===null)return;const id=value.trim();if(!/^[a-f0-9]{32}$/i.test(id)){alert("Dat lijkt geen geldige Spotify Client ID van 32 tekens.");return;}localStorage.setItem("mcc_spotify_client_id",id);spStatus("Client ID opgeslagen. Tik op Spotify koppelen.");}
async function spotifyBoot(){
 $("#spotifyConnect").addEventListener("click",spotifyConnect);$("#spotifySettings").addEventListener("click",spotifySettings);$("#spotifyDisconnect").addEventListener("click",()=>spotifyDisconnect());
 $("#spotifySearchButton").addEventListener("click",spotifySearch);$("#spotifySearch").addEventListener("keydown",e=>{if(e.key==="Enter")spotifySearch();});
 $("#spotifyPlay").addEventListener("click",async()=>{try{await spotifyPlayer?.activateElement();await spotifyPlayer?.togglePlay();}catch(e){spStatus(e.message);}});
 $("#spotifyPrevious").addEventListener("click",()=>spotifyPlayer?.previousTrack());$("#spotifyNext").addEventListener("click",()=>spotifyPlayer?.nextTrack());
 $("#spotifyShuffle").addEventListener("click",async()=>{spotifyShuffleState=!spotifyShuffleState;await spotifyControl("/me/player/shuffle?state="+spotifyShuffleState);$("#spotifyShuffle").classList.toggle("on",spotifyShuffleState);});
 $("#spotifyRepeat").addEventListener("click",async()=>{spotifyRepeatState=spotifyRepeatState==="off"?"context":spotifyRepeatState==="context"?"track":"off";await spotifyControl("/me/player/repeat?state="+spotifyRepeatState);$("#spotifyRepeat").classList.toggle("on",spotifyRepeatState!=="off");});
 $("#spotifyVolume").addEventListener("input",e=>$("#spotifyVolumeValue").textContent=e.target.value+"%");
 $("#spotifyVolume").addEventListener("change",e=>{const v=Number(e.target.value);spotifyPlayer?.setVolume(v/100);spotifyControl("/me/player/volume?volume_percent="+v,"PUT");});
 const code=new URLSearchParams(location.search).get("code"),state=new URLSearchParams(location.search).get("state"),error=new URLSearchParams(location.search).get("error");
 if(error){spStatus("Spotify-toestemming niet verleend.");history.replaceState({},"",SPOTIFY_REDIRECT);}
 if(code){if(state!==spStore.getItem("mcc_sp_state")){spStatus("Veiligheidscontrole mislukt. Probeer opnieuw.");}else{try{await spotifyTokenExchange(code);history.replaceState({},"",SPOTIFY_REDIRECT);}catch(e){spStatus(e.message);}}}
 if(spotifyToken||localStorage.getItem("mcc_sp_refresh")||spStore.getItem("mcc_sp_refresh")){try{await spotifyAccess();$("#spotifyAccountLabel").textContent="Spotify-account gekoppeld";$("#spotifyConnect").textContent="Opnieuw koppelen";spStatus("Account gekoppeld. Je playlists worden geladen.");spotifySdk();spotifyLoadPlaylists();spotifyCurrent();}catch(e){spStatus(e.message);}}
 else if(spClient())spStatus("Client ID ingesteld. Tik op Spotify koppelen.");
}
spotifyBoot();


// Free weather via Open-Meteo (no API key). Coordinates are stored locally only.
const weatherCodes={
 0:["Helder","☀"],1:["Overwegend helder","🌤"],2:["Half bewolkt","⛅"],3:["Bewolkt","☁"],
 45:["Mist","🌫"],48:["Rijpende mist","🌫"],51:["Lichte motregen","🌦"],53:["Motregen","🌦"],55:["Dichte motregen","🌧"],
 56:["Lichte ijzelmotregen","🌧"],57:["IJzelmotregen","🌧"],61:["Lichte regen","🌦"],63:["Regen","🌧"],65:["Zware regen","🌧"],
 66:["Lichte ijzelregen","🌧"],67:["Zware ijzelregen","🌧"],71:["Lichte sneeuw","🌨"],73:["Sneeuw","❄️"],75:["Zware sneeuw","❄️"],
 77:["Sneeuwkorrels","🌨"],80:["Lichte regenbuien","🌦"],81:["Regenbuien","🌧"],82:["Zware regenbuien","⛈"],
 85:["Lichte sneeuwbuien","🌨"],86:["Zware sneeuwbuien","❄️"],95:["Onweer","⛈"],96:["Onweer met hagel","⛈"],99:["Zwaar onweer met hagel","⛈"]
};
let weatherPlace=null,weatherBusy=false;
function weatherInfo(code){return weatherCodes[code]||["Onbekend","☁"];}
function weatherSetMessage(message){const e=$("#weatherMessage");if(e)e.textContent=message;}
function weatherSavePlace(place){weatherPlace=place;localStorage.setItem("mcc_weather_place",JSON.stringify(place));}
async function weatherLoad(lat,lon,name){
 if(weatherBusy)return;weatherBusy=true;weatherSetMessage("Weer wordt opgehaald…");
 try{
  const u=new URL("https://api.open-meteo.com/v1/forecast");
  Object.entries({latitude:lat,longitude:lon,current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",timezone:"auto",forecast_days:"5"}).forEach(([k,v])=>u.searchParams.set(k,v));
  const r=await fetch(u);if(!r.ok)throw Error("Weerbron tijdelijk niet bereikbaar.");const d=await r.json();const c=d.current,info=weatherInfo(c.weather_code);
  $("#weatherLocationLabel").textContent=name;$("#weatherUpdated").textContent="Bijgewerkt om "+new Date().toLocaleTimeString("nl-BE",{hour:"2-digit",minute:"2-digit"});
  $("#weatherTemp").textContent=Math.round(c.temperature_2m)+"°";$("#weatherCondition").textContent=info[0];$("#weatherFeels").textContent="Voelt als "+Math.round(c.apparent_temperature)+"°";
  $("#weatherIcon").textContent=info[1];$("#weatherApparent").textContent=Math.round(c.apparent_temperature)+"°";$("#weatherWind").textContent=Math.round(c.wind_speed_10m)+" km/u";$("#weatherRain").textContent=Math.round(c.precipitation||0)+" mm";$("#weatherHumidity").textContent=Math.round(c.relative_humidity_2m)+"%";
  $("#dashWeatherTemp").textContent=Math.round(c.temperature_2m)+"°";$("#dashWeatherText").textContent=info[0];$("#dashWeatherArt").textContent=info[1];$("#dashWeatherIcon").textContent=info[1];$("#dashWeatherPlace").textContent=name;$("#weatherMini").textContent=Math.round(c.temperature_2m)+"° · "+info[0];
  $("#weatherForecast").innerHTML=d.daily.time.map((day,i)=>{const dt=new Date(day+"T12:00:00");const label=i===0?"Vandaag":new Intl.DateTimeFormat("nl-BE",{weekday:"short"}).format(dt);const inf=weatherInfo(d.daily.weather_code[i]);return '<div class="card forecast-day"><span>'+label+'</span><b>'+inf[1]+'</b><strong>'+Math.round(d.daily.temperature_2m_max[i])+'°</strong><small>'+Math.round(d.daily.temperature_2m_min[i])+'° · '+(d.daily.precipitation_probability_max?.[i]??0)+'% regen</small></div>';}).join("");
  weatherSetMessage("Weer succesvol bijgewerkt.");weatherSavePlace({latitude:lat,longitude:lon,name});
 }catch(e){weatherSetMessage(e.message||"Weer ophalen mislukt.");}
 finally{weatherBusy=false;}
}
function weatherLocate(){
 if(!navigator.geolocation){weatherSetMessage("Locatiebepaling wordt niet ondersteund door deze browser.");return;}
 weatherSetMessage("Vraag om locatietoestemming aan je browser…");
 navigator.geolocation.getCurrentPosition(async p=>{let name="Mijn locatie";try{const u=new URL("https://geocoding-api.open-meteo.com/v1/reverse");u.searchParams.set("latitude",p.coords.latitude);u.searchParams.set("longitude",p.coords.longitude);u.searchParams.set("language","nl");u.searchParams.set("format","json");const r=await fetch(u);const d=await r.json();const x=d.results?.[0];if(x)name=[x.name,x.admin1].filter(Boolean).join(", ");}catch{}weatherLoad(p.coords.latitude,p.coords.longitude,name);},e=>weatherSetMessage(e.code===1?"Locatietoegang geweigerd. Zoek hieronder handmatig een plaats.":"Locatie kon niet worden bepaald. Zoek hieronder handmatig een plaats."),{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
}
async function weatherSearch(){
 const q=$("#weatherCity").value.trim();if(!q){weatherSetMessage("Vul eerst een plaatsnaam in.");return;}
 weatherSetMessage("Plaats wordt gezocht…");
 try{const u=new URL("https://geocoding-api.open-meteo.com/v1/search");Object.entries({name:q,count:"5",language:"nl",format:"json"}).forEach(([k,v])=>u.searchParams.set(k,v));const r=await fetch(u);if(!r.ok)throw Error("Plaats zoeken is tijdelijk niet beschikbaar.");const d=await r.json();const x=d.results?.[0];if(!x){weatherSetMessage("Geen plaats gevonden. Probeer een andere schrijfwijze.");return;}weatherLoad(x.latitude,x.longitude,[x.name,x.admin1,x.country].filter(Boolean).join(", "));}
 catch(e){weatherSetMessage(e.message);}
}
function weatherBoot(){
 $("#weatherLocate").addEventListener("click",weatherLocate);$("#weatherRefresh").addEventListener("click",()=>weatherPlace?weatherLoad(weatherPlace.latitude,weatherPlace.longitude,weatherPlace.name):weatherLocate());$("#weatherSearch").addEventListener("click",weatherSearch);$("#weatherCity").addEventListener("keydown",e=>{if(e.key==="Enter")weatherSearch();});
 try{const saved=JSON.parse(localStorage.getItem("mcc_weather_place")||"null");if(saved?.latitude&&saved?.longitude){weatherPlace=saved;weatherLoad(saved.latitude,saved.longitude,saved.name||"Opgeslagen locatie");}}catch{}
}

function networkStatus(){const online=navigator.onLine;$("#internetStatus").textContent=online?"Internet beschikbaar":"Offline";$("#networkOnline").textContent=online?"Online":"Offline";$("#networkDetail").textContent=online?"Browser meldt een actieve netwerkverbinding":"Geen netwerkverbinding gedetecteerd";}
window.addEventListener("online",networkStatus);window.addEventListener("offline",networkStatus);networkStatus();
$("#speedTest").addEventListener("click",async()=>{const b=$("#speedTest"),out=$("#speedResult"),note=$("#speedNote");b.disabled=true;b.textContent="Meten…";out.innerHTML="… <small>Mbps</small>";note.textContent="Test wordt uitgevoerd.";try{const start=performance.now();const response=await fetch("https://speed.cloudflare.com/__down?bytes=5000000",{cache:"no-store"});if(!response.ok)throw new Error("Testserver niet bereikbaar");const data=await response.arrayBuffer();const seconds=(performance.now()-start)/1000;const mbps=(data.byteLength*8/seconds/1e6).toFixed(1);out.innerHTML=mbps+' <small>Mbps</small>';note.textContent="Indicatieve downloadsnelheid · "+(data.byteLength/1e6).toFixed(1)+" MB ontvangen.";}catch(e){out.innerHTML="— <small>Mbps</small>";note.textContent="Meten mislukt. Controleer je internetverbinding en probeer opnieuw.";}finally{b.disabled=false;b.textContent="Opnieuw meten";}});
weatherBoot();updateClock();setInterval(updateClock,1000);