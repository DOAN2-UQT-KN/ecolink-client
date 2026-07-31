import{r as a,j as t,c as o}from"./index-DY1sND3x.js";import{M as d,T as p,a as x,P as h,L as l}from"./leaflet-D1_-9TcO.js";const u=[16.047,108.206],g=6,f=`
  @keyframes sos-marker-pulse {
    0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.8; }
    70%  { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
    100% { transform: translate(-50%, -50%) scale(1);   opacity: 0; }
  }
  .sos-ring {
    position: absolute;
    top: 50%; left: 50%;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(220, 38, 38, 0.35);
    animation: sos-marker-pulse 1.8s ease-out infinite;
    pointer-events: none;
  }
  .sos-ring-delay {
    animation-delay: 0.6s;
  }
`;function m(){if(typeof document>"u"||document.getElementById("sos-marker-style"))return;const s=document.createElement("style");s.id="sos-marker-style",s.textContent=f,document.head.appendChild(s)}function r(s){const n=`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <filter id="shadow-${s.replace("#","")}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
      <path
        d="M16 0C7.163 0 0 7.163 0 16c0 11.25 14 28 16 28s16-16.75 16-28C32 7.163 24.837 0 16 0z"
        fill="${s}"
        filter="url(#shadow-${s.replace("#","")})"
      />
      <circle cx="16" cy="16" r="7" fill="white" opacity="0.95"/>
    </svg>`.trim();return l.divIcon({className:"",html:n,iconSize:[32,44],iconAnchor:[16,44],popupAnchor:[0,-46]})}function y(){const n=`
    <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:flex-end;flex-direction:column;">
      <div class="sos-ring" style="width:44px;height:44px;"></div>
      <div class="sos-ring sos-ring-delay" style="width:44px;height:44px;"></div>
      <div style="position:relative;z-index:1;">${`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <filter id="shadow-sos" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(127,29,29,0.5)"/>
      </filter>
      <path
        d="M16 0C7.163 0 0 7.163 0 16c0 11.25 14 28 16 28s16-16.75 16-28C32 7.163 24.837 0 16 0z"
        fill="#dc2626"
        filter="url(#shadow-sos)"
      />
      <circle cx="16" cy="16" r="7" fill="white" opacity="0.95"/>
      <text x="16" y="20" text-anchor="middle" font-size="9" font-weight="bold" fill="#991b1b">!</text>
    </svg>`.trim()}</div>
    </div>
  `.trim();return l.divIcon({className:"",html:n,iconSize:[48,60],iconAnchor:[24,60],popupAnchor:[0,-62]})}const w=a.memo(function({markers:n}){const{t:i}=o(),c=a.useMemo(()=>({CAMPAIGN:r("#2563eb"),INCIDENT:r("#eab308"),SOS:y()}),[]);return t.jsx(t.Fragment,{children:n.map(e=>t.jsx(x,{position:[e.lat,e.lng],icon:c[e.type],zIndexOffset:e.type==="SOS"?1e3:0,children:t.jsx(h,{minWidth:200,maxWidth:280,className:"map-popup",children:t.jsxs("div",{className:"py-1 space-y-1.5",children:[t.jsx("span",{className:`inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${e.type==="CAMPAIGN"?"bg-blue-100 text-blue-700":e.type==="SOS"?"bg-red-100 text-red-700 border border-red-300":"bg-yellow-100 text-yellow-800"}`,children:e.type==="CAMPAIGN"?i("Campaign"):e.type==="SOS"?`🚨 ${i("SOS")}`:i("Incident")}),t.jsx("p",{className:"font-semibold text-gray-900 text-sm leading-snug",children:e.title}),e.type==="SOS"&&e.content&&t.jsx("p",{className:"text-xs text-gray-700 leading-snug",children:e.content}),e.type==="SOS"&&e.phone&&t.jsxs("p",{className:"text-xs text-gray-600 flex items-center gap-1",children:["📞 ",e.phone]}),e.wasteType&&t.jsx("p",{className:"text-xs text-gray-500 capitalize",children:e.wasteType}),e.address&&t.jsxs("p",{className:"text-xs text-gray-400 leading-snug line-clamp-2",children:["📍 ",e.address]}),(e.type=="SOS"||e.type=="CAMPAIGN")&&t.jsx("div",{className:"flex justify-end",children:t.jsx("a",{href:`/campaigns/${e.campaignId??e.id}`,className:"text-xs text-blue-700 underline text-right",target:"_blank",children:i("View more")})})]})})},`${e.type}-${e.id}`))})}),b=a.memo(function(){const{t:n}=o();return t.jsxs("div",{className:"absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-gray-600 pointer-events-none select-none",children:[t.jsx("span",{className:"h-3 w-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"}),n("Refreshing map…")]})}),v=a.memo(function(){const{t:n}=o();return t.jsx("div",{className:"absolute bottom-8 left-1/2 -translate-x-1/2 z-[999] bg-white/90 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-lg text-sm text-gray-500 pointer-events-none select-none",children:n("No markers found on map.")})}),N=a.memo(function({markers:n,loading:i}){return a.useEffect(()=>{m()},[]),t.jsxs("div",{className:"relative h-full w-full",children:[i&&t.jsx(b,{}),!i&&n.length===0&&t.jsx(v,{}),t.jsxs(d,{center:u,zoom:g,className:"h-full w-full z-0",zoomControl:!0,children:[t.jsx(p,{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}),t.jsx(w,{markers:n})]})]})});export{N as default};
