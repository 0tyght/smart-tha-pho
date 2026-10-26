import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { WasteRoutePlayback } from "../src/domain/WasteRoutePlayback.js";
import { WasteFleetMotionController } from "../src/application/WasteFleetMotionController.js";
import { WasteFleetTrackingController } from "../src/application/WasteFleetTrackingController.js";
import { WasteFleetPolicy } from "../src/domain/WasteFleetPolicy.js";
import { LocationHistoryPolicy } from "../src/application/LocationHistoryPolicy.js";
import { LeafletFleetVehicleRenderer } from "../src/infrastructure/LeafletFleetVehicleRenderer.js";

const geometry={type:"LineString",coordinates:[[100.2,16.75],[100.21,16.75],[100.21,16.76]]};
const vehicles=Array.from({length:6},(_,i)=>({id:`v${i}`,vehicleCode:`TRUCK-${i}`,position:{latitude:16.75,longitude:100.2},
  status:i===5?"MAINTENANCE":"IN_PROGRESS",plan:i===5?null:{id:`p${i}`,status:"IN_PROGRESS"},route:{id:`r${i}`,routeCode:`R${i}`,routeGeojson:geometry}}));
function fixture(){let id=0;const frames=new Map();let rendered=[];const controller=new WasteFleetMotionController({createPlayback:options=>new WasteRoutePlayback(options),scheduler:{request:cb=>{const next=id++;frames.set(next,cb);return next;},cancel:handle=>frames.delete(handle)},renderer:{render:rows=>{rendered=rows;},clear:()=>{rendered=[];}}});const fire=time=>{const [handle,callback]=frames.entries().next().value;frames.delete(handle);callback(time);};return {controller,frames,fire,rendered:()=>rendered};}
test("all operating vehicles move at once without a selection; maintenance stays stationary",()=>{
 const f=fixture();f.controller.configure({vehicles,example:true});f.controller.setEnabled(true);const before=f.controller.positions();f.fire(0);f.fire(200);
 const after=f.controller.positions();for(let i=0;i<5;i++)assert.notDeepEqual(after[i].position,before[i].position);assert.deepEqual(after[5].position,before[5].position);assert.equal(f.frames.size,1);
});
test("vehicle selection and unchanged polling never rewind or interrupt any vehicle",()=>{
 const f=fixture();f.controller.configure({vehicles,example:true});f.controller.setEnabled(true);f.fire(0);f.fire(200);const before=f.controller.positions();
 f.controller.configure({vehicles:structuredClone(vehicles),example:true,selectedId:"v3"});const after=f.controller.positions();
 assert.deepEqual(after.map(v=>v.position),before.map(v=>v.position));assert.equal(after[3].selected,true);assert.equal(f.frames.size,1);f.fire(400);assert.notDeepEqual(f.controller.positions()[0].position,before[0].position);
});
test("pause, hidden tab and disposal cancel the only animation frame and resume without teleporting",()=>{
 const f=fixture();f.controller.configure({vehicles,example:true});f.controller.setEnabled(true);f.fire(0);f.fire(200);f.controller.setEnabled(false);const before=f.controller.positions();assert.equal(f.frames.size,0);
 f.controller.setEnabled(true);f.fire(100000);assert.deepEqual(f.controller.positions().map(v=>v.position),before.map(v=>v.position));f.controller.dispose();assert.equal(f.frames.size,0);assert.deepEqual(f.rendered(),[]);
});
test("speed changes preserve position and the fleet continues after many route lengths",()=>{
 const f=fixture();f.controller.configure({vehicles,example:true});const before=f.controller.positions();f.controller.configure({vehicles,example:true,speedKph:40});assert.deepEqual(f.controller.positions(),before);
 assert.throws(()=>f.controller.configure({vehicles,example:true,speedKph:0}),RangeError);
 for(let i=0;i<150;i++)f.controller.step();const looped=f.controller.positions();f.controller.setEnabled(true);assert.equal(f.frames.size,1);f.fire(0);f.fire(200);assert.ok(f.controller.positions().slice(0,5).every((v,i)=>JSON.stringify(v.position)!==JSON.stringify(looped[i].position)));
});
test("actual GPS stays observed, never runs through a synthetic route",()=>{
 const f=fixture();f.controller.configure({vehicles,example:false});f.controller.setEnabled(true);assert.equal(f.frames.size,0);f.controller.step();assert.deepEqual(f.controller.positions().map(v=>v.position),vehicles.map(v=>v.position));
});
test("manual controller stepping moves working vehicles without creating a scheduler",()=>{
 const f=fixture();f.controller.configure({vehicles,example:true});const before=f.controller.positions();f.controller.step();assert.equal(f.frames.size,0);for(let i=0;i<5;i++)assert.notDeepEqual(f.controller.positions()[i].position,before[i].position);
});

test("fleet view never substitutes automatic movement with a reduced-motion step control",()=>{
 const motion=readFileSync(new URL("../src/components/WasteFleetMotion.jsx",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/pages/FleetTrackingPage.jsx",import.meta.url),"utf8");
 assert.doesNotMatch(motion,/matchMedia|preference\.matches|stepSequence/);
 assert.match(motion,/!paused\s*&&\s*!document\.hidden\s*&&\s*inView/);
 assert.doesNotMatch(page,/เลื่อนรถทีละ|reducedMotion|controller\.step/);
 assert.match(page,/controller\.toggleMotion/);
});
test("local automatic example starts unselected and explicit GPS mode survives polling",async()=>{
 const sourceVehicles=vehicles.map(v=>({id:v.id,vehicleCode:v.vehicleCode,status:v.status,lastLatitude:null,lastLongitude:null,lastGpsAt:null}));
 const controller=new WasteFleetTrackingController({api:{get:async url=>url.endsWith("/vehicles")?sourceVehicles:url.endsWith("/routes")?[{id:"r",isActive:true,routeGeojson:geometry}]:[]},policy:new WasteFleetPolicy({bounds:{south:16.7,north:16.805,west:100.15,east:100.27}}),historyPolicy:new LocationHistoryPolicy({maximumGapMinutes:5}),clock:()=>new Date("2026-10-26T05:00:00Z"),autoExample:true});
 await controller.refresh();assert.equal(controller.snapshot().example,true);assert.equal(controller.snapshot().selected,null);assert.equal(controller.snapshot().routeGeojson,null);assert.equal(controller.snapshot().vehicles[5].plan,null);
 controller.showActual();await controller.refresh();assert.equal(controller.snapshot().example,false);
});
test("renderer colors every truck by its route and retains one marker per vehicle",()=>{
 const markers=[];let removed=0;const elements=[];
 const leaflet={DomUtil:{setPosition:()=>{}},divIcon:o=>o,marker:()=>{const element={dataset:{},style:{setProperty:(name,value)=>{element[name]=value;}},classList:{toggle:()=>{}},querySelector:()=>({style:{}})};elements.push(element);const marker={addTo:()=>marker,bindTooltip:()=>marker,on:(name,cb)=>{marker.click=cb;},setLatLng:()=>marker,setZIndexOffset:()=>marker,getElement:()=>element,remove:()=>{removed++;}};markers.push(marker);return marker;}};
 let selected;const renderer=new LeafletFleetVehicleRenderer({map:{project:()=>({subtract:()=>({})}),getPixelOrigin:()=>({})},leaflet,colorForRoute:code=>`color-${code}`,onSelect:id=>{selected=id;}});
 renderer.render(vehicles);renderer.render(vehicles);assert.equal(markers.length,6);assert.equal(elements[2]["--vehicle-color"],"color-R2");markers[2].click();assert.equal(selected,"v2");renderer.render(vehicles.slice(0,2));assert.equal(removed,4);renderer.clear();assert.equal(removed,6);
});

test("stale catalogue GPS does not block local automatic preview, but recent GPS does",async()=>{
 for(const [gpsAt,expected] of [["2026-08-13T05:00:00Z",true],["2026-10-26T05:00:00Z",false]]) {
  const observed=[{id:"v",vehicleCode:"DEMO-W01",status:"AVAILABLE",lastLatitude:16.75,lastLongitude:100.2,lastGpsAt:gpsAt}];
  const controller=new WasteFleetTrackingController({api:{get:async url=>url.endsWith("/vehicles")?observed:url.endsWith("/routes")?[{id:"r",isActive:true,routeGeojson:geometry}]:[]},policy:new WasteFleetPolicy({bounds:{south:16.7,north:16.805,west:100.15,east:100.27}}),historyPolicy:new LocationHistoryPolicy({maximumGapMinutes:5}),clock:()=>new Date("2026-10-26T05:00:00Z"),autoExample:true});
  await controller.refresh();assert.equal(controller.snapshot().example,expected);controller.dispose();
 }
});
