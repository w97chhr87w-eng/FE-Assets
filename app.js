const KEY="facilities_parts_v1";
let db=JSON.parse(localStorage.getItem(KEY)||'{"parts":[],"requests":[],"faults":[],"history":[]}');

function save(){localStorage.setItem(KEY,JSON.stringify(db)); renderAll();}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function showScreen(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll("nav .nav").forEach(x=>x.classList.toggle("active",x.dataset.screen===id));
  renderAll();
}
function openModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function addHistory(text){db.history.unshift({text,at:new Date().toLocaleString()});db.history=db.history.slice(0,200)}

function openPartForm(id=null){
 const p=id?db.parts.find(x=>x.id===id):null;
 openModal(`<h2>${p?"Edit":"Add"} Part</h2><div class="form">
 <label>Part name / description<input id="pName" value="${esc(p?.name||"")}"></label>
 <label>Part number<input id="pNo" value="${esc(p?.number||"")}"></label>
 <label>Category<input id="pCat" value="${esc(p?.category||"")}"></label>
 <label>Quantity<input id="pQty" type="number" min="0" value="${p?.qty??0}"></label>
 <label>Minimum stock<input id="pMin" type="number" min="0" value="${p?.min??0}"></label>
 <label>Storage location<input id="pLoc" value="${esc(p?.location||"")}"></label>
 <label>Supplier<input id="pSup" value="${esc(p?.supplier||"")}"></label>
 <button onclick="savePart('${id||""}')">Save Part</button></div>`);
}
function savePart(id){
 const data={name:pName.value.trim(),number:pNo.value.trim(),category:pCat.value.trim(),qty:+pQty.value||0,min:+pMin.value||0,location:pLoc.value.trim(),supplier:pSup.value.trim()};
 if(!data.name)return alert("Part name is required");
 if(id) Object.assign(db.parts.find(x=>x.id===id),data); else db.parts.push({id:crypto.randomUUID(),...data});
 addHistory(`${id?"Updated":"Added"} part: ${data.name}`); save(); closeModal();
}
function issuePart(id){
 const p=db.parts.find(x=>x.id===id);
 openModal(`<h2>Issue Part</h2><p><b>${esc(p.name)}</b><br>Available: ${p.qty}</p>
 <div class="form"><label>Quantity<input id="issueQty" type="number" min="1" max="${p.qty}" value="1"></label>
 <label>Issued to / location<input id="issueTo"></label><button onclick="confirmIssue('${id}')">Issue Part</button></div>`);
}
function confirmIssue(id){
 const p=db.parts.find(x=>x.id===id), q=+issueQty.value;
 if(!q||q>p.qty)return alert("Invalid quantity");
 p.qty-=q; addHistory(`Issued ${q} × ${p.name} to ${issueTo.value||"unspecified"}`); save(); closeModal();
}
function renderInventory(){
 const q=(inventorySearch?.value||"").toLowerCase();
 const rows=db.parts.filter(p=>[p.name,p.number,p.category,p.location,p.supplier].join(" ").toLowerCase().includes(q));
 inventoryList.innerHTML=rows.length?rows.map(p=>`<div class="item"><div><h3>${esc(p.name)}</h3><div class="meta">${esc(p.number)} · ${esc(p.category)}<br>📍 ${esc(p.location)} · Supplier: ${esc(p.supplier)}</div></div><div class="qty ${p.qty<=p.min?'low':''}">${p.qty}<small> pcs</small><div class="meta">min ${p.min}</div><div class="actions"><button onclick="issuePart('${p.id}')">Issue</button><button onclick="openPartForm('${p.id}')">Edit</button></div></div></div>`).join(""):`<div class="empty">No parts yet. Add your first part.</div>`;
}
function openRequestForm(){
 const options=db.parts.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.qty} available)</option>`).join("");
 openModal(`<h2>New Parts Request</h2><div class="form">
 <label>Part<select id="rPart">${options}</select></label>
 <label>Quantity<input id="rQty" type="number" min="1" value="1"></label>
 <label>Requested by<input id="rBy"></label>
 <label>Location / equipment<input id="rLoc"></label>
 <label>Reason<textarea id="rReason" rows="3"></textarea></label>
 <button onclick="saveRequest()">Submit Request</button></div>`);
}
function saveRequest(){
 const p=db.parts.find(x=>x.id===rPart.value); if(!p)return alert("Add a part first");
 db.requests.unshift({id:crypto.randomUUID(),partId:p.id,qty:+rQty.value||1,by:rBy.value,loc:rLoc.value,reason:rReason.value,status:"Requested",at:new Date().toLocaleString()});
 addHistory(`Request submitted: ${rQty.value} × ${p.name}`); save(); closeModal();
}
function updateRequest(id,status){
 const r=db.requests.find(x=>x.id===id); r.status=status;
 if(status==="Issued"){const p=db.parts.find(x=>x.id===r.partId); if(p){p.qty=Math.max(0,p.qty-r.qty)}}
 addHistory(`Request ${status.toLowerCase()}: ${r.qty} × ${db.parts.find(x=>x.id===r.partId)?.name||""}`); save();
}
function renderRequests(){
 const f=requestFilter.value;
 const rows=db.requests.filter(r=>!f||r.status===f);
 requestList.innerHTML=rows.length?rows.map(r=>{const p=db.parts.find(x=>x.id===r.partId)||{};return `<div class="item"><div><h3>${r.qty} × ${esc(p.name||"Unknown part")}</h3><div class="meta">${esc(r.by)} · ${esc(r.loc)}<br>${esc(r.reason)}<br>${r.at}</div><span class="badge">${r.status}</span></div><div class="actions">${r.status==="Requested"?`<button class="success" onclick="updateRequest('${r.id}','Approved')">Approve</button><button class="danger" onclick="updateRequest('${r.id}','Rejected')">Reject</button>`:""}${r.status==="Approved"?`<button onclick="updateRequest('${r.id}','Issued')">Issue</button>`:""}${r.status==="Issued"?`<button onclick="updateRequest('${r.id}','Completed')">Complete</button>`:""}</div></div>`}).join(""):`<div class="empty">No requests.</div>`;
}
function openFaultForm(){
 const options=db.parts.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
 openModal(`<h2>Report Faulty Part</h2><div class="form">
 <label>Part<select id="fPart"><option value="">Unknown / not in inventory</option>${options}</select></label>
 <label>Equipment / location<input id="fLoc"></label>
 <label>Reported by<input id="fBy"></label>
 <label>Fault description<textarea id="fDesc" rows="4"></textarea></label>
 <button onclick="saveFault()">Submit Fault Report</button></div>`);
}
function saveFault(){
 db.faults.unshift({id:crypto.randomUUID(),partId:fPart.value,loc:fLoc.value,by:fBy.value,desc:fDesc.value,status:"Open",at:new Date().toLocaleString()});
 addHistory(`Fault reported at ${fLoc.value||"unspecified location"}`); save(); closeModal();
}
function updateFault(id,status){db.faults.find(x=>x.id===id).status=status;addHistory(`Fault marked ${status.toLowerCase()}`);save()}
function renderFaults(){
 faultList.innerHTML=db.faults.length?db.faults.map(f=>{const p=db.parts.find(x=>x.id===f.partId);return `<div class="item"><div><h3>${esc(p?.name||"Part not identified")}</h3><div class="meta">📍 ${esc(f.loc)} · ${esc(f.by)} · ${f.at}<br>${esc(f.desc)}</div><span class="badge">${f.status}</span></div><div class="actions">${f.status==="Open"?`<button onclick="updateFault('${f.id}','Resolved')">Resolve</button>`:""}</div></div>`}).join(""):`<div class="empty">No faulty-part reports.</div>`;
}
function renderDashboard(){
 statParts.textContent=db.parts.length;statLow.textContent=db.parts.filter(p=>p.qty<=p.min).length;
 statRequests.textContent=db.requests.filter(r=>r.status==="Requested").length;statFaulty.textContent=db.faults.filter(f=>f.status==="Open").length;
 const low=db.parts.filter(p=>p.qty<=p.min);lowStockList.innerHTML=low.length?low.map(p=>`<div class="history-row"><b>${esc(p.name)}</b> — ${p.qty} left (minimum ${p.min})</div>`).join(""):`<div class="empty">No low-stock parts 🎉</div>`;
}
function renderHistory(){historyList.innerHTML=db.history.length?db.history.map(h=>`<div class="history-row"><b>${h.at}</b><br>${esc(h.text)}</div>`).join(""):`<div class="empty">No activity yet.</div>`}
function renderAll(){renderDashboard();renderInventory();renderRequests();renderFaults();renderHistory()}
renderAll();
