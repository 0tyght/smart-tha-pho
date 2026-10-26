import assert from "node:assert/strict";
import test from "node:test";
import { WasteFleetPolicy } from "../src/domain/WasteFleetPolicy.js";
import { WasteFleetTrackingController } from "../src/application/WasteFleetTrackingController.js";
import { LocationHistoryPolicy } from "../src/application/LocationHistoryPolicy.js";

const now = new Date("2026-10-26T05:00:00Z");
const date = "2026-10-26";
const bounds = { south:16.70,north:16.805,west:100.15,east:100.27 };
const routes = [{ id:"r1",routeName:"เส้นทาง 1",isActive:true,routeGeojson:{type:"LineString",coordinates:[[100.2,16.75],[100.21,16.76]]} }];
const vehicles = Array.from({length:6},(_,i)=>({id:`v${i}`,vehicleCode:`TRUCK-${i}`,status:"AVAILABLE",lastLatitude:null,lastLongitude:null,lastGpsAt:null}));
const plan = {id:"p1",vehicleId:"v0",routeId:"r1",scheduledDate:date,status:"IN_PROGRESS",publicationStatus:"PUBLISHED"};
const policy = () => new WasteFleetPolicy({bounds});

test("fleet keeps all vehicles when no plan or GPS exists",()=>{
  const result=policy().resolve({vehicles,routes,plans:[],now:now.getTime(),date});
  assert.equal(result.total,6);assert.equal(result.unknown,6);assert.equal(result.positioned,0);assert.equal(result.operating,0);
  assert.ok(result.vehicles.every(v=>v.position===null && v.plan===null));
});
test("fleet uses only today's published active plan, never a historical or draft plan",()=>{
  const plans=[plan,{...plan,id:"old",vehicleId:"v1",scheduledDate:"2026-08-22"},
    {...plan,id:"draft",vehicleId:"v2",publicationStatus:"DRAFT"},{...plan,id:"finished",vehicleId:"v3",status:"COMPLETED"},
    {...plan,id:"future",vehicleId:"v4",status:"SCHEDULED"}];
  const result=policy().resolve({vehicles,routes,plans,now:now.getTime(),date});
  assert.equal(result.operating,1);assert.equal(result.vehicles[0].route.id,"r1");assert.ok(result.vehicles.slice(1).every(v=>!v.plan));
});
test("GPS freshness remains distinct from last-known position and invalid coordinates stay absent",()=>{
  const sample=[{...vehicles[0],lastLatitude:16.75,lastLongitude:100.2,lastGpsAt:now.toISOString()},
    {...vehicles[1],lastLatitude:16.75,lastLongitude:100.2,lastGpsAt:"2026-08-22T05:00:00Z"},
    {...vehicles[2],lastLatitude:"",lastLongitude:null,lastGpsAt:now.toISOString()},
    {...vehicles[3],lastLatitude:0,lastLongitude:0,lastGpsAt:now.toISOString()},
    {...vehicles[4],lastLatitude:16.75,lastLongitude:100.2,lastGpsAt:"invalid"}];
  const result=policy().resolve({vehicles:sample,routes,now:now.getTime(),date});
  assert.equal(result.positioned,2);assert.equal(result.vehicles[0].gpsKey,"live");assert.equal(result.vehicles[1].gpsKey,"stale");
  assert.ok(result.vehicles.slice(2).every(v=>!v.position));
});
test("example positions use existing road geometry without mutating source data",()=>{
  const before=JSON.stringify({vehicles,routes});
  const result=policy().resolve({vehicles,routes,now:now.getTime(),date,example:true});
  assert.equal(result.positioned,6);assert.equal(result.operating,6);assert.equal(result.vehicles[0].gpsKey,"example");
  assert.equal(result.vehicles[0].position.longitude,100.2);assert.equal(JSON.stringify({vehicles,routes}),before);
});
function fixture(plans=[]) {
  const calls=[];
  const api={get:async(url)=>{calls.push(url);if(url.endsWith("/vehicles"))return structuredClone(vehicles);if(url.endsWith("/routes"))return structuredClone(routes);if(url.includes("/track"))return {routeGeojson:routes[0].routeGeojson,stops:[],locations:[]};return structuredClone(plans);}};
  const controller=new WasteFleetTrackingController({api,policy:policy(),historyPolicy:new LocationHistoryPolicy({maximumGapMinutes:5}),clock:()=>now});
  return {controller,calls};
}
test("initial tracking loads fleet regardless of today's plan count using GET requests only",async()=>{
  const {controller,calls}=fixture();await controller.refresh();
  assert.equal(controller.snapshot().total,6);assert.equal(controller.snapshot().loading,false);assert.equal(controller.snapshot().mapVehicles.length,0);
  assert.ok(calls.includes("/api/waste/plans?date=2026-10-26"));assert.equal(calls.length,3);
});
test("selecting an operating vehicle loads only its current plan and clears the old selection",async()=>{
  const {controller,calls}=fixture([plan]);await controller.refresh();controller.selectVehicle("v0");await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(controller.snapshot().selected.plan.id,"p1");assert.ok(calls.includes("/api/waste/plans/p1/track"));assert.ok(controller.snapshot().routeGeojson);
  controller.selectVehicle("v1");assert.equal(controller.snapshot().track,null);assert.equal(controller.snapshot().routeGeojson,null);
});
test("example mode is explicit, uses no GPS write, and returning to actual restores unknown positions",async()=>{
  const {controller,calls}=fixture();await controller.refresh();const count=calls.length;controller.showExample();
  assert.equal(controller.snapshot().example,true);assert.equal(controller.snapshot().selectedId,"");assert.equal(controller.snapshot().mapVehicles.length,6);
  controller.selectVehicle("v2");assert.equal(controller.snapshot().selected.vehicleCode,"TRUCK-2");assert.equal(calls.length,count);
  controller.showActual();assert.equal(controller.snapshot().positioned,0);assert.equal(controller.snapshot().selected,null);assert.equal(controller.snapshot().operating,0);
});
test("slow detail responses cannot leak a previous vehicle's route into the new selection",async()=>{
  let resolveDetail;
  const controller=new WasteFleetTrackingController({api:{get:async(url)=>url.endsWith("/vehicles")?vehicles:url.endsWith("/routes")?routes:url.includes("/track")?new Promise(resolve=>{resolveDetail=resolve;}):[plan]},policy:policy(),historyPolicy:new LocationHistoryPolicy({maximumGapMinutes:5}),clock:()=>now});
  await controller.refresh();controller.selectVehicle("v0");controller.selectVehicle("v1");resolveDetail({routeGeojson:routes[0].routeGeojson});
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(controller.snapshot().selectedId,"v1");assert.equal(controller.snapshot().track,null);
});
