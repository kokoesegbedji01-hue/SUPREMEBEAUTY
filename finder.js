(function(){
var map,layer,markers=[];
var current=0,cancelPrev=null,cache={},zc={};
function hi(i){document.querySelectorAll('.loc').forEach(function(n){n.classList.toggle('on',+n.dataset.i===i)});var n=document.querySelector('.loc[data-i="'+i+'"]');if(n)n.scrollIntoView({block:'nearest',behavior:'smooth'})}
var Q={hair:['["shop"="hairdresser"]'],barber:['["shop"="hairdresser"]["hairdressing"="barber"]','["shop"="barber"]'],nails:['["beauty"="nails"]','["shop"="beauty"]["name"~"nail",i]'],skin:['["shop"="beauty"]','["amenity"="spa"]','["leisure"="spa"]'],store:['["shop"~"cosmetics|hairdresser_supply|perfumery"]']};
Q.all=[].concat(Q.hair,Q.nails,Q.skin,Q.store);
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function initMap(lat,lon,z){
  if(typeof L==='undefined'){document.getElementById('f-status').textContent='The map could not load. Check your internet connection and refresh.';return false}
  if(!map){map=L.map('map').setView([lat,lon],z||12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    layer=L.layerGroup().addTo(map);}
  else{map.setView([lat,lon],z||12);layer.clearLayers();}
  markers=[];
  setTimeout(function(){map.invalidateSize()},100);return true;
}
window.addEventListener('load',function(){initMap(39.5,-98.35,4)});
function dirs(t,a,lat,lon){
  var dest=(lat&&lon)?lat+','+lon:encodeURIComponent(t.name+(a?' '+a:''));
  var ap='https://maps.apple.com/?dirflg=d&daddr='+dest+'&q='+encodeURIComponent(t.name);
  var gg='https://www.google.com/maps/dir/?api=1&destination='+((lat&&lon)?lat+','+lon:encodeURIComponent(t.name+(a?' '+a:'')));
  return '<strong>Get directions:</strong> <a class="text-link" target="_blank" rel="noopener" href="'+ap+'">Apple Maps</a> &middot; <a class="text-link" target="_blank" rel="noopener" href="'+gg+'">Google Maps</a>';
}
function addr(t){var a=[((t['addr:housenumber']||'')+' '+(t['addr:street']||'')).trim(),t['addr:city'],t['addr:state'],t['addr:postcode']].filter(Boolean);return a.join(', ')}
function kind(t){if(t.beauty==='nails')return 'Nail salon';if(t.hairdressing==='barber'||t.shop==='barber')return 'Barbershop';if(t.shop==='hairdresser')return 'Hair salon';if(t.shop==='cosmetics'||t.shop==='perfumery'||t.shop==='hairdresser_supply')return 'Beauty store';return 'Beauty / spa'}

// Asks the first Overpass server right away. If it has not answered in 4 seconds,
// the second server joins in (and a third at 8 seconds). The first good answer wins.
// A new search cancels the old one, so searches never pile up or overwrite each other.
function overpass(q){
  var eps=[
    'https://overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];
  return new Promise(function(resolve,reject){
    var done=false,started=0,failed=0,ctls=[],timers=[],lastMsg='';
    function finish(fn,val){
      if(done)return;done=true;
      timers.forEach(clearTimeout);
      ctls.forEach(function(c){try{c.abort()}catch(e){}});
      fn(val);
    }
    function startNext(){
      if(done||started>=eps.length)return;
      var url=eps[started++];
      var c=new AbortController();ctls.push(c);
      timers.push(setTimeout(function(){c.abort()},20000));
      fetch(url,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'},signal:c.signal})
        .then(function(r){if(!r.ok)throw new Error('ov '+r.status);return r.json()})
        .then(function(d){
          // Overpass can answer "200 OK" with an empty list and a remark when it is overloaded or timed out.
          if(!d||!Array.isArray(d.elements)||(d.remark&&!d.elements.length))throw new Error('ov remark: '+(d&&d.remark));
          finish(resolve,d);
        })
        .catch(function(err){
          if(done)return;
          console.warn('Overpass server failed:',url,err);
          failed++;
          lastMsg=String((err&&err.message)||err);
          if(failed>=eps.length)finish(reject,new Error('ov: '+lastMsg));else startNext();
        });
    }
    cancelPrev=function(){finish(reject,new Error('cancel'))};
    startNext();
    timers.push(setTimeout(startNext,4000));
    timers.push(setTimeout(startNext,8000));
  });
}

function getZip(zip){
  if(zc[zip])return Promise.resolve(zc[zip]);
  return fetch('https://api.zippopotam.us/us/'+zip).then(function(r){if(!r.ok)throw new Error('zip');return r.json()}).then(function(z){zc[zip]=z;return z});
}

document.getElementById('finder-form').addEventListener('submit',function(e){
  e.preventDefault();
  var zip=document.getElementById('f-zip').value.trim(),type=document.getElementById('f-type').value,mi=+document.getElementById('f-rad').value,st=document.getElementById('f-status'),list=document.getElementById('f-list');
  if(!/^\d{5}$/.test(zip)){st.textContent='Please enter a 5-digit US ZIP code.';return}
  if(!Q[type])type='all';
  if(cancelPrev){cancelPrev();cancelPrev=null}
  var my=++current,key=zip+'|'+type+'|'+mi;
  st.textContent='Searching... new areas can take up to 20 seconds.';list.innerHTML='';markers=[];
  getZip(zip).then(function(z){
    if(my!==current)throw new Error('stale');
    var lat=+z.places[0].latitude,lon=+z.places[0].longitude;
    if(!initMap(lat,lon,12))throw new Error('map');
    if(cache[key])return cache[key];
    var m=Math.round(mi*1609),q='[out:json][timeout:25];(';
    Q[type].forEach(function(f){q+='nwr'+f+'(around:'+m+','+lat+','+lon+');'});q+=');out center tags 80;';
    return overpass(q).then(function(d){if(d.elements.length)cache[key]=d;return d});
  }).then(function(d){
    if(my!==current)return;
    var items=d.elements.filter(function(x){return x.tags&&x.tags.name}).slice(0,60);
    if(!items.length){st.textContent='No listings found here yet. Try a larger distance or another ZIP code.';return}
    st.textContent=items.length+' locations found near '+zip+'.';
    list.innerHTML=items.map(function(x,i){var t=x.tags,p=t.phone||t['contact:phone'],a=addr(t),lat=x.lat||(x.center&&x.center.lat),lon=x.lon||(x.center&&x.center.lon);
      if(lat&&lon){markers[i]=L.marker([lat,lon]).addTo(layer).bindPopup('<strong>'+esc(t.name)+'</strong><br>'+esc(a||'Address not listed')+'<br>'+(p?esc(p):'Phone not listed')+'<br><br>'+dirs(t,a,lat,lon)+'<br><small>Pending review for the Supreme Standard</small>');markers[i].on('click',function(){hi(i)})}
      return '<div class="loc" data-i="'+i+'" tabindex="0"><h3>'+esc(t.name)+'</h3><p class="micro">'+kind(t)+'</p><p>'+esc(a||'Address not listed. Search the name online.')+'</p><p>'+(p?'<a class="text-link" href="tel:'+esc(p.replace(/[^+\d]/g,''))+'">'+esc(p)+'</a>':'Phone not listed')+'</p><p class="dir">'+dirs(t,a,lat,lon)+'</p><p class="pending">Pending review for the Supreme Standard. Call and ask if they pass.</p></div>'}).join('');
  }).catch(function(err){
    if(my!==current||err.message==='stale'||err.message==='cancel')return;
    console.error('Finder error:',err);
    st.textContent=err.message==='zip'?'We could not find that ZIP code.':'The directory is busy right now. Please try again in a moment. (' + String(err.message).slice(0,80) + ')';
  });
});
document.getElementById('f-list').addEventListener('click',function(e){
  if(e.target.closest('a'))return;var n=e.target.closest('.loc');if(!n)return;var i=+n.dataset.i,m=markers[i];hi(i);
  if(m){map.setView(m.getLatLng(),Math.max(map.getZoom(),15));m.openPopup();document.getElementById('map').scrollIntoView({block:'center',behavior:'smooth'})}
});
})();
