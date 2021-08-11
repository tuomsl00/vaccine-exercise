import React, { ReactElement, useState } from 'react';
import './App.css';

const server = process.env.REACT_APP_SERVER;

interface ITime {
  fullDay: boolean;
  time: string|number;
  origTime: string;
}

interface IState {
  date: string;
  ordersArrived: number|ReactElement;
  expiredCount: number|ReactElement;
  expBeforeUsage: number|ReactElement;
  vaccinesUsed: number|ReactElement;
  willExpire: number|ReactElement;
  expDays: number;
}

function App() {
  let date = new Date();

  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();

  const [state, setState] = useState<IState>({
    date: year+"-"+month+"-"+day,
    ordersArrived: <i className="c-inline-spinner"></i>,
    expiredCount: <i className="c-inline-spinner"></i>,
    expBeforeUsage: <i className="c-inline-spinner"></i>,
    vaccinesUsed: <i className="c-inline-spinner"></i>,
    willExpire: <i className="c-inline-spinner"></i>,
    expDays: 10,
  });

  const [time, setTime] = useState<ITime>({
    fullDay: true,
    time: "23:59:59",
    origTime: "23:59:59"
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

  async function fetchNumbers(e: any) {
    let date = e.target.value;
    
    let dateMillis = dateToMillis(date+" "+time.time);
    
    let ordersArrived = 0;
    let expiredCount = 0;
    let expBeforeUsage = 0;
    let vaccinesUsed = 0;
    let willExpire = 0;

    setState({...state, 
      ordersArrived: <i className="c-inline-spinner"></i>,
      expiredCount: <i className="c-inline-spinner"></i>,
      expBeforeUsage: <i className="c-inline-spinner"></i>,
      vaccinesUsed: <i className="c-inline-spinner"></i>,
      willExpire: <i className="c-inline-spinner"></i>
    });

    try {
        
      await fetch(server+"/orders-arrived-on-date/"+dateMillis)
      .then(response => response.json())
      .then(data => ordersArrived = data.quantity);
      

      await fetch(server+"/expired-bottles/"+dateMillis)
        .then(response => response.json())
        .then(data => expiredCount = data.quantity);

      await fetch(server+"/expired-before-usage/"+dateMillis)
        .then(response => response.json())
        .then(data => expBeforeUsage = data.quantity);

      await fetch(server+"/vaccines-used/"+dateMillis)
      .then(response => response.json())
      .then(data => vaccinesUsed = data.quantity);
      
    } catch(e) {
      console.log(e);
    }
    
    willExpire = await vaccinessWillExpire(dateMillis, state.expDays);

    setState({
      date: date,
      ordersArrived: ordersArrived,
      expiredCount: expiredCount,
      expBeforeUsage: expBeforeUsage,
      vaccinesUsed: vaccinesUsed,
      willExpire: willExpire,
      expDays: state.expDays
    });
      
  }

  async function setDays(e: any) {
    let willExpire = 0;
    let dateMillis = dateToMillis(state.date+" "+time.time);
    let days = e.target.value;
    willExpire = await vaccinessWillExpire(dateMillis, days);
    updateDays(e, willExpire)
  }

  function updateDays(e: any, willExpire?: number|ReactElement) {
    if (typeof willExpire === 'undefined') willExpire = state.willExpire;
    setState({
      ...state,
      expDays: e.target.value,
      willExpire: willExpire
    });
  }
  function fullDayToggle(e: any) {
    setTime({
      fullDay: e.target.checked,
      time: e.target.checked?"23:59:59":time.origTime,
      origTime: time.origTime
    });
    fetchNumbers({target: { value: state.date}});
  }

  function changeTime(e: any) {
    setTime({
      fullDay: false,
      time: e.target.value,
      origTime: e.target.value
    });
    fetchNumbers({target: { value: state.date}});
  }

  return (
    <div className="App">
      <header className="App-header">
        <input type="date" onChange={fetchNumbers} defaultValue={new Date().toISOString().split('T')[0]}></input>
        <input type="time" onChange={changeTime} defaultValue={new Date().toTimeString().substr(0,8)}></input>
        <p>{state.date} {time.time}</p>
        <p>Full day <input type="checkbox" onChange={fullDayToggle} checked={time.fullDay}></input></p>
        <p>Orders arrived: {state.ordersArrived}</p>
        <p>Vaccines used: {state.vaccinesUsed}</p>
        <p>Bottles expired: {state.expiredCount}</p>
        <p>Expired vaccines before usage: {state.expBeforeUsage}</p>
        <p>Vaccines that'll expire in next {state.expDays} day{state.expDays!=1?"s":""}: {state.willExpire} | <small>{time.fullDay?"Passing day ignored":" Hours from 0th day included"}</small></p>
        <input type="range" min="0" max="90" defaultValue={state.expDays} onMouseUp={setDays} onChange={updateDays}></input>
      </header>
    </div>
  );
}

export default App;
