const API = "/api";
const config = {
 customers:{title:"Customers",desc:"People who trust your workshop with their vehicles.",singular:"Customer",fields:[
  ["name","Full name","text",true],["phone","Phone number","tel",true],["email","Email address","email"],["address","Address","text","full"]],columns:[["customer_id","ID"],["name","Customer"],["phone","Phone"],["email","Email"],["address","Address"]]},
 vehicles:{title:"Vehicles",desc:"Every vehicle registered with your service center.",singular:"Vehicle",fields:[
  ["customer_id","Vehicle owner","select",true,"customers"],["vehicle_number","Registration number","text",true],["vehicle_model","Vehicle model","text",true],["vehicle_type","Vehicle type","select",false,["Car","Bike","Scooter","Truck","Other"]]],columns:[["vehicle_id","ID"],["vehicle_number","Registration"],["vehicle_model","Model"],["vehicle_type","Type"],["customer_name","Owner"]]},
 services:{title:"Service jobs",desc:"Schedule, track and update workshop service progress.",singular:"Service job",fields:[
  ["vehicle_id","Vehicle","select",true,"vehicles"],["service_type","Service type","text",true],["service_date","Service date","date",true],["description","Description","textarea",false,"full"],["service_charge","Service charge (₹)","number"],["status","Job status","select",true,["Requested","Scheduled","In Progress","Completed","Cancelled"]]],columns:[["service_id","ID"],["customer_name","Customer"],["vehicle_number","Vehicle"],["service_type","Service"],["service_date","Date"],["service_charge","Charge"],["status","Status"]]},
 payments:{title:"Payments",desc:"Record payments and keep every transaction traceable.",singular:"Payment",fields:[
  ["service_id","Service job","select",true,"services"],["amount","Amount (₹)","number",true],["payment_date","Payment date","date"],["payment_method","Payment method","select",false,["UPI","Cash","Card","Net Banking","Other"]],["status","Payment status","select",true,["Pending","Paid","Failed","Refunded"]]],columns:[["payment_id","ID"],["customer_name","Customer"],["vehicle_number","Vehicle"],["service_type","Service"],["amount","Amount"],["payment_date","Date"],["payment_method","Method"],["status","Status"]]}
};
let currentPage="dashboard", rows=[], editingId=null, lookups={customers:[],vehicles:[],services:[]};
const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
async function api(path,options={}) {
 const res=await fetch(API+path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
 const data=await res.json().catch(()=>({}));
 if(!res.ok) throw new Error(data.error||"Request failed");
 return data;
}
function toast(message){$("toast").textContent=message;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600)}
async function checkConnection(){
 try{await api("/health");$("connection").innerHTML="<i></i> MySQL connected";$("connection").classList.remove("error")}
 catch(e){$("connection").innerHTML="<i></i> Database offline";$("connection").classList.add("error")}
}
async function loadDashboard(){
 try{
  const d=await api("/dashboard");
  $("statCustomers").textContent=d.customers;$("statVehicles").textContent=d.vehicles;$("statServices").textContent=d.services;$("statPending").textContent=d.pending;$("statRevenue").textContent=money(d.revenue);
  $("recentList").innerHTML=d.recent.length?d.recent.map(r=>`<div class="recent-item"><div class="recent-icon">🚘</div><div class="recent-info"><b>${esc(r.service_type)} · ${esc(r.vehicle_number)}</b><small>${esc(r.customer_name)} · ${esc(r.service_date)}</small></div><span class="status ${statusClass(r.status)}">${esc(r.status)}</span></div>`).join(""):'<div class="empty-state">No service activity yet. Create your first service job.</div>';
 }catch(e){$("recentList").innerHTML=`<div class="empty-state">${esc(e.message)}. Check your database connection.</div>`}
}
function statusClass(s){return String(s||"").toLowerCase().replace(/\s+/g,"-")}
function showPage(page){
 currentPage=page;
 document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 $("dashboardPage").classList.toggle("active",page==="dashboard");$("dataPage").classList.toggle("active",page!=="dashboard");
 const titles={dashboard:["Good afternoon, Srija ✦","Here’s what’s happening at your service center today."],customers:["Customer directory","Keep customer contact details accurate and up to date."],vehicles:["Vehicle registry","Manage registered vehicles and their owners."],services:["Service job board","Track service requests, charges and workshop progress."],payments:["Payment records","Manage collections and payment status with confidence."]};
 $("pageTitle").textContent=titles[page][0];$("pageSubtitle").textContent=titles[page][1];$("eyebrow").textContent="WORKSPACE / "+page.toUpperCase();
 if(page!=="dashboard")loadResource(page);else loadDashboard();
}
async function loadResource(resource){
 try{await loadLookups();rows=await api("/"+resource);renderTable()}
 catch(e){rows=[];renderTable();toast(e.message)}
}
async function loadLookups(){lookups=await api("/lookups")}
function renderTable(){
 if(currentPage==="dashboard")return;
 const cfg=config[currentPage],term=($("searchInput").value||"").toLowerCase();
 $("tableTitle").textContent=cfg.title;$("tableDescription").textContent=cfg.desc;$("recordCount").textContent=`${rows.length} records`;$("addButton").textContent="＋ Add "+cfg.singular.toLowerCase();
 $("tableHead").innerHTML="<tr>"+cfg.columns.map(c=>`<th>${esc(c[1])}</th>`).join("")+"<th>Actions</th></tr>";
 const filtered=rows.filter(r=>cfg.columns.some(c=>String(r[c[0]]??"").toLowerCase().includes(term)));
 $("tableBody").innerHTML=filtered.map(r=>`<tr>${cfg.columns.map(c=>`<td>${c[0]==="status"?`<span class="status ${statusClass(r[c[0]])}">${esc(r[c[0]])}</span>`:c[0].includes("charge")||c[0]==="amount"?money(r[c[0]]):esc(r[c[0]])}</td>`).join("")}<td><div class="row-actions"><button onclick="openEdit(${r[idField(currentPage)]})">Edit</button><button onclick="deleteRecord(${r[idField(currentPage)]})">Delete</button></div></td></tr>`).join("");
 $("tableEmpty").hidden=filtered.length>0;
}
function idField(resource){return {customers:"customer_id",vehicles:"vehicle_id",services:"service_id",payments:"payment_id"}[resource]}
function fieldControl(f){
 const [name,label,type,required,extra]=f;let input="";
 if(type==="select"){
  let opts=[];
  if(extra==="customers")opts=lookups.customers.map(x=>[x.customer_id,`${x.name} · ${x.phone}`]);
  else if(extra==="vehicles")opts=lookups.vehicles.map(x=>[x.vehicle_id,`${x.vehicle_number} · ${x.vehicle_model} (${x.customer_name})`]);
  else if(extra==="services")opts=lookups.services.map(x=>[x.service_id,`#${x.service_id} · ${x.service_type} (${x.vehicle_number})`]);
  else opts=extra.map(x=>[x,x]);
  input=`<select name="${name}" ${required?"required":""}><option value="">Choose ${label.toLowerCase()}</option>${opts.map(o=>`<option value="${esc(o[0])}">${esc(o[1])}</option>`).join("")}</select>`;
 }else if(type==="textarea")input=`<textarea name="${name}" placeholder="${label}"></textarea>`;
 else input=`<input name="${name}" type="${type}" ${type==="number"?'min="0" step="0.01"':""} placeholder="${label}" ${required?"required":""}>`;
 return `<div class="field ${extra==="full"?"full":""}"><label>${label}${required?" *":""}</label>${input}</div>`;
}
async function openCreate(resource=currentPage){
 if(resource==="dashboard")resource="services";
 await loadLookups();editingId=null;$("modalTitle").textContent="Add "+config[resource].singular;$("saveButton").textContent="Save record";$("formError").textContent="";
 $("formFields").innerHTML=config[resource].fields.map(fieldControl).join("");$("recordForm").dataset.resource=resource;$("modalBackdrop").classList.add("show");
}
async function openEdit(id){
 const resource=currentPage;await loadLookups();const record=rows.find(r=>Number(r[idField(resource)])===Number(id));if(!record)return;
 editingId=id;$("modalTitle").textContent="Edit "+config[resource].singular;$("saveButton").textContent="Save changes";$("formError").textContent="";
 $("formFields").innerHTML=config[resource].fields.map(fieldControl).join("");
 for(const [key,value] of Object.entries(record)){const el=$("recordForm").elements[key];if(el&&value!==null)el.value=String(value).slice(0,10) && key.endsWith("_date")?String(value).slice(0,10):value}
 $("recordForm").dataset.resource=resource;$("modalBackdrop").classList.add("show");
}
function closeModal(){$("modalBackdrop").classList.remove("show")}
function backdropClose(e){if(e.target===$("modalBackdrop"))closeModal()}
$("recordForm").addEventListener("submit",async e=>{
 e.preventDefault();const resource=e.currentTarget.dataset.resource,body=Object.fromEntries(new FormData(e.currentTarget).entries());
 for(const f of ["customer_id","vehicle_id","service_id","service_charge","amount"])if(body[f]!==undefined&&body[f]!=="")body[f]=Number(body[f]);
 try{await api("/"+resource+(editingId?"/"+editingId:""),{method:editingId?"PUT":"POST",body:JSON.stringify(body)});closeModal();toast(editingId?"Record updated successfully":"Record added successfully");editingId=null;if(resource===currentPage)await loadResource(resource);await loadDashboard();await checkConnection()}
 catch(err){$("formError").textContent=err.message}
});
async function deleteRecord(id){
 const resource=currentPage;if(!confirm("Delete this record? Related records may also be deleted because of the database relationships."))return;
 try{await api("/"+resource+"/"+id,{method:"DELETE"});toast("Record deleted");await loadResource(resource);await loadDashboard()}
 catch(e){toast(e.message)}
}
function refreshCurrent(){checkConnection();if(currentPage==="dashboard")loadDashboard();else loadResource(currentPage);toast("Refreshing data…")}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
checkConnection();loadDashboard();setInterval(checkConnection,30000);
