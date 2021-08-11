/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState } from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Text,
  Button,
  useColorScheme,
  View,
  Switch,
  TextInput,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import DateTimePicker from '@react-native-community/datetimepicker';
import { parse } from '@babel/core';

const server = "https://sleepy-sands-71346.herokuapp.com";

const Section = ({children, title}): Node => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  let loading = {
    ordersArrived: <ActivityIndicator color="#0000ff" />,
    expiredCount: <ActivityIndicator color="#0000ff" />,
    expBeforeUsage: <ActivityIndicator color="#0000ff" />,
    vaccinesUsed: <ActivityIndicator color="#0000ff" />,
    willExpire: <ActivityIndicator color="#0000ff"/>
  }
  const [state, setState] = useState({
    ...loading,
    expDays: 10
  });

  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);

  const [warning, setWarning] = useState(false);

  const [fullDay, setIsFullDay] = useState(true);
  const toggleSwitch = () => setIsFullDay(previousState => !previousState);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
    fetchNumbers();
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode('date');
  };

  const showTimepicker = () => {
    showMode('time');
  };

  async function vaccinessWillExpire(dateMillis, days) {
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

  function dateToMillis(date) {
    let timeZoneOffset = (new Date(date).getTimezoneOffset())*60*1000;
    return ((new Date(date).getTime())-timeZoneOffset);
  }

  async function fetchNumbers(days) {
    let sDate = fullDay?date.toISOString().split('T')[0].concat("T23:59:59"):date;
    let dateMillis = dateToMillis(sDate);

    let ordersArrived = 0;
    let expiredCount = 0;
    let expBeforeUsage = 0;
    let vaccinesUsed = 0;
    let willExpire = 0;

    setState({...state, ...loading});

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

    console.log(ordersArrived);
    
    willExpire = await vaccinessWillExpire(dateMillis, state.expDays);

    setState({
      date: date,
      ordersArrived: ordersArrived,
      expiredCount: expiredCount,
      expBeforeUsage: expBeforeUsage,
      vaccinesUsed: vaccinesUsed,
      willExpire: willExpire,
      expDays: days
    });

  }

  function getExpDays(e) {
    let days = e.nativeEvent.text;
    if (isNaN(days)) {
      setWarning(true);
      return false;
    } else {
      setWarning(false);
    }

    fetchNumbers(days);
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>

      <View>
        <Button onPress={showDatepicker} title="Show date picker!" />
      </View>
      <View>
        <Button onPress={showTimepicker} title="Show time picker!" />
      </View>
      <View>
        <Text>{date.toUTCString()}</Text>
      </View>
        {show && <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={onChange}
        />}
            <View
      style={{
        flexDirection: "row",
        height: 100,
        padding: 20
      }}
    >
        <View style={{ flex: 0.1 }}>
          <Text>{fullDay?"Full day":"By hour of day"}</Text>
        </View>
        <View style={{ flex: 0.1 }}>
          <Switch
            onValueChange={toggleSwitch}
            value={fullDay}
          />
        </View>
        </View>
          <Text>Orders arrived: {state.ordersArrived}</Text>
          <Text>Vaccines used: {state.vaccinesUsed}</Text>
          <Text>Bottles expired: {state.expiredCount}</Text>
          <Text>Expired vaccines before usage: {state.expBeforeUsage}</Text>
          <TextInput style={styles.input} maxLength={2} onEndEditing={getExpDays} defaultValue={state.expDays} />
          <Text>Vaccines that'll expire in next {state.expDays} day{state.expDays!=1?"s":""}: {state.willExpire} | {fullDay?"Passing day ignored":" Hours from 0th day included"}</Text>
          <Text style={{ color: 'red' }}>{warning?"Invalid number!":""}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    width: 50,
    borderWidth: 1,
    padding: 10,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
