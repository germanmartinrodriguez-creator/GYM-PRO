const VERSION="gym-pro-v26.2-20260916";
const APP=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];

async function mostrarVersion(response){
  if(!response || !response.ok) return response;

  const tipo=response.headers.get("content-type") || "";
  if(!tipo.includes("text/html")) return response;

  try{
    let html=await response.text();

    html=html.replace(
      "TU ENTRENAMIENTO, PASO A PASO",
      "TU ENTRENAMIENTO, PASO A PASO · v26.2"
    );

    return new Response(html,{
      status:response.status,
      statusText:response.statusText,
      headers:response.headers
    });
  }catch(e){
    return response;
  }
}

self.addEventListener("install",e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION).then(cache=>cache.addAll(APP))
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    for(const nombre of await caches.keys()){
      if(nombre!==VERSION){
        await caches.delete(nombre);
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;

  const url=new URL(e.request.url);

  if(e.request.mode==="navigate" || url.origin===location.origin){

    e.respondWith((async()=>{
      try{
        const respuesta=await fetch(e.request,{cache:"no-store"});

        if(respuesta && respuesta.ok){
          const cache=await caches.open(VERSION);
          await cache.put(e.request,respuesta.clone());
        }

        if(e.request.mode==="navigate"){
          return await mostrarVersion(respuesta);
        }

        return respuesta;

      }catch(error){

        const guardada=
          (await caches.match(e.request)) ||
          (await caches.match("./index.html"));

        if(e.request.mode==="navigate"){
          return await mostrarVersion(guardada);
        }

        return guardada;
      }
    })());

    return;
  }

  if(e.request.destination==="image"){

    e.respondWith((async()=>{

      const guardada=await caches.match(e.request);
      if(guardada) return guardada;

      try{
        const respuesta=await fetch(e.request);

        if(respuesta && respuesta.ok){
          const cache=await caches.open(VERSION);
          await cache.put(e.request,respuesta.clone());
        }

        return respuesta;

      }catch(error){
        return new Response("",{status:504});
      }

    })());
  }
});
