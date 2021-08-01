import React, { useState } from 'react';
import './App.css';

const server = "http://localhost:5000";

function App() {
  let date = new Date();

  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();

  const [state, setState] = useState({
    date: year+"-"+month+"-"+day,
    ordersArrived: 0,
    expiredCount: 0,
    expBeforeUsage: 0,
    vaccinesUsed: 0,
    expDays: 0,
    willExpire: 0
  });

  const [time, setTime] = useState({
    fullDay: false,
    time: "00:00:00",
    origTime: "00:00:00"
  });

  async function vaccinessWillExpire(dateMillis: number, days: number) {
    let willExpire = 0;
    try {    
    await fetch(server+"/vaccines-will-expire/"+dateMillis.toString()+"?days="+days)
    .then(response => response.json())
    .then(data => willExpire = data.quantity);
    } catch(e) {
      return 0;
    }
    return willExpire;
  }

  function dateToMillis(date: string) {
    let timeZoneOffset = (new Date(date).getTimezoneOffset())*60*1000;
    return ((new Date(date).getTime())-timeZoneOffset);
  }

  async function setDate(e: any) {
    let date = e.target.value;
    
    let dateMillis = dateToMillis(date+" "+time.time);
    
    let count = 0;
    let ordersArrived = 0;
    let expiredCount = 0;
    let expBeforeUsage = 0;
    let vaccinesUsed = 0;
    let expDays = 0;
    let willExpire = 0;
    /*
    await fetch("http://localhost:3001/orders-count/")
      .then(response => response.json())
      .then(data => count = data.orders);
*/
    console.log(dateMillis);
    try {
    await fetch(server+"/orders-arrived-on-date/"+dateMillis)
      .then(response => response.json())
      .then(data => ordersArrived = data.ordersArrived);

    await fetch(server+"/expired-bottles/"+dateMillis)
      .then(response => response.json())
      .then(data => expiredCount = data.expiredCount);

    await fetch(server+"/expired-before-usage/"+dateMillis)
      .then(response => response.json())
      .then(data => expBeforeUsage = data.quantity);

    await fetch(server+"/vaccines-used/"+dateMillis)
    .then(response => response.json())
    .then(data => vaccinesUsed = data.used);
    } catch(e) {

    }
      willExpire = await vaccinessWillExpire(dateMillis, state.expDays);

      console.log(ordersArrived);

      setState({
        date: date,
        ordersArrived: ordersArrived,
        expiredCount: expiredCount,
        expBeforeUsage: expBeforeUsage,
        vaccinesUsed: vaccinesUsed,
        expDays: state.expDays,
        willExpire: willExpire
      });
  }

  async function setDays(e: any) {
    let willExpire = 0;
    let dateMillis = dateToMillis(state.date+" "+time.time);
    let days = e.target.value;
    willExpire = await vaccinessWillExpire(dateMillis, days);
    updateDays(e, willExpire)
  }

  function updateDays(e: any, willExpire?: number) {
    if (typeof willExpire === 'undefined') willExpire = state.willExpire;
    setState({
      date: state.date,
      ordersArrived: state.ordersArrived,
      expiredCount: state.expiredCount,
      expBeforeUsage: state.expBeforeUsage,
      vaccinesUsed: state.vaccinesUsed,
      expDays: e.target.value,
      willExpire: willExpire
    });
  }
  var origTime = "00:00:00";
  function fullDayToggle(e: any) {
    setTime({
      fullDay: e.target.checked,
      time: e.target.checked?"23:59:59":time.origTime,
      origTime: time.origTime
    });
    console.log(origTime);
  }

  function changeTime(e: any) {
    origTime = e.target.value;
    setTime({
      fullDay: time.fullDay,
      time: e.target.value+":00",
      origTime: e.target.value+":00"
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <input type="date" onChange={setDate}></input><input type="time" onChange={changeTime}></input>
        <p>{state.date} {time.time}</p>
        <p>Full day <input type="checkbox" onChange={fullDayToggle}></input></p>
        <p>Orders arrived: {state.ordersArrived}</p>
        <p>Vaccines used: {state.vaccinesUsed}</p>
        <p>Bottles expired: {state.expiredCount}</p>
        <p>Expired vaccines before usage: {state.expBeforeUsage}</p>
        <p>Vaccines that'll expire in next {state.expDays} day{state.expDays!=1?"s":""}: {state.willExpire} | <small>{time.fullDay?"Passing day ignored":" Hours from 0th day included"}</small></p>
        <input type="range" min="0" max="90" onMouseUp={setDays} onChange={updateDays}></input>
      </header>
    </div>
  );
}

export default App;
